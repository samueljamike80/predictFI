import React, { useState } from 'react'
import { ArrowLeft, Bell, BellOff, BarChart2, Book, Activity } from 'lucide-react'
import PriceChart from './PriceChart'
import Orderbook from './Orderbook'
import TradingPanel from './TradingPanel'

const DETAIL_TABS = [
  { id: 'chart', label: 'Chart', icon: BarChart2 },
  { id: 'orderbook', label: 'Orderbook', icon: Book },
]

export default function MarketDetail({ market, isWatched, onToggleWatch, onBack }) {
  const [detailTab, setDetailTab] = useState('chart')

  const volume = market.volume > 0 ? `$${(market.volume / 100).toLocaleString()}` : '—'
  const volume24h = market.volume24h > 0 ? `$${(market.volume24h / 100).toLocaleString()}` : '—'
  const openInterest = market.openInterest > 0 ? `$${(market.openInterest / 100).toLocaleString()}` : '—'

  const closeTime = market.closeTime ? new Date(market.closeTime * 1000).toLocaleDateString() : null
  const expiryTime = market.expirationTime ? new Date(market.expirationTime * 1000).toLocaleDateString() : null

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center gap-3 p-3 border-b border-terminal-border bg-terminal-panel">
        <button onClick={onBack} className="p-1.5 rounded hover:bg-terminal-hover text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>

        {market.imageUrl && (
          <img src={market.imageUrl} alt="" className="w-7 h-7 rounded object-cover border border-terminal-border" />
        )}

        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold text-white truncate">{market.title || market.eventTitle}</h2>
          <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
            <span className="font-mono">{market.ticker}</span>
            {closeTime && <span>Closes {closeTime}</span>}
          </div>
        </div>

        <button
          onClick={() => onToggleWatch(market.ticker, market.title || market.ticker)}
          className={`p-2 rounded-lg transition-colors ${isWatched ? 'text-accent-amber bg-amber-900/20 border border-amber-700/30' : 'text-slate-500 hover:text-slate-300 hover:bg-terminal-hover'}`}
        >
          {isWatched ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
        </button>
      </div>

      {/* Stats strip */}
      <div className="flex-shrink-0 flex items-center gap-6 px-4 py-2 bg-terminal-bg border-b border-terminal-border overflow-x-auto no-scrollbar">
        {[
          { label: 'Volume', value: volume },
          { label: '24h Vol', value: volume24h },
          { label: 'Open Interest', value: openInterest },
          { label: 'Status', value: market.status },
        ].map(item => (
          <div key={item.label} className="flex-shrink-0">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">{item.label}</div>
            <div className="text-xs font-mono text-white mt-0.5">{item.value}</div>
          </div>
        ))}
      </div>

      {/* Body: chart+tabs left, trade right */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: tabs + content */}
        <div className="flex-1 flex flex-col min-w-0 border-r border-terminal-border">
          {/* Tabs */}
          <div className="flex-shrink-0 flex items-center gap-1 px-3 py-2 border-b border-terminal-border bg-terminal-panel">
            {DETAIL_TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setDetailTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                  detailTab === tab.id
                    ? 'bg-dflow/20 text-dflow-light border border-dflow/30'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-terminal-hover'
                }`}
              >
                <tab.icon className="w-3 h-3" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            {detailTab === 'chart' && <PriceChart ticker={market.ticker} />}
            {detailTab === 'orderbook' && <Orderbook ticker={market.ticker} status={market.status} />}
          </div>
        </div>

        {/* Right: trading panel */}
        <div className="w-80 flex-shrink-0 overflow-y-auto border-l border-terminal-border">
          <TradingPanel market={market} />
        </div>
      </div>
    </div>
  )
}
