// Standard CIE L*a*b* (D65 standard observer) to sRGB conversion

export function labToRgb(l: number, a: number, b: number): { r: number; g: number; b: number; css: string } {
  // 1. CIELAB to XYZ
  let y = (l + 16) / 116;
  let x = a / 500 + y;
  let z = y - b / 200;

  const x3 = Math.pow(x, 3);
  const y3 = Math.pow(y, 3);
  const z3 = Math.pow(z, 3);

  x = (x3 > 0.008856 ? x3 : (x - 16 / 116) / 7.787) * 95.047;
  y = (y3 > 0.008856 ? y3 : (y - 16 / 116) / 7.787) * 100.0;
  z = (z3 > 0.008856 ? z3 : (z - 16 / 116) / 7.787) * 108.883;

  // 2. XYZ to linear sRGB
  const xNorm = x / 100;
  const yNorm = y / 100;
  const zNorm = z / 100;

  let rLin = xNorm * 3.2406 + yNorm * -1.5372 + zNorm * -0.4986;
  let gLin = xNorm * -0.9689 + yNorm * 1.8758 + zNorm * 0.0415;
  let bLin = xNorm * 0.0557 + yNorm * -0.204 + zNorm * 1.057;

  // 3. Gamma companding
  const gamma = (c: number) => {
    c = c > 0.0031308 ? 1.055 * Math.pow(c, 1 / 2.4) - 0.055 : 12.92 * c;
    return Math.min(255, Math.max(0, Math.round(c * 255)));
  };

  const r = gamma(rLin);
  const g = gamma(gLin);
  const bVal = gamma(bLin);

  return {
    r,
    g,
    b: bVal,
    css: `rgb(${r}, ${g}, ${bVal})`,
  };
}
