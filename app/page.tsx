import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 font-sans px-6 text-slate-900">
      <div className="w-full max-w-xl text-center space-y-6">
        
        {/* Subtitle */}
        <p className="text-md font-semibold uppercase tracking-[0.25em] text-indigo-600">
          Tawi-Tawi
        </p>

        {/* Title */}
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          Explore Tawi-Tawi
        </h1>

        {/* Body Description */}
        <p className="text-sm text-slate-600 leading-relaxed max-w-md mx-auto sm:text-base">
          Discover barangays, locations, population information, and geographic data through an interactive map of Tawi-Tawi.
        </p>

        {/* Link Button */}
        <div className="pt-2">
          <Link
            href="/map"
            className="inline-block rounded-full bg-indigo-600 px-8 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-indigo-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Explore Map
          </Link>
        </div>

        {/* Disclaimer */}
        <p className="pt-6 text-[11px] text-slate-400 leading-relaxed border-t border-slate-200 max-w-md mx-auto">
          This is a personal project created for educational and portfolio purposes. It is not affiliated with or intended to replace official government mapping or demographic data.
        </p>

      </div>
    </main>
  );
}