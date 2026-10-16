import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json([]);

  const pattern = `%${q}%`;

  const [muni, brgy] = await Promise.all([
    supabase.from("municipality").select("municipalityID, name").ilike("name", pattern).limit(4),
    supabase.from("barangay").select("brgyID, name, municipalityID").ilike("name", pattern).limit(6),
  ]);

  const err = muni.error ?? brgy.error;
  if (err) {
    console.error("Search error:", err);
    return NextResponse.json({ error: err.message, hint: err.hint }, { status: 500 });
  }

  // municipality names for the matched barangays
  const ids = [...new Set((brgy.data ?? []).map((b: any) => b.municipalityID))];
  const { data: parents } = ids.length
    ? await supabase.from("municipality").select("municipalityID, name").in("municipalityID", ids)
    : { data: [] as any[] };
  const nameById = new Map((parents ?? []).map((p: any) => [p.municipalityID, p.name]));

  return NextResponse.json([
    ...(muni.data ?? []).map((m: any) => ({
      kind: "municipality",
      id: m.municipalityID,
      label: m.name,
      subtitle: "Municipality",
      lat: null,
      lng: null,
    })),
    ...(brgy.data ?? []).map((b: any) => ({
      kind: "barangay",
      id: b.brgyID,
      label: b.name,
      subtitle: `Barangay · ${nameById.get(b.municipalityID) ?? ""}`,
      lat: null,
      lng: null,
    })),
  ]);
}