export default function HeaderDate() {
  // Generate today's date in Chinese format
  const today = new Date().toLocaleDateString("zh-CN", {
    month: "long",
    day: "numeric",
  })

  return (
    <header className="date-header">
      <h1 className="text-2xl font-semibold text-[var(--text)]">{today}</h1>
    </header>
  )
} 