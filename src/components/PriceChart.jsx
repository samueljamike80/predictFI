import React, { useEffect, useRef, useState, useCallback } from 'react'
import { createChart } from 'lightweight-charts'
import { fetchCandlesticks } from '../hooks/useMarkets'

const INTERVALS = [
  { label: '1M', value: 1 },
  { label: '1H', value: 60 },
  { label: '1D', value: 1440 },
]

export default function PriceChart({ ticker }) {
  const containerRef = useRef(null)
  const chartRef = useRef(null)
  const candleSeriesRef = useRef(null)
  const volSeriesRef = useRef(null)
  const [interval, setCurrentInterval] = useState(60)
  const [loading, setLoading] = useState(false)

  // Create chart once on mount
  useEffect(() => {
    if (!containerRef.current) return

    const chart = createChart(containerRef.current, {
      autoSize: true,
      layout: {
        background: { color: '#0D1117' },
        textColor: '#64748B',
        fontFamily: 'JetBrains Mono',
        fontSize: 10,
      },
      grid: {
        vertLines: { color: '#1C2433' },
        horzLines: { color: '#1C2433' },
      },
      crosshair: {
        vertLine: { color: '#7C3AED', style: 1, width: 1, labelBackgroundColor: '#7C3AED' },
        horzLine: { color: '#7C3AED', style: 1, width: 1, labelBackgroundColor: '#7C3AED' },
      },
      rightPriceScale: {
        borderColor: '#1C2433',
        scaleMargins: { top: 0.1, bottom: 0.3 },
      },
      timeScale: {
        borderColor: '#1C2433',
        timeVisible: true,
        secondsVisible: false,
      },
    })

    const candleSeries = chart.addCandlestickSeries({
      upColor: '#00D26A',
      downColor: '#F43F5E',
      borderUpColor: '#00D26A',
      borderDownColor: '#F43F5E',
      wickUpColor: '#00D26A',
      wickDownColor: '#F43F5E',
      priceFormat: {
        type: 'custom',
        formatter: price => `${(price * 100).toFixed(1)}¢`,
        minMove: 0.001,
      },
    })

    const volSeries = chart.addHistogramSeries({
      color: '#1C2433',
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
    })

    chart.priceScale('volume').applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    })

    chartRef.current = chart
    candleSeriesRef.current = candleSeries
    volSeriesRef.current = volSeries

    return () => {
      chart.remove()
      chartRef.current = null
      candleSeriesRef.current = null
      volSeriesRef.current = null
    }
  }, [])

  const loadData = useCallback(async (periodInterval) => {
    if (!ticker || !candleSeriesRef.current) return
    setLoading(true)
    try {
      const candles = await fetchCandlesticks(ticker, periodInterval)
      const sorted = candles.sort((a, b) => a.end_period_ts - b.end_period_ts)
      const deduped = sorted.filter((d, i, arr) => i === 0 || d.end_period_ts !== arr[i - 1].end_period_ts)

      const candleData = deduped.map(c => ({
        time: c.end_period_ts,
        open: parseFloat(c.price.open_dollars),
        high: parseFloat(c.price.high_dollars),
        low: parseFloat(c.price.low_dollars),
        close: parseFloat(c.price.close_dollars),
      }))

      const volData = deduped.map(c => ({
        time: c.end_period_ts,
        value: c.volume / 100,
        color: parseFloat(c.price.close_dollars) >= parseFloat(c.price.open_dollars)
          ? '#1a3a2a'
          : '#3a1a1a',
      }))

      // Deduplicate volume too
      const dedupedVol = volData.filter((d, i, arr) => i === 0 || d.time !== arr[i - 1].time)

      candleSeriesRef.current?.setData(candleData)
      volSeriesRef.current?.setData(dedupedVol)
      chartRef.current?.timeScale().fitContent()
    } catch (e) {
      console.error('Chart load error', e)
    } finally {
      setLoading(false)
    }
  }, [ticker])

  useEffect(() => {
    loadData(interval)
  }, [ticker, interval, loadData])

  const handleIntervalChange = (val) => {
    setCurrentInterval(val)
    // Don't unmount chart — just refetch
  }

  return (
    <div className="flex flex-col h-full">
      {/* Controls */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-terminal-border">
        <span className="text-slate-500 text-[10px] uppercase tracking-wider">Interval</span>
        <div className="flex gap-1">
          {INTERVALS.map(iv => (
            <button
              key={iv.value}
              onClick={() => handleIntervalChange(iv.value)}
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold transition-all ${
                interval === iv.value
                  ? 'bg-dflow/20 text-dflow-light border border-dflow/40'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-terminal-hover'
              }`}
            >
              {iv.label}
            </button>
          ))}
        </div>
        {loading && (
          <span className="text-[10px] text-slate-600 ml-auto">Loading…</span>
        )}
      </div>

      {/* Chart */}
      <div ref={containerRef} className="flex-1" />
    </div>
  )
}
