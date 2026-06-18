const dotDelays = ["0ms", "120ms", "240ms"];
const barDelays = ["0ms", "110ms", "220ms", "330ms"];

export function Spinner({ className = "" }) {
  return (
    <span className={`inline-flex items-end gap-1 ${className}`} aria-hidden="true">
      {dotDelays.map((delay) => (
        <span
          key={delay}
          className="h-1.5 w-1.5 rounded-full bg-current opacity-80 loader-dot"
          style={{ animationDelay: delay }}
        />
      ))}
    </span>
  );
}

export function ButtonLoader() {
  return (
    <span className="inline-flex items-center justify-center gap-2">
      <Spinner />
    </span>
  );
}

export default function PageLoader({ label = "Loading" }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-white/10 bg-zinc-950/80 p-6 shadow-2xl backdrop-blur-xl">
        <div className="absolute left-0 right-0 top-0 h-px overflow-hidden bg-white/10">
          <span className="block h-full w-1/2 bg-emerald-300 loader-sweep" />
        </div>

        <div className="flex items-center gap-4">
          <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl border border-emerald-300/20 bg-emerald-300/10">
            <div className="flex h-9 items-end gap-1.5 text-emerald-300">
              {barDelays.map((delay, index) => (
                <span
                  key={delay}
                  className="w-2 rounded-full bg-current loader-bar"
                  style={{
                    animationDelay: delay,
                    height: `${18 + index * 5}px`,
                  }}
                />
              ))}
            </div>
          </div>

          <div className="min-w-0 flex-1 text-left">
            <p className="text-sm font-semibold text-white">{label}</p>
            <div className="mt-3 space-y-2">
              <span className="block h-2.5 w-full rounded-full bg-white/10 loader-shimmer" />
              <span className="block h-2.5 w-2/3 rounded-full bg-white/10 loader-shimmer" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
