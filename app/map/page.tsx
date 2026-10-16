
"use client";

import { useEffect, useRef, useState } from "react";
import { Map as MapLibreMap, setWorkerUrl } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import SearchBar, { type SearchResult } from "../../component/SearchBar";
import InfoSidebar from "../../component/InfoSidebar";
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

  useEffect(() => {
    if (!mapContainer.current) return;

    const map = new MapLibreMap({
      container: mapContainer.current,
      style: mapStyles.Liberty,
      center: [119.7657797, 5.0245908],
      zoom: 12,
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  function handleStyleChange(style: StyleName) {
    setSelectedStyle(style);
    mapRef.current?.setStyle(mapStyles[style]);
  }

  const [selected, setSelected] = useState<{
  kind: "municipality" | "barangay";
  id: number;
} | null>(null);

function handleSearchSelect(r: SearchResult) {
  setSelected({ kind: r.kind, id: r.id });

  if (r.lat != null && r.lng != null) {
    mapRef.current?.flyTo({
      center: [r.lng, r.lat],
      zoom: r.kind === "municipality" ? 12 : 14,
    });
  }
}

  return (
    <div className="relative w-full">
      <div
        ref={mapContainer}
        className="w-full"
        style={{ height: "500px" }}
      />

<div className="absolute left-4 top-4 z-20">
  <SearchBar onSelect={handleSearchSelect} />
</div>

{selected && (
  <InfoSidebar selected={selected} onClose={() => setSelected(null)} />
)}
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
