


import * as maplibregl from "maplibre-gl";
import type {
  Map as MapLibreMap,
  LngLatLike,
  GeoJSONSource,
} from "maplibre-gl";
import type {
  Feature,
  FeatureCollection,
  Geometry,
} from "geojson";

export const GEO_SOURCE_ID = "bongao-source";
export const GEO_FILL_ID = "bongao-fill";
export const GEO_OUTLINE_ID = "bongao-outline";

const HIGHLIGHT_SOURCE_ID = "geo-highlight-source";
const HIGHLIGHT_FILL_ID = "geo-highlight-fill";
const HIGHLIGHT_OUTLINE_ID = "geo-highlight-outline";

type PlaceKind = "municipality" | "barangay";

type GeoProperties = {
  adm4_en?: string;
  adm4_psgc?: string | number;
  adm3_en?: string;
  adm3_psgc?: string | number;
  municipality?: string;
  brgy?: string;
  name?: string;
  "Brgy name"?: string;
  [key: string]: unknown;
};

type GeoFeature = Feature<Geometry, GeoProperties>;

let geoJsonPromise:
  | Promise<FeatureCollection<Geometry, GeoProperties>>
  | null = null;

function normalize(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLocaleLowerCase("en");
}

function loadGeoJson() {
  if (!geoJsonPromise) {
    geoJsonPromise = fetch("/twt.geojson")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to load /twt.geojson");
        }

        return response.json();
      })
      .catch((error) => {
        geoJsonPromise = null;
        throw error;
      });
  }

  return geoJsonPromise;
}

export async function addGeoJsonLayer(map: MapLibreMap) {
  const geoJson = await loadGeoJson();

  if (!map.getSource(GEO_SOURCE_ID)) {
    map.addSource(GEO_SOURCE_ID, {
      type: "geojson",
      data: geoJson,
    });
  }

  if (!map.getLayer(GEO_FILL_ID)) {
    map.addLayer({
      id: GEO_FILL_ID,
      type: "fill",
      source: GEO_SOURCE_ID,
      layout: { visibility: "none" },
      paint: {
        "fill-color": "#3b82f6",
        "fill-opacity": 0.3,
      },
    });
  }

  if (!map.getLayer(GEO_OUTLINE_ID)) {
    map.addLayer({
      id: GEO_OUTLINE_ID,
      type: "line",
      source: GEO_SOURCE_ID,
      layout: { visibility: "none" },
      paint: {
        "line-color": "#4177f3",
        "line-width": 1.5,
      },
    });
    
  }

  if (!map.getSource(HIGHLIGHT_SOURCE_ID)) {
    map.addSource(HIGHLIGHT_SOURCE_ID, {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: [],
      },
    });
  }

  if (!map.getLayer(HIGHLIGHT_FILL_ID)) {
    map.addLayer({
      id: HIGHLIGHT_FILL_ID,
      type: "fill",
      source: HIGHLIGHT_SOURCE_ID,
      paint: {
        // "fill-color": "#FFD444",
         "fill-color": "#800020",
        "fill-opacity": 1,
      },
    });
  }

  if (!map.getLayer(HIGHLIGHT_OUTLINE_ID)) {
    map.addLayer({
      id: HIGHLIGHT_OUTLINE_ID,
      type: "line",
      source: HIGHLIGHT_SOURCE_ID,
      paint: {
        "line-color": "#FFF9F2",
        "line-width": 1,
      },
    });
  }
}

export async function highlightGeoJson(
  map: MapLibreMap,
  kind: PlaceKind,
  label: string
) {
  const geoJson = await loadGeoJson();
  const target = normalize(label);

  const matches = geoJson.features.filter((feature) => {
    const p = (feature.properties ?? {}) as GeoProperties;

    if (kind === "barangay") {
      const names = [
        p.adm4_en,
        p.brgy,
        p.name,
        p["Brgy name"],
      ];

      return names.some((name) => normalize(name) === target);
    }

    // Match all barangays whose municipality property
    // has the selected municipality's name.
    const municipalityNames = [
      p.municipality,
      p.adm3_en,
    ];

    return municipalityNames.some(
      (name) => normalize(name) === target
    );
  }) as GeoFeature[];

  const source = map.getSource(
    HIGHLIGHT_SOURCE_ID
  ) as maplibregl.GeoJSONSource | undefined;

  if (!source) {
    console.error(
      "Highlight source is missing. Call addGeoJsonLayer after map load."
    );
    return;
  }

  source.setData({
    type: "FeatureCollection",
    features: matches,
  });

  if (matches.length === 0) {
    console.warn(`No GeoJSON features matched: ${label} (${kind})`);
    return;
  }

  const bounds = new maplibregl.LngLatBounds();

  function addCoordinates(value: unknown) {
    if (
      Array.isArray(value) &&
      value.length >= 2 &&
      typeof value[0] === "number" &&
      typeof value[1] === "number"
    ) {
      bounds.extend([value[0], value[1]]);
      return;
    }

    if (Array.isArray(value)) {
      value.forEach(addCoordinates);
    }
  }

//   for (const feature of matches) {
//     if (feature.geometry) {
//       addCoordinates(feature.geometry.coordinates);
//     }
//   }

  if (!bounds.isEmpty()) {
    map.fitBounds(bounds, {
      padding: 70,
      maxZoom: kind === "barangay" ? 14 : 12,
      duration: 1000,
    });
  }
}

export function clearGeoJsonHighlight(map: MapLibreMap) {
  const source = map.getSource(
    HIGHLIGHT_SOURCE_ID
  ) as maplibregl.GeoJSONSource | undefined;

  source?.setData({
    type: "FeatureCollection",
    features: [],
  });
}


export function setGeoJsonVisibility(
  map: MapLibreMap,
  visible: boolean
) {
  const visibility = visible ? "visible" : "none";

  // Toggle only the full GeoJSON layer.
  for (const id of [GEO_FILL_ID, GEO_OUTLINE_ID]) {
    if (map.getLayer(id)) {
      map.setLayoutProperty(id, "visibility", visibility);
    }
  }

  // Keep the highlight layers visible independently.
  for (const id of [HIGHLIGHT_FILL_ID, HIGHLIGHT_OUTLINE_ID]) {
    if (map.getLayer(id)) {
      map.setLayoutProperty(id, "visibility", "visible");
    }
  }
}
