
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name")?.trim();

  if (!name) {
    return NextResponse.json(
      { error: "Municipality name is required." },
      { status: 400 }
    );
  }

  const { data: municipalities, error: municipalityError } =
    await supabase
      .from("municipality")
      .select("municipalityID, name")
      .ilike("name", name)
      .limit(2);

  if (municipalityError) {
    return NextResponse.json(
      { error: municipalityError.message },
      { status: 500 }
    );
  }

  if (!municipalities || municipalities.length !== 1) {
    return NextResponse.json(
      { error: "Municipality not found or name is ambiguous." },
      { status: 404 }
    );
  }

  const municipality = municipalities[0];

  const { data: barangays, error: barangayError } = await supabase
    .from("barangay")
    .select("brgyID, name")
    .eq("municipalityID", municipality.municipalityID);

  if (barangayError) {
    return NextResponse.json(
      { error: barangayError.message },
      { status: 500 }
    );
  }

  if (!barangays?.length) {
    return NextResponse.json({
      municipality: municipality.name,
      barangays: [],
    });
  }

  const ids = barangays.map((barangay) => barangay.brgyID);

  const { data: statistics, error: statsError } = await supabase
    .from("barangay_statistics")
    .select("brgyID, year, totalPopulation")
    .in("brgyID", ids)
    .order("year", { ascending: false });

  if (statsError) {
    return NextResponse.json(
      { error: statsError.message },
      { status: 500 }
    );
  }

  // Keep the newest population record for each barangay.
  const latestStats = new Map<string, number>();

  for (const stat of statistics ?? []) {
    const id = String(stat.brgyID);

    if (!latestStats.has(id)) {
      latestStats.set(id, Number(stat.totalPopulation) || 0);
    }
  }

  return NextResponse.json({
    municipality: municipality.name,
    barangays: barangays.map((barangay) => ({
      id: String(barangay.brgyID),
      name: barangay.name,
      population: latestStats.get(String(barangay.brgyID)) ?? null,
    })),
  });
}
