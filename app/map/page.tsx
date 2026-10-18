
"use client";

import { useEffect, useRef, useState } from "react";
import { Map as MapLibreMap, setWorkerUrl, NavigationControl } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import SearchBar, { type SearchResult } from "../../component/SearchBar";
import InfoSidebar from "../../component/InfoSidebar";

import {
  clearGeoJsonHighlight,
  addGeoJsonLayer,
  setGeoJsonVisibility,highlightGeoJson 
} from "@/utils/geolayer";
setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");

const mapStyles = {
   Positron: "https://tiles.openfreemap.org/styles/positron",
  Liberty: "https://tiles.openfreemap.org/styles/liberty",
  Bright: "https://tiles.openfreemap.org/styles/bright",
};

type StyleName = keyof typeof mapStyles;

export default function Map() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);

  const [selectedStyle, setSelectedStyle] =
    useState<StyleName>("Liberty");
  const [showGeoLayer, setShowGeoLayer] = useState(false);

  useEffect(() => {
    if (!mapContainer.current) return;

    const map = new MapLibreMap({
      container: mapContainer.current,
      style: mapStyles.Bright,
      center: [119.7657797, 5.0245908],
      zoom: 12,
    });

   map.addControl(new NavigationControl(), "bottom-right");

    map.on("load", () => {
      addGeoJsonLayer(map);

      // Apply the current visibility setting
      setGeoJsonVisibility(map, showGeoLayer);
    });


    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

    function toggleGeoLayer() {
    const nextVisible = !showGeoLayer;

    setShowGeoLayer(nextVisible);

    const map = mapRef.current;

    if (map?.isStyleLoaded()) {
      setGeoJsonVisibility(map, nextVisible);
    }
  }

  function handleStyleChange(style: StyleName) {
    setSelectedStyle(style);
    mapRef.current?.setStyle(mapStyles[style]);
  }

  const [selected, setSelected] = useState<{
  kind: "municipality" | "barangay";
  id: number;
} | null>(null);

// function handleSearchSelect(r: SearchResult) {
//   setSelected({ kind: r.kind, id: r.id });

//   if (r.lat != null && r.lng != null) {
//     mapRef.current?.flyTo({
//       center: [r.lng, r.lat],
//       zoom: r.kind === "municipality" ? 12 : 14,
//     });
//   }
// }
function clearSearchSelection() {
  setSelected(null);

  if (mapRef.current) {
    clearGeoJsonHighlight(mapRef.current);
  }
}

function handleSearchSelect(r: SearchResult) {
  setSelected({ kind: r.kind, id: r.id });

  const map = mapRef.current;

  if (!map) return;

  void highlightGeoJson(map, r.kind, r.label).catch(
    (error) => {
      console.error("Failed to highlight GeoJSON:", error);
    }
  );
}


return (
  <div className="relative h-screen w-full overflow-hidden">
    {/* Map */}
    <div
      ref={mapContainer}
      className="absolute inset-0 h-full w-full"
    />

    {/* Search bar */}
    
{/* Search bar + GeoLayer button */}

{/* Search bar + GeoLayer button */}
<div className="absolute left-4 top-4 z-30 flex items-center gap-2">
  <div className="w-80 [&_nav]:pointer-events-auto">
    <SearchBar onSelect={handleSearchSelect}
    onClear={clearSearchSelection} />
  </div>

  <button
    type="button"
    onClick={toggleGeoLayer}
    className="flex h-10 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white px-4 text-sm font-medium text-gray-900 shadow-md hover:bg-gray-100"
  >
    {showGeoLayer ? "Hide province boundary" : "Show province boundary"}
  </button>
</div>



    {/* Selected barangay information */}
    {selected && (
      <InfoSidebar
        selected={selected}
        onClose={() => setSelected(null)}
      />
    )}

    {/* Map style selector */}
    <div className="absolute bottom-4 left-4 z-10">
      <select
        aria-label="Choose map style"
        value={selectedStyle}
        onChange={(e) =>
          handleStyleChange(e.target.value as StyleName)
        }
        className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-md"
      >
        {Object.keys(mapStyles).map((style) => (
          <option key={style} value={style}>
            {style}
          </option>
        ))}
      </select>
    </div>
  </div>
);
}