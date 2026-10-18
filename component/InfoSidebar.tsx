"use client";

import { useEffect, useState } from "react";

type Stat = { year: number; totalPopulation: number; totalVoters: number };
type Info =
  | { kind: "barangay"; name: string; type: string; municipality: string; stats: Stat[] }
  | {
      kind: "municipality";
      name: string;
      barangayCount: number;
      totalPopulation: number;
      totalVoters: number;
      barangays: string[];
      stats?: Stat[];
    };

const fmt = (n: number) => n.toLocaleString();

export default function InfoSidebar({
  selected,
  onClose,
}: {
  selected: { kind: "municipality" | "barangay"; id: number };
  onClose: () => void;
}) {
  const [info, setInfo] = useState<Info | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    fetch(`/api/placeinfo?kind=${selected.kind}&id=${selected.id}`, {
      signal: controller.signal,
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        setInfo(data);
        setLoading(false);
      })
      .catch((e) => {
        if (e.name !== "AbortError") setLoading(false);
      });
    return () => controller.abort();
  }, [selected.kind, selected.id]);

  const statsList = info?.stats ?? [];

  return (
    // <aside className="absolute right-0 top-0 bottom-0 z-20 w-80 sm:w-96 bg-white border-l border-gray-200 shadow-2xl flex flex-col font-sans transition-all duration-300">


<aside className="absolute right-0 top-0 bottom-0 z-20 w-80 sm:w-96 max-sm:inset-x-0 max-sm:top-auto max-sm:bottom-0 max-sm:z-40 max-sm:max-h-[55vh] max-sm:rounded-t-2xl max-sm:border-t bg-white border-l border-gray-200 shadow-2xl flex flex-col font-sans transition-all duration-300">

      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gray-50/50">
        <div className="flex items-center space-x-2">
          <span
            className={`h-2.5 w-2.5 rounded-full ${
              selected.kind === "municipality" ? "bg-indigo-600" : "bg-emerald-600"
            }`}
          />
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            {selected.kind === "municipality" ? "Municipality" : "Barangay"}
          </span>
        </div>
        <button
          onClick={onClose}
          aria-label="Close"
          className="text-gray-400 hover:text-gray-700 p-1.5 rounded-md transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Main Body */}
      {/* <div className="flex-1 overflow-y-auto p-6 space-y-6"> */}
      <div className="min-h-0 flex-1 overflow-y-auto p-4 space-y-5 sm:p-6 sm:space-y-6">
        {loading && (
          <div className="py-24 flex flex-col items-center justify-center space-y-2">
            <div className="w-5 h-5 border-2 border-gray-200 border-t-gray-800 rounded-full animate-spin" />
            <p className="text-xs text-gray-400">Loading details...</p>
          </div>
        )}

        {!loading && !info && (
          <div className="py-20 text-center">
            <p className="text-sm text-gray-500">No data found for this selection.</p>
          </div>
        )}

        {!loading && info && (
          <div className="space-y-6">
            {/* Title Section */}
          <div>
  <h2 className="text-xl font-bold tracking-tight text-gray-900">
    {info.name}
  </h2>

  <div className="mt-1 space-y-1">
    {info.kind === "barangay" ? (
      <>
        <p className="text-xs font-medium text-gray-600">
          {info.type}
        </p>
        <p className="text-xs text-gray-500">
          Municipality:{" "}
          <span className="font-medium text-gray-700">
            {info.municipality}
          </span>
        </p>
      </>
    ) : (
      <>
        
        <p className="text-xs text-gray-500">
          Total Barangays:{" "}
          <span className="font-medium text-gray-700">
            {info.barangayCount}
          </span>
        </p>
      </>
    )}
  </div>
</div>

            {/* Statistical Table - Header Always Displayed */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                Statistical Data
              </h3>

              <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg bg-white shadow-xs">
  <table className="w-full text-left text-xs">
    <thead className="sticky top-0 bg-gray-50 text-gray-600 font-semibold border-b border-gray-200 z-10">
      <tr>
        <th className="px-3.5 py-3 border-r border-gray-100 uppercase tracking-wider">
          Year
        </th>
        <th className="px-3.5 py-3 border-r border-gray-100 uppercase tracking-wider">
          Total Population
        </th>
        <th className="px-3.5 py-3 uppercase tracking-wider">
          Total Voters
        </th>
      </tr>
    </thead>
    <tbody className="divide-y divide-gray-100 text-gray-800">
      {statsList.length > 0 ? (
        statsList.map((s) => (
          <tr key={s.year} className="hover:bg-gray-50/50">
            <td className="px-3.5 py-3 font-semibold text-gray-900 border-r border-gray-100">
              {s.year}
            </td>
            <td className="px-3.5 py-3 border-r border-gray-100">
              {fmt(s.totalPopulation)}
            </td>
            <td className="px-3.5 py-3 font-medium text-indigo-600">
              {fmt(s.totalVoters)}
            </td>
          </tr>
        ))
      ) : (
        <tr>
          <td colSpan={3} className="px-3.5 py-6 text-center text-xs text-gray-400 italic">
            No statistical records available.
          </td>
        </tr>
      )}
    </tbody>
  </table>
</div>
            </div>

            {/* Barangays List (For Municipality Only) */}
            {info.kind === "municipality" && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                  Barangays List ({info.barangays.length})
                </h3>
                <div className="max-h-52 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100 bg-white">
                  {info.barangays.map((b) => (
                    <div key={b} className="px-3.5 py-2.5 text-xs text-gray-700 hover:bg-gray-50">
                      {b}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}