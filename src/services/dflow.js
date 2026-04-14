import { DFLOW_ORDER_API, USDC_MINT } from '../config'
import { VersionedTransaction } from '@solana/web3.js'

export async function getKycStatus(walletAddress) {
  try {
    const res = await fetch(`https://proof.dflow.net/verify/${walletAddress}`)
    if (!res.ok) return false
    const data = await res.json()
    return data.verified === true
  } catch {
    return false
  }
}

export function getKycDeepLink(walletAddress, signature, timestamp) {
  const redirectUri = 'https://predictfi.app'
  return `https://dflow.net/proof?wallet=${walletAddress}&signature=${signature}&timestamp=${timestamp}&redirect_uri=${encodeURIComponent(redirectUri)}`
}

const base58Encode = (bytes) => {
  const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
  let result = ''
  let n = BigInt('0x' + Array.from(bytes, b => b.toString(16).padStart(2, '0')).join(''))
  while (n > 0n) { result = ALPHABET[Number(n % 58n)] + result; n = n / 58n }
  return result
}

export async function signAndGetKycLink(wallet) {
  const timestamp = Date.now().toString()
  const message = 'Proof KYC verification: ' + timestamp
  const encoded = new TextEncoder().encode(message)
  const sig = await wallet.signMessage(encoded)
  const sigB58 = base58Encode(sig)
  return getKycDeepLink(wallet.publicKey.toBase58(), sigB58, timestamp)
}

export async function getQuote(inputMint, outputMint, amountRaw, userPublicKey, options = {}) {
  const params = new URLSearchParams({
    inputMint,
    outputMint,
    amount: amountRaw.toString(),
    slippageBps: 'auto',
    prioritizationFeeLamports: 'auto',
    ...(userPublicKey ? { userPublicKey } : {}),
    ...options,
  })
  const res = await fetch(`${DFLOW_ORDER_API}/order?${params}`)
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || err.message || `DFlow API ${res.status}`)
  }
  return res.json()
}

export async function pollOrderStatus(connection, signature, maxWait = 120000) {
  const start = Date.now()
  while (Date.now() - start < maxWait) {
    try {
      const res = await fetch(`${DFLOW_ORDER_API}/order-status?signature=${signature}`)
      if (res.ok) {
        const data = await res.json()
        if (['closed', 'expired', 'failed'].includes(data.status)) return data
      }
    } catch {}
    // Also poll on-chain status
    try {
      const status = await connection.getSignatureStatus(signature)
      const val = status?.value
      if (val?.confirmationStatus === 'confirmed' || val?.confirmationStatus === 'finalized') {
        if (val.err) return { status: 'failed', error: val.err }
      }
    } catch {}
    await new Promise(r => setTimeout(r, 2500))
  }
  return { status: 'expired' }
}

export function deserializeTx(base64) {
  const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0))
  return VersionedTransaction.deserialize(bytes)
}

export function serializeTx(tx) {
  return Buffer.from(tx.serialize()).toString('base64')
}
