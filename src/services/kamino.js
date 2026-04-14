import { DIALECT_PROXY, KAMINO_MAIN_MARKET, USDC_RESERVE_MAIN } from '../config'
import { VersionedTransaction, Transaction } from '@solana/web3.js'

export async function getBorrowTransaction(walletPublicKey, reserveAddress, amount) {
  const market = KAMINO_MAIN_MARKET
  const res = await fetch(
    `${DIALECT_PROXY}/kamino.dial.to/api/v0/lending/reserve/${market}/${reserveAddress}/borrow?amount=${amount}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'transaction', account: walletPublicKey }),
    }
  )
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || `Kamino API ${res.status}`)
  }
  const data = await res.json()
  return data.transaction
}

export async function getDepositTransaction(walletPublicKey, reserveAddress, amount) {
  const market = KAMINO_MAIN_MARKET
  const res = await fetch(
    `${DIALECT_PROXY}/kamino.dial.to/api/v0/lending/reserve/${market}/${reserveAddress}/deposit?amount=${amount}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'transaction', account: walletPublicKey }),
    }
  )
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || `Kamino API ${res.status}`)
  }
  const data = await res.json()
  return data.transaction
}

export async function getRepayTransaction(walletPublicKey, reserveAddress, percentage = 100) {
  const market = KAMINO_MAIN_MARKET
  const res = await fetch(
    `${DIALECT_PROXY}/kamino.dial.to/api/v0/lending/reserve/${market}/${reserveAddress}/repay?percentage=${percentage}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'transaction', account: walletPublicKey }),
    }
  )
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || `Kamino API ${res.status}`)
  }
  const data = await res.json()
  return data.transaction
}

export function deserializeTx(base64) {
  const buf = Buffer.from(base64, 'base64')
  try {
    return VersionedTransaction.deserialize(buf)
  } catch {
    return Transaction.from(buf)
  }
}

export async function confirmWithPolling(connection, signature, timeout = 60000) {
  const start = Date.now()
  while (Date.now() - start < timeout) {
    const status = await connection.getSignatureStatus(signature)
    const val = status?.value
    if (val?.confirmationStatus === 'confirmed' || val?.confirmationStatus === 'finalized') {
      if (val.err) throw new Error('Transaction failed: ' + JSON.stringify(val.err))
      return val
    }
    await new Promise(r => setTimeout(r, 2000))
  }
  throw new Error('Transaction confirmation timeout')
}
