import React, { useEffect } from 'react'
import { Bell, X, Clock, BellOff, ArrowRight } from 'lucide-react'

function TimeAgo({ ts }) {
  const secs = Math.floor((Date.now() - ts) / 1000)
  const fmt = secs < 60 ? `${secs}s ago`
    : secs < 3600 ? `${Math.floor(secs / 60)}m ago`
    : secs < 86400 ? `${Math.floor(secs / 3600)}h ago`
    : `${Math.floor(secs / 86400)}d ago`
  return <span>{fmt}</span>
}

const STATUS_COLORS = {
  active: 'text-accent-green',
  inactive: 'text-amber-400',
  closed: 'text-slate-400',
  determined: 'text-accent-blue',
  finalized: 'text-purple-400',
}

export default function AlertsView({ watched, notifications, onRemoveWatch, onMarkRead }) {
  useEffect(() => { onMarkRead() }, [onMarkRead])

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex gap-0 h-full">
        {/* Watched list */}
        <div className="w-80 flex-shrink-0 flex flex-col border-r border-terminal-border">
          <div className="flex items-center justify-between px-4 py-3 border-b border-terminal-border bg-terminal-panel">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-accent-amber" />
              <span className="text-sm font-semibold text-white">Watching</span>
              <span className="text-[10px] bg-terminal-hover border border-terminal-border px-1.5 py-0.5 rounded text-slate-400 font-mono">
                {watched.length}
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {watched.length === 0 ? (
              <div className="p-6 text-center">
                <BellOff className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                <p className="text-slate-500 text-sm">No markets watched</p>
                <p className="text-slate-600 text-xs mt-1">
                  Click the bell icon on any market to watch it for status changes
                </p>
              </div>
            ) : (
              watched.map(w => (
                <div key={w.ticker} className="flex items-start gap-3 px-4 py-3 border-b border-terminal-border hover:bg-terminal-hover group">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white line-clamp-2 leading-tight">{w.title}</p>
                    <span className="text-[10px] text-slate-600 font-mono">{w.ticker}</span>
                  </div>
                  <button
                    onClick={() => onRemoveWatch(w.ticker)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-900/30 text-slate-500 hover:text-accent-red transition-all flex-shrink-0"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Notifications feed */}
        <div className="flex-1 flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-terminal-border bg-terminal-panel">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-semibold text-white">Notification History</span>
            </div>
            <span className="text-[10px] text-slate-600 font-mono">{notifications.length} events</span>
          </div>

          <div className="flex-1 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Clock className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                <p className="text-slate-500 text-sm">No notifications yet</p>
                <p className="text-slate-600 text-xs mt-1">
                  Watch markets to get notified when their status changes
                </p>
              </div>
            ) : (
              notifications.map(n => (
                <div key={n.id} className="flex items-start gap-3 px-4 py-3 border-b border-terminal-border hover:bg-terminal-hover animate-fade-in">
                  <div className="w-2 h-2 rounded-full bg-dflow-light mt-1.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs text-white leading-tight">{n.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] font-mono ${STATUS_COLORS[n.prevStatus] || 'text-slate-500'}`}>
                        {n.prevStatus}
                      </span>
                      <ArrowRight className="w-2.5 h-2.5 text-slate-600" />
                      <span className={`text-[10px] font-mono font-semibold ${STATUS_COLORS[n.newStatus] || 'text-slate-300'}`}>
                        {n.newStatus}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-600">
                      <span className="font-mono">{n.ticker}</span>
                      <span>·</span>
                      <TimeAgo ts={n.ts} />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
