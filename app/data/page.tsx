
"use client";

import { useEffect, useState } from "react";
import Navbar from "@/component/Navbar";
import GeoJSONExplorer from "@/component/GeoJSONExplorer";

type Summary = {
  totalPopulation: number;
  totalVoters: number;
  totalMunicipalities: number;
  totalBarangays: number;
};

const numberFormat = new Intl.NumberFormat("en-PH");

export default function DataPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadSummary() {
      try {
        const response = await fetch("/api/summary");

        if (!response.ok) {
          throw new Error("Could not load statistics.");
        }

        const data: Summary = await response.json();
        setSummary(data);
      } catch (err) {
        console.error("Failed to load summary:", err);
        setError("Unable to load statistics. Please try refreshing the page.");
      } finally {
        setLoading(false);
      }
    }

    loadSummary();
  }, []);

  const cards = [
    {
      title: "Total Population",
      value: summary?.totalPopulation,
      color: "text-blue-700",
    },
    {
      title: "Total Voters",
      value: summary?.totalVoters,
      color: "text-emerald-700",
    },
    {
      title: "Total Municipalities",
      value: summary?.totalMunicipalities,
      color: "text-violet-700",
    },
    {
      title: "Total Barangays",
      value: summary?.totalBarangays,
      color: "text-orange-700",
    },
  ];

  return (
    <main className="min-h-screen bg-slate-50">
      <Navbar />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8">
          <p className="text-sm font-semibold text-teal-700">
            Tawi-Tawi Province
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            Geographic Data
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Explore barangays, municipalities, population, and voter statistics.
          </p>
        </header>

        {/* Statistics Cards */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card) => (
            <div
              key={card.title}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <p className="text-sm font-medium text-slate-500">
                {card.title}
              </p>

              <h2 className={`mt-2 text-2xl font-bold ${card.color}`}>
                {loading
                  ? "Loading..."
                  : error
                    ? "—"
                    : numberFormat.format(card.value ?? 0)}
              </h2>
            </div>
          ))}
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* GeoJSON Explorer */}
        <GeoJSONExplorer />
      </div>
    </main>
  );
}
