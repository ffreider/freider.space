// Every object ever catalogued in Earth orbit, from CelesTrak's SATCAT,
// packed by scripts/space-catalogue.mjs into public/space/catalogue.bin.
//
// Layout (little-endian): "SPC1" (u32), count (u32), then 32 bytes per
// object: NORAD number (u32), launch day and decay day (u16 each, days since
// Sputnik's launch; 0xFFFF = still in orbit), kind (u8: 0 satellite,
// 1 rocket body, 2 debris, 3 unknown), 3 bytes padding, perigee, apogee
// (km), inclination (degrees), period (minutes) as f32, 4 bytes reserved.

export const EPOCH = Date.UTC(1957, 9, 4); // Sputnik 1
const MAGIC = 0x53504331;
const STILL_UP = 0xffff;
const SIZE = 32;

export type SpaceObject = {
  norad: number;
  launchDay: number;
  decayDay: number | null;
  kind: 0 | 1 | 2 | 3;
  perigeeKm: number;
  apogeeKm: number;
  inclinationDeg: number;
  periodMin: number;
};

export const dayOf = (date: Date) => Math.floor((date.getTime() - EPOCH) / 86_400_000);

export function decodeCatalogue(buf: ArrayBuffer): SpaceObject[] {
  const v = new DataView(buf);
  if (buf.byteLength < 8 || v.getUint32(0, true) !== MAGIC) throw new Error("not a space catalogue");
  const count = v.getUint32(4, true);
  const out: SpaceObject[] = new Array(count);
  for (let i = 0; i < count; i++) {
    const p = 8 + SIZE * i;
    const decay = v.getUint16(p + 6, true);
    out[i] = {
      norad: v.getUint32(p, true),
      launchDay: v.getUint16(p + 4, true),
      decayDay: decay === STILL_UP ? null : decay,
      kind: v.getUint8(p + 8) as SpaceObject["kind"],
      perigeeKm: v.getFloat32(p + 12, true),
      apogeeKm: v.getFloat32(p + 16, true),
      inclinationDeg: v.getFloat32(p + 20, true),
      periodMin: v.getFloat32(p + 24, true),
    };
  }
  return out;
}
