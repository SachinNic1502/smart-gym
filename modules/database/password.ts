import crypto from "crypto";

const SALT_LENGTH = 16; // bytes
const KEY_LENGTH = 64; // bytes
const ITERATIONS = 100_000;
const DIGEST = "sha512";

function pbkdf2Async(password: string, salt: string, iterations: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(password, salt, iterations, KEY_LENGTH, DIGEST, (err, derivedKey) => {
      if (err) return reject(err);
      resolve(derivedKey);
    });
  });
}

/**
 * Hash a password using PBKDF2 with a random salt.
 * Returns a string formatted as: "pbkdf2$<iterations>$<salt>$<hash>".
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(SALT_LENGTH).toString("hex");
  const derivedKey = await pbkdf2Async(password, salt, ITERATIONS);
  const hash = derivedKey.toString("hex");
  return `pbkdf2$${ITERATIONS}$${salt}$${hash}`;
}

/**
 * Verify a password against a stored PBKDF2 hash.
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  try {
    const [algo, iterStr, salt, hash] = storedHash.split("$");
    if (algo !== "pbkdf2") return false;
    const iterations = Number(iterStr);
    if (!iterations || !salt || !hash) return false;

    const derivedKey = await pbkdf2Async(password, salt, iterations);
    const derivedHex = derivedKey.toString("hex");

    // Use timing-safe comparison
    return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(derivedHex, "hex"));
  } catch {
    return false;
  }
}
