/**
 * Verifies Apple's signed StoreKit 2 payloads (transaction JWS from the app,
 * and App Store Server Notifications V2) WITHOUT calling any Apple API and
 * without any third-party JOSE library — just Node's built-in `crypto`.
 *
 * Every payload Apple hands out here is a JWS Compact Serialization
 * (`header.payload.signature`, base64url) signed with ES256, whose header
 * carries an `x5c` certificate chain. Verifying it means:
 *   1. Each cert in the chain is currently valid (not expired/not-yet-valid).
 *   2. Each cert was actually signed by the next one up the chain.
 *   3. The chain terminates at Apple's real Root CA — not merely "a"
 *      self-signed certificate that happens to say "Apple" in the subject.
 *   4. The signature over `header.payload` verifies against the LEAF
 *      cert's public key.
 * Only after all four hold is the decoded JSON payload trustworthy. This is
 * the same trust model Apple's own server libraries implement; we just don't
 * pull in a dependency to do four calls to node:crypto.
 *
 * Used by BOTH /api/iap/verify (client-submitted transaction JWS) and
 * /api/iap/notifications (Apple's server-to-server push) — same signature
 * scheme, same trust anchor, different payload shape.
 */

import { X509Certificate, verify as cryptoVerify } from 'node:crypto'

// Apple Root CA - G3 — fetched 2026-08-03 from
// https://www.apple.com/certificateauthority/AppleRootCA-G3.cer (Apple's own
// published certificate authority page), valid 2014-04-30 through
// 2039-04-30. SHA-256 fingerprint 63:34:3A:BF:B8:9A:6A:03:EB:B5:7E:9B:3F:5F:
// A7:BE:7C:4F:5C:75:6F:30:17:B3:A8:C4:88:C3:65:3E:91:79 — this is the trust
// anchor. A JWS whose x5c chain does not terminate here is rejected
// regardless of anything else about it.
const APPLE_ROOT_CA_G3_PEM = `-----BEGIN CERTIFICATE-----
MIICQzCCAcmgAwIBAgIILcX8iNLFS5UwCgYIKoZIzj0EAwMwZzEbMBkGA1UEAwwS
QXBwbGUgUm9vdCBDQSAtIEczMSYwJAYDVQQLDB1BcHBsZSBDZXJ0aWZpY2F0aW9u
IEF1dGhvcml0eTETMBEGA1UECgwKQXBwbGUgSW5jLjELMAkGA1UEBhMCVVMwHhcN
MTQwNDMwMTgxOTA2WhcNMzkwNDMwMTgxOTA2WjBnMRswGQYDVQQDDBJBcHBsZSBS
b290IENBIC0gRzMxJjAkBgNVBAsMHUFwcGxlIENlcnRpZmljYXRpb24gQXV0aG9y
aXR5MRMwEQYDVQQKDApBcHBsZSBJbmMuMQswCQYDVQQGEwJVUzB2MBAGByqGSM49
AgEGBSuBBAAiA2IABJjpLz1AcqTtkyJygRMc3RCV8cWjTnHcFBbZDuWmBSp3ZHtf
TjjTuxxEtX/1H7YyYl3J6YRbTzBPEVoA/VhYDKX1DyxNB0cTddqXl5dvMVztK517
IDvYuVTZXpmkOlEKMaNCMEAwHQYDVR0OBBYEFLuw3qFYM4iapIqZ3r6966/ayySr
MA8GA1UdEwEB/wQFMAMBAf8wDgYDVR0PAQH/BAQDAgEGMAoGCCqGSM49BAMDA2gA
MGUCMQCD6cHEFl4aXTQY2e3v9GwOAEZLuN+yRhHFD/3meoyhpmvOwgPUnPWTxnS4
at+qIxUCMG1mihDK1A3UT82NQz60imOlM27jbdoXt2QfyFMm+YhidDkLF1vLUagM
6BgD56KyKA==
-----END CERTIFICATE-----`

export class AppleJwsError extends Error {}

function b64urlToBuffer(seg: string): Buffer {
  return Buffer.from(seg.replace(/-/g, '+').replace(/_/g, '/'), 'base64')
}

/**
 * Decodes AND verifies a single Apple JWS Compact Serialization string.
 * Throws AppleJwsError on any failure — callers must treat that exactly like
 * "not a real Apple transaction" and never fall back to trusting the
 * unverified payload.
 */
export function verifyAppleSignedPayload<T = Record<string, unknown>>(jws: string): T {
  if (typeof jws !== 'string' || jws.length === 0) {
    throw new AppleJwsError('Empty or missing signed payload')
  }
  const parts = jws.split('.')
  if (parts.length !== 3) {
    throw new AppleJwsError('Malformed JWS — expected 3 dot-separated segments')
  }
  const [headerB64, payloadB64, sigB64] = parts

  let header: { alg?: string; x5c?: string[] }
  try {
    header = JSON.parse(b64urlToBuffer(headerB64).toString('utf8'))
  } catch {
    throw new AppleJwsError('JWS header is not valid JSON')
  }
  if (header.alg !== 'ES256') {
    throw new AppleJwsError(`Unsupported JWS alg "${header.alg}" — expected ES256`)
  }
  if (!Array.isArray(header.x5c) || header.x5c.length === 0) {
    throw new AppleJwsError('JWS header missing x5c certificate chain')
  }

  let certs: X509Certificate[]
  try {
    certs = header.x5c.map((c) => new X509Certificate(Buffer.from(c, 'base64')))
  } catch {
    throw new AppleJwsError('Could not parse a certificate in the x5c chain')
  }

  const now = new Date()
  for (const cert of certs) {
    if (now < new Date(cert.validFrom) || now > new Date(cert.validTo)) {
      throw new AppleJwsError('A certificate in the chain is outside its validity window')
    }
  }

  // Each cert (except the last) must be signed by the NEXT cert up the chain.
  for (let i = 0; i < certs.length - 1; i++) {
    if (!certs[i].verify(certs[i + 1].publicKey)) {
      throw new AppleJwsError('Certificate chain is broken — a link was not signed by the next certificate up')
    }
  }

  // The chain must terminate at Apple's real, pinned root.
  const root = new X509Certificate(APPLE_ROOT_CA_G3_PEM)
  const top = certs[certs.length - 1]
  const topIsRootItself = top.fingerprint256 === root.fingerprint256
  if (!topIsRootItself && !top.verify(root.publicKey)) {
    throw new AppleJwsError("Certificate chain does not terminate at Apple's Root CA - G3")
  }

  // Signature over "header.payload", verified against the LEAF cert's key.
  // JWS ES256 signatures are raw R||S (64 bytes), not DER — dsaEncoding
  // 'ieee-p1363' tells Node to expect that raw format instead of DER-wrapped.
  const signingInput = Buffer.from(`${headerB64}.${payloadB64}`, 'ascii')
  const signature = b64urlToBuffer(sigB64)
  const verified = cryptoVerify(
    'sha256',
    signingInput,
    { key: certs[0].publicKey, dsaEncoding: 'ieee-p1363' },
    signature,
  )
  if (!verified) {
    throw new AppleJwsError('JWS signature verification failed')
  }

  try {
    return JSON.parse(b64urlToBuffer(payloadB64).toString('utf8')) as T
  } catch {
    throw new AppleJwsError('JWS payload is not valid JSON')
  }
}

/** Decoded shape of a verified transaction JWS (signedTransactionInfo). */
export interface AppleTransactionPayload {
  transactionId: string
  originalTransactionId: string
  bundleId: string
  productId: string
  subscriptionGroupIdentifier?: string
  purchaseDate: number
  originalPurchaseDate: number
  expiresDate?: number
  quantity?: number
  type: string
  inAppOwnershipType?: string
  signedDate: number
  environment: 'Sandbox' | 'Production'
  transactionReason?: string
  storefront?: string
  storefrontId?: string
  price?: number
  currency?: string
  offerType?: number
  offerDiscountType?: string
  appAccountToken?: string
  revocationDate?: number
  revocationReason?: number
  isUpgraded?: boolean
}

/** Decoded shape of the outer App Store Server Notification V2 envelope. */
export interface AppleNotificationPayload {
  notificationType: string
  subtype?: string
  notificationUUID: string
  data?: {
    appAppleId?: number
    bundleId: string
    bundleVersion?: string
    environment: 'Sandbox' | 'Production'
    signedTransactionInfo?: string
    signedRenewalInfo?: string
    status?: number
  }
  version?: string
  signedDate: number
}

/** Decoded shape of a verified renewal-info JWS (signedRenewalInfo). */
export interface AppleRenewalInfoPayload {
  originalTransactionId: string
  autoRenewProductId?: string
  autoRenewStatus: number
  expirationIntent?: number
  gracePeriodExpiresDate?: number
  isInBillingRetryPeriod?: boolean
  environment: 'Sandbox' | 'Production'
  signedDate: number
  productId: string
}
