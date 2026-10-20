
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("barangay_statistics")
      .select("year, totalPopulation, totalVoters")
      .order("year", { ascending: false });

    if (error) {
      console.error("Statistics API error:", error.message);

      return NextResponse.json(
        { error: "Failed to fetch statistics." },
        { status: 500 }
      );
    }

    // Group statistics by year and sum across barangays.
    const grouped = new Map<
      number,
      { year: number; totalPopulation: number; totalVoters: number }
    >();

    for (const row of data ?? []) {
      const year = Number(row.year);

      if (!grouped.has(year)) {
        grouped.set(year, {
          year,
          totalPopulation: 0,
          totalVoters: 0,
        });
      }

      const stat = grouped.get(year)!;

      stat.totalPopulation += Number(row.totalPopulation ?? 0);
      stat.totalVoters += Number(row.totalVoters ?? 0);
    }

    const statistics = Array.from(grouped.values()).sort(
      (a, b) => b.year - a.year
    );

    return NextResponse.json(statistics);
  } catch (error) {
    console.error("Unexpected statistics API error:", error);

    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
