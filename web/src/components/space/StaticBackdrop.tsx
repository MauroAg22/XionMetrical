// Static 2D space background (CSS only, no images or downloads). It is the first thing painted, the
// layer seen while the 3D scene loads, and the whole background when there is no WebGL, the device
// is low-end or the visitor prefers reduced motion. Decorative: hidden from assistive technology.

/** Fixed sky: navy base, a faint Milky Way band and two layers of stars. */
export function StaticSky() {
  return (
    <div className="space-sky">
      <div className="space-sky__band" />
      <div className="space-sky__stars" />
      <div className="space-sky__stars space-sky__stars--far" />
    </div>
  );
}

/** Earth's limb rising at the bottom of the hero. Fades out once the 3D scene takes over. */
export function StaticEarth() {
  return <div aria-hidden="true" className="static-planet static-earth" />;
}

/** Mars near the end of the page (the journey's destination). Fades out once the 3D scene takes over. */
export function StaticMars() {
  return <div aria-hidden="true" className="static-planet static-mars" />;
}
