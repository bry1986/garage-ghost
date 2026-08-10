import { Battery, Droplets, Gauge, Thermometer, Wrench } from "lucide-react";
import { WarningWordRing } from "./warning-word-ring";

/**
 * Instrument-cluster hero visual — pure CSS + lucide-react. No external
 * images, no copyrighted vehicle logos. A stylised dashboard with a gauge,
 * a sweeping needle, and warning indicators in the brand's severity colors.
 *
 * Paint order (by DOM, all siblings positioned): housing frame → orbiting
 * word ring → gauge dial. The dial therefore occludes ring words that cross
 * its face, while words sweep visibly through the annulus between dial edge
 * and housing bezel — a machined, concentric depth effect.
 */
export function InstrumentCluster() {
  return (
    <div
      aria-hidden="true"
      className="relative mx-auto aspect-[16/10] w-full max-w-md select-none"
    >
      {/* Cluster housing */}
      <div className="absolute inset-0 rounded-[2rem] border border-zinc-800 bg-zinc-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_24px_48px_-24px_rgba(0,0,0,0.8)]">
        {/* Warning indicators */}
        <div className="absolute left-[7%] top-[16%] flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/80">
          <Battery className="h-5 w-5 text-emerald-400" strokeWidth={2.2} />
        </div>
        <div className="gauge-glow absolute right-[7%] top-[16%] flex h-10 w-10 items-center justify-center rounded-lg border border-amber-500/40 bg-amber-500/10">
          <Gauge className="h-5 w-5 text-amber-400" strokeWidth={2.2} />
        </div>
        <div className="absolute bottom-[12%] left-[7%] flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/80">
          <Droplets className="h-5 w-5 text-sky-400" strokeWidth={2.2} />
        </div>
        <div className="gauge-glow absolute bottom-[12%] right-[7%] flex h-10 w-10 items-center justify-center rounded-lg border border-red-500/40 bg-red-500/10">
          <Thermometer className="h-5 w-5 text-red-400" strokeWidth={2.2} />
        </div>

        {/* Centered ghost mark */}
        <div className="absolute left-1/2 top-[14%] -translate-x-1/2 rounded-md border border-zinc-800 bg-zinc-900/80 p-1.5">
          <Wrench className="h-4 w-4 text-zinc-500" strokeWidth={2.2} />
        </div>
      </div>

      {/* Ambient orbiting word ring (decorative, pauses off-screen) */}
      <WarningWordRing />

      {/* Gauge dial — sits above the ring so words disappear behind it */}
      <div className="absolute left-1/2 top-1/2 h-[78%] w-[78%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-zinc-800 bg-zinc-900">
        {/* Tick marks */}
        {Array.from({ length: 24 }).map((_, index) => (
          <span
            key={index}
            className="absolute left-1/2 top-1/2 h-[46%] w-px origin-bottom bg-zinc-700/60"
            style={{ transform: `translateX(-50%) rotate(${index * 15 - 165}deg)` }}
          />
        ))}
        {/* Amber sweep arc */}
        <div className="absolute left-1/2 top-1/2 h-[70%] w-[70%] -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-transparent border-t-amber-500/60 border-r-amber-500/20" />
        {/* Needle */}
        <div className="needle-sweep absolute left-1/2 top-1/2 h-[40%] w-[3px] -translate-x-1/2 origin-bottom rounded-full bg-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.6)]">
          <span className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-amber-300" />
        </div>
        {/* Hub */}
        <div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-zinc-600 bg-zinc-800" />
        {/* Digital readout */}
        <div className="absolute inset-x-0 bottom-[16%] text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-zinc-500">
            Ok
          </p>
        </div>
      </div>
    </div>
  );
}
