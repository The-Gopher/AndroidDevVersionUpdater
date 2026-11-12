import { Build, mergeBuild, StreamsDoc } from "./streams";

const build = (code: number, over: Partial<Build> = {}): Build => ({
  version: `1.0.${code}`,
  versionCode: code,
  downloadUrl: `https://storage.googleapis.com/b/app/${code}/x.apk`,
  releaseDate: `2026-11-${String(code).padStart(2, "0")}T00:00:00Z`,
  abis: [],
  ...over,
});
const incoming = (b: Build, bundleId = "com.a", streamName = "a-qa") => ({ bundleId, streamName, build: b });

describe("mergeBuild", () => {
  it("creates the document from nothing", () => {
    expect(mergeBuild(null, incoming(build(1)))).toEqual({
      streams: [{ streamName: "a-qa", bundleId: "com.a", builds: [build(1)] }],
    });
  });

  it("adds a second bundle ID without disturbing the first", () => {
    const doc = mergeBuild(mergeBuild(null, incoming(build(1))), incoming(build(1), "com.b", "b-qa"));
    expect(doc.streams.map((s) => s.bundleId)).toEqual(["com.a", "com.b"]);
  });

  it("is idempotent: a redelivered event produces an identical document", () => {
    const once = mergeBuild(null, incoming(build(1)));
    expect(mergeBuild(once, incoming(build(1)))).toEqual(once);
  });

  it("lists newest versionCode first and keeps only the newest N", () => {
    let doc: StreamsDoc | null = null;
    for (const c of [3, 1, 2, 5, 4, 7, 6]) doc = mergeBuild(doc, incoming(build(c)), 5);
    expect(doc!.streams[0].builds.map((b) => b.versionCode)).toEqual([7, 6, 5, 4, 3]);
  });

  it("trims each ABI variant separately, so an arm64 build is not pushed out by x86_64 ones", () => {
    let doc: StreamsDoc | null = mergeBuild(null, incoming(build(10, { abis: ["arm64-v8a"] })), 2);
    for (const c of [11, 12, 13]) doc = mergeBuild(doc, incoming(build(c, { abis: ["x86_64"] })), 2);
    const codes = doc!.streams[0].builds.map((b) => b.versionCode);
    expect(codes).toContain(10);
    expect(codes.filter((c) => c > 10)).toEqual([13, 12]);
  });

  it("takes the stream name from the latest upload", () => {
    const doc = mergeBuild(mergeBuild(null, incoming(build(1))), incoming(build(2), "com.a", "renamed"));
    expect(doc.streams[0].streamName).toBe("renamed");
  });

  it("does not mutate its input", () => {
    const before = mergeBuild(null, incoming(build(1)));
    const snapshot = JSON.stringify(before);
    mergeBuild(before, incoming(build(2)));
    expect(JSON.stringify(before)).toBe(snapshot);
  });
});
