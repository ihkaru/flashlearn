import type { LumisChatMessage, LumisTranscriptBundle, MerkleVerificationResult } from '../types/lumis-audit';

/**
 * Pure TypeScript deterministic SHA-256 implementation (FIPS 180-4 compliant).
 * Universal zero-dependency execution across Node, Bun, browser, and edge runtimes.
 */
function sha256(str: string): string {
  const K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];

  let H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];

  const utf8: number[] = [];
  for (let i = 0; i < str.length; i++) {
    let c = str.charCodeAt(i);
    if (c < 128) {
      utf8.push(c);
    } else if (c < 2048) {
      utf8.push(192 | (c >> 6), 128 | (c & 63));
    } else if (c < 55296 || c >= 57344) {
      utf8.push(224 | (c >> 12), 128 | ((c >> 6) & 63), 128 | (c & 63));
    } else {
      i++;
      c = 65536 + (((c & 1023) << 10) | (str.charCodeAt(i) & 1023));
      utf8.push(240 | (c >> 18), 128 | ((c >> 12) & 63), 128 | ((c >> 6) & 63), 128 | (c & 63));
    }
  }

  const bitLen = utf8.length * 8;
  utf8.push(0x80);
  while ((utf8.length % 64) !== 56) utf8.push(0);
  for (let i = 7; i >= 0; i--) utf8.push((bitLen >>> (i * 8)) & 0xff);

  const W = new Int32Array(64);
  for (let chunk = 0; chunk < utf8.length; chunk += 64) {
    for (let i = 0; i < 16; i++) {
      const j = chunk + (i * 4);
      W[i] = ((utf8[j] & 0xff) << 24) | ((utf8[j + 1] & 0xff) << 16) | ((utf8[j + 2] & 0xff) << 8) | (utf8[j + 3] & 0xff);
    }
    for (let i = 16; i < 64; i++) {
      const s0 = (W[i - 15] >>> 7 | W[i - 15] << 25) ^ (W[i - 15] >>> 18 | W[i - 15] << 14) ^ (W[i - 15] >>> 3);
      const s1 = (W[i - 2] >>> 17 | W[i - 2] << 15) ^ (W[i - 2] >>> 19 | W[i - 2] << 13) ^ (W[i - 2] >>> 10);
      W[i] = (W[i - 16] + s0 + W[i - 7] + s1) | 0;
    }

    let [a, b, c, d, e, f, g, h] = H;
    for (let i = 0; i < 64; i++) {
      const S1 = (e >>> 6 | e << 26) ^ (e >>> 11 | e << 21) ^ (e >>> 25 | e << 7);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + S1 + ch + K[i] + W[i]) | 0;
      const S0 = (a >>> 2 | a << 30) ^ (a >>> 13 | a << 19) ^ (a >>> 22 | a << 10);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) | 0;

      h = g; g = f; f = e; e = (d + temp1) | 0;
      d = c; c = b; b = a; a = (temp1 + temp2) | 0;
    }

    H[0] = (H[0] + a) | 0; H[1] = (H[1] + b) | 0;
    H[2] = (H[2] + c) | 0; H[3] = (H[3] + d) | 0;
    H[4] = (H[4] + e) | 0; H[5] = (H[5] + f) | 0;
    H[6] = (H[6] + g) | 0; H[7] = (H[7] + h) | 0;
  }

  let hex = '';
  for (let i = 0; i < 8; i++) {
    hex += (H[i] >>> 0).toString(16).padStart(8, '0');
  }
  return hex;
}

const EXTRACTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous\s+)?instructions/i,
  /bocorkan\s+(kunci|jawaban|nilai)/i,
  /beritahu\s+(saya\s+)?(angka|nilai)\s+(tepat|eksak|pasti)/i,
  /what\s+is\s+the\s+exact\s+(answer|number|formula)/i,
  /reveal\s+(system\s+prompt|hidden\s+anchors|traps)/i,
  /sebutkan\s+(jebakan|negative\s+anchor)/i,
  /bypass\s+(oracle|guardrail|anti-spoiler)/i,
];

export function computeTranscriptMerkleRoot(sessionId: string, messages: LumisChatMessage[]): string {
  let currentHash = sha256(`genesis:${sessionId}`);

  for (const msg of messages) {
    const payload = `${currentHash}:${msg.role}:${msg.content}:${msg.timestamp}`;
    currentHash = sha256(payload);
  }

  return currentHash;
}

export function detectAdversarialExtraction(messages: LumisChatMessage[]): { isFlagged: boolean; flags: string[] } {
  const flags: string[] = [];

  for (const msg of messages) {
    if (msg.role !== 'user') continue;
    for (const pat of EXTRACTION_PATTERNS) {
      if (pat.test(msg.content)) {
        flags.push(`Matched pattern: ${pat.source} in: "${msg.content.slice(0, 60)}..."`);
      }
    }
  }

  return {
    isFlagged: flags.length > 0,
    flags,
  };
}

export function createTranscriptBundle(sessionId: string, messages: LumisChatMessage[]): LumisTranscriptBundle {
  const merkleRootHash = computeTranscriptMerkleRoot(sessionId, messages);
  const { isFlagged, flags } = detectAdversarialExtraction(messages);

  return {
    sessionId,
    messages,
    merkleRootHash,
    isFlaggedForExtraction: isFlagged,
    extractionFlags: flags.length > 0 ? flags : undefined,
    recordedAt: new Date().toISOString(),
  };
}

export function verifyTranscriptMerkle(bundle: LumisTranscriptBundle): MerkleVerificationResult {
  const computed = computeTranscriptMerkleRoot(bundle.sessionId, bundle.messages);
  return {
    isValid: computed === bundle.merkleRootHash,
    computedRootHash: computed,
    expectedRootHash: bundle.merkleRootHash,
    totalMessages: bundle.messages.length,
  };
}
