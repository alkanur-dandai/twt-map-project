


"use client";

import { useEffect, useMemo, useRef, useState } from "react";

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

type Stat = {
  year: number;
  totalPopulation: number;
  totalVoters: number;
};

type BarangayInfo = {
  kind: "barangay";
  name: string;
  type: string;
  municipality: string;
  stats: Stat[];
};

type MunicipalityInfo = {
  kind: "municipality";
  name: string;
  barangayCount: number;
  totalPopulation: number;
  totalVoters: number;
  barangays: string[];
  stats: Stat[];
};

type PlaceInfo = BarangayInfo | MunicipalityInfo;

type PopulationResponse = {
  municipality?: string;
  barangays?: {
    name: string;
    population?: number | null;
    totalPopulation?: number | null;
  }[];
  error?: string;
};

const LEGEND_ITEMS = [
  { label: "Very High", range: "10,000+", color: "#dc2626" },
  { label: "High", range: "5,000–9,999", color: "#f97316" },
  { label: "Medium", range: "2,000–4,999", color: "#eab308" },
  { label: "Low", range: "Below 2,000", color: "#22c55e" },
  { label: "No data", range: "Unavailable", color: "#94a3b8" },
];

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

    if (typeof value === "number") {
      return String(value);
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

function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
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

function getPopulationColor(population: number | null | undefined) {
  if (population == null || !Number.isFinite(population)) {
    return "#94a3b8";
  }

  if (population >= 10000) return "#dc2626";
  if (population >= 5000) return "#f97316";
  if (population >= 2000) return "#eab308";

  return "#22c55e";
}

export default function GeoJSONExplorer() {
  const [geojson, setGeojson] = useState<GeoJSONData | null>(null);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<SearchItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showResults, setShowResults] = useState(false);

  const [placeInfo, setPlaceInfo] = useState<PlaceInfo | null>(null);
  const [infoLoading, setInfoLoading] = useState(false);
  const [infoError, setInfoError] = useState("");

  // Population highlighting state
  const [showPopulation, setShowPopulation] = useState(false);
  const [populationByBarangay, setPopulationByBarangay] = useState<
    Record<string, number | null>
  >({});
  const [populationLoading, setPopulationLoading] = useState(false);
  const [populationError, setPopulationError] = useState("");
  const [populationLoaded, setPopulationLoaded] = useState(false);


  // GeoJSON zoom and pan
const [zoom, setZoom] = useState(0.8);
const [pan, setPan] = useState({ x: 0, y: 0 });
const [isDragging, setIsDragging] = useState(false);

const dragStart = useRef({
  x: 0,
  y: 0,
  panX: 0,
  panY: 0,
});

const dragMoved = useRef(false);

function handleWheel(e: React.WheelEvent<HTMLDivElement>) {
  e.preventDefault();

  const factor = e.deltaY < 0 ? 1.1 : 0.9;

  setZoom((current) =>
    Math.min(3, Math.max(0.5, current * factor))
  );
}

function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
  if (e.pointerType === "mouse" && e.button !== 0) return;

  dragMoved.current = false;

  dragStart.current = {
    x: e.clientX,
    y: e.clientY,
    panX: pan.x,
    panY: pan.y,
  };

  setIsDragging(true);
  e.currentTarget.setPointerCapture(e.pointerId);
}

function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
  if (!isDragging) return;

  const dx = e.clientX - dragStart.current.x;
  const dy = e.clientY - dragStart.current.y;

  if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
    dragMoved.current = true;
  }

  setPan({
    x: dragStart.current.panX + dx,
    y: dragStart.current.panY + dy,
  });
}

function handlePointerUp() {
  setIsDragging(false);
}

function resetMapView() {
  setZoom(0.8);
  setPan({ x: 0, y: 0 });
}

  // Load GeoJSON
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
          throw new Error(
            "The file is not a valid GeoJSON FeatureCollection."
          );
        }

        if (!cancelled) {
          setGeojson(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Unable to load GeoJSON."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadData();

    return () => {
      cancelled = true;
    };
  }, []);

  // Build unique search items from GeoJSON
  const searchItems = useMemo(() => {
    if (!geojson) return [];

    const items = new Map<string, SearchItem>();

    for (const feature of geojson.features) {
      const barangay = getBarangay(feature);
      const municipality = getMunicipality(feature);

      if (barangay) {
        const key = `barangay:${normalizeName(barangay)}:${normalizeName(
          municipality
        )}`;

        if (!items.has(key)) {
          items.set(key, {
            name: barangay,
            kind: "Barangay",
            municipality: municipality || undefined,
          });
        }
      }

      if (municipality) {
        const key = `municipality:${normalizeName(municipality)}`;

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

  // Filter results as the user types
  const results = useMemo(() => {
    const query = normalizeName(search);

    if (!query) return [];

    return searchItems
      .filter((item) => normalizeName(item.name).includes(query))
      .slice(0, 8);
  }, [search, searchItems]);

  // Find GeoJSON features for the selected location
  const selectedFeatures = useMemo(() => {
    if (!geojson || !selected) return [];

    return geojson.features.filter((feature) => {
      if (selected.kind === "Barangay") {
        const sameBarangay =
          normalizeName(getBarangay(feature)) ===
          normalizeName(selected.name);

        const sameMunicipality =
          !selected.municipality ||
          normalizeName(getMunicipality(feature)) ===
            normalizeName(selected.municipality);

        return sameBarangay && sameMunicipality;
      }

      return (
        normalizeName(getMunicipality(feature)) ===
        normalizeName(selected.name)
      );
    });
  }, [geojson, selected]);

  // Calculate the SVG boundary drawing
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
        name: getBarangay(feature),
        d: makePath(feature, project),
      })),
    };
  }, [selectedFeatures]);

  // Match the selected GeoJSON name to Supabase, then fetch its information.
  async function selectLocation(item: SearchItem) {
    resetMapView();
    setSelected(item);
    setSearch(item.name);
    setShowResults(false);

    setPlaceInfo(null);
    setInfoError("");
    setInfoLoading(true);

    setShowPopulation(false);
    setPopulationByBarangay({});
    setPopulationError("");
    setPopulationLoaded(false);

    // Fetch population for every barangay in the selected municipality.
    if (item.kind === "Municipality") {
      setPopulationLoading(true);

      try {
        const response = await fetch(
          `/api/municipality-population?name=${encodeURIComponent(item.name)}`
        );

        const data: PopulationResponse = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || "Unable to load barangay populations."
          );
        }

        const populationMap: Record<string, number | null> = {};

        for (const barangay of data.barangays ?? []) {
          // Supports either "population" or "totalPopulation" in the API.
          const rawPopulation =
            barangay.totalPopulation ?? barangay.population;

          populationMap[normalizeName(barangay.name)] =
            rawPopulation == null ? null : Number(rawPopulation);
        }

        setPopulationByBarangay(populationMap);
        setPopulationLoaded(true);
      } catch (err) {
        setPopulationError(
          err instanceof Error
            ? err.message
            : "Unable to load barangay populations."
        );
      } finally {
        setPopulationLoading(false);
      }
    } else {
      setPopulationLoading(false);
    }

    // Fetch the selected location's normal information.
    try {
      const kind =
        item.kind === "Barangay" ? "barangay" : "municipality";

      const params = new URLSearchParams({
        kind,
        name: item.name,
      });

      if (item.kind === "Barangay" && item.municipality) {
        params.set("municipality", item.municipality);
      }

      const matchResponse = await fetch(
        `/api/placesearch?${params.toString()}`
      );

      const match = await matchResponse.json();

      if (!matchResponse.ok) {
        throw new Error(
          match.error || "Location not found in the database."
        );
      }

      if (match.id === undefined || match.id === null) {
        throw new Error("The database did not return a location ID.");
      }

      const infoParams = new URLSearchParams({
        kind,
        id: String(match.id),
      });

      const infoResponse = await fetch(
        `/api/placeinfo?${infoParams.toString()}`
      );

      const info = await infoResponse.json();

      if (!infoResponse.ok || !info) {
        throw new Error(
          info.error || "Failed to load location information."
        );
      }

      setPlaceInfo(info as PlaceInfo);
    } catch (err) {
      setInfoError(
        err instanceof Error
          ? err.message
          : "Unable to load location information."
      );
    } finally {
      setInfoLoading(false);
    }
  }

  function clearSelection() {
    setSelected(null);
    setSearch("");
    setShowResults(false);

    setPlaceInfo(null);
    setInfoError("");
    setInfoLoading(false);

    setShowPopulation(false);
    setPopulationByBarangay({});
    setPopulationError("");
    setPopulationLoading(false);
    setPopulationLoaded(false);
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    setSelected(null);
    setPlaceInfo(null);
    setInfoError("");
    setInfoLoading(false);

    setShowPopulation(false);
    setPopulationByBarangay({});
    setPopulationError("");
    setPopulationLoading(false);
    setPopulationLoaded(false);

    setShowResults(true);
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
            onChange={(event) => handleSearchChange(event.target.value)}
            onFocus={() => setShowResults(true)}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                setShowResults(false);
              }

              if (event.key === "Enter" && results.length > 0) {
                event.preventDefault();
                void selectLocation(results[0]);
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
                  key={`${item.kind}-${item.name}-${item.municipality ?? ""}`}
                  type="button"
                  onClick={() => void selectLocation(item)}
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

      {/* Main container */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              {selected?.name ?? "GeoJSON Boundary Viewer"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {selected
                ? `${selected.kind} boundary and database information`
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
          {!selected ? (
            <div className="flex min-h-56 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center">
              <span className="mb-3 text-3xl text-teal-700">⌖</span>
              <p className="text-sm font-medium text-slate-700">
                No location selected
              </p>
              <p className="mt-1 max-w-sm text-sm text-slate-500">
                Search above and choose a barangay or municipality to see its
                boundary and statistics.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
              {/* Left: GeoJSON viewer and population toggle */}
            <div className="flex min-w-0 flex-col lg:col-span-8">
                <div>
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
                  ) : !drawing ||
                    drawing.paths.every((path) => !path.d) ? (
                    <div className="rounded-xl bg-amber-50 p-5 text-sm text-amber-800">
                      No drawable boundary was found. Check the selected
                      location name, GeoJSON geometry, or supported geometry
                      type.
                    </div>
                  ) : (
                    <>
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm font-medium text-slate-700">
                          Selected area
                        </p>
                        <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-medium text-teal-700">
                          {selectedFeatures.length} feature
                          {selectedFeatures.length === 1 ? "" : "s"}
                        </span>
                      </div>

                      {/* Show population control only for municipalities */}
                    
{/* Floating population controls for municipalities */}
{selected.kind === "Municipality" && (
  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
    <p className="text-sm text-slate-600">
      Color barangays by population
    </p>

    <button
      type="button"
      disabled={populationLoading || !populationLoaded}
      onClick={() => setShowPopulation((current) => !current)}
      className={`rounded-lg px-3 py-2 text-xs font-semibold shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${
        showPopulation
          ? "bg-slate-700 text-white hover:bg-slate-800"
          : "bg-teal-600 text-white hover:bg-teal-700"
      }`}
    >
      {populationLoading
        ? "Loading population..."
        : showPopulation
          ? "Hide population"
          : "Show population"}
    </button>

    {populationError && (
      <p className="w-full text-xs text-red-600">
        {populationError}
      </p>
    )}
  </div>
)}



<div
  onWheel={handleWheel}
  onPointerDown={(e) => {
    if ((e.target as HTMLElement).closest("button")) return;
    handlePointerDown(e);
  }}
  onPointerMove={handlePointerMove}
  onPointerUp={handlePointerUp}
  onPointerCancel={handlePointerUp}
  className={`relative flex min-h-52 items-center justify-center overflow-hidden rounded-xl border border-slate-100 bg-slate-50 p-3 sm:p-5 ${
    isDragging ? "cursor-grabbing" : "cursor-grab"
  }`}
  style={{ touchAction: "none" }}
>
  {/* Zoom controls */}
  <div className="absolute right-2 top-2 z-20 flex gap-1">
    <button
      type="button"
      onClick={() => setZoom((z) => Math.min(3, z * 1.2))}
      className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold shadow-sm hover:bg-slate-100"
      aria-label="Zoom in"
    >
      +
    </button>

    <button
      type="button"
      onClick={() => setZoom((z) => Math.max(0.5, z / 1.2))}
      className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold shadow-sm hover:bg-slate-100"
      aria-label="Zoom out"
    >
      −
    </button>

    <button
      type="button"
      onClick={resetMapView}
      className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs shadow-sm hover:bg-slate-100"
    >
      Reset
    </button>
  </div>

  <svg
    viewBox={`0 0 ${drawing.width} ${drawing.height}`}
    role="img"
    aria-label={`${selected.name} geographic boundary`}
    className="block h-auto max-h-[380px] w-full max-w-none"
    preserveAspectRatio="xMidYMid meet"
    style={{
      transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
      transformOrigin: "center center",
      transition: isDragging ? "none" : "transform 80ms ease-out",
      flexShrink: 0,
    }}
  >
    {drawing.paths.map((path) => {
      const population =
        populationByBarangay[normalizeName(path.name)];

      const populationMode =
        selected.kind === "Municipality" && showPopulation;

      return (
        <path
          key={path.key}
          d={path.d}
          fill={
            populationMode
              ? getPopulationColor(population)
              : "#0d9488"
          }
          fillOpacity={populationMode ? 0.8 : 0.2}
          stroke={populationMode ? "#ffffff" : "#0f766e"}
          strokeWidth={populationMode ? 1.2 : 1.5}
          strokeLinejoin="round"
          fillRule="evenodd"
          vectorEffect="non-scaling-stroke"
        >
          <title>
            {path.name || "Barangay"}
            {populationMode
              ? ` — ${
                  population == null
                    ? "No population data"
                    : `${population.toLocaleString()} people`
                }`
              : ""}
          </title>
        </path>
      );
    })}
  </svg>

  {/* Keep your existing population legend here */}
{selected.kind === "Municipality" && showPopulation && (
  <div className="absolute bottom-1 left-1 right-1 z-10 grid grid-cols-2 gap-x-2 gap-y-1 rounded-md bg-white/80 px-2 py-1 sm:flex sm:flex-wrap sm:items-center sm:justify-center sm:gap-x-3">
    {LEGEND_ITEMS.map((item) => (
      <div
        key={item.label}
        className="flex min-w-0 items-center gap-1"
      >
        <span
          className="h-2 w-2 shrink-0 rounded-sm"
          style={{ backgroundColor: item.color }}
        />
        <span className="whitespace-nowrap text-[8px] leading-tight text-slate-700 sm:text-[10px]">
          {item.label}
          <span className="ml-1 text-slate-500">
            {item.range}
          </span>
        </span>
      </div>
    ))}
  </div>
)}
</div>



                      {selected.kind === "Municipality" && showPopulation && (
                        <p className="mt-2 text-xs text-slate-500">
                          Hover over a barangay boundary to see its name and
                          population.
                        </p>
                      )}
                    </>
                  )}
                </div>

                <p className="mt-3 text-center text-xs text-slate-500">
                  Geographic boundary from your GeoJSON dataset.
                </p>
              </div>

              {/* Right: Location information */}
<div className="flex min-w-0 flex-col border-t border-slate-100 pt-5 lg:col-span-4 lg:border-l lg:border-t-0 lg:pl-4 lg:pt-0">                {infoLoading ? (
                  <div className="flex flex-1 items-center justify-center py-10">
                    <p className="text-sm text-slate-500">
                      Loading database information...
                    </p>
                  </div>
                ) : infoError ? (
                  <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                    {infoError}
                  </p>
                ) : placeInfo ? (
                  <div className="flex flex-1 flex-col">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">
                        {placeInfo.name}
                      </h3>

                      {placeInfo.kind === "barangay" ? (
                        <p className="mt-1 text-sm text-slate-500">
                          {placeInfo.type} · {placeInfo.municipality}
                        </p>
                      ) : (
                        <p className="mt-1 text-sm text-slate-500">
                          Municipality · {placeInfo.barangayCount} barangays
                        </p>
                      )}
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-teal-50 p-4">
                        <p className="text-xs font-medium text-teal-700">
                          Population
                        </p>
                        <p className="mt-1 truncate text-xl font-bold text-teal-900">
                          {Number(
                            placeInfo.kind === "municipality"
                              ? placeInfo.totalPopulation
                              : placeInfo.stats[0]?.totalPopulation ?? 0
                          ).toLocaleString()}
                        </p>
                      </div>

                      <div className="rounded-xl bg-sky-50 p-4">
                        <p className="text-xs font-medium text-sky-700">
                          Voters
                        </p>
                        <p className="mt-1 truncate text-xl font-bold text-sky-900">
                          {Number(
                            placeInfo.kind === "municipality"
                              ? placeInfo.totalVoters
                              : placeInfo.stats[0]?.totalVoters ?? 0
                          ).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <h4 className="mt-6 text-sm font-semibold text-slate-800">
                      Population from POPCEN Data
                    </h4>

                    {placeInfo.stats.length > 0 ? (
                    <div className="mt-2 max-h-64 min-w-0 flex-1 overflow-auto">
                       <table className="w-full text-left text-xs sm:text-sm">
                          <thead className="sticky top-0 bg-slate-50 text-slate-600">
                            <tr>
                              <th className="px-3 py-2">Year</th>
                              <th className="px-3 py-2">Population</th>
                              <th className="px-3 py-2">Voters</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {placeInfo.stats.map((stat) => (
                              <tr key={stat.year}>
                                <td className="px-3 py-2 font-medium">
                                  {stat.year}
                                </td>
                                <td className="px-3 py-2">
                                  {Number(
                                    stat.totalPopulation
                                  ).toLocaleString()}
                                </td>
                                <td className="px-3 py-2">
                                  {Number(stat.totalVoters).toLocaleString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="mt-3 text-sm text-slate-500">
                        No statistics are available for this location.
                      </p>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

