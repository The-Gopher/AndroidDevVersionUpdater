// Reads the three attributes we need from a compiled (binary) AndroidManifest.xml.
//
// A full AXML decoder is a few hundred lines; the root <manifest> element only
// needs the string pool and the first start-element chunk, so that is all this
// does. Format reference: frameworks/base/include/androidfw/ResourceTypes.h
// (ResChunk_header, ResStringPool_header, ResXMLTree_attrExt, Res_value).

const RES_STRING_POOL_TYPE = 0x0001;
const RES_XML_START_ELEMENT_TYPE = 0x0102;
const UTF8_FLAG = 0x100;

const TYPE_STRING = 0x03;
const TYPE_INT_DEC = 0x10;
const TYPE_INT_HEX = 0x11;

export class ManifestParseError extends Error {}

export interface ManifestInfo {
  packageName: string;
  versionCode: number;
  versionName: string | null;
}

export function parseManifest(buf: Buffer): ManifestInfo {
  try {
    return parse(buf);
  } catch (err) {
    if (err instanceof ManifestParseError) throw err;
    // Buffer reads throw RangeError when a truncated or hostile file points past its end.
    throw new ManifestParseError(`malformed AndroidManifest.xml: ${(err as Error).message}`);
  }
}

function parse(buf: Buffer): ManifestInfo {
  if (buf.length < 8 || buf.readUInt16LE(0) !== 0x0003) {
    throw new ManifestParseError("not a binary XML file");
  }

  let pool: string[] = [];
  let offset = buf.readUInt16LE(2); // skip the file header

  while (offset + 8 <= buf.length) {
    const type = buf.readUInt16LE(offset);
    const headerSize = buf.readUInt16LE(offset + 2);
    const size = buf.readUInt32LE(offset + 4);
    if (size < 8 || offset + size > buf.length) {
      throw new ManifestParseError("chunk runs past the end of the file");
    }

    if (type === RES_STRING_POOL_TYPE) {
      pool = readStringPool(buf, offset, headerSize);
    } else if (type === RES_XML_START_ELEMENT_TYPE) {
      const element = readElement(buf, offset, pool);
      if (element.name !== "manifest") {
        throw new ManifestParseError(`root element is <${element.name}>, not <manifest>`);
      }
      return toManifestInfo(element.attributes);
    }
    offset += size;
  }
  throw new ManifestParseError("no <manifest> element found");
}

function readStringPool(buf: Buffer, chunk: number, headerSize: number): string[] {
  const count = buf.readUInt32LE(chunk + 8);
  const flags = buf.readUInt32LE(chunk + 16);
  const stringsStart = chunk + buf.readUInt32LE(chunk + 20);
  const utf8 = (flags & UTF8_FLAG) !== 0;
  const pool: string[] = [];
  for (let i = 0; i < count; i++) {
    const at = stringsStart + buf.readUInt32LE(chunk + headerSize + 4 * i);
    pool.push(utf8 ? readUtf8(buf, at) : readUtf16(buf, at));
  }
  return pool;
}

function readUtf8(buf: Buffer, at: number): string {
  // Two length prefixes: UTF-16 code units, then UTF-8 bytes. Each is one byte,
  // or two when the high bit of the first is set.
  const skipLen = (): number => {
    const first = buf.readUInt8(at++);
    if (first & 0x80) {
      const value = ((first & 0x7f) << 8) | buf.readUInt8(at++);
      return value;
    }
    return first;
  };
  skipLen();
  const byteLen = skipLen();
  return buf.toString("utf8", at, at + byteLen);
}

function readUtf16(buf: Buffer, at: number): string {
  let len = buf.readUInt16LE(at);
  at += 2;
  if (len & 0x8000) {
    len = ((len & 0x7fff) << 16) | buf.readUInt16LE(at);
    at += 2;
  }
  return buf.toString("utf16le", at, at + len * 2);
}

interface Attribute {
  name: string;
  raw: string | null;
  dataType: number;
  data: number;
}

function readElement(buf: Buffer, chunk: number, pool: string[]) {
  const ext = chunk + 16; // after ResXMLTree_node (header + line number + comment)
  const name = pool[buf.readInt32LE(ext + 4)] ?? "";
  const attrStart = buf.readUInt16LE(ext + 8);
  const attrSize = buf.readUInt16LE(ext + 10);
  const attrCount = buf.readUInt16LE(ext + 12);

  const attributes: Attribute[] = [];
  for (let i = 0; i < attrCount; i++) {
    const at = ext + attrStart + i * attrSize;
    const raw = buf.readInt32LE(at + 8);
    attributes.push({
      name: pool[buf.readInt32LE(at + 4)] ?? "",
      raw: raw >= 0 ? (pool[raw] ?? null) : null,
      dataType: buf.readUInt8(at + 15),
      data: buf.readUInt32LE(at + 16),
    });
  }
  return { name, attributes };
}

function toManifestInfo(attributes: Attribute[]): ManifestInfo {
  const find = (name: string) => attributes.find((a) => a.name === name);

  const packageName = find("package")?.raw;
  if (!packageName) throw new ManifestParseError("manifest has no package attribute");

  const code = find("versionCode");
  if (!code || (code.dataType !== TYPE_INT_DEC && code.dataType !== TYPE_INT_HEX)) {
    throw new ManifestParseError("manifest has no integer versionCode");
  }

  const name = find("versionName");
  // versionName can be a resource reference (@string/...), in which case there
  // is no literal to read; report null rather than a resource id.
  const versionName = name && name.dataType === TYPE_STRING ? name.raw : null;

  return { packageName, versionCode: code.data, versionName };
}
