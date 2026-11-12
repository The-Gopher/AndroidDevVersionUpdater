import { Storage } from "@google-cloud/storage";
import { RangeReader } from "./apkInfo";
import { StreamsDoc } from "./streams";
import { StreamsStore } from "./indexApk";

export const STREAMS_OBJECT = "streams.json";

export function gcsRangeReader(storage: Storage, bucket: string, name: string, size: number): RangeReader {
  const file = storage.bucket(bucket).file(name);
  // GCS's `end` is inclusive; ours is exclusive.
  return { size, read: (start, end) => file.createReadStream({ start, end: end - 1, validation: false }) };
}

export function gcsStreamsStore(storage: Storage, bucket: string): StreamsStore {
  const file = storage.bucket(bucket).file(STREAMS_OBJECT);
  return {
    async read() {
      try {
        const [meta] = await file.getMetadata();
        // Download exactly the generation whose number we return, so the pair cannot
        // disagree if another invocation writes between the two calls.
        const generation = String(meta.generation);
        const [body] = await storage.bucket(bucket).file(STREAMS_OBJECT, { generation }).download();
        return { doc: JSON.parse(body.toString("utf8")) as StreamsDoc, generation };
      } catch (err) {
        if ((err as { code?: number }).code === 404) return null;
        throw err;
      }
    },
    async write(doc, ifGeneration) {
      try {
        await file.save(JSON.stringify(doc, null, 2) + "\n", {
          contentType: "application/json",
          // The phone polls this file; a cached copy is a missed update.
          metadata: { cacheControl: "no-cache, max-age=0" },
          // 0 means "only if it does not exist yet".
          preconditionOpts: { ifGenerationMatch: ifGeneration === null ? 0 : Number(ifGeneration) },
          resumable: false,
        });
        return true;
      } catch (err) {
        if ((err as { code?: number }).code === 412) return false;
        throw err;
      }
    },
  };
}
