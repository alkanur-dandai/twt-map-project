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
        .from("barangaystatistics")
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
          .from("barangaystatistics")
          .select("brgyID, year, totalPopulation, totalVoters")
          .in("brgyID", brgyIds)
          .order("year", { ascending: false })
      : { data: [] as any[], error: null };
    if (statsErr) console.error("Stats error:", statsErr);

    // most recent record per barangay (rows are already sorted newest first)
    const latest = new Map<number, any>();
    for (const s of stats ?? []) if (!latest.has(s.brgyID)) latest.set(s.brgyID, s);
    const rows = [...latest.values()].map(toStat);

    return NextResponse.json({
      kind: "municipality",
      name: m.name,
      barangayCount: brgyIds.length,
      totalPopulation: rows.reduce((n, s) => n + s.totalPopulation, 0),
      totalVoters: rows.reduce((n, s) => n + s.totalVoters, 0),
      barangays: (brgys ?? []).map((b: any) => b.name),
    });
  }

  return NextResponse.json(null, { status: 400 });
}