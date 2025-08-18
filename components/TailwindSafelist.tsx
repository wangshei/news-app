// This hidden component ensures Tailwind includes dynamically-used classes
// from config-driven category colors in production builds.
export default function TailwindSafelist() {
  return (
    <div className="hidden">
      {/* Category bg colors - exact matches from config/categories.ts */}
      <div className="bg-rose-500 bg-sky-500 bg-amber-500 bg-purple-500 bg-indigo-500 bg-yellow-500 bg-orange-500 bg-pink-500" />
      {/* Light variants for background colors */}
      <div className="bg-rose-500/10 bg-sky-500/10 bg-amber-500/10 bg-purple-500/10 bg-indigo-500/10 bg-yellow-500/10 bg-orange-500/10 bg-pink-500/10" />
      {/* Fallback colors */}
      <div className="bg-gray-400 bg-gray-400/10" />
    </div>
  )
}


