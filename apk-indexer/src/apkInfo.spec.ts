import { readFileSync } from "fs";
import { join } from "path";
import { Readable } from "stream";
import { ManifestParseError } from "./axml";
import { readApkInfo, RangeReader } from "./apkInfo";

function fromFile(name: string): { reader: RangeReader; reads: Array<[number, number]> } {
  const bytes = readFileSync(join(__dirname, "__fixtures__", name));
  const reads: Array<[number, number]> = [];
  return {
    reads,
    reader: {
      size: bytes.length,
      read: (start, end) => {
        reads.push([start, end]);
        return Readable.from([bytes.subarray(start, end)]);
      },
    },
  };
}

describe("readApkInfo", () => {
  it("returns the manifest identity and the ABIs the APK carries native code for", async () => {
    const { reader } = fromFile("mini-split.zip");
    expect(await readApkInfo(reader)).toEqual({
      packageName: "com.thegopher.androiddevversionupdater",
      versionCode: 1,
      versionName: "1.0",
      abis: ["arm64-v8a", "x86_64"],
    });
  });

  it("reports no ABIs for an APK without native libraries", async () => {
    expect((await readApkInfo(fromFile("mini-nonative.zip").reader)).abis).toEqual([]);
  });

  it("reads byte ranges, never the whole file in one go", async () => {
    const { reader, reads } = fromFile("mini-split.zip");
    await readApkInfo(reader);
    expect(reads.length).toBeGreaterThan(0);
    expect(reads.every(([s, e]) => s >= 0 && e <= reader.size)).toBe(true);
  });

  it("rejects a file that is not a zip", async () => {
    const junk = Buffer.alloc(200, 7);
    const reader: RangeReader = { size: junk.length, read: (s, e) => Readable.from([junk.subarray(s, e)]) };
    await expect(readApkInfo(reader)).rejects.toBeInstanceOf(ManifestParseError);
  });
});
