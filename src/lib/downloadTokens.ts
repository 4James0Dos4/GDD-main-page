import { createHash, randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { getDownloadTokenTtlMs } from "./stripeEnv";

export type DownloadTokenRecord = {
  /** SHA-256 hash tokenu używany w URL pobrania */
  token: string;
  /** Oryginalny token (tylko serwer) — do ponownej wysyłki maila */
  plainToken?: string;
  productId: string;
  email: string;
  sessionId: string;
  createdAt: number;
  expiresAt: number;
  usedAt?: number;
};

const memoryStore = new Map<string, DownloadTokenRecord>();

function storePath(): string {
  return path.join(process.cwd(), ".data", "download-tokens.json");
}

async function loadStore(): Promise<Map<string, DownloadTokenRecord>> {
  try {
    const raw = await readFile(storePath(), "utf8");
    const parsed = JSON.parse(raw) as DownloadTokenRecord[];
    const map = new Map<string, DownloadTokenRecord>();
    for (const item of parsed) {
      map.set(item.token, item);
    }
    return map;
  } catch {
    return new Map(memoryStore);
  }
}

async function persistStore(map: Map<string, DownloadTokenRecord>): Promise<void> {
  const dir = path.dirname(storePath());
  await mkdir(dir, { recursive: true });
  await writeFile(storePath(), JSON.stringify([...map.values()], null, 2), "utf8");
  memoryStore.clear();
  for (const [key, value] of map) {
    memoryStore.set(key, value);
  }
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function deleteTokenBySessionId(sessionId: string): Promise<void> {
  const map = await loadStore();
  for (const [key, record] of map) {
    if (record.sessionId === sessionId) {
      map.delete(key);
    }
  }
  await persistStore(map);
}

export async function clearPlainTokenBySessionId(sessionId: string): Promise<void> {
  const map = await loadStore();
  let changed = false;
  for (const record of map.values()) {
    if (record.sessionId === sessionId && record.plainToken) {
      delete record.plainToken;
      changed = true;
    }
  }
  if (changed) {
    await persistStore(map);
  }
}

export function isTokenUsable(record: DownloadTokenRecord): boolean {
  if (record.usedAt) return false;
  if (Date.now() > record.expiresAt) return false;
  return true;
}

export async function findTokenBySessionId(
  sessionId: string,
): Promise<DownloadTokenRecord | null> {
  const map = await loadStore();
  for (const record of map.values()) {
    if (record.sessionId === sessionId) {
      return record;
    }
  }
  return null;
}

export async function createDownloadToken(input: {
  productId: string;
  email: string;
  sessionId: string;
}): Promise<string> {
  const existing = await findTokenBySessionId(input.sessionId);
  if (existing) {
    throw new Error(`Token already exists for session ${input.sessionId}`);
  }

  const token = randomBytes(32).toString("hex");
  const record: DownloadTokenRecord = {
    token: hashToken(token),
    plainToken: token,
    productId: input.productId,
    email: input.email,
    sessionId: input.sessionId,
    createdAt: Date.now(),
    expiresAt: Date.now() + getDownloadTokenTtlMs(),
  };

  const map = await loadStore();
  map.set(record.token, record);
  await persistStore(map);
  return token;
}

export async function consumeDownloadToken(
  plainToken: string,
): Promise<DownloadTokenRecord | null> {
  const hashed = hashToken(plainToken);
  const map = await loadStore();
  const record = map.get(hashed);

  if (!record) return null;
  if (record.usedAt) return null;
  if (Date.now() > record.expiresAt) return null;

  record.usedAt = Date.now();
  map.set(hashed, record);
  await persistStore(map);
  return record;
}
