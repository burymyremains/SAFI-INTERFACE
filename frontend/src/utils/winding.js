// src/utils/winding.js

/**
 * Calcula un array de puntos { x, y, z } que describen el patrón de bobinado
 * sobre un cilindro de diámetro `diameter`, longitud `length`,
 * ancho de filamento `width`, ángulo de bobinado `angle` y `layers` capas.
 */

export function computeWindingPath({ diameter, length, width, angle, layers }) {
  const radius = diameter/2;
  const circ = Math.PI * diameter;
  const axialStep = Math.tan((angle * Math.PI)/180) * width;
  let totalPasses = Math.ceil(length/axialStep) * layers;

  // ► Elimina o comenta este cap
  // const MAX_POINTS = 5000;
  // if (totalPasses > MAX_POINTS) totalPasses = MAX_POINTS;

  const points = [];
  let z=0, theta=0;
  for(let i=0; i<totalPasses; i++){
    theta += (2*Math.PI*width)/circ;
    z += axialStep;
    if(z>length) z-=length;
    points.push({ x: radius*Math.cos(theta), y: radius*Math.sin(theta), z});
  }
  return points;
}