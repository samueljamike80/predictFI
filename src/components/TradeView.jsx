import React, { useState, useEffect, useRef } from 'react'
import { Search, Zap, TrendingUp } from 'lucide-react'
import { PREDICTION_MARKET_API } from '../config'
import TradingPanel from './TradingPanel'

export default function TradeView() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [selected, setSelected] = useState(null)
  const [trending, setTrending] = useState([])
  const timerRef = useRef(null)

  // Load trending on mount
  useEffect(() => {
    fetch(`${PREDICTION_MARKET_API}/markets?status=active&limit=6&sort=volume24h&order=desc`)
      .then(r => r.json())
      .then(d => setTrending(d.markets || []))
      .catch(() => {})
  }, [])

  // Debounced search
  useEffect(() => {
    clearTimeout(timerRef.current)
    if (!query.trim()) { setResults([]); setSearching(false); return }
    setSearching(true)
    timerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`${PREDICTION_MARKET_API}/search?q=${encodeURIComponent(query.trim())}&withNestedMarkets=true&limit=20`)
        const data = await res.json()
        const items = []
        for (const ev of (data.events || [])) {
          for (const m of (ev.markets || [])) {
            if (m.status === 'active') {
              items.push({ ...m, eventTitle: ev.title, imageUrl: ev.imageUrl })
            }
          }
        }
        setResults(items.slice(0, 12))
      } catch {
        setResults([])
      } finally {
        setSearching(false)
      }
    }, 350)
    return () => clearTimeout(timerRef.current)
  }, [query])

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left: market selector */}
      <div className="w-96 flex-shrink-0 flex flex-col border-r border-terminal-border">
        <div className="p-3 border-b border-terminal-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search market to trade…"
              className="w-full bg-terminal-bg border border-terminal-border rounded-lg pl-8 pr-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-dflow/60"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Search results */}
          {query && (
            <div>
              <div className="px-3 py-2 text-[10px] text-slate-500 uppercase tracking-wider border-b border-terminal-border">
                Results {searching ? '…' : `(${results.length})`}
              </div>
              {results.map(m => (
                <button
                  key={m.ticker}
                  onClick={() => setSelected(m)}
                  className={`w-full text-left px-3 py-2.5 border-b border-terminal-border hover:bg-terminal-hover transition-colors ${selected?.ticker === m.ticker ? 'bg-dflow/10 border-l-2 border-l-dflow' : ''}`}
                >
                  <div className="flex items-start gap-2">
                    {m.imageUrl && (
                      <img src={m.imageUrl} alt="" className="w-6 h-6 rounded object-cover flex-shrink-0 mt-0.5" onError={e => {e.target.style.display='none'}} />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white line-clamp-2 leading-tight">{m.title || m.eventTitle}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-slate-600 font-mono">{m.ticker}</span>
                        {m.yesAsk && (
                          <span className="text-[10px] text-accent-green font-mono">
                            YES {(parseFloat(m.yesAsk) * 100).toFixed(1)}¢
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
              {!searching && results.length === 0 && (
                <div className="p-4 text-center text-slate-600 text-xs">No active markets found</div>
              )}
            </div>
          )}

          {/* Trending markets */}
          {!query && (
            <div>
              <div className="px-3 py-2 flex items-center gap-2 border-b border-terminal-border">
                <TrendingUp className="w-3 h-3 text-dflow-light" />
                <span className="text-[10px] text-slate-500 uppercase tracking-wider">Trending</span>
              </div>
              {trending.map(m => (
                <button
                  key={m.ticker}
                  onClick={() => setSelected(m)}
                  className={`w-full text-left px-3 py-2.5 border-b border-terminal-border hover:bg-terminal-hover transition-colors ${selected?.ticker === m.ticker ? 'bg-dflow/10 border-l-2 border-l-dflow' : ''}`}
                >
                  <p className="text-xs text-white line-clamp-2 leading-tight">{m.title}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] text-slate-600 font-mono">{m.ticker}</span>
                    <div className="flex items-center gap-2">
                      {m.yesAsk && (
                        <span className="text-[10px] text-accent-green font-mono">
                          YES {(parseFloat(m.yesAsk) * 100).toFixed(1)}¢
                        </span>
                      )}
                      {m.volume24h > 0 && (
                        <span className="text-[10px] text-slate-600 font-mono">
                          ${(m.volume24h / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })} 24h
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right: trading panel */}
      <div className="flex-1 overflow-y-auto">
        {selected ? (
          <TradingPanel market={selected} />
        ) : (
          <div className="flex items-center justify-center h-full text-center p-8">
            <div>
              <Zap className="w-12 h-12 text-dflow/30 mx-auto mb-4" />
              <p className="text-slate-500 text-sm">Select a market to start trading</p>
              <p className="text-slate-600 text-xs mt-2">Search or pick from trending markets</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
