import { ApkInfo } from "./apkInfo";
import { mergeBuild, NewBuild, sameDoc, StreamsDoc } from "./streams";

/** The streams.json object, with the generation used for compare-and-swap writes. */
export interface StreamsStore {
  read(): Promise<{ doc: StreamsDoc; generation: string } | null>;
  /** Resolves false when `generation` no longer matches (someone else wrote first). */
  write(doc: StreamsDoc, ifGeneration: string | null): Promise<boolean>;
}

export interface IndexInput {
  bucket: string;
  /** Object name, e.g. "myapp-qa/<sha>/app-release.apk". */
  name: string;
  timeCreated: string;
  info: ApkInfo;
}

export function downloadUrl(bucket: string, name: string): string {
  const path = name.split("/").map(encodeURIComponent).join("/");
  return `https://storage.googleapis.com/${bucket}/${path}`;
}

/** "myapp-qa/<sha>/x.apk" -> "myapp-qa": the folder CI chose for this flavor. */
export function streamNameFor(name: string): string {
  return name.split("/")[0];
}

const MAX_ATTEMPTS = 8;

/**
 * Read-modify-write of streams.json under an ifGenerationMatch precondition.
 * CI uploads every flavor's APK within seconds of each other, so concurrent
 * invocations are the normal case, not an edge: without the precondition the
 * last writer would silently drop the others' builds.
 */
export async function indexApk(
  store: StreamsStore,
  input: IndexInput,
  sleep: (ms: number) => Promise<void> = (ms) => new Promise((r) => setTimeout(r, ms)),
): Promise<"written" | "unchanged"> {
  const incoming: NewBuild = {
    bundleId: input.info.packageName,
    streamName: streamNameFor(input.name),
    build: {
      // Fall back to the code so a manifest with a resource-reference name still lists.
      version: input.info.versionName ?? String(input.info.versionCode),
      versionCode: input.info.versionCode,
      downloadUrl: downloadUrl(input.bucket, input.name),
      releaseDate: input.timeCreated,
      abis: input.info.abis,
    },
  };

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const existing = await store.read();
    const next = mergeBuild(existing?.doc ?? null, incoming);
    if (sameDoc(existing?.doc ?? null, next)) return "unchanged";
    if (await store.write(next, existing?.generation ?? null)) return "written";
    await sleep(Math.random() * 100 * attempt);
  }
  throw new Error(`streams.json is still contended after ${MAX_ATTEMPTS} attempts`);
}
