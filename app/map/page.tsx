
// "use client";

// import { useEffect, useRef, useState } from "react";
// import { Map as MapLibreMap, setWorkerUrl, NavigationControl } from "maplibre-gl";
// import "maplibre-gl/dist/maplibre-gl.css";
// import SearchBar, { type SearchResult } from "../../component/SearchBar";
// import InfoSidebar from "../../component/InfoSidebar";

// import {
//   clearGeoJsonHighlight,
//   addGeoJsonLayer,
//   setGeoJsonVisibility,highlightGeoJson 
// } from "@/utils/geolayer";
// import Navbar from "@/component/Navbar";

// setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");

// const mapStyles = {
//    Positron: "https://tiles.openfreemap.org/styles/positron",
//   Liberty: "https://tiles.openfreemap.org/styles/liberty",
//   Bright: "https://tiles.openfreemap.org/styles/bright",
// };

// type StyleName = keyof typeof mapStyles;

// export default function Map() {
//   const mapContainer = useRef<HTMLDivElement>(null);
//   const mapRef = useRef<MapLibreMap | null>(null);

//   const [selectedStyle, setSelectedStyle] =
//     useState<StyleName>("Liberty");
//   const [showGeoLayer, setShowGeoLayer] = useState(false);

//   useEffect(() => {
//     if (!mapContainer.current) return;

//     const map = new MapLibreMap({
//       container: mapContainer.current,
//       style: mapStyles.Bright,
//       center: [119.7657797, 5.0245908],
//       zoom: 12,
//     });

//    map.addControl(new NavigationControl(), "bottom-right");

//     map.on("load", () => {
//       addGeoJsonLayer(map);

//       // Apply the current visibility setting
//       setGeoJsonVisibility(map, showGeoLayer);
//     });


//     mapRef.current = map;

//     return () => {
//       map.remove();
//       mapRef.current = null;
//     };
//   }, []);

//     function toggleGeoLayer() {
//     const nextVisible = !showGeoLayer;

//     setShowGeoLayer(nextVisible);

//     const map = mapRef.current;

//     if (map?.isStyleLoaded()) {
//       setGeoJsonVisibility(map, nextVisible);
//     }
//   }

//   function handleStyleChange(style: StyleName) {
//     setSelectedStyle(style);
//     mapRef.current?.setStyle(mapStyles[style]);
//   }

//   const [selected, setSelected] = useState<{
//   kind: "municipality" | "barangay";
//   id: number;
// } | null>(null);

// // function handleSearchSelect(r: SearchResult) {
// //   setSelected({ kind: r.kind, id: r.id });

// //   if (r.lat != null && r.lng != null) {
// //     mapRef.current?.flyTo({
// //       center: [r.lng, r.lat],
// //       zoom: r.kind === "municipality" ? 12 : 14,
// //     });
// //   }
// // }
// function clearSearchSelection() {
//   setSelected(null);

//   if (mapRef.current) {
//     clearGeoJsonHighlight(mapRef.current);
//   }
// }

// function handleSearchSelect(r: SearchResult) {
//   setSelected({ kind: r.kind, id: r.id });

//   const map = mapRef.current;

//   if (!map) return;

//   void highlightGeoJson(map, r.kind, r.label).catch(
//     (error) => {
//       console.error("Failed to highlight GeoJSON:", error);
//     }
//   );
// }


// return (
  
// <div className="flex flex-col h-screen w-full overflow-hidden bg-gray-50">


//   <Navbar />
//   <div className="relative h-screen w-full overflow-hidden">
//     {/* Map */}
//     <div
//       ref={mapContainer}
//       className="absolute inset-0 h-full w-full"
//     />

  
// <div className="absolute left-3 right-3 top-3 z-30 flex flex-col items-stretch gap-2 sm:left-4 sm:right-auto sm:top-4 sm:flex-row sm:items-start">
//   <div className="w-full sm:w-80 [&_nav]:pointer-events-auto">
//     <SearchBar
//       onSelect={handleSearchSelect}
//       onClear={clearSearchSelection}
//     />
//   </div>

//   <button
//     type="button"
//     onClick={toggleGeoLayer}

// className="flex h-10 w-fit min-w-0 shrink-0 items-center justify-center self-start rounded-lg border border-gray-300 bg-white px-3 text-xs font-medium text-gray-900 shadow-md transition hover:bg-gray-100 sm:h-10 sm:w-auto sm:px-4 sm:text-sm"
//   >
//     {showGeoLayer
//       ? "Hide province boundary"
//       : "Show province boundary"}
//   </button>
// </div>






// {selected && (
//     <InfoSidebar
//       selected={selected}
//       onClose={() => setSelected(null)}
//     />
  
// )}


//     {/* Map style selector */}
    
//     <div className="absolute bottom-4 left-4 z-10">
//       <select
//         aria-label="Choose map style"
//         value={selectedStyle}
//         onChange={(e) =>
//           handleStyleChange(e.target.value as StyleName)
//         }
//         className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-md"
//       >
//         {Object.keys(mapStyles).map((style) => (
//           <option key={style} value={style}>
//             {style}
//           </option>
//         ))}
//       </select>
//     </div>
//   </div>
//   </div>
// );
// }

"use client";

import { useEffect, useRef, useState } from "react";
import { Map as MapLibreMap, setWorkerUrl, NavigationControl } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import SearchBar, { type SearchResult } from "../../component/SearchBar";
import InfoSidebar from "../../component/InfoSidebar";

import {
  clearGeoJsonHighlight,
  addGeoJsonLayer,
  setGeoJsonVisibility,
  highlightGeoJson,
} from "@/utils/geolayer";
import Navbar from "@/component/Navbar";

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

  const [selectedStyle, setSelectedStyle] = useState<StyleName>("Liberty");
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

    // map.on("load", () => {
    //   addGeoJsonLayer(map);
    //   setGeoJsonVisibility(map, showGeoLayer);
    // });

    map.on("load", () => {
  void addGeoJsonLayer(map)
    .then(() => {
      setGeoJsonVisibility(map, showGeoLayer);
    })
    .catch((error) => {
      console.error("Failed to load GeoJSON layer:", error);
    });
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

    void highlightGeoJson(map, r.kind, r.label).catch((error) => {
      console.error("Failed to highlight GeoJSON:", error);
    });
  }

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-gray-50">
      <Navbar />
      
      {/* Map Area Container (flex-1 ensures it takes the remaining height nicely without double-scrollbars) */}
      <div className="relative flex-1 w-full overflow-hidden">
        
        {/* Map Canvas */}
        <div ref={mapContainer} className="absolute inset-0 h-full w-full" />

        {/* Top Control: Search Bar */}
        <div className="absolute left-3 right-3 top-3 z-30 sm:left-4 sm:right-auto sm:top-4 w-full sm:w-80">
          <SearchBar
            onSelect={handleSearchSelect}
            onClear={clearSearchSelection}
          />
        </div>

        {/* Info Sidebar (Explicitly wrapped with high z-index and positioning so it pops up) */}
       {/* Info Sidebar */}
{selected && (
  <InfoSidebar
    selected={selected}
    onClose={() => setSelected(null)}
  />
)}

        {/* Bottom-Left Controls: Boundary Toggle + Map Style Selector */}
        <div className="absolute bottom-6 left-4 z-20 flex flex-col gap-2 bg-white/95 backdrop-blur-md p-2.5 rounded-xl shadow-lg border border-gray-200">
          
          <button
            type="button"
            onClick={toggleGeoLayer}
            className="flex h-9 w-full items-center justify-center rounded-lg border border-gray-200 bg-white px-3 text-xs font-medium text-gray-800 shadow-sm transition hover:bg-gray-50"
          >
            <span className={`w-2 h-2 rounded-full mr-2 ${showGeoLayer ? 'bg-blue-600' : 'bg-gray-300'}`}></span>
            {showGeoLayer ? "Hide province boundary" : "Show province boundary"}
          </button>

          <select
            aria-label="Choose map style"
            value={selectedStyle}
            onChange={(e) =>
              handleStyleChange(e.target.value as StyleName)
            }
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-medium text-gray-700 shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            {Object.keys(mapStyles).map((style) => (
              <option key={style} value={style}>
                {style} Style
              </option>
            ))}
          </select>

        </div>

      </div>
    </div>
  );
}