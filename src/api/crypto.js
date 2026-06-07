/**
 * Browser-side AES-256-GCM matching the backend's utils/crypto.js.
 *
 * Key   = SHA-256(REACT_APP_SECRET_KEY) → 32 bytes.
 * Token = base64( iv[12] | authTag[16] | ciphertext ).
 *
 * Two interchangeable engines, both emitting the identical iv|tag|ct layout:
 *   1. Native Web Crypto (window.crypto.subtle) — used whenever available.
 *   2. Pure-JS (@noble/ciphers + @noble/hashes) — fallback for non-secure
 *      contexts (http:// on a LAN IP) where `crypto.subtle` is undefined.
 */
import { gcm } from "@noble/ciphers/aes";
import { sha256 } from "@noble/hashes/sha256";

const SECRET = process.env.REACT_APP_SECRET_KEY || "";
const IV_LEN = 12;
const TAG_LEN = 16;

function getSubtle() {
  return (
    (typeof window !== "undefined" && window.crypto && window.crypto.subtle) ||
    (typeof globalThis !== "undefined" &&
      globalThis.crypto &&
      globalThis.crypto.subtle) ||
    null
  );
}

function randomBytes(n) {
  const out = new Uint8Array(n);
  const c =
    (typeof window !== "undefined" && window.crypto) ||
    (typeof globalThis !== "undefined" && globalThis.crypto) ||
    null;
  if (c && c.getRandomValues) c.getRandomValues(out);
  else for (let i = 0; i < n; i++) out[i] = Math.floor(Math.random() * 256);
  return out;
}

let subtleKeyPromise = null;
let rawKey = null;

function getSubtleKey(subtle) {
  if (!subtleKeyPromise) {
    const enc = new TextEncoder().encode(SECRET);
    subtleKeyPromise = subtle
      .digest("SHA-256", enc)
      .then((hash) =>
        subtle.importKey("raw", hash, { name: "AES-GCM" }, false, [
          "encrypt",
          "decrypt",
        ])
      )
      .catch((e) => {
        subtleKeyPromise = null;
        throw e;
      });
  }
  return subtleKeyPromise;
}

function getRawKey() {
  if (!rawKey) rawKey = sha256(new TextEncoder().encode(SECRET));
  return rawKey;
}

const b64encode = (bytes) => {
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return window.btoa(bin);
};

const b64decode = (str) => {
  const bin = window.atob(str);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
};

export const cryptoEnabled = () => SECRET.length > 0;

export async function encryptPayload(payload) {
  const iv = randomBytes(IV_LEN);
  const plaintext = new TextEncoder().encode(JSON.stringify(payload ?? null));
  const subtle = getSubtle();

  let buf; // ct | tag
  if (subtle) {
    const key = await getSubtleKey(subtle);
    buf = new Uint8Array(
      await subtle.encrypt({ name: "AES-GCM", iv }, key, plaintext)
    );
  } else {
    buf = gcm(getRawKey(), iv).encrypt(plaintext);
  }

  const ct = buf.subarray(0, buf.length - TAG_LEN);
  const tag = buf.subarray(buf.length - TAG_LEN);
  const out = new Uint8Array(IV_LEN + TAG_LEN + ct.length);
  out.set(iv, 0);
  out.set(tag, IV_LEN);
  out.set(ct, IV_LEN + TAG_LEN);
  return b64encode(out);
}

export async function decryptPayload(token) {
  const all = b64decode(token);
  const iv = all.subarray(0, IV_LEN);
  const tag = all.subarray(IV_LEN, IV_LEN + TAG_LEN);
  const ct = all.subarray(IV_LEN + TAG_LEN);

  const combined = new Uint8Array(ct.length + TAG_LEN);
  combined.set(ct, 0);
  combined.set(tag, ct.length);

  const subtle = getSubtle();
  let plain;
  if (subtle) {
    const key = await getSubtleKey(subtle);
    plain = new Uint8Array(
      await subtle.decrypt({ name: "AES-GCM", iv }, key, combined)
    );
  } else {
    plain = gcm(getRawKey(), iv).decrypt(combined);
  }
  return JSON.parse(new TextDecoder().decode(plain));
}
