
// import { supabase } from "@/lib/supabase";

// export async function getMunicipalities() {
//   const { data, error } = await supabase
//     .from("municipality")
//     .select("municipalityID, name")
//     .order("name");

//   if (error) {
//     throw new Error(error.message);
//   }

//   return data;
// }

// export async function getBarangays(municipalityID: number) {
//   const { data, error } = await supabase
//     .from("barangay")
//     .select("brgyID, name, type, municipalityID")
//     .eq("municipalityID", municipalityID)
//     .order("name");

//   if (error) {
//     throw new Error(error.message);
//   }

//   return data;
// }
