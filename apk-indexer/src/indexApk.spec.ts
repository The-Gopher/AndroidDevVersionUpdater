import { downloadUrl, indexApk, IndexInput, StreamsStore, streamNameFor } from "./indexApk";
import { StreamsDoc } from "./streams";

const info = (code: number) => ({ packageName: "com.a", versionCode: code, versionName: `1.0.${code}`, abis: [] });
const input = (code: number, name = `a-qa/sha${code}/x.apk`): IndexInput => ({
  bucket: "bkt",
  name,
  timeCreated: "2026-11-12T00:00:00Z",
  info: info(code),
});
const noSleep = async () => {};

// An in-memory bucket object with real generation semantics.
function memoryStore() {
  let doc: StreamsDoc | null = null;
  let generation = 0;
  let writes = 0;
  let injected = 0;
  const store: StreamsStore = {
    async read() {
      return doc ? { doc: JSON.parse(JSON.stringify(doc)), generation: String(generation) } : null;
    },
    async write(next, ifGeneration) {
      if (injected > 0) {
        injected--;
        generation++; // someone else got in first
        return false;
      }
      if ((ifGeneration ?? "0") !== String(doc ? generation : 0)) return false;
      doc = JSON.parse(JSON.stringify(next));
      generation++;
      writes++;
      return true;
    },
  };
  return {
    store,
    /** The next n writes lose the race: another writer's update lands first. */
    loseNext(n: number) { injected = n; },
    get doc() { return doc; },
    get writes() { return writes; },
  };
}

describe("indexApk", () => {
  it("writes the first build", async () => {
    const m = memoryStore();
    expect(await indexApk(m.store, input(1), noSleep)).toBe("written");
    expect(m.doc!.streams[0]).toMatchObject({ streamName: "a-qa", bundleId: "com.a" });
    expect(m.doc!.streams[0].builds[0]).toMatchObject({
      version: "1.0.1",
      downloadUrl: "https://storage.googleapis.com/bkt/a-qa/sha1/x.apk",
    });
  });

  it("does not write when the object is already listed", async () => {
    const m = memoryStore();
    await indexApk(m.store, input(1), noSleep);
    expect(await indexApk(m.store, input(1), noSleep)).toBe("unchanged");
    expect(m.writes).toBe(1);
  });

  it("retries after losing a write race, and keeps both builds", async () => {
    const m = memoryStore();
    await indexApk(m.store, input(1), noSleep);
    m.loseNext(2);
    expect(await indexApk(m.store, input(2), noSleep)).toBe("written");
    expect(m.doc!.streams[0].builds.map((b) => b.versionCode)).toEqual([2, 1]);
  });

  it("many concurrent uploads all end up listed", async () => {
    const m = memoryStore();
    await Promise.all([1, 2, 3, 4].map((c) => indexApk(m.store, input(c), noSleep)));
    expect(m.doc!.streams[0].builds.map((b) => b.versionCode)).toEqual([4, 3, 2, 1]);
  });

  it("gives up loudly when the file stays contended, so Eventarc retries", async () => {
    const m = memoryStore();
    m.loseNext(99);
    await expect(indexApk(m.store, input(1), noSleep)).rejects.toThrow(/contended/);
  });

  it("falls back to the versionCode when the manifest has no literal versionName", async () => {
    const m = memoryStore();
    await indexApk(m.store, { ...input(7), info: { ...info(7), versionName: null } }, noSleep);
    expect(m.doc!.streams[0].builds[0].version).toBe("7");
  });
});

describe("helpers", () => {
  it("percent-encodes object names but keeps the slashes", () => {
    expect(downloadUrl("bkt", "a b/c#d/x.apk")).toBe("https://storage.googleapis.com/bkt/a%20b/c%23d/x.apk");
  });
  it("names a stream after its top-level folder", () => {
    expect(streamNameFor("myapp-qa/abc/x.apk")).toBe("myapp-qa");
  });
});
