import React, { useState, useEffect, useRef } from 'react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { Bell, TrendingUp, Zap, Activity } from 'lucide-react'
import { PREDICTION_MARKET_API } from '../config'

function TickerItem({ title, yesAsk, volume24h }) {
  const price = yesAsk ? parseFloat(yesAsk) * 100 : null
  return (
    <span className="inline-flex items-center gap-2 px-6 whitespace-nowrap text-xs">
      <span className="text-slate-400 truncate max-w-[180px]">{title}</span>
      {price !== null && (
        <span className={`font-mono font-semibold ${price >= 50 ? 'text-accent-green' : 'text-accent-red'}`}>
          {price.toFixed(1)}¢
        </span>
      )}
      {volume24h > 0 && (
        <span className="text-slate-600 font-mono text-[10px]">
          ${(volume24h / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}
        </span>
      )}
    </span>
  )
}

export default function TopBar({ unread, onNotificationsClick, activeTab, setActiveTab }) {
  const [tickerMarkets, setTickerMarkets] = useState([])
  const [solPrice, setSolPrice] = useState(null)

  useEffect(() => {
    fetch(`${PREDICTION_MARKET_API}/markets?status=active&limit=20&sort=volume24h&order=desc`)
      .then(r => r.json())
      .then(d => setTickerMarkets(d.markets || []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd')
      .then(r => r.json())
      .then(d => setSolPrice(d?.solana?.usd))
      .catch(() => {})
  }, [])

  const tabs = [
    { id: 'markets', label: 'MARKETS', icon: TrendingUp },
    { id: 'trade', label: 'TRADE', icon: Zap },
    { id: 'kamino', label: 'LEVERAGE', icon: Activity },
    { id: 'alerts', label: 'ALERTS', icon: Bell },
  ]

  return (
    <div className="flex flex-col border-b border-terminal-border flex-shrink-0">
      {/* Main bar */}
      <div className="flex items-center h-12 px-4 gap-4 bg-terminal-panel">
        {/* Logo */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="w-6 h-6 rounded bg-dflow flex items-center justify-center">
            <TrendingUp className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-bold text-white text-sm tracking-wider">PREDICT<span className="text-dflow-light">FI</span></span>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 ml-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 h-8 rounded text-xs font-semibold tracking-wider transition-all ${
                activeTab === tab.id
                  ? 'bg-dflow/20 text-dflow-light border border-dflow/30'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-terminal-hover'
              }`}
            >
              <tab.icon className="w-3 h-3" />
              {tab.label}
              {tab.id === 'alerts' && unread > 0 && (
                <span className="bg-accent-red text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none">
                  {unread}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* SOL price */}
        {solPrice && (
          <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-terminal-hover px-3 py-1.5 rounded border border-terminal-border">
            <img
              src="https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png"
              className="w-3.5 h-3.5 rounded-full"
              alt="SOL"
            />
            <span className="text-white font-mono font-semibold">${solPrice.toLocaleString()}</span>
          </div>
        )}

        {/* Wallet */}
        <WalletMultiButton />
      </div>

      {/* Ticker tape */}
      <div className="h-7 bg-terminal-bg border-t border-terminal-border overflow-hidden flex items-center relative">
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-terminal-bg to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-terminal-bg to-transparent z-10 pointer-events-none" />
        <div className="ticker-track flex items-center">
          {[...tickerMarkets, ...tickerMarkets].map((m, i) => (
            <TickerItem key={`${m.ticker}_${i}`} title={m.title || m.eventTicker} yesAsk={m.yesAsk} volume24h={m.volume24h || 0} />
          ))}
        </div>
      </div>
    </div>
  )
}
