import React, { useEffect, useState, useRef } from 'react'
import { fetchOrderbook } from '../hooks/useMarkets'

function sortedEntries(obj, desc = true) {
  if (!obj) return []
  return Object.entries(obj)
    .map(([price, qty]) => ({ price: parseFloat(price), qty }))
    .sort((a, b) => desc ? b.price - a.price : a.price - b.price)
    .slice(0, 10)
}

function PriceRow({ price, qty, side, maxQty }) {
  const pct = maxQty > 0 ? (qty / maxQty) * 100 : 0
  return (
    <div className="relative flex items-center justify-between text-[10px] font-mono py-0.5 px-2 group">
      <div
        className={`absolute inset-0 opacity-20 ${side === 'yes' ? 'bg-accent-green' : 'bg-accent-red'}`}
        style={{ width: `${pct}%`, left: side === 'yes' ? 'auto' : '0', right: side === 'yes' ? '0' : 'auto' }}
      />
      <span className={`relative z-10 ${side === 'yes' ? 'text-accent-green' : 'text-accent-red'}`}>
        {(price * 100).toFixed(1)}¢
      </span>
      <span className="relative z-10 text-slate-400">{qty.toLocaleString()}</span>
    </div>
  )
}

export default function Orderbook({ ticker, status }) {
  const [book, setBook] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const pollRef = useRef(null)

  useEffect(() => {
    if (status !== 'active') {
      setLoading(false)
      setError(`Orderbook unavailable — market is ${status}`)
      return
    }

    const load = async () => {
      try {
        const data = await fetchOrderbook(ticker)
        if (!data) { setError('Orderbook unavailable'); return }
        setBook(data)
        setError(null)
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }

    load()
    pollRef.current = setInterval(load, 10000)
    return () => clearInterval(pollRef.current)
  }, [ticker, status])

  if (loading) return (
    <div className="p-4 text-center text-slate-600 text-xs">Loading orderbook…</div>
  )

  if (error) return (
    <div className="p-4 text-center text-slate-600 text-xs">{error}</div>
  )

  const yesBids = sortedEntries(book?.yes_bids, true)
  const noBids = sortedEntries(book?.no_bids, true)
  const maxYes = yesBids.length ? Math.max(...yesBids.map(e => e.qty)) : 1
  const maxNo = noBids.length ? Math.max(...noBids.map(e => e.qty)) : 1

  return (
    <div className="grid grid-cols-2 gap-0 h-full text-[10px]">
      {/* YES side */}
      <div className="border-r border-terminal-border">
        <div className="flex items-center justify-between px-2 py-1.5 border-b border-terminal-border bg-green-900/10">
          <span className="text-accent-green font-semibold uppercase tracking-wider text-[9px]">YES Bids</span>
          <span className="text-slate-600">Qty</span>
        </div>
        <div className="overflow-y-auto">
          {yesBids.length ? yesBids.map((row, i) => (
            <PriceRow key={i} price={row.price} qty={row.qty} side="yes" maxQty={maxYes} />
          )) : (
            <div className="p-2 text-slate-600">No bids</div>
          )}
        </div>
      </div>

      {/* NO side */}
      <div>
        <div className="flex items-center justify-between px-2 py-1.5 border-b border-terminal-border bg-red-900/10">
          <span className="text-accent-red font-semibold uppercase tracking-wider text-[9px]">NO Bids</span>
          <span className="text-slate-600">Qty</span>
        </div>
        <div className="overflow-y-auto">
          {noBids.length ? noBids.map((row, i) => (
            <PriceRow key={i} price={row.price} qty={row.qty} side="no" maxQty={maxNo} />
          )) : (
            <div className="p-2 text-slate-600">No bids</div>
          )}
        </div>
      </div>
    </div>
  )
}
