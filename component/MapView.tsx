// // components/Map.tsx
// 'use client';

// import React, { useEffect, useRef } from 'react';
// import * as maplibregl from 'maplibre-gl';
// import 'maplibre-gl/dist/maplibre-gl.css';

// export default function MapView() {
//   const mapContainer = useRef<HTMLDivElement>(null);
//   const map = useRef<maplibregl.Map | null>(null);

//   useEffect(() => {
//     if (map.current) return; // initialize map only once

//     if (mapContainer.current) {
//       map.current = new maplibregl.Map({
//         container: mapContainer.current,
//         // Using a public demo style; replace with your own vector tile style URL
//         style: 'https://tiles.openfreemap.org/styles/liberty', 
//         center: [121.0, 13.0], // Longitude, Latitude
//         zoom: 5,
//       });

//       // Add navigation controls (zoom buttons, compass)
//       map.current.addControl(new maplibregl.NavigationControl(), 'top-right');
//     }
//   }, []);

//   return (
//     <div 
//       ref={mapContainer} 
//       style={{ width: '100%', height: '500px', position: 'relative' }} 
//     />
//   );