import React, { useState } from 'react'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { Activity, TrendingDown, TrendingUp, Loader, AlertTriangle, CheckCircle, ExternalLink, Info } from 'lucide-react'
import useKamino from '../hooks/useKamino'
import { getBorrowTransaction, getDepositTransaction, getRepayTransaction, deserializeTx, confirmWithPolling } from '../services/kamino'

function HealthBar({ value }) {
  if (value === null) return <span className="text-slate-600 font-mono text-xs">—</span>
  const color = value > 2 ? 'text-accent-green' : value > 1.2 ? 'text-accent-amber' : 'text-accent-red'
  return <span className={`font-mono font-bold text-sm ${color}`}>{value.toFixed(2)}</span>
}

function PositionCard({ position, onBorrow, onRepay, onDeposit, submitting }) {
  const [action, setAction] = useState(null)
  const [amount, setAmount] = useState('')

  const handleAction = async () => {
    if (!amount || parseFloat(amount) <= 0) return
    await (action === 'borrow' ? onBorrow : action === 'repay' ? onRepay : onDeposit)(position.reserve, amount)
    setAction(null)
    setAmount('')
  }

  return (
    <div className="panel-glow rounded-xl p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <img src={position.icon} alt={position.token} className="w-8 h-8 rounded-full border border-terminal-border" />
          <div>
            <div className="text-sm font-bold text-white">{position.token}</div>
            {position.isMock && <div className="text-[10px] text-dflow-light">Demo Data</div>}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-slate-500">Health Factor</div>
          <HealthBar value={position.healthFactor} />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-terminal-bg rounded-lg p-2.5 border border-terminal-border">
          <div className="text-[10px] text-slate-500 mb-1">Deposited</div>
          <div className="text-xs font-mono font-semibold text-white">
            {position.depositedAmount.toLocaleString()} <span className="text-slate-500">{position.token}</span>
          </div>
          <div className="text-[10px] text-accent-green mt-0.5">{position.apy}% APY</div>
        </div>
        <div className="bg-terminal-bg rounded-lg p-2.5 border border-terminal-border">
          <div className="text-[10px] text-slate-500 mb-1">Borrowed</div>
          <div className="text-xs font-mono font-semibold text-white">
            {position.borrowedAmount.toLocaleString()} <span className="text-slate-500">{position.token}</span>
          </div>
          <div className="text-[10px] text-accent-red mt-0.5">{position.borrowApr}% APR</div>
        </div>
        <div className="bg-terminal-bg rounded-lg p-2.5 border border-terminal-border">
          <div className="text-[10px] text-slate-500 mb-1">Available</div>
          <div className="text-xs font-mono font-semibold text-accent-blue">
            {position.borrowCapacity.toLocaleString()} <span className="text-slate-500 text-[10px]">{position.token}</span>
          </div>
          <div className="text-[10px] text-slate-600 mt-0.5">{position.ltv.toFixed(1)}% LTV</div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {['borrow', 'repay', 'deposit'].map(a => (
          <button
            key={a}
            onClick={() => setAction(action === a ? null : a)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
              action === a
                ? a === 'borrow'
                  ? 'bg-dflow/20 text-dflow-light border border-dflow/40'
                  : a === 'repay'
                  ? 'bg-accent-green/20 text-accent-green border border-accent-green/40'
                  : 'bg-accent-blue/20 text-accent-blue border border-accent-blue/40'
                : 'bg-terminal-bg border border-terminal-border text-slate-500 hover:text-slate-300'
            }`}
          >
            {a}
          </button>
        ))}
      </div>

      {action && (
        <div className="space-y-2">
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder={`Amount in ${position.token}`}
            className="w-full bg-terminal-bg border border-terminal-border rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-dflow/60"
          />
          <button
            onClick={handleAction}
            disabled={submitting || !amount}
            className="w-full py-2 rounded-lg bg-dflow hover:bg-dflow-light text-white text-sm font-semibold uppercase tracking-wider transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? <Loader className="w-4 h-4 animate-spin mx-auto" /> : `Confirm ${action}`}
          </button>
        </div>
      )}
    </div>
  )
}

export default function KaminoView() {
  const { publicKey, signTransaction, connected } = useWallet()
  const { connection } = useConnection()
  const { positions, loading, error, refresh } = useKamino(publicKey?.toBase58())
  const [submitting, setSubmitting] = useState(false)
  const [txResult, setTxResult] = useState(null)
  const [txError, setTxError] = useState(null)

  const executeTx = async (txBase64) => {
    const tx = deserializeTx(txBase64)
    const signed = await signTransaction(tx)
    const sig = await connection.sendRawTransaction(signed.serialize(), { skipPreflight: true })
    await confirmWithPolling(connection, sig)
    return sig
  }

  const handleBorrow = async (reserve, amount) => {
    if (!publicKey || !connected) return
    setSubmitting(true); setTxError(null)
    try {
      const txB64 = await getBorrowTransaction(publicKey.toBase58(), reserve, amount)
      const sig = await executeTx(txB64)
      setTxResult({ action: 'borrow', sig })
      refresh()
    } catch (e) { setTxError(e.message) } finally { setSubmitting(false) }
  }

  const handleRepay = async (reserve, percentage = 100) => {
    if (!publicKey || !connected) return
    setSubmitting(true); setTxError(null)
    try {
      const txB64 = await getRepayTransaction(publicKey.toBase58(), reserve, percentage)
      const sig = await executeTx(txB64)
      setTxResult({ action: 'repay', sig })
      refresh()
    } catch (e) { setTxError(e.message) } finally { setSubmitting(false) }
  }

  const handleDeposit = async (reserve, amount) => {
    if (!publicKey || !connected) return
    setSubmitting(true); setTxError(null)
    try {
      const txB64 = await getDepositTransaction(publicKey.toBase58(), reserve, amount)
      const sig = await executeTx(txB64)
      setTxResult({ action: 'deposit', sig })
      refresh()
    } catch (e) { setTxError(e.message) } finally { setSubmitting(false) }
  }

  const totalDeposited = positions.reduce((acc, p) => {
    if (p.token === 'USDC') return acc + p.depositedAmount
    return acc
  }, 0)

  const totalBorrowed = positions.reduce((acc, p) => {
    if (p.token === 'USDC') return acc + p.borrowedAmount
    return acc
  }, 0)

  return (
    <div className="flex flex-col h-full overflow-y-auto p-4 space-y-4 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-accent-blue" />
            Kamino Leverage
          </h2>
          <p className="text-slate-500 text-xs mt-0.5">
            Borrow USDC against your collateral to fund larger prediction market positions
          </p>
        </div>
        {!publicKey && <WalletMultiButton />}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="panel-glow rounded-xl p-3 text-center">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider">Total Deposited</div>
          <div className="text-lg font-mono font-bold text-white mt-1">
            ${totalDeposited.toLocaleString()}
          </div>
        </div>
        <div className="panel-glow rounded-xl p-3 text-center">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider">Total Borrowed</div>
          <div className="text-lg font-mono font-bold text-accent-red mt-1">
            ${totalBorrowed.toLocaleString()}
          </div>
        </div>
        <div className="panel-glow rounded-xl p-3 text-center">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider">Net Equity</div>
          <div className="text-lg font-mono font-bold text-accent-green mt-1">
            ${(totalDeposited - totalBorrowed).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Strategy tip */}
      <div className="bg-dflow/5 border border-dflow/20 rounded-xl p-3 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-dflow-light flex-shrink-0 mt-0.5" />
        <div className="text-xs text-slate-400 leading-relaxed">
          <span className="text-white font-semibold">Leveraged Prediction Strategy:</span> Deposit collateral
          on Kamino → Borrow USDC → Use borrowed USDC to buy YES/NO tokens on prediction markets.
          Keep health factor &gt;1.5 to avoid liquidation.
        </div>
      </div>

      {/* Tx result */}
      {txResult && (
        <div className="flex items-center gap-2 p-3 bg-green-900/20 border border-green-700/30 rounded-xl text-accent-green text-xs">
          <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="capitalize">{txResult.action} confirmed!</span>
          <a href={`https://solscan.io/tx/${txResult.sig}`} target="_blank" rel="noopener noreferrer" className="ml-auto text-slate-400 hover:text-white">
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}

      {txError && (
        <div className="flex items-center gap-2 p-3 bg-red-900/20 border border-red-700/30 rounded-xl text-accent-red text-xs">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
          {txError}
        </div>
      )}

      {/* Positions */}
      {loading ? (
        <div className="text-center py-8 text-slate-600 text-sm">
          <Loader className="w-6 h-6 animate-spin mx-auto mb-2" />
          Loading positions…
        </div>
      ) : (
        <div className="space-y-4">
          {positions.map((p, i) => (
            <PositionCard
              key={p.reserve || i}
              position={p}
              onBorrow={handleBorrow}
              onRepay={handleRepay}
              onDeposit={handleDeposit}
              submitting={submitting}
            />
          ))}
        </div>
      )}
    </div>
  )
}
