// Every object ever catalogued in Earth orbit, from CelesTrak's SATCAT,
// packed by scripts/space-catalogue.mjs into public/space/catalogue.bin.
//
// Layout (little-endian): "SPC2" (u32), count (u32), then 24 bytes per
// object: NORAD number with the kind in its top two bits (u32; kind 0
// satellite, 1 rocket body, 2 debris, 3 unknown), launch day and decay day
// (u16 each, days since Sputnik's launch; 0xFFFF = still in orbit), then
// perigee, apogee (km), inclination (degrees), period (minutes) as f32.
//
// The launch day is the day the object appears in the story: for debris,
// the day of the break-up that made it where that's known, otherwise the
// day it was catalogued (see appear.ts), since the catalogue gives every
// fragment its parent's launch date.

export const EPOCH = Date.UTC(1957, 9, 4); // Sputnik 1
const MAGIC = 0x53504332;
const STILL_UP = 0xffff;
const SIZE = 24;
const NORAD = 0x3fffffff;

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

export function encodeCatalogue(objs: SpaceObject[]): ArrayBuffer {
  const buf = new ArrayBuffer(8 + SIZE * objs.length);
  const v = new DataView(buf);
  v.setUint32(0, MAGIC, true);
  v.setUint32(4, objs.length, true);
  objs.forEach((o, i) => {
    const p = 8 + SIZE * i;
    v.setUint32(p, ((o.kind << 30) | (o.norad & NORAD)) >>> 0, true);
    v.setUint16(p + 4, o.launchDay, true);
    v.setUint16(p + 6, o.decayDay ?? STILL_UP, true);
    v.setFloat32(p + 8, o.perigeeKm, true);
    v.setFloat32(p + 12, o.apogeeKm, true);
    v.setFloat32(p + 16, o.inclinationDeg, true);
    v.setFloat32(p + 20, o.periodMin, true);
  });
  return buf;
}

export function decodeCatalogue(buf: ArrayBuffer): SpaceObject[] {
  const v = new DataView(buf);
  if (buf.byteLength < 8 || v.getUint32(0, true) !== MAGIC) throw new Error("not a space catalogue");
  const count = v.getUint32(4, true);
  if (buf.byteLength < 8 + SIZE * count) throw new Error("space catalogue incomplete");
  const out: SpaceObject[] = new Array(count);
  for (let i = 0; i < count; i++) {
    const p = 8 + SIZE * i;
    const id = v.getUint32(p, true);
    const decay = v.getUint16(p + 6, true);
    out[i] = {
      norad: id & NORAD,
      launchDay: v.getUint16(p + 4, true),
      decayDay: decay === STILL_UP ? null : decay,
      kind: (id >>> 30) as SpaceObject["kind"],
      perigeeKm: v.getFloat32(p + 8, true),
      apogeeKm: v.getFloat32(p + 12, true),
      inclinationDeg: v.getFloat32(p + 16, true),
      periodMin: v.getFloat32(p + 20, true),
    };
  }
  return out;
}
