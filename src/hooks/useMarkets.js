import { useState, useEffect, useRef, useCallback } from 'react'
import { PREDICTION_MARKET_API } from '../config'

const CACHE = {}
const CACHE_TTL = 30000

function cached(key, fn) {
  const now = Date.now()
  if (CACHE[key] && now - CACHE[key].ts < CACHE_TTL) return Promise.resolve(CACHE[key].data)
  return fn().then(data => {
    CACHE[key] = { data, ts: now }
    return data
  })
}

export function useMarkets(category = 'all', search = '') {
  const [markets, setMarkets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [cursor, setCursor] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const timerRef = useRef(null)

  const fetchMarkets = useCallback(async (reset = false) => {
    const offset = reset ? 0 : cursor
    setLoading(true)
    try {
      let url
      if (search.trim().length > 0) {
        url = `${PREDICTION_MARKET_API}/search?q=${encodeURIComponent(search.trim())}&withNestedMarkets=true&limit=48`
      } else {
        url = `${PREDICTION_MARKET_API}/markets?status=active&limit=48&cursor=${offset}&sort=volume24h&order=desc`
      }

      const res = await fetch(url)
      if (!res.ok) throw new Error(`API ${res.status}`)
      const data = await res.json()

      let items
      if (search.trim().length > 0) {
        // Search returns events with nested markets
        items = []
        for (const ev of (data.events || [])) {
          for (const m of (ev.markets || [])) {
            if (m.status === 'active') {
              items.push({ ...m, eventTitle: ev.title, imageUrl: ev.imageUrl })
            }
          }
        }
      } else {
        items = (data.markets || []).map(m => ({ ...m, eventTitle: m.title }))
      }

      if (category !== 'all') {
        items = items.filter(m => (m.category || '').toLowerCase() === category.toLowerCase())
      }

      if (reset) {
        setMarkets(items)
        setCursor(48)
      } else {
        setMarkets(prev => [...prev, ...items])
        setCursor(prev => prev + 48)
      }
      setHasMore(items.length === 48)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [category, search, cursor])

  useEffect(() => {
    fetchMarkets(true)
  }, [category, search])

  // Poll every 30s
  useEffect(() => {
    timerRef.current = setInterval(() => {
      fetchMarkets(true)
    }, 30000)
    return () => clearInterval(timerRef.current)
  }, [category, search])

  return { markets, loading, error, hasMore, loadMore: () => fetchMarkets(false), refresh: () => fetchMarkets(true) }
}

export async function fetchMarketDetail(ticker) {
  return cached(`market_${ticker}`, async () => {
    const res = await fetch(`${PREDICTION_MARKET_API}/market/${ticker}`)
    if (!res.ok) throw new Error(`API ${res.status}`)
    return res.json()
  })
}

export async function fetchOrderbook(ticker) {
  const res = await fetch(`${PREDICTION_MARKET_API}/orderbook/${ticker}`)
  if (!res.ok) return null
  return res.json()
}

export async function fetchCandlesticks(ticker, periodInterval = 60) {
  const now = Math.floor(Date.now() / 1000)
  const ranges = { 1: 5 * 3600, 60: 7 * 24 * 3600, 1440: 300 * 24 * 3600 }
  const startTs = now - (ranges[periodInterval] || 7 * 24 * 3600)
  const res = await fetch(
    `${PREDICTION_MARKET_API}/market/${ticker}/candlesticks?periodInterval=${periodInterval}&startTs=${startTs}&endTs=${now}`
  )
  if (!res.ok) return []
  const data = await res.json()
  return (data.candlesticks || []).filter(c => c.price && c.price.open_dollars != null)
}
