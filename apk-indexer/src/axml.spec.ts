import { readFileSync } from "fs";
import { join } from "path";
import { ManifestParseError, parseManifest } from "./axml";

const fixture = (n: string) => readFileSync(join(__dirname, "__fixtures__", n));

// Builds the smallest binary XML that has a <manifest> root, so the UTF-8 string
// pool path is exercised — AGP output happens to be UTF-16 and a real UTF-8
// fixture is not to hand.
function buildAxml(opts: { utf8: boolean; versionName?: string | "ref" }): Buffer {
  const strings = ["package", "versionCode", "versionName", "manifest", "com.example.app", "1.2.3-QA"];
  const enc = (s: string): Buffer => {
    if (opts.utf8) {
      const b = Buffer.from(s, "utf8");
      return Buffer.concat([Buffer.from([s.length, b.length]), b, Buffer.from([0])]);
    }
    const b = Buffer.from(s, "utf16le");
    const len = Buffer.alloc(2);
    len.writeUInt16LE(s.length);
    return Buffer.concat([len, b, Buffer.alloc(2)]);
  };
  const encoded = strings.map(enc);
  const offsets: number[] = [];
  let pos = 0;
  for (const e of encoded) {
    offsets.push(pos);
    pos += e.length;
  }
  while (pos % 4) pos++;
  const data = Buffer.alloc(pos);
  Buffer.concat(encoded).copy(data);

  const poolHeader = 28;
  const pool = Buffer.alloc(poolHeader + 4 * strings.length + data.length);
  pool.writeUInt16LE(0x0001, 0);
  pool.writeUInt16LE(poolHeader, 2);
  pool.writeUInt32LE(pool.length, 4);
  pool.writeUInt32LE(strings.length, 8);
  pool.writeUInt32LE(opts.utf8 ? 0x100 : 0, 16);
  pool.writeUInt32LE(poolHeader + 4 * strings.length, 20);
  offsets.forEach((o, i) => pool.writeUInt32LE(o, poolHeader + 4 * i));
  data.copy(pool, poolHeader + 4 * strings.length);

  const attrs: Buffer[] = [];
  const attr = (name: number, raw: number, type: number, value: number) => {
    const a = Buffer.alloc(20);
    a.writeInt32LE(-1, 0);
    a.writeInt32LE(name, 4);
    a.writeInt32LE(raw, 8);
    a.writeUInt16LE(8, 12);
    a.writeUInt8(type, 15);
    a.writeUInt32LE(value >>> 0, 16);
    attrs.push(a);
  };
  attr(0, 4, 0x03, 4); // package="com.example.app"
  attr(1, -1, 0x10, 4194307); // versionCode (an ABI-folded value)
  if (opts.versionName === "ref") attr(2, -1, 0x01, 0x7f0f0001);
  else attr(2, 5, 0x03, 5);

  const el = Buffer.alloc(36 + 20 * attrs.length);
  el.writeUInt16LE(0x0102, 0);
  el.writeUInt16LE(16, 2);
  el.writeUInt32LE(el.length, 4);
  el.writeInt32LE(-1, 16 + 0); // ns
  el.writeInt32LE(3, 16 + 4); // name = "manifest"
  el.writeUInt16LE(20, 16 + 8);
  el.writeUInt16LE(20, 16 + 10);
  el.writeUInt16LE(attrs.length, 16 + 12);
  Buffer.concat(attrs).copy(el, 36);

  const head = Buffer.alloc(8);
  head.writeUInt16LE(0x0003, 0);
  head.writeUInt16LE(8, 2);
  head.writeUInt32LE(8 + pool.length + el.length, 4);
  return Buffer.concat([head, pool, el]);
}

describe("parseManifest", () => {
  it("reads a manifest compiled by the Android Gradle plugin", () => {
    expect(parseManifest(fixture("updater.AndroidManifest.xml"))).toEqual({
      packageName: "com.thegopher.androiddevversionupdater",
      versionCode: 1,
      versionName: "1.0",
    });
  });

  it.each([true, false])("reads a UTF-8=%s string pool, and a versionCode above 2^22", (utf8) => {
    expect(parseManifest(buildAxml({ utf8 }))).toEqual({
      packageName: "com.example.app",
      versionCode: 4194307, // 4 * 1048576 + 3, the x86_64 split of build 3
      versionName: "1.2.3-QA",
    });
  });

  it("reports null for a versionName that is a resource reference", () => {
    expect(parseManifest(buildAxml({ utf8: true, versionName: "ref" })).versionName).toBeNull();
  });

  it("rejects text that is not binary XML", () => {
    expect(() => parseManifest(Buffer.from("<manifest/>"))).toThrow(ManifestParseError);
  });

  it("turns a truncated file into a ManifestParseError, not a RangeError", () => {
    const whole = fixture("updater.AndroidManifest.xml");
    expect(() => parseManifest(whole.subarray(0, 400))).toThrow(ManifestParseError);
  });
});
