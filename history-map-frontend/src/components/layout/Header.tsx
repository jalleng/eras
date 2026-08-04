export function Header() {
  return (
    <header className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-4 py-3">
      <div>
        <h1 className="text-lg font-semibold text-white">Eras</h1>
        <p className="text-xs text-slate-400">
          Explore what was happening around the world, one date at a time
        </p>
      </div>
      <a
        className="ml-auto text-white/40 text-[13px] italic"
        href="https://www.linkedin.com/in/jeffreygerber/"
        target="_blank"
        rel="noopener noreferrer"
      >
        A Jalleng App
      </a>
    </header>
  )
}
