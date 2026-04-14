import React, { useState, useEffect, useRef } from 'react'
import { CheckCircle, XCircle, Clock, Loader, ExternalLink } from 'lucide-react'
import { DFLOW_ORDER_API } from '../config'

const STATUS_INFO = {
  pending: { color: 'text-slate-400', icon: Loader, spin: true, label: 'Submitting' },
  open: { color: 'text-accent-amber', icon: Clock, spin: false, label: 'Order Open' },
  pendingClose: { color: 'text-dflow-light', icon: Clock, spin: false, label: 'Pending Close' },
  closed: { color: 'text-accent-green', icon: CheckCircle, spin: false, label: 'Filled!' },
  expired: { color: 'text-slate-500', icon: XCircle, spin: false, label: 'Expired' },
  failed: { color: 'text-accent-red', icon: XCircle, spin: false, label: 'Failed' },
}

export default function OrderStatusTracker({ signature, onDone }) {
  const [status, setStatus] = useState('pending')
  const [elapsed, setElapsed] = useState(0)
  const pollRef = useRef(null)
  const timerRef = useRef(null)
  const startRef = useRef(Date.now())

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000))
    }, 1000)

    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${DFLOW_ORDER_API}/order-status?signature=${signature}`)
        if (!res.ok) return
        const data = await res.json()
        setStatus(data.status || 'pending')
        if (['closed', 'expired', 'failed'].includes(data.status)) {
          clearInterval(pollRef.current)
          clearInterval(timerRef.current)
          setTimeout(() => onDone?.(data.status), 1500)
        }
      } catch {}
    }, 2500)

    return () => {
      clearInterval(pollRef.current)
      clearInterval(timerRef.current)
    }
  }, [signature, onDone])

  const info = STATUS_INFO[status] || STATUS_INFO.pending
  const Icon = info.icon

  return (
    <div className="panel-glow rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-slate-400 text-xs uppercase tracking-wider">Order Status</span>
        <span className="text-slate-600 font-mono text-[10px]">{elapsed}s</span>
      </div>

      <div className={`flex items-center gap-3 ${info.color}`}>
        <Icon className={`w-5 h-5 flex-shrink-0 ${info.spin ? 'animate-spin' : ''}`} />
        <span className="font-semibold text-sm">{info.label}</span>
      </div>

      <div className="space-y-1">
        {['pending', 'open', 'pendingClose', 'closed'].map(s => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors ${
              status === s ? 'bg-dflow-light' :
              ['closed'].includes(status) && ['pending','open','pendingClose','closed'].indexOf(s) <= ['pending','open','pendingClose','closed'].indexOf(status) ? 'bg-accent-green' :
              'bg-terminal-border'
            }`} />
            <span className={`text-[10px] font-mono capitalize ${status === s ? 'text-white' : 'text-slate-600'}`}>
              {s === 'pendingClose' ? 'Pending Close' : s.charAt(0).toUpperCase() + s.slice(1)}
            </span>
          </div>
        ))}
      </div>

      <a
        href={`https://solscan.io/tx/${signature}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 text-[10px] text-slate-600 hover:text-dflow-light transition-colors"
      >
        <ExternalLink className="w-3 h-3" />
        View on Solscan
      </a>
    </div>
  )
}
