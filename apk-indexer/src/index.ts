import { cloudEvent, CloudEvent } from "@google-cloud/functions-framework";
import { Storage } from "@google-cloud/storage";
import { readApkInfo } from "./apkInfo";
import { ManifestParseError } from "./axml";
import { gcsRangeReader, gcsStreamsStore } from "./gcs";
import { indexApk } from "./indexApk";

// Optional guard. The Eventarc trigger already filters to one bucket, and streams.json is
// written to whichever bucket the event came from, so this only matters if the service is
// ever pointed at more than one and should refuse the others.
const ONLY_BUCKET = process.env.BUCKET;

interface StorageObjectData {
  bucket: string;
  name: string;
  size?: string;
  timeCreated?: string;
}

const storage = new Storage();

cloudEvent<StorageObjectData>("apk-indexer", async (event: CloudEvent<StorageObjectData>) => {
  const object = event.data;
  if (!object || (ONLY_BUCKET && object.bucket !== ONLY_BUCKET)) {
    console.warn("Ignoring event for another bucket", object?.bucket);
    return;
  }
  // streams.json lives in this same bucket, so our own write fires this function too.
  if (!object.name.toLowerCase().endsWith(".apk")) return;

  let info;
  try {
    info = await readApkInfo(gcsRangeReader(storage, object.bucket, object.name, Number(object.size)));
  } catch (err) {
    if (err instanceof ManifestParseError) {
      // A bad file will be just as bad on redelivery; swallow it so Eventarc does not retry forever.
      console.warn("Not indexing", object.name, (err as Error).message);
      return;
    }
    throw err; // GCS or network trouble: let Eventarc retry
  }

  const result = await indexApk(gcsStreamsStore(storage, object.bucket), {
    bucket: object.bucket,
    name: object.name,
    timeCreated: object.timeCreated ?? new Date().toISOString(),
    info,
  });
  console.log("Indexed", JSON.stringify({ name: object.name, result, ...info }));
});
