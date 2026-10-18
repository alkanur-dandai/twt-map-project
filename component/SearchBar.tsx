"use client";

import { useEffect, useRef, useState } from "react";

export type SearchResult = {
  kind: "municipality" | "barangay";
  id: number;
  label: string;
  subtitle: string;
  lat: number | null;
  lng: number | null;
};

type SearchBarProps = {
  onSelect: (result: SearchResult) => void;
  onClear: () => void;
};

export default function SearchBar({
  onSelect,
  onClear,
}: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [searched, setSearched] = useState(false);
  const [active, setActive] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounced search
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setSearched(false);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, {
          signal: controller.signal,
        });
        const data = await res.json();

        setResults(res.ok && Array.isArray(data) ? data : []);
        setSearched(true);
        setOpen(true);
        setActive(-1);
      } catch (e) {
        if ((e as Error).name !== "AbortError") console.error(e);
      }
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  // Close on outside click
  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  // "/" focuses the search
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (e.key === "/" && tag !== "INPUT" && tag !== "TEXTAREA") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  function choose(r: SearchResult) {
    setQuery(r.label);
    setOpen(false);
    onSelect(r);
  }


function clear() {
  setQuery("");
  setResults([]);
  setSearched(false);
  setOpen(false);
  setActive(-1);

  onClear();

  inputRef.current?.focus();
}


  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
      return;
    }
    if (!open || !results.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i <= 0 ? results.length - 1 : i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      choose(results[active >= 0 ? active : 0]);
    }
  }

  return (
    <div ref={wrapperRef} className="relative w-80 max-w-[calc(100vw-2rem)]">
      <div className="flex h-10 items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 shadow-sm transition-colors focus-within:border-neutral-900">
        <svg
          className="h-4 w-4 shrink-0 text-neutral-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>

        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls="search-listbox"
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 ? `opt-${active}` : undefined}
          aria-label="Search barangay or municipality"
          placeholder="Search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          onKeyDown={onKeyDown}
          className="min-w-0 flex-1 bg-transparent text-sm text-neutral-900 outline-none placeholder:text-neutral-400"
        />

        {query ? (
          <button
            type="button"
            onClick={clear}
            aria-label="Clear search"
            className="text-neutral-400 transition-colors hover:text-neutral-900"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        ) : (
          <kbd className="rounded border border-neutral-200 px-1.5 text-[10px] font-medium leading-4 text-neutral-400">
            /
          </kbd>
        )}
      </div>

      {open && (
        <ul
          id="search-listbox"
          role="listbox"
          className="absolute z-10 mt-1.5 max-h-72 w-full overflow-auto rounded-lg border border-neutral-200 bg-white py-1 shadow-lg"
        >
          {results.map((r, i) => (
            <li
              key={`${r.kind}-${r.id}`}
              id={`opt-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => choose(r)}
              onMouseEnter={() => setActive(i)}
              className={`relative cursor-pointer px-3 py-2 ${
                i === active ? "bg-neutral-50" : ""
              }`}
            >
              {i === active && (
                <span className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-neutral-900" />
              )}
            <div className="truncate text-sm font-medium text-neutral-900">
  {r.label}
</div>

<div className="truncate text-xs text-neutral-500">
  {r.kind === "barangay"
    ? `Municipality: ${r.subtitle?.split(" · ").pop()}`
    : "Municipality"}
</div>
            </li>
          ))}
          {searched && results.length === 0 && (
            <li className="px-3 py-4 text-sm text-neutral-400">No results</li>
          )}
        </ul>
      )}
    </div>
  );
}