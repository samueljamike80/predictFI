import React, { useState, useEffect, useCallback } from 'react'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { CheckCircle, Shield, ExternalLink, Loader, RotateCcw, AlertTriangle, Info } from 'lucide-react'
import { getKycStatus, signAndGetKycLink, getQuote, deserializeTx, pollOrderStatus } from '../services/dflow'
import OrderStatusTracker from './OrderStatusTracker'
import { USDC_MINT } from '../config'

const MAINTENANCE_START = { day: 4, hour: 3 }  // Thursday 3:00 AM ET
const MAINTENANCE_END = { day: 4, hour: 5 }

function isMaintenanceWindow() {
  const now = new Date()
  const day = now.getUTCDay()
  const hour = now.getUTCHours()
  if (day === 4 && hour >= 3 && hour < 5) return true
  return false
}

function getMidPrice(yesAsk, yesBid) {
  const a = parseFloat(yesAsk); const b = parseFloat(yesBid)
  if (!isNaN(a) && !isNaN(b)) return (a + b) / 2
  if (!isNaN(a)) return a
  if (!isNaN(b)) return b
  return null
}

export default function TradingPanel({ market, onClose }) {
  const { publicKey, signTransaction } = useWallet()
  const { connection } = useConnection()

  const [kyc, setKyc] = useState({ loading: true, verified: false })
  const [side, setSide] = useState('yes') // yes | no
  const [amount, setAmount] = useState('')
  const [quote, setQuote] = useState(null)
  const [quoteLoading, setQuoteLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [signature, setSignature] = useState(null)
  const [error, setError] = useState(null)

  const USDC_SETTLE = USDC_MINT
  const accounts = market?.accounts?.[USDC_SETTLE]
  const yesMint = accounts?.yesMint
  const noMint = accounts?.noMint
  const isInitialized = accounts?.isInitialized

  // Check KYC on wallet connect
  useEffect(() => {
    if (!publicKey) {
      setKyc({ loading: false, verified: false })
      return
    }
    setKyc({ loading: true, verified: false })
    getKycStatus(publicKey.toBase58())
      .then(v => setKyc({ loading: false, verified: v }))
      .catch(() => setKyc({ loading: false, verified: false }))
  }, [publicKey])

  const handleKycVerify = async () => {
    if (!publicKey || !signTransaction) return
    try {
      const link = await signAndGetKycLink({ publicKey, signMessage: async (msg) => {
        // Use wallet.signMessage if available
        const wallet = window.solana || window.solflare
        if (wallet?.signMessage) return wallet.signMessage(msg)
        throw new Error('signMessage not supported')
      }})
      window.open(link, '_blank')
    } catch (e) {
      setError('Could not open KYC flow: ' + e.message)
    }
  }

  const handleRecheck = async () => {
    if (!publicKey) return
    setKyc({ loading: true, verified: false })
    const v = await getKycStatus(publicKey.toBase58())
    setKyc({ loading: false, verified: v })
  }

  // Get quote without wallet (browse mode)
  const fetchBrowseQuote = useCallback(async () => {
    if (!market || !amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      setQuote(null)
      return
    }
    const mint = side === 'yes' ? yesMint : noMint
    if (!mint) return
    const rawAmount = Math.round(parseFloat(amount) * 1_000_000)
    setQuoteLoading(true)
    try {
      const q = await getQuote(USDC_SETTLE, mint, rawAmount)
      setQuote(q)
      setError(null)
    } catch (e) {
      setQuote(null)
      setError(e.message)
    } finally {
      setQuoteLoading(false)
    }
  }, [market, amount, side, yesMint, noMint])

  useEffect(() => {
    const t = setTimeout(fetchBrowseQuote, 600)
    return () => clearTimeout(t)
  }, [fetchBrowseQuote])

  const handleTrade = async () => {
    if (!publicKey || !signTransaction) return
    if (!kyc.verified) return
    if (isMaintenanceWindow()) {
      setError('Markets are down for maintenance (Thu 3–5 AM ET). Try again shortly.')
      return
    }
    const mint = side === 'yes' ? yesMint : noMint
    if (!mint) { setError('Market accounts not initialized.'); return }
    const rawAmount = Math.round(parseFloat(amount) * 1_000_000)
    if (rawAmount < 10000) { setError('Minimum order is 0.01 USDC'); return }

    setSubmitting(true)
    setError(null)
    try {
      const order = await getQuote(USDC_SETTLE, mint, rawAmount, publicKey.toBase58(), {
        predictionMarketSlippageBps: 200,
        ...(isInitialized ? {} : { predictionMarketInitPayer: publicKey.toBase58() }),
      })
      if (!order.transaction) throw new Error('No transaction returned from API')
      const tx = deserializeTx(order.transaction)
      const signed = await signTransaction(tx)
      const sig = await connection.sendRawTransaction(signed.serialize(), { skipPreflight: true })
      setSignature(sig)
    } catch (e) {
      setError(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  const midYes = getMidPrice(market?.yesAsk, market?.yesBid)
  const yesPercent = midYes !== null ? (midYes * 100).toFixed(1) : '—'
  const noPercent = midYes !== null ? ((1 - midYes) * 100).toFixed(1) : '—'

  if (signature) {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Order Submitted</h3>
          <button onClick={() => { setSignature(null); setAmount(''); setQuote(null) }} className="text-slate-500 hover:text-white">
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
        <OrderStatusTracker signature={signature} onDone={() => {}} />
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4 overflow-y-auto">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Trade</h3>
        {market && (
          <span className="text-slate-500 font-mono text-[10px]">{market.ticker}</span>
        )}
      </div>

      {/* Market info */}
      {market && midYes !== null && (
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-terminal-bg rounded-lg p-3 border border-terminal-border">
            <div className="text-[10px] text-slate-500 mb-1">YES Price</div>
            <div className="text-accent-green font-mono font-bold text-base">{yesPercent}¢</div>
          </div>
          <div className="bg-terminal-bg rounded-lg p-3 border border-terminal-border">
            <div className="text-[10px] text-slate-500 mb-1">NO Price</div>
            <div className="text-accent-red font-mono font-bold text-base">{noPercent}¢</div>
          </div>
        </div>
      )}

      {/* KYC Status */}
      {!publicKey ? (
        <div className="bg-terminal-bg rounded-lg p-3 border border-terminal-border text-center space-y-3">
          <p className="text-slate-400 text-xs">Connect your wallet to trade</p>
          <WalletMultiButton />
        </div>
      ) : kyc.loading ? (
        <div className="flex items-center gap-2 p-3 bg-terminal-bg rounded-lg border border-terminal-border text-slate-500 text-xs">
          <Loader className="w-3.5 h-3.5 animate-spin" />
          Checking identity…
        </div>
      ) : !kyc.verified ? (
        <div className="bg-amber-900/20 border border-amber-700/30 rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold">
            <Shield className="w-3.5 h-3.5" />
            Identity Verification Required
          </div>
          <p className="text-slate-400 text-[10px] leading-relaxed">
            Prediction market trading requires KYC. Click below to verify your identity on dFlow.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleKycVerify}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              Verify Identity
            </button>
            <button
              onClick={handleRecheck}
              className="px-3 py-2 rounded-lg bg-terminal-hover border border-terminal-border text-slate-400 hover:text-white text-xs transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 p-2.5 bg-green-900/20 border border-green-700/30 rounded-lg text-accent-green text-xs">
          <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
          Identity Verified
        </div>
      )}

      {/* Side selector */}
      <div className="grid grid-cols-2 gap-2">
        {['yes', 'no'].map(s => (
          <button
            key={s}
            onClick={() => setSide(s)}
            className={`py-2.5 rounded-lg font-bold text-sm uppercase tracking-wider transition-all ${
              side === s
                ? s === 'yes'
                  ? 'bg-accent-green/20 text-accent-green border border-accent-green/40'
                  : 'bg-accent-red/20 text-accent-red border border-accent-red/40'
                : 'bg-terminal-bg border border-terminal-border text-slate-500 hover:text-slate-300'
            }`}
          >
            {s === 'yes' ? `YES ${yesPercent}¢` : `NO ${noPercent}¢`}
          </button>
        ))}
      </div>

      {/* Amount */}
      <div>
        <label className="text-[10px] text-slate-500 uppercase tracking-wider mb-1 block">Amount (USDC)</label>
        <div className="relative">
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="0.00"
            min="0.01"
            step="0.01"
            className="w-full bg-terminal-bg border border-terminal-border rounded-lg px-3 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-dflow/60 pr-14"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-mono">USDC</span>
        </div>
        {/* Quick amounts */}
        <div className="flex gap-1.5 mt-2">
          {[1, 5, 10, 50, 100].map(v => (
            <button
              key={v}
              onClick={() => setAmount(v.toString())}
              className="px-2 py-0.5 rounded bg-terminal-hover border border-terminal-border text-slate-400 hover:text-white text-[10px] font-mono transition-colors"
            >
              ${v}
            </button>
          ))}
        </div>
      </div>

      {/* Quote */}
      {quoteLoading && (
        <div className="flex items-center gap-2 text-slate-500 text-xs">
          <Loader className="w-3 h-3 animate-spin" />
          Getting quote…
        </div>
      )}
      {quote && !quoteLoading && (
        <div className="bg-terminal-bg rounded-lg p-3 border border-terminal-border space-y-2">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider">Quote</div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">Contracts</span>
            <span className="text-white font-mono">
              {quote.outAmount ? (parseInt(quote.outAmount) / 1e6).toFixed(2) : '—'}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">Price Impact</span>
            <span className={`font-mono ${parseFloat(quote.priceImpactPct) > 2 ? 'text-accent-red' : 'text-slate-300'}`}>
              {quote.priceImpactPct ? `${parseFloat(quote.priceImpactPct).toFixed(2)}%` : '—'}
            </span>
          </div>
          {quote.routePlan?.[0]?.venue && (
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Route</span>
              <span className="text-slate-300 font-mono">{quote.routePlan[0].venue}</span>
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-900/20 border border-red-700/30 rounded-lg text-accent-red text-xs">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        onClick={handleTrade}
        disabled={!publicKey || !kyc.verified || !amount || parseFloat(amount) <= 0 || submitting || !market}
        className={`w-full py-3 rounded-xl font-bold text-sm uppercase tracking-wider transition-all ${
          side === 'yes'
            ? 'bg-gradient-to-r from-accent-green to-emerald-500 hover:from-emerald-400 hover:to-emerald-500 text-black disabled:opacity-40 disabled:cursor-not-allowed'
            : 'bg-gradient-to-r from-accent-red to-rose-600 hover:from-rose-400 hover:to-rose-600 text-white disabled:opacity-40 disabled:cursor-not-allowed'
        }`}
      >
        {submitting ? (
          <span className="flex items-center justify-center gap-2">
            <Loader className="w-4 h-4 animate-spin" />
            Submitting…
          </span>
        ) : (
          `Buy ${side.toUpperCase()} ${amount ? `— $${amount}` : ''}`
        )}
      </button>

      <div className="text-[10px] text-slate-600 flex items-center gap-1.5">
        <Info className="w-3 h-3 flex-shrink-0" />
        Async execution via dFlow CLPs. Orders settle asynchronously after submission.
      </div>
    </div>
  )
}
