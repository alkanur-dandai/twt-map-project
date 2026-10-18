

// // "use client";

// // import Link from "next/link";
// // import { usePathname } from "next/navigation";
// // import { useEffect, useRef, useState } from "react";

// // export type SearchResult = {
// //   kind: "municipality" | "barangay";
// //   id: number;
// //   label: string;
// //   subtitle: string;
// //   lat: number | null;
// //   lng: number | null;
// // };

// // const links = [
// //   { href: "/", label: "Map" },
// //   { href: "/Data", label: "Data" },
// //   { href: "/about", label: "About" },
// // ];

// // export default function Navbar({
// //   onSelect,
// // }: {
// //   /** Pass this to show the search bar. Omit it on pages that don't need search. */
// //   onSelect?: (r: SearchResult) => void;
// // }) {
// //   const pathname = usePathname();
// //   const hasSearch = !!onSelect;

// //   const [query, setQuery] = useState("");
// //   const [results, setResults] = useState<SearchResult[]>([]);
// //   const [open, setOpen] = useState(false);
// //   const [searched, setSearched] = useState(false);
// //   const [active, setActive] = useState(-1);
// //   const wrapperRef = useRef<HTMLDivElement>(null);
// //   const inputRef = useRef<HTMLInputElement>(null);

// //   // Debounced search
// //   useEffect(() => {
// //     const q = query.trim();
// //     if (q.length < 2) {
// //       setResults([]);
// //       setSearched(false);
// //       return;
// //     }

// //     const controller = new AbortController();
// //     const timer = setTimeout(async () => {
// //       try {
// //         const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, {
// //           signal: controller.signal,
// //         });
// //         const data = await res.json();

// //         setResults(res.ok && Array.isArray(data) ? data : []);
// //         setSearched(true);
// //         setOpen(true);
// //         setActive(-1);
// //       } catch (e) {
// //         if ((e as Error).name !== "AbortError") console.error(e);
// //       }
// //     }, 250);

// //     return () => {
// //       clearTimeout(timer);
// //       controller.abort();
// //     };
// //   }, [query]);

// //   // Close on outside click
// //   useEffect(() => {
// //     const close = (e: MouseEvent) => {
// //       if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
// //     };
// //     document.addEventListener("mousedown", close);
// //     return () => document.removeEventListener("mousedown", close);
// //   }, []);

// //   // "/" focuses the search
// //   useEffect(() => {
// //     if (!hasSearch) return;
// //     const onKey = (e: KeyboardEvent) => {
// //       const tag = (e.target as HTMLElement).tagName;
// //       if (e.key === "/" && tag !== "INPUT" && tag !== "TEXTAREA") {
// //         e.preventDefault();
// //         inputRef.current?.focus();
// //       }
// //     };
// //     document.addEventListener("keydown", onKey);
// //     return () => document.removeEventListener("keydown", onKey);
// //   }, [hasSearch]);

// //   function choose(r: SearchResult) {
// //     setQuery(r.label);
// //     setOpen(false);
// //     onSelect?.(r);
// //   }

// //   function clear() {
// //     setQuery("");
// //     setResults([]);
// //     setSearched(false);
// //     setOpen(false);
// //     inputRef.current?.focus();
// //   }

// //   function onKeyDown(e: React.KeyboardEvent) {
// //     if (e.key === "Escape") {
// //       setOpen(false);
// //       inputRef.current?.blur();
// //       return;
// //     }
// //     if (!open || !results.length) return;
// //     if (e.key === "ArrowDown") {
// //       e.preventDefault();
// //       setActive((i) => (i + 1) % results.length);
// //     } else if (e.key === "ArrowUp") {
// //       e.preventDefault();
// //       setActive((i) => (i <= 0 ? results.length - 1 : i - 1));
// //     } else if (e.key === "Enter") {
// //       e.preventDefault();
// //       choose(results[active >= 0 ? active : 0]);
// //     }
// //   }

// //   return (
// //     <header className="relative z-30 w-full shrink-0 px-4 pt-4">
// //       {/* `relative` makes the nav the anchor for the search dropdown */}
// //       <nav
// //         aria-label="Main"
// //         className="relative flex items-center gap-4 rounded-2xl border border-gray-200 bg-white/80 px-4 py-2 shadow-sm backdrop-blur"
// //       >
// //         {/* Search, right after the logo */}
// //         {/* Search wrapper: constrain its max width here so it doesn't take up all flex-1 space */}
// //        {/* Search wrapper */}
// // {hasSearch && (
// //   <div ref={wrapperRef} className="relative min-w-0 w-72">
// //     {/* Changed bg-gray-100/80 to bg-white and added a subtle border for definition */}
// //     <div className="group flex h-9 w-full items-center gap-2 rounded-full border border-gray-200 bg-white px-3 shadow-sm transition-colors duration-200 focus-within:ring-1 focus-within:ring-gray-900/10">
// //       <svg
// //         className="h-4 w-4 shrink-0 text-gray-400 group-focus-within:text-gray-900"
// //         viewBox="0 0 24 24"
// //         fill="none"
// //         stroke="currentColor"
// //         strokeWidth="1.75"
// //         strokeLinecap="round"
// //         aria-hidden="true"
// //       >
// //         <circle cx="11" cy="11" r="7" />
// //         <path d="m20 20-3.5-3.5" />
// //       </svg>

// //       <input
// //         ref={inputRef}
// //         type="text"
// //         role="combobox"
// //         aria-expanded={open}
// //         aria-controls="search-listbox"
// //         aria-autocomplete="list"
// //         aria-activedescendant={active >= 0 ? `opt-${active}` : undefined}
// //         aria-label="Search barangay or municipality"
// //         placeholder="Search places…"
// //         value={query}
// //         onChange={(e) => setQuery(e.target.value)}
// //         onFocus={() => results.length > 0 && setOpen(true)}
// //         onKeyDown={onKeyDown}
// //         className="min-w-0 flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
// //       />

// //       {query ? (
// //         <button
// //           type="button"
// //           onClick={clear}
// //           aria-label="Clear search"
// //           className="text-gray-400 transition-colors hover:text-gray-900"
// //         >
// //           <svg
// //             className="h-4 w-4"
// //             viewBox="0 0 24 24"
// //             fill="none"
// //             stroke="currentColor"
// //             strokeWidth="1.75"
// //             strokeLinecap="round"
// //             aria-hidden="true"
// //           >
// //             <path d="M6 6l12 12M18 6L6 18" />
// //           </svg>
// //         </button>
// //       ) : (
// //         <kbd className="hidden rounded border border-gray-300/70 px-1.5 text-[10px] font-medium leading-4 text-gray-400 sm:block">
// //           /
// //         </kbd>
// //       )}
// //     </div>

// //     {/* Dropdown list remains unchanged */}
// //     {open && (
// //       <ul
// //         id="search-listbox"
// //         role="listbox"
// //         className="absolute inset-x-0 top-full z-10 mt-2 max-h-80 overflow-auto rounded-2xl border border-gray-200 bg-white/90 p-1.5 shadow-lg backdrop-blur"
// //       >
// //         {results.map((r, i) => (
// //           <li
// //             key={`${r.kind}-${r.id}`}
// //             id={`opt-${i}`}
// //             role="option"
// //             aria-selected={i === active}
// //             onMouseDown={(e) => e.preventDefault()}
// //             onClick={() => choose(r)}
// //             onMouseEnter={() => setActive(i)}
// //             className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-2 ${
// //               i === active ? "bg-gray-100" : ""
// //             }`}
// //           >
// //             <div className="min-w-0">
// //               <div className="truncate text-sm text-gray-900">
// //                 {r.label}
// //               </div>
// //               {r.subtitle && (
// //                 <div className="truncate text-xs text-gray-500">
// //                   {r.subtitle}
// //                 </div>
// //               )}
// //             </div>
// //             <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-500">
// //               {r.kind === "barangay" ? "Barangay" : "Municipality"}
// //             </span>
// //           </li>
// //         ))}
// //         {searched && results.length === 0 && (
// //           <li className="px-3 py-4 text-sm text-gray-400">No results</li>
// //         )}
// //       </ul>
// //     )}
// //   </div>
// // )}
// //        {/* Navigation links centered with more gap */}
// //           <ul className="hidden shrink-0 items-center justify-center gap-3 md:flex absolute left-1/2 -translate-x-1/2">
// //             {links.map(({ href, label }) => {
// //               const isActive = pathname === href;
// //               return (
// //                 <li key={href}>
// //                   <Link
// //                     href={href}
// //                     aria-current={isActive ? "page" : undefined}
// //                     className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
// //                       isActive
// //                         ? "bg-gray-900 text-white"
// //                         : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
// //                     }`}
// //                   >
// //                     {label}
// //                   </Link>
// //                 </li>
// //               );
// //             })}
// //           </ul>
// //       </nav>
// //     </header>
// //   );
// // }



// "use client";

// import Link from "next/link";
// import { usePathname } from "next/navigation";
// import { useEffect, useRef, useState } from "react";

// export type SearchResult = {
//   kind: "municipality" | "barangay";
//   id: number;
//   label: string;
//   subtitle: string;
//   lat: number | null;
//   lng: number | null;
// };

// const links = [
//   { href: "/", label: "Map" },
//   { href: "/Data", label: "Data" },
//   { href: "/about", label: "About" },
// ];

// type NavbarProps = {
//   onSelect?: (result: SearchResult) => void;
// };

// export default function Navbar({ onSelect }: NavbarProps) {
//   const pathname = usePathname();
//   const hasSearch = typeof onSelect === "function";

//   const [query, setQuery] = useState("");
//   const [results, setResults] = useState<SearchResult[]>([]);
//   const [open, setOpen] = useState(false);
//   const [searched, setSearched] = useState(false);
//   const [active, setActive] = useState(-1);

//   const wrapperRef = useRef<HTMLDivElement>(null);
//   const inputRef = useRef<HTMLInputElement>(null);

//   // Debounced place search
//   useEffect(() => {
//     const q = query.trim();

//     if (q.length < 2) {
//       setResults([]);
//       setSearched(false);
//       setOpen(false);
//       return;
//     }

//     const controller = new AbortController();

//     const timer = window.setTimeout(async () => {
//       try {
//         const res = await fetch(
//           `/api/search?q=${encodeURIComponent(q)}`,
//           { signal: controller.signal }
//         );

//         const data = await res.json();

//         if (controller.signal.aborted) return;

//         setResults(res.ok && Array.isArray(data) ? data : []);
//         setSearched(true);
//         setOpen(true);
//         setActive(-1);
//       } catch (error) {
//         if ((error as Error).name !== "AbortError") {
//           console.error("Search failed:", error);
//         }
//       }
//     }, 250);

//     return () => {
//       window.clearTimeout(timer);
//       controller.abort();
//     };
//   }, [query]);

//   // Close the dropdown when clicking outside
//   useEffect(() => {
//     function handleOutsideClick(event: MouseEvent) {
//       if (
//         wrapperRef.current &&
//         !wrapperRef.current.contains(event.target as Node)
//       ) {
//         setOpen(false);
//       }
//     }

//     document.addEventListener("mousedown", handleOutsideClick);

//     return () => {
//       document.removeEventListener("mousedown", handleOutsideClick);
//     };
//   }, []);

//   // "/" focuses the search input
//   useEffect(() => {
//     if (!hasSearch) return;

//     function handleShortcut(event: KeyboardEvent) {
//       const target = event.target as HTMLElement;

//       if (
//         event.key === "/" &&
//         !event.ctrlKey &&
//         !event.metaKey &&
//         !event.altKey &&
//         target.tagName !== "INPUT" &&
//         target.tagName !== "TEXTAREA" &&
//         !target.isContentEditable
//       ) {
//         event.preventDefault();
//         inputRef.current?.focus();
//       }
//     }

//     document.addEventListener("keydown", handleShortcut);

//     return () => {
//       document.removeEventListener("keydown", handleShortcut);
//     };
//   }, [hasSearch]);

//   function choose(result: SearchResult) {
//     setQuery(result.label);
//     setOpen(false);
//     onSelect?.(result);
//   }

//   function clearSearch() {
//     setQuery("");
//     setResults([]);
//     setSearched(false);
//     setOpen(false);
//     setActive(-1);
//     inputRef.current?.focus();
//   }

//   function handleKeyDown(
//     event: React.KeyboardEvent<HTMLInputElement>
//   ) {
//     if (event.key === "Escape") {
//       setOpen(false);
//       inputRef.current?.blur();
//       return;
//     }

//     if (!open || results.length === 0) return;

//     if (event.key === "ArrowDown") {
//       event.preventDefault();
//       setActive((index) => (index + 1) % results.length);
//     } else if (event.key === "ArrowUp") {
//       event.preventDefault();
//       setActive((index) =>
//         index <= 0 ? results.length - 1 : index - 1
//       );
//     } else if (event.key === "Enter") {
//       event.preventDefault();
//       choose(results[active >= 0 ? active : 0]);
//     }
//   }

//   return (
//     <header className="relative z-30 w-full shrink-0 px-4 pt-4">
//       <nav
//         aria-label="Main"
//         className="relative flex min-w-0 items-center gap-4 rounded-2xl border border-gray-200 bg-white/80 px-4 py-2 shadow-sm backdrop-blur"
//       >
//         {/* Place search */}
//         {hasSearch && (
//           <div
//             ref={wrapperRef}
//             className="relative w-72 min-w-0 max-sm:flex-1"
//           >
//             <div className="group flex h-9 w-full items-center gap-2 rounded-full border border-gray-200 bg-white px-3 shadow-sm transition-colors focus-within:ring-1 focus-within:ring-gray-900/10">
//               <svg
//                 className="h-4 w-4 shrink-0 text-gray-400 group-focus-within:text-gray-900"
//                 viewBox="0 0 24 24"
//                 fill="none"
//                 stroke="currentColor"
//                 strokeWidth="1.75"
//                 strokeLinecap="round"
//                 aria-hidden="true"
//               >
//                 <circle cx="11" cy="11" r="7" />
//                 <path d="m20 20-3.5-3.5" />
//               </svg>

//               <input
//                 ref={inputRef}
//                 type="text"
//                 role="combobox"
//                 aria-expanded={open}
//                 aria-controls="search-listbox"
//                 aria-autocomplete="list"
//                 aria-activedescendant={
//                   open && active >= 0
//                     ? `opt-${active}`
//                     : undefined
//                 }
//                 aria-label="Search barangay or municipality"
//                 placeholder="Search places..."
//                 value={query}
//                 onChange={(event) => setQuery(event.target.value)}
//                 onFocus={() => {
//                   if (results.length > 0 || searched) {
//                     setOpen(true);
//                   }
//                 }}
//                 onKeyDown={handleKeyDown}
//                 className="min-w-0 flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
//               />

//               {query ? (
//                 <button
//                   type="button"
//                   onClick={clearSearch}
//                   aria-label="Clear search"
//                   className="shrink-0 text-gray-400 hover:text-gray-900"
//                 >
//                   <svg
//                     className="h-4 w-4"
//                     viewBox="0 0 24 24"
//                     fill="none"
//                     stroke="currentColor"
//                     strokeWidth="1.75"
//                     strokeLinecap="round"
//                     aria-hidden="true"
//                   >
//                     <path d="M6 6l12 12M18 6 6 18" />
//                   </svg>
//                 </button>
//               ) : (
//                 <kbd className="hidden rounded border border-gray-300/70 px-1.5 text-[10px] font-medium leading-4 text-gray-400 sm:block">
//                   /
//                 </kbd>
//               )}
//             </div>

//             {/* Search results */}
//             {open && (
//               <ul
//                 id="search-listbox"
//                 role="listbox"
//                 className="absolute inset-x-0 top-full z-50 mt-2 max-h-80 overflow-auto rounded-2xl border border-gray-200 bg-white p-1.5 shadow-lg"
//               >
//                 {results.map((result, index) => (
//                   <li
//                     key={`${result.kind}-${result.id}`}
//                     id={`opt-${index}`}
//                     role="option"
//                     aria-selected={index === active}
//                     onMouseDown={(event) => event.preventDefault()}
//                     onClick={() => choose(result)}
//                     onMouseEnter={() => setActive(index)}
//                     className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-2 ${
//                       index === active ? "bg-gray-100" : ""
//                     }`}
//                   >
//                     <div className="min-w-0">
//                       <div className="truncate text-sm text-gray-900">
//                         {result.label}
//                       </div>

//                       {result.subtitle && (
//                         <div className="truncate text-xs text-gray-500">
//                           {result.subtitle}
//                         </div>
//                       )}
//                     </div>

//                     <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-500">
//                       {result.kind === "barangay"
//                         ? "Barangay"
//                         : "Municipality"}
//                     </span>
//                   </li>
//                 ))}

//                 {searched && results.length === 0 && (
//                   <li className="px-3 py-4 text-sm text-gray-400">
//                     No results found
//                   </li>
//                 )}
//               </ul>
//             )}
//           </div>
//         )}

//         {/* Navigation links */}
//         <ul className="ml-auto flex shrink-0 items-center justify-center gap-1 sm:gap-3 md:absolute md:left-1/2 md:ml-0 md:-translate-x-1/2">
//           {links.map(({ href, label }) => {
//             const isActive = pathname === href;

//             return (
//               <li key={href}>
//                 <Link
//                   href={href}
//                   aria-current={isActive ? "page" : undefined}
//                   className={`whitespace-nowrap rounded-full px-2 py-1.5 text-xs transition-colors sm:px-3 sm:text-sm ${
//                     isActive
//                       ? "bg-gray-900 text-white"
//                       : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
//                   }`}
//                 >
//                   {label}
//                 </Link>
//               </li>
//             );
//           })}
//         </ul>
//       </nav>
//     </header>
//   );
// }
