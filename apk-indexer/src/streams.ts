// The document the Android updater app reads. The shape is its contract — see
// AndroidDevVersionUpdater's data/model/Models.kt. `abis` is additive: older
// builds of that app ignore it.

export interface Build {
  version: string;
  versionCode: number;
  downloadUrl: string;
  releaseDate: string;
  abis: string[];
}

export interface Stream {
  streamName: string;
  bundleId: string;
  builds: Build[];
}

export interface StreamsDoc {
  streams: Stream[];
}

export interface NewBuild {
  bundleId: string;
  streamName: string;
  build: Build;
}

/** Newest builds kept per bundle ID and ABI set, so the file does not grow with every CI run. */
export const KEEP_PER_VARIANT = 5;

const abiKey = (b: Build) => (b.abis ?? []).join(",");

/**
 * Returns a new document with `incoming` folded in. Pure and deterministic: the
 * same inputs always produce the same JSON, so a redelivered event yields a
 * document equal to the one already stored and the caller can skip the write.
 */
export function mergeBuild(current: StreamsDoc | null, incoming: NewBuild, keep = KEEP_PER_VARIANT): StreamsDoc {
  const streams = new Map<string, Stream>();
  for (const s of current?.streams ?? []) {
    streams.set(s.bundleId, { ...s, builds: [...s.builds] });
  }

  const stream = streams.get(incoming.bundleId) ?? {
    streamName: incoming.streamName,
    bundleId: incoming.bundleId,
    builds: [],
  };
  // The latest upload names the stream; the bundle ID is the identity.
  stream.streamName = incoming.streamName;

  // A redelivered event, or the same object re-uploaded, replaces itself.
  const builds = stream.builds.filter((b) => b.downloadUrl !== incoming.build.downloadUrl);
  builds.push({ ...incoming.build, abis: incoming.build.abis ?? [] });

  const byVariant = new Map<string, Build[]>();
  for (const b of builds) {
    const key = abiKey(b);
    byVariant.set(key, [...(byVariant.get(key) ?? []), b]);
  }
  const kept: Build[] = [];
  for (const group of byVariant.values()) {
    group.sort(newestFirst);
    kept.push(...group.slice(0, keep));
  }
  stream.builds = kept.sort(newestFirst);
  streams.set(incoming.bundleId, stream);

  return { streams: [...streams.values()].sort((a, b) => a.bundleId.localeCompare(b.bundleId)) };
}

function newestFirst(a: Build, b: Build): number {
  return (
    b.versionCode - a.versionCode ||
    b.releaseDate.localeCompare(a.releaseDate) ||
    a.downloadUrl.localeCompare(b.downloadUrl)
  );
}

export function sameDoc(a: StreamsDoc | null, b: StreamsDoc): boolean {
  return a !== null && JSON.stringify(a) === JSON.stringify(b);
}
