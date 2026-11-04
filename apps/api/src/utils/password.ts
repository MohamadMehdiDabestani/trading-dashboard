import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

const KEYLEN = 64;
const PARAMS = { N: 16384, r: 8, p: 1 } as const;

function derive(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) =>
    scrypt(password.normalize("NFKC"), salt, KEYLEN, PARAMS, (err, key) =>
      err ? reject(err) : resolve(key),
    ),
  );
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await derive(password, salt);
  return `s1$${salt.toString("base64url")}$${key.toString("base64url")}`;
}

let dummyHash: Promise<string> | undefined;

export async function verifyPassword(
  password: string,
  stored?: string | null,
): Promise<boolean> {
  const hash = stored ?? (await (dummyHash ??= hashPassword("dummy-password")));
  const [v, saltB64, keyB64] = hash.split("$");
  if (v !== "s1" || !saltB64 || !keyB64) return false;

  const expected = Buffer.from(keyB64, "base64url");
  const actual = await derive(password, Buffer.from(saltB64, "base64url"));
  const match = expected.length === actual.length && timingSafeEqual(expected, actual);
  return stored != null && match;
}