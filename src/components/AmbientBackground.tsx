/**
 * Fixed, GPU-only ambient colour field that sits behind the whole app.
 * Uses a small number of large blurred blobs (transform/opacity animation only)
 * so mid-range devices stay smooth.
 */
export function AmbientBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_-10%,oklch(0.32_0.12_272)_0%,transparent_65%)]" />
      <div
        className="absolute -left-[25%] -top-[15%] size-[65vmax] animate-drift rounded-full opacity-60 blur-[90px]"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, var(--glow-indigo), transparent 70%)",
        }}
      />
      <div
        className="absolute -right-[20%] top-[18%] size-[50vmax] animate-drift rounded-full opacity-45 blur-[90px] [animation-delay:-8s]"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, var(--glow-violet), transparent 70%)",
        }}
      />
      <div
        className="absolute bottom-[-15%] left-[10%] size-[45vmax] animate-drift rounded-full opacity-30 blur-[100px] [animation-delay:-16s]"
        style={{
          background: "radial-gradient(circle at 50% 50%, var(--glow-cyan), transparent 70%)",
        }}
      />
      <div
        className="absolute bottom-[22%] right-[8%] size-[22vmax] animate-drift rounded-full opacity-20 blur-[80px] [animation-delay:-4s]"
        style={{
          background: "radial-gradient(circle at 50% 50%, var(--glow-gold), transparent 70%)",
        }}
      />
      {/* Faint geometric academic grid for depth */}
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(oklch(1 0 0 / 0.6) 1px, transparent 1px), linear-gradient(90deg, oklch(1 0 0 / 0.6) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(120% 80% at 50% 0%, black, transparent 70%)",
          WebkitMaskImage: "radial-gradient(120% 80% at 50% 0%, black, transparent 70%)",
        }}
      />
    </div>
  );
}
