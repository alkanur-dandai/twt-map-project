
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const kind = sp.get("kind");
  const name = sp.get("name")?.trim();
  const municipality = sp.get("municipality")?.trim();

  if (!name || !kind) {
    return NextResponse.json(
      { error: "Name and kind are required." },
      { status: 400 }
    );
  }

  if (kind === "municipality") {
    const { data, error } = await supabase
      .from("municipality")
      .select("municipalityID, name")
      .ilike("name", name)
      .limit(2);

    if (error) {
      console.error("Municipality search error:", error);
      return NextResponse.json(
        { error: "Failed to search municipalities." },
        { status: 500 }
      );
    }

    if (!data || data.length !== 1) {
      return NextResponse.json(
        {
          error:
            data?.length
              ? "Multiple municipalities matched this name."
              : "Municipality not found.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      kind: "municipality",
      id: data[0].municipalityID,
      name: data[0].name,
    });
  }

  if (kind === "barangay") {
    if (!municipality) {
      return NextResponse.json(
        { error: "Municipality name is required for barangay search." },
        { status: 400 }
      );
    }

    const { data: municipalities, error: municipalityError } =
      await supabase
        .from("municipality")
        .select("municipalityID, name")
        .ilike("name", municipality)
        .limit(2);

    if (municipalityError) {
      console.error("Municipality lookup error:", municipalityError);
      return NextResponse.json(
        { error: "Failed to look up municipality." },
        { status: 500 }
      );
    }

    if (!municipalities || municipalities.length !== 1) {
      return NextResponse.json(
        { error: "Municipality not found or name is ambiguous." },
        { status: 404 }
      );
    }

    const { data: barangays, error } = await supabase
      .from("barangay")
      .select("brgyID, name, type, municipalityID")
      .eq("municipalityID", municipalities[0].municipalityID)
      .ilike("name", name)
      .limit(2);

    if (error) {
      console.error("Barangay search error:", error);
      return NextResponse.json(
        { error: "Failed to search barangays." },
        { status: 500 }
      );
    }

    if (!barangays || barangays.length !== 1) {
      return NextResponse.json(
        {
          error:
            barangays?.length
              ? "Multiple barangays matched this name."
              : "Barangay not found.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      kind: "barangay",
      id: barangays[0].brgyID,
      name: barangays[0].name,
      type: barangays[0].type,
      municipality: municipalities[0].name,
    });
  }

  return NextResponse.json(
    { error: "Invalid location kind." },
    { status: 400 }
  );
}
