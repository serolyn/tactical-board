interface HeroVisualSlotProps {
  src: string
  alt: string
}

/**
 * Stable boundary for the future Ghost Signal WebGL scene.
 *
 * The real image remains in the DOM as a fast, accessible fallback. Phase 3C can
 * mount a canvas inside `data-ghost-signal-mount` without rebuilding the hero.
 */
export function HeroVisualSlot({ src, alt }: HeroVisualSlotProps) {
  return (
    <figure className="hero-visual-slot" data-hero-visual-slot>
      <img
        alt={alt}
        decoding="async"
        fetchPriority="high"
        height="900"
        src={src}
        width="1600"
      />
      <div aria-hidden="true" className="hero-visual-slot__future" data-ghost-signal-mount />
      <figcaption>SIGNAL STATIQUE / FALLBACK VISUEL</figcaption>
    </figure>
  )
}
