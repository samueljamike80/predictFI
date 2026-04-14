import React from 'react'
import { TrendingUp, TrendingDown, Bell, BellOff, ChevronRight, Clock } from 'lucide-react'

function getMidPrice(yesAsk, yesBid) {
  const a = parseFloat(yesAsk)
  const b = parseFloat(yesBid)
  if (!isNaN(a) && !isNaN(b)) return (a + b) / 2
  if (!isNaN(a)) return a
  if (!isNaN(b)) return b
  return null
}

function StatusBadge({ status }) {
  const map = {
    active: 'bg-green-900/40 text-accent-green border-green-700/30',
    inactive: 'bg-yellow-900/40 text-amber-400 border-yellow-700/30',
    closed: 'bg-slate-800 text-slate-400 border-slate-700',
    determined: 'bg-blue-900/40 text-accent-blue border-blue-700/30',
    finalized: 'bg-purple-900/40 text-purple-400 border-purple-700/30',
  }
  return (
    <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${map[status] || map.closed}`}>
      {status}
    </span>
  )
}

export default function MarketCard({ market, onSelect, isWatched, onToggleWatch }) {
  const midPrice = getMidPrice(market.yesAsk, market.yesBid)
  const yesPercent = midPrice !== null ? Math.round(midPrice * 100) : null
  const vol = market.volume24h > 0
    ? `$${(market.volume24h / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
    : null
  const totalVol = market.volume > 0
    ? `$${(market.volume / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
    : null

  return (
    <div
      onClick={() => onSelect(market)}
      className="panel-glow rounded-lg p-3 cursor-pointer hover:border-dflow/40 hover:bg-terminal-hover transition-all group animate-fade-in"
    >
      {/* Header */}
      <div className="flex items-start gap-2.5 mb-3">
        {market.imageUrl ? (
          <img
            src={market.imageUrl}
            alt=""
            className="w-8 h-8 rounded object-cover flex-shrink-0 border border-terminal-border"
            onError={e => { e.target.style.display = 'none' }}
          />
        ) : (
          <div className="w-8 h-8 rounded bg-terminal-border flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-1 mb-1">
            <p className="text-slate-200 text-xs font-medium leading-tight line-clamp-2 flex-1">
              {market.title || market.eventTitle || market.ticker}
            </p>
            <button
              onClick={e => { e.stopPropagation(); onToggleWatch(market.ticker, market.title || market.ticker) }}
              className={`flex-shrink-0 p-1 rounded transition-colors ${isWatched ? 'text-accent-amber' : 'text-slate-600 hover:text-slate-400'}`}
            >
              {isWatched ? <Bell className="w-3 h-3" /> : <BellOff className="w-3 h-3" />}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={market.status} />
            <span className="text-slate-600 font-mono text-[10px]">{market.ticker}</span>
          </div>
        </div>
      </div>

      {/* Price bar */}
      {yesPercent !== null && (
        <div className="mb-3">
          <div className="flex justify-between text-[10px] font-mono mb-1">
            <span className="text-accent-green font-semibold">YES {yesPercent}¢</span>
            <span className="text-accent-red font-semibold">NO {100 - yesPercent}¢</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden bg-terminal-border">
            <div
              className="h-full rounded-full bg-gradient-to-r from-accent-green to-emerald-400 transition-all"
              style={{ width: `${yesPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-[10px] text-slate-500 font-mono">
          {vol && (
            <span className="flex items-center gap-1">
              <TrendingUp className="w-2.5 h-2.5" />
              {vol} 24h
            </span>
          )}
          {totalVol && (
            <span>{totalVol} total</span>
          )}
        </div>
        <div className="flex items-center gap-1 text-slate-600 group-hover:text-dflow-light transition-colors">
          <span className="text-[10px]">TRADE</span>
          <ChevronRight className="w-3 h-3" />
        </div>
      </div>
    </div>
  )
}
