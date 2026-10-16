
"use client";

import { useEffect, useState } from "react";
import { getMunicipalities, getBarangays } from "@/lib/queries";

type Municipality = {
  municipalityID: number;
  name: string;
};

type Barangay = {
  brgyID: number;
  name: string;
  type: string | null;
  municipalityID: number;
};

export default function TestDataPage() {
  const [municipalities, setMunicipalities] =
    useState<Municipality[]>([]);

  const [barangays, setBarangays] =
    useState<Barangay[]>([]);

  const [selectedID, setSelectedID] =
    useState("");

  const [error, setError] = useState("");

  useEffect(() => {
    async function loadMunicipalities() {
      try {
        const data = await getMunicipalities();
        setMunicipalities(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load data"
        );
      }
    }

    loadMunicipalities();
  }, []);

  async function handleChange(id: string) {
    setSelectedID(id);
    setBarangays([]);
    setError("");

    if (!id) return;

    try {
      const data = await getBarangays(Number(id));
      setBarangays(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load barangays"
      );
    }
  }

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="mb-4 text-2xl font-bold">
        Tawi-Tawi Municipalities
      </h1>

      <label
        htmlFor="municipality"
        className="mb-2 block font-medium"
      >
        Select Municipality
      </label>

      <select
        id="municipality"
        value={selectedID}
        onChange={(e) => handleChange(e.target.value)}
        className="mb-6 w-full rounded border p-3"
      >
        <option value="">Choose a municipality</option>

        {municipalities.map((municipality) => (
          <option
            key={municipality.municipalityID}
            value={municipality.municipalityID}
          >
            {municipality.name}
          </option>
        ))}
      </select>

      {error && (
        <p className="mb-4 text-red-600">
          Error: {error}
        </p>
      )}

      {selectedID && (
        <>
          <h2 className="mb-3 text-xl font-semibold">
            Barangays ({barangays.length})
          </h2>

          <ul className="space-y-2">
            {barangays.map((barangay) => (
              <li
                key={barangay.brgyID}
                className="rounded border p-3"
              >
                {barangay.name}
                <span className="ml-2 text-sm text-gray-500">
                  {barangay.type ?? "Type not specified"}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}
