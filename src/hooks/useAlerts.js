import { useState, useEffect, useRef, useCallback } from 'react'
import { PREDICTION_MARKET_API } from '../config'

const STORAGE_KEY = 'predictfi_alerts'
const HISTORY_KEY = 'predictfi_alert_history'

function loadWatched() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') } catch { return [] }
}
function saveWatched(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}
function loadHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]') } catch { return [] }
}
function saveHistory(list) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(list.slice(0, 100)))
}

export default function useAlerts() {
  const [watched, setWatched] = useState(loadWatched)
  const [notifications, setNotifications] = useState(loadHistory)
  const [unread, setUnread] = useState(0)
  const lastStatusRef = useRef({})
  const pollRef = useRef(null)

  const addWatch = useCallback((ticker, title) => {
    setWatched(prev => {
      if (prev.find(w => w.ticker === ticker)) return prev
      const next = [...prev, { ticker, title, addedAt: Date.now() }]
      saveWatched(next)
      return next
    })
  }, [])

  const removeWatch = useCallback((ticker) => {
    setWatched(prev => {
      const next = prev.filter(w => w.ticker !== ticker)
      saveWatched(next)
      delete lastStatusRef.current[ticker]
      return next
    })
  }, [])

  const pushNotification = useCallback((note) => {
    setNotifications(prev => {
      const next = [note, ...prev].slice(0, 100)
      saveHistory(next)
      return next
    })
    setUnread(n => n + 1)
  }, [])

  const markRead = useCallback(() => setUnread(0), [])

  const pollStatus = useCallback(async () => {
    if (watched.length === 0) return
    for (const w of watched) {
      try {
        const res = await fetch(`${PREDICTION_MARKET_API}/market/${w.ticker}`)
        if (!res.ok) continue
        const data = await res.json()
        const newStatus = data.status
        const prev = lastStatusRef.current[w.ticker]
        if (prev && prev !== newStatus) {
          const note = {
            id: `${w.ticker}_${Date.now()}`,
            ticker: w.ticker,
            title: w.title,
            prevStatus: prev,
            newStatus,
            ts: Date.now(),
            source: 'Quicknode Webhook Relay',
          }
          pushNotification(note)
        }
        lastStatusRef.current[w.ticker] = newStatus
      } catch {}
    }
  }, [watched, pushNotification])

  // Prime the lastStatus on mount and when watched changes
  useEffect(() => {
    for (const w of watched) {
      if (!lastStatusRef.current[w.ticker]) {
        fetch(`${PREDICTION_MARKET_API}/market/${w.ticker}`)
          .then(r => r.json())
          .then(d => { lastStatusRef.current[w.ticker] = d.status })
          .catch(() => {})
      }
    }
  }, [watched])

  useEffect(() => {
    pollRef.current = setInterval(pollStatus, 20000)
    return () => clearInterval(pollRef.current)
  }, [pollStatus])

  return { watched, notifications, unread, addWatch, removeWatch, markRead }
}
