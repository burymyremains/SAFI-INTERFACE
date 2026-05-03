// src/utils/trajectory.js
export function generateTrajectory({ D, L, d, θdeg, N, res }) {
  const R         = D / 2;
  const θ         = (θdeg * Math.PI) / 180;
  // avance axial por revolución
  const dzPerRev  = 2 * Math.PI * R * Math.tan(θ);
  const totalRevs = L / dzPerRev;

  // separamos la parte entera y la fracción
  const fullRevs   = Math.floor(totalRevs);
  const partialRev = totalRevs - fullRevs;

  // offset entre capas (sin solape, igual a tu d original)
  const layerOffset = d;

  const points = [];

  for (let layer = 0; layer < N; layer++) {
    const rLayer = R - layer * layerOffset;

    // revoluciones completas
    for (let rev = 0; rev < fullRevs; rev++) {
      for (let i = 0; i < res; i++) {
        const t = (rev + i / res) * 2 * Math.PI;
        const z = (rev + i / res) * dzPerRev - L / 2;
        points.push({
          x: rLayer * Math.cos(t),
          y: rLayer * Math.sin(t),
          z
        });
      }
    }

    // revolución parcial (si hay fracción)
    if (partialRev > 1e-6) {
      const partCount = Math.ceil(res * partialRev);
      for (let i = 0; i < partCount; i++) {
        const t = (fullRevs + i / res) * 2 * Math.PI;
        const z = (fullRevs + i / res) * dzPerRev - L / 2;
        points.push({
          x: rLayer * Math.cos(t),
          y: rLayer * Math.sin(t),
          z
        });
      }
    }
  }

  return points;
}
