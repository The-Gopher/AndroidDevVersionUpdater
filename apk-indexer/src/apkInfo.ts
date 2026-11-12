import { Readable } from "stream";
import yauzl from "yauzl";
import { ManifestInfo, ManifestParseError, parseManifest } from "./axml";

// An APK is a zip, and a zip keeps its directory at the END of the file. Reading
// that directory and then the one entry we want touches a few hundred KB of a
// ~100 MB APK, so the function can run in 256 MiB and finish in well under a second.
export interface RangeReader {
  size: number;
  /** Bytes [start, end) of the file. */
  read(start: number, end: number): Readable;
}

export interface ApkInfo extends ManifestInfo {
  /**
   * Native ABIs the APK ships libraries for (from lib/<abi>/*.so). Empty means it
   * carries no native code and runs anywhere. The manifest does not say which ABI
   * a split APK is for, and per-ABI split builds commonly fold the ABI
   * into versionCode, so this is the only way to tell an arm64 APK from an x86_64 one.
   */
  abis: string[];
}

const MANIFEST_ENTRY = "AndroidManifest.xml";
const MAX_MANIFEST_BYTES = 8 * 1024 * 1024;
const LIB_ENTRY = /^lib\/([^/]+)\/[^/]+\.so$/;

class RangeAccessReader extends yauzl.RandomAccessReader {
  constructor(private readonly source: RangeReader) {
    super();
  }
  _readStreamForRange(start: number, end: number): Readable {
    return this.source.read(start, end);
  }
}

export function readApkInfo(source: RangeReader): Promise<ApkInfo> {
  return new Promise((resolve, reject) => {
    yauzl.fromRandomAccessReader(
      new RangeAccessReader(source),
      source.size,
      { lazyEntries: true, autoClose: false },
      (err, zip) => {
        if (err || !zip) return reject(new ManifestParseError(`not a zip file: ${err?.message}`));

        const abis = new Set<string>();
        let manifestEntry: yauzl.Entry | null = null;

        zip.on("error", reject);
        zip.on("entry", (entry: yauzl.Entry) => {
          if (entry.fileName === MANIFEST_ENTRY) manifestEntry = entry;
          const lib = LIB_ENTRY.exec(entry.fileName);
          if (lib) abis.add(lib[1]);
          zip.readEntry();
        });
        zip.on("end", () => {
          if (!manifestEntry) return reject(new ManifestParseError("no AndroidManifest.xml in the archive"));
          if (manifestEntry.uncompressedSize > MAX_MANIFEST_BYTES) {
            return reject(new ManifestParseError("AndroidManifest.xml is implausibly large"));
          }
          zip.openReadStream(manifestEntry, (openErr, stream) => {
            if (openErr || !stream) return reject(openErr ?? new Error("could not open manifest"));
            const chunks: Buffer[] = [];
            stream.on("data", (c: Buffer) => chunks.push(c));
            stream.on("error", reject);
            stream.on("end", () => {
              try {
                resolve({ ...parseManifest(Buffer.concat(chunks)), abis: [...abis].sort() });
              } catch (e) {
                reject(e);
              }
            });
          });
        });
        zip.readEntry();
      },
    );
  });
}
