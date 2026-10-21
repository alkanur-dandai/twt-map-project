import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

type Stat = { year: number; totalPopulation: number; totalVoters: number };

const toStat = (s: any): Stat => ({
  year: s.year,
  totalPopulation: s.totalPopulation ?? 0,
  totalVoters: s.totalVoters ?? 0,
});

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const kind = sp.get("kind");
  const id = Number(sp.get("id")); // remove Number() if your IDs are uuid/text

  if (kind === "barangay") {
    const { data: b, error } = await supabase
      .from("barangay")
      .select("brgyID, name, type, municipalityID")
      .eq("brgyID", id)
      .single();

    if (error || !b) {
      console.error("Place (barangay) error:", error);
      return NextResponse.json(null, { status: 404 });
    }

    const [{ data: m }, { data: stats, error: statsErr }] = await Promise.all([
      supabase.from("municipality").select("name").eq("municipalityID", b.municipalityID).single(),
      supabase
        .from("barangay_statistics")
        .select("year, totalPopulation, totalVoters")
        .eq("brgyID", id)
        .order("year", { ascending: false }),
    ]);
    if (statsErr) console.error("Stats error:", statsErr);

    return NextResponse.json({
      kind: "barangay",
      name: b.name,
      type: b.type,
      municipality: m?.name ?? "",
      stats: (stats ?? []).map(toStat),
    });
  }

  if (kind === "municipality") {
    const { data: m, error } = await supabase
      .from("municipality")
      .select("municipalityID, name")
      .eq("municipalityID", id)
      .single();

    if (error || !m) {
      console.error("Place (municipality) error:", error);
      return NextResponse.json(null, { status: 404 });
    }

    const { data: brgys } = await supabase
      .from("barangay")
      .select("brgyID, name")
      .eq("municipalityID", id)
      .order("name", { ascending: true });

    const brgyIds = (brgys ?? []).map((b: any) => b.brgyID);
    const { data: stats, error: statsErr } = brgyIds.length
      ? await supabase
          .from("barangay_statistics")
          .select("brgyID, year, totalPopulation, totalVoters")
          .in("brgyID", brgyIds)
          .order("year", { ascending: false })
      : { data: [] as any[], error: null };
    if (statsErr) console.error("Stats error:", statsErr);

    // most recent record per barangay (rows are already sorted newest first)
   
    // Group statistics by year and sum all barangay values.
    const yearlyStats = new Map<
      number,
      { year: number; totalPopulation: number; totalVoters: number }
    >();

    for (const s of stats ?? []) {
      const year = Number(s.year);

      if (!yearlyStats.has(year)) {
        yearlyStats.set(year, {
          year,
          totalPopulation: 0,
          totalVoters: 0,
        });
      }

      const current = yearlyStats.get(year)!;

      current.totalPopulation += Number(s.totalPopulation ?? 0);
      current.totalVoters += Number(s.totalVoters ?? 0);
    }

    // Newest year first.
    const rows = Array.from(yearlyStats.values()).sort(
      (a, b) => b.year - a.year
    );

    return NextResponse.json({
      kind: "municipality",
      name: m.name,
      barangayCount: brgyIds.length,
      totalPopulation: rows[0]?.totalPopulation ?? 0,
      totalVoters: rows[0]?.totalVoters ?? 0,
      barangays: (brgys ?? []).map((b: any) => b.name),
      stats: rows,
    });

  }

  return NextResponse.json(null, { status: 400 });
}


