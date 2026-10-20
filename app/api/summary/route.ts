
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const [
      { count: municipalityCount, error: municipalityError },
      { data: barangays, error: barangayError },
    ] = await Promise.all([
      supabase
        .from("municipality")
        .select("municipalityID", { count: "exact", head: true }),

      supabase
        .from("barangay")
        .select("brgyID"),
    ]);

    if (municipalityError) throw municipalityError;
    if (barangayError) throw barangayError;

    const barangayIds = (barangays ?? []).map((b) => b.brgyID);

    let totalPopulation = 0;
    let totalVoters = 0;

    if (barangayIds.length > 0) {
      const { data: stats, error: statsError } = await supabase
        .from("barangay_statistics")
        .select("brgyID, year, totalPopulation, totalVoters")
        .in("brgyID", barangayIds)
        .order("year", { ascending: false });

      if (statsError) throw statsError;

      // Count only the newest statistics record for each barangay.
      const seenBarangays = new Set<string | number>();

      for (const stat of stats ?? []) {
        if (seenBarangays.has(stat.brgyID)) continue;

        seenBarangays.add(stat.brgyID);
        totalPopulation += Number(stat.totalPopulation ?? 0);
        totalVoters += Number(stat.totalVoters ?? 0);
      }
    }

    return NextResponse.json({
      totalPopulation,
      totalVoters,
      totalMunicipalities: municipalityCount ?? 0,
      totalBarangays: barangayIds.length,
    });
  } catch (error) {
    console.error("Summary API error:", error);

    return NextResponse.json(
      { error: "Failed to load province statistics." },
      { status: 500 }
    );
  }
}
