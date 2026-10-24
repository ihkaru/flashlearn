# Phase 16: Cryptographic Verifiable Credentials & OpenBadges 3.0
**Research Foundation, Cryptographic Standards, and Implementation Specification**
**Standard: October 2026 W3C Verifiable Credentials 2.0 & Data Integrity Ed25519**

---

## 1. Executive Summary & Research Foundation

### 1.1 The Vulnerability of Centralized, Hosted Assertions
Traditional digital badge systems (e.g., Open Badges 2.0) and corporate LMS certificates rely on **hosted assertion URLs**. When an external party (e.g., an audit agency, military command, or hiring organization) wants to verify a candidate's certification:
1. The verifier’s system must make an HTTP `GET` request back to the issuer's centralized server.
2. If the issuer's server suffers downtime, is decommissioned, or sits behind a restricted enterprise firewall or air-gapped network, verification fails completely.
3. The credential is not portable; if the candidate leaves the issuing organization, their credential history is vulnerable to deletion or tampering.

### 1.2 State-of-the-Art Benchmark (October 2026)
In October 2026, the global standard for professional micro-credentials and digital passports has unified under:
- **W3C Verifiable Credentials Data Model v2.0**: The official W3C recommendation for self-describing, cryptographically tamper-evident claims.
- **1EdTech Open Badges 3.0**: Fully aligned with W3C VC 2.0, deprecating hosted JSON in favor of portable cryptographic proofs.
- **W3C Data Integrity EdDSA Cryptosuite 2022 (Ed25519)**: Eliminates heavy transport dependencies (JWT/JOSE overhead) in favor of lightweight, mathematically rigorous Ed25519 elliptic-curve public-key signatures.
- **Offline Decentralized Verification**: A verifier anywhere in the world—even completely disconnected from the internet—can mathematically verify that the candidate's Digital Passport was issued by the certified authority and has not been altered by a single bit.

---

## 2. Mathematical & Cryptographic Formulation

### 2.1 Cryptographic Key Infrastructure
Each workspace or certification authority maintains an Ed25519 keypair:
$$\mathcal{K} = (sk_{\text{workspace}}, pk_{\text{workspace}})$$
- $sk_{\text{workspace}} \in \{0, 1\}^{256}$: The private signing key securely held in Infisical / encrypted database column.
- $pk_{\text{workspace}} \in \{0, 1\}^{256}$: The public key published via `did:web` (e.g., `did:web:flashlearn.dvlpid.my.id:workspaces:pbj-ri#key-1`).

### 2.2 Canonical Transformation & Proof Generation
1. **Document Canonicalization**: The credential document $C$ (excluding the proof) is normalized using standard RDF Dataset Canonicalization (RDFC-1.0):
   $$\mathcal{N} = \text{CanonicalizeRDFC}(C)$$
2. **Cryptographic Hashing**:
   $$H = \text{SHA-256}(\mathcal{N})$$
3. **Ed25519 Digital Signature**:
   $$\sigma = \text{Sign}_{\text{Ed25519}}(sk_{\text{workspace}}, H)$$
4. **Multibase Proof Encoding**: The signature is encoded as a base58-btc multibase string prefixed with `z`:
   $$\text{proofValue} = \text{Base58Btc}(\sigma)$$

### 2.3 Mathematical Verification Protocol
Given a signed credential $(C, \text{proof})$:
1. Extract $pk_{\text{issuer}}$ from `proof.verificationMethod`.
2. Re-compute $H = \text{SHA-256}(\text{CanonicalizeRDFC}(C \setminus \text{proof}))$.
3. Decode signature $\sigma = \text{DecodeBase58Btc}(\text{proof.proofValue})$.
4. Evaluate:
   $$\text{Verify}_{\text{Ed25519}}(pk_{\text{issuer}}, H, \sigma) \in \{ \text{True}, \text{False} \}$$
   *Verification executes in under $0.5\text{ ms}$ on modern hardware without external network calls.*

---

## 3. Architecture & Implementation Plan

### 3.1 Domain Layer (`apps/api/src/domain/`)
1. **Value Object**: `VerifiableCredential20.ts`
   - Validates JSON-LD `@context`, `id`, `type`, `issuer`, `validFrom`, `credentialSubject`, and `proof`.
2. **Entity**: `WorkspaceSigningKey.ts`
   - Represents Ed25519 public key and encrypted private key with key rotation timestamps.
3. **Domain Service**: `W3cCredentialSigner.ts` & `W3cCredentialVerifier.ts`
   - Pure cryptographic implementation utilizing `node:crypto` / Bun native crypto.

### 3.2 Application Layer (`apps/api/src/application/`)
1. **Use Cases**:
   - `IssueVerifiableCredentialUseCase.ts`:
     - Checks that candidate has successfully passed Gate Capstone (Gate 3).
     - Confirms Competency Health Index ($R(t) \ge 0.85$).
     - Signs and issues standard W3C VC 2.0 / OpenBadges 3.0 document.
   - `VerifyVerifiableCredentialUseCase.ts`:
     - Validates cryptographic proof, issuer identity, expiration, and revocation status.
2. **Key Management Use Case**: `RotateWorkspaceKeysUseCase.ts`.

### 3.3 Persistence & Infrastructure Layer (`apps/api/src/infrastructure/`)
1. **Prisma Schema Update**:
   ```prisma
   model WorkspaceKeypair {
     id                 String    @id @default(uuid())
     workspaceId        String    @unique
     publicKeyMultibase String
     encryptedPrivateKey String
     didIdentifier      String    @unique
     createdAt          DateTime  @default(now())
   }

   model IssuedCredential {
     id                 String    @id // urn:uuid:...
     gateId             String
     userId             String
     vcPayloadJson      Json
     signatureHex       String
     status             String    // ACTIVE, REVOKED, DRIFT_SUSPENDED
     issuedAt           DateTime  @default(now())
     revokedAt          DateTime?

     @@index([userId])
     @@index([gateId])
   }
   ```

### 3.4 CLI Interface (`@flashlearn/cli`)
1. **Verifiable Credential Commands**:
   ```bash
   # Issue an offline-verifiable W3C VC 2.0 for a certified candidate
   flashlearn gate issue-vc \
     --gate-id <gate-id> \
     --user-id <user-id> \
     --output ./passport-vc.json

   # Verify any W3C VC 2.0 file offline (zero network connection required)
   flashlearn gate verify-vc --file ./passport-vc.json
   ```

---

## 4. Verification & Testing Gauntlet

### 4.1 Automated Hermetic Test Cases (`apps/api/tests/verifiable_credentials.test.ts`)
1. **RED -> GREEN Case 1 (Cryptographic Issuance & Verification)**:
   - Generate test Ed25519 keypair.
   - Issue W3C VC 2.0 credential for Gate 3 Capstone pass.
   - Assert: `verifyVC(credential) === true`.
2. **RED -> GREEN Case 2 (Tamper Detection)**:
   - Modify a single character in the candidate's name or gate criteria inside the JSON.
   - Assert: `verifyVC(tamperedCredential) === false` with `SIGNATURE_MISMATCH`.
3. **RED -> GREEN Case 3 (Drift Suspension Invariant)**:
   - Attempt to issue VC when learner's Competency Health Index $R(t) < 0.85$.
   - Assert: Issuance blocked with typed domain error `COMPETENCY_DRIFT_UNSTABLE`.

### 4.2 Quality & SRP Verification
- Run static SRP analyzer: `bun run lint:srp`.
- Ensure zero external heavy Web3/blockchain dependencies; use lightweight native Ed25519 crypto.
