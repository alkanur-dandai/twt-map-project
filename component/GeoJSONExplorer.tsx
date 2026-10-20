
"use client";

import { useEffect, useMemo, useState } from "react";

type Position = [number, number, ...number[]];

type GeoFeature = {
  type: "Feature";
  properties?: Record<string, unknown>;
  geometry: {
    type: string;
    coordinates: unknown;
  } | null;
};

type GeoJSONData = {
  type: "FeatureCollection";
  features: GeoFeature[];
};

type SearchItem = {
  name: string;
  kind: "Barangay" | "Municipality";
  municipality?: string;
};

function getProperty(
  properties: Record<string, unknown> | undefined,
  names: string[]
): string {
  if (!properties) return "";

  for (const name of names) {
    const key = Object.keys(properties).find(
      (property) => property.toLowerCase() === name.toLowerCase()
    );

    const value = key ? properties[key] : undefined;

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
}

function getBarangay(feature: GeoFeature): string {
  return getProperty(feature.properties, [
    "adm4_en",
    "brgy",
    "Brgy name",
    "barangay",
    "barangay_name",
  ]);
}

function getMunicipality(feature: GeoFeature): string {
  return getProperty(feature.properties, [
    "adm3_en",
    "municipality",
    "municipality_name",
  ]);
}

function collectPositions(value: unknown): Position[] {
  if (!Array.isArray(value)) return [];

  if (
    value.length >= 2 &&
    typeof value[0] === "number" &&
    typeof value[1] === "number"
  ) {
    return [value as Position];
  }

  return value.flatMap((item) => collectPositions(item));
}

function getPolygonRings(
  geometry: NonNullable<GeoFeature["geometry"]>
): unknown[][] {
  if (geometry.type === "Polygon") {
    return geometry.coordinates as unknown[][];
  }

  if (geometry.type === "MultiPolygon") {
    return (geometry.coordinates as unknown[][][]).flat();
  }

  return [];
}

function makePath(
  feature: GeoFeature,
  project: (position: Position) => [number, number]
): string {
  if (!feature.geometry) return "";

  return getPolygonRings(feature.geometry)
    .map((ring) => {
      const points = collectPositions(ring);

      if (points.length < 3) return "";

      const commands = points.map((point, index) => {
        const [x, y] = project(point);

        return `${index === 0 ? "M" : "L"} ${x} ${y}`;
      });

      return `${commands.join(" ")} Z`;
    })
    .filter(Boolean)
    .join(" ");
}

export default function GeoJSONExplorer() {
  const [geojson, setGeojson] = useState<GeoJSONData | null>(null);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<SearchItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        const response = await fetch("/twt.geojson");

        if (!response.ok) {
          throw new Error(
            `GeoJSON request failed with status ${response.status}.`
          );
        }

        const data: GeoJSONData = await response.json();

        if (
          data.type !== "FeatureCollection" ||
          !Array.isArray(data.features)
        ) {
          throw new Error("The file is not a valid GeoJSON FeatureCollection.");
        }

        if (!cancelled) {
          setGeojson(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load GeoJSON."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, []);

  const searchItems = useMemo(() => {
    if (!geojson) return [];

    const items = new Map<string, SearchItem>();

    for (const feature of geojson.features) {
      const barangay = getBarangay(feature);
      const municipality = getMunicipality(feature);

      if (barangay) {
        const key = `barangay:${barangay.toLowerCase()}`;

        if (!items.has(key)) {
          items.set(key, {
            name: barangay,
            kind: "Barangay",
            municipality: municipality || undefined,
          });
        }
      }

      if (municipality) {
        const key = `municipality:${municipality.toLowerCase()}`;

        if (!items.has(key)) {
          items.set(key, {
            name: municipality,
            kind: "Municipality",
          });
        }
      }
    }

    return [...items.values()].sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [geojson]);

  const results = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return [];

    return searchItems
      .filter((item) => item.name.toLowerCase().includes(query))
      .slice(0, 8);
  }, [search, searchItems]);

  const selectedFeatures = useMemo(() => {
    if (!geojson || !selected) return [];

    return geojson.features.filter((feature) => {
      if (selected.kind === "Barangay") {
        return (
          getBarangay(feature).toLowerCase() ===
          selected.name.toLowerCase()
        );
      }

      return (
        getMunicipality(feature).toLowerCase() ===
        selected.name.toLowerCase()
      );
    });
  }, [geojson, selected]);

  const drawing = useMemo(() => {
    if (!selectedFeatures.length) return null;

    const features = selectedFeatures.filter(
      (feature) => feature.geometry
    );

    const positions = features.flatMap((feature) =>
      collectPositions(feature.geometry!.coordinates)
    );

    if (!positions.length) return null;

    const xs = positions.map((position) => position[0]);
    const ys = positions.map((position) => position[1]);

    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    const width = 640;
    const height = 380;
    const padding = 24;

    const rangeX = maxX - minX || 0.0001;
    const rangeY = maxY - minY || 0.0001;

    const scale = Math.min(
      (width - padding * 2) / rangeX,
      (height - padding * 2) / rangeY
    );

    const drawnWidth = rangeX * scale;
    const drawnHeight = rangeY * scale;

    const offsetX = (width - drawnWidth) / 2;
    const offsetY = (height - drawnHeight) / 2;

    const project = (
      position: Position
    ): [number, number] => [
      offsetX + (position[0] - minX) * scale,
      height - offsetY - (position[1] - minY) * scale,
    ];

    return {
      width,
      height,
      paths: features.map((feature, index) => ({
        key: `${index}-${getBarangay(feature)}`,
        d: makePath(feature, project),
      })),
    };
  }, [selectedFeatures]);

  function selectLocation(item: SearchItem) {
    setSelected(item);
    setSearch(item.name);
    setShowResults(false);
  }

  function clearSelection() {
    setSelected(null);
    setSearch("");
    setShowResults(false);
  }

  return (
    <section className="mx-auto w-full max-w-5xl space-y-6">
      {/* Search */}
      <div className="relative z-20 mx-auto max-w-2xl">
        <label
          htmlFor="location-search"
          className="mb-2 block text-sm font-semibold text-slate-700"
        >
          Search barangay or municipality
        </label>

        <div className="relative">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
            ⌕
          </span>

          <input
            id="location-search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setSelected(null);
              setShowResults(true);
            }}
            onFocus={() => setShowResults(true)}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                setShowResults(false);
              }

              if (event.key === "Enter" && results.length > 0) {
                event.preventDefault();
                selectLocation(results[0]);
              }
            }}
            placeholder="Type a location name..."
            autoComplete="off"
            className="w-full rounded-xl border border-slate-200 bg-white px-11 py-3.5 text-sm text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10"
          />

          {search && (
            <button
              type="button"
              onClick={clearSelection}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-slate-500 hover:bg-slate-100"
            >
              ✕
            </button>
          )}
        </div>

        {showResults && search.trim() && (
          <div className="absolute left-0 right-0 top-full mt-2 max-h-72 overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-xl">
            {results.length ? (
              results.map((item) => (
                <button
                  key={`${item.kind}-${item.name}`}
                  type="button"
                  onClick={() => selectLocation(item)}
                  className="flex w-full items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 text-left last:border-0 hover:bg-teal-50"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-slate-800">
                      {item.name}
                    </span>

                    {item.municipality && (
                      <span className="mt-1 block text-xs text-slate-500">
                        {item.municipality}
                      </span>
                    )}
                  </span>

                  <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                    {item.kind}
                  </span>
                </button>
              ))
            ) : (
              <p className="px-4 py-5 text-center text-sm text-slate-500">
                No matching locations found.
              </p>
            )}
          </div>
        )}
      </div>

      {showResults && (
        <button
          type="button"
          aria-label="Close search results"
          onClick={() => setShowResults(false)}
          className="fixed inset-0 z-10 cursor-default"
        />
      )}

      {/* Boundary viewer */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              {selected?.name ?? "GeoJSON Boundary Viewer"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {selected
                ? `${selected.kind} boundary`
                : "Select a location to display its boundary."}
            </p>
          </div>

          {selected && (
            <button
              type="button"
              onClick={clearSelection}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50"
            >
              Clear selection
            </button>
          )}
        </div>

        <div className="p-4 sm:p-6">
          {loading ? (
            <div className="flex min-h-56 items-center justify-center text-sm text-slate-500">
              Loading GeoJSON...
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
              <p className="font-semibold">
                Unable to load the GeoJSON file.
              </p>
              <p className="mt-2">{error}</p>
              <p className="mt-2">
                Confirm that your file is located at{" "}
                <code>public/twt.geojson</code>.
              </p>
            </div>
          ) : !selected ? (
            <div className="flex min-h-56 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center">
              <span className="mb-3 text-3xl text-teal-700">⌖</span>

              <p className="text-sm font-medium text-slate-700">
                No location selected
              </p>

              <p className="mt-1 max-w-sm text-sm text-slate-500">
                Search above and choose a barangay or municipality to see
                its boundary.
              </p>
            </div>
          ) : !drawing || drawing.paths.every((path) => !path.d) ? (
            <div className="rounded-xl bg-amber-50 p-5 text-sm text-amber-800">
              No drawable boundary was found. The GeoJSON properties or
              geometry type may differ from what this viewer supports.
            </div>
          ) : (
            <>
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-slate-700">
                  Selected area
                </p>

                <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-medium text-teal-700">
                  {selectedFeatures.length} feature
                  {selectedFeatures.length === 1 ? "" : "s"}
                </span>
              </div>

              <div className="flex min-h-52 items-center justify-center overflow-hidden rounded-xl border border-slate-100 bg-slate-50 p-3 sm:p-5">
                <svg
                  viewBox={`0 0 ${drawing.width} ${drawing.height}`}
                  role="img"
                  aria-label={`${selected.name} geographic boundary`}
                  className="block h-auto max-h-[300px] w-full max-w-xl"
                  preserveAspectRatio="xMidYMid meet"
                >
                  {drawing.paths.map((path) => (
                    <path
                      key={path.key}
                      d={path.d}
                      fill="#0d9488"
                      fillOpacity={0.2}
                      stroke="#0f766e"
                      strokeWidth={1.5}
                      strokeLinejoin="round"
                      fillRule="evenodd"
                    />
                  ))}
                </svg>
              </div>

              <p className="mt-3 text-center text-xs text-slate-500">
                Geographic boundary from your GeoJSON dataset.
              </p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
