import React, { useState, useCallback } from 'react'
import { Search, ChevronDown, Filter, RefreshCw } from 'lucide-react'
import { useMarkets } from '../hooks/useMarkets'
import MarketCard from './MarketCard'
import MarketDetail from './MarketDetail'

const CATEGORIES = ['all', 'crypto', 'politics', 'sports', 'finance', 'entertainment', 'science']

export default function MarketsView({ watchedMap, onToggleWatch }) {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [selectedMarket, setSelectedMarket] = useState(null)

  const debounceSearch = useCallback((val) => {
    setSearch(val)
    clearTimeout(window.__searchTimer)
    window.__searchTimer = setTimeout(() => setDebouncedSearch(val), 350)
  }, [])

  const { markets, loading, error, hasMore, loadMore, refresh } = useMarkets(category, debouncedSearch)

  if (selectedMarket) {
    return (
      <MarketDetail
        market={selectedMarket}
        isWatched={!!watchedMap[selectedMarket.ticker]}
        onToggleWatch={onToggleWatch}
        onBack={() => setSelectedMarket(null)}
      />
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Toolbar */}
      <div className="flex-shrink-0 flex items-center gap-3 p-3 border-b border-terminal-border bg-terminal-panel">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={e => debounceSearch(e.target.value)}
            placeholder="Search markets…"
            className="w-full bg-terminal-bg border border-terminal-border rounded-lg pl-8 pr-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-dflow/60"
          />
        </div>

        {/* Category filters */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {CATEGORIES.map(c => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-3 py-1.5 rounded text-xs font-semibold uppercase tracking-wider flex-shrink-0 transition-all ${
                category === c
                  ? 'bg-dflow/20 text-dflow-light border border-dflow/30'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-terminal-hover border border-transparent'
              }`}
            >
              {c === 'all' ? 'All' : c}
            </button>
          ))}
        </div>

        <button onClick={refresh} className="p-2 rounded-lg hover:bg-terminal-hover text-slate-500 hover:text-slate-300 transition-colors flex-shrink-0">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-3">
        {error ? (
          <div className="text-center text-accent-red py-16 text-sm">
            Error: {error}
            <button onClick={refresh} className="block mx-auto mt-4 text-xs text-slate-400 hover:text-white underline">
              Retry
            </button>
          </div>
        ) : markets.length === 0 && !loading ? (
          <div className="text-center text-slate-600 py-16">
            <Search className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-sm">No markets found</p>
            {debouncedSearch && (
              <button onClick={() => debounceSearch('')} className="mt-3 text-xs text-dflow-light hover:underline">
                Clear search
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {markets.map(market => (
                <MarketCard
                  key={market.ticker}
                  market={market}
                  onSelect={setSelectedMarket}
                  isWatched={!!watchedMap[market.ticker]}
                  onToggleWatch={onToggleWatch}
                />
              ))}
            </div>

            {loading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 mt-3">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="panel-glow rounded-lg p-3 h-36 animate-pulse" />
                ))}
              </div>
            )}

            {hasMore && !loading && (
              <div className="flex justify-center mt-6">
                <button
                  onClick={loadMore}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-terminal-hover border border-terminal-border text-slate-300 hover:text-white hover:border-dflow/40 text-sm font-medium transition-all"
                >
                  <ChevronDown className="w-4 h-4" />
                  Load More
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
