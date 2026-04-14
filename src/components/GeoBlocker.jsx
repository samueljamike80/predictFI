import React from 'react'
import { ShieldOff, Globe } from 'lucide-react'

export default function GeoBlocker({ country }) {
  return (
    <div className="h-screen w-screen flex items-center justify-center bg-terminal-bg grid-bg">
      <div className="max-w-md w-full mx-4">
        <div className="panel-glow rounded-xl p-8 text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-red-900/30 border border-red-500/30 flex items-center justify-center">
              <ShieldOff className="w-8 h-8 text-accent-red" />
            </div>
          </div>

          <div>
            <h1 className="text-xl font-bold text-white mb-2">Region Restricted</h1>
            <p className="text-slate-400 text-sm leading-relaxed">
              Prediction market trading is not available in your region
              {country ? ` (${country})` : ''} due to regulatory requirements.
            </p>
          </div>

          <div className="bg-terminal-bg rounded-lg p-4 border border-terminal-border text-left space-y-2">
            <div className="flex items-center gap-2 text-slate-500 text-xs">
              <Globe className="w-3.5 h-3.5 flex-shrink-0" />
              <span>
                Prediction markets are restricted in 53+ jurisdictions including the United States,
                United Kingdom, Canada, and other regions.
              </span>
            </div>
          </div>

          <p className="text-slate-600 text-xs">
            If you believe this is an error, please contact support.
          </p>
        </div>
      </div>
    </div>
  )
}
