"use client";
import {useRouter} from "next/navigation";

export default function Home() {
  const router = useRouter(); 

  const handleClick = () => {
    router.push("/map");
  };  
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <h1 className="text-lg">Tawi-Tawi Data</h1>
    <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 h-10 w-40" onClick={handleClick}>
     Explore
    </button>
    </div>
  );
}
