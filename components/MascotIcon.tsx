type Size = "sm" | "md" | "lg"

const sizeMap: Record<Size, string> = {
  sm: "h-10 w-16",
  md: "h-14 w-20",
  lg: "h-16 w-24",
}

export function MascotIcon({ size = "md" }: { size?: Size }) {
  const classes = sizeMap[size] ?? sizeMap.md
  return (
    <div className={`rounded-full bg-gradient-to-br from-pink-300 via-pink-300 to-sky-300 shadow-md flex items-center justify-center ${classes}`}>
      <div className="flex gap-2">
        <span className="h-4 w-4 rounded-full bg-white/80 shadow-inner" />
        <span className="h-4 w-4 rounded-full bg-white/80 shadow-inner" />
      </div>
    </div>
  )
}
