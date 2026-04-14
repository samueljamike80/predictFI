import React, { useState, useMemo, useCallback } from 'react'
import SolanaWalletProvider from './components/WalletProvider'
import GeoBlocker from './components/GeoBlocker'
import TopBar from './components/TopBar'
import MarketsView from './components/MarketsView'
import TradeView from './components/TradeView'
import KaminoView from './components/KaminoView'
import AlertsView from './components/AlertsView'
import useGeoCheck from './hooks/useGeoCheck'
import useAlerts from './hooks/useAlerts'

function AppContent() {
  const { status, country } = useGeoCheck()
  const { watched, notifications, unread, addWatch, removeWatch, markRead } = useAlerts()
  const [activeTab, setActiveTab] = useState('markets')

  const watchedMap = useMemo(() => {
    const map = {}
    for (const w of watched) {
      map[w.ticker] = true
    }
    return map
  }, [watched])

  const handleToggleWatch = useCallback((ticker, title) => {
    if (watchedMap[ticker]) {
      removeWatch(ticker)
    } else {
      addWatch(ticker, title)
    }
  }, [watchedMap, removeWatch, addWatch])

  if (status === 'loading') {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-terminal-bg">
        <div className="text-slate-500 text-sm">Loading…</div>
      </div>
    )
  }

  if (status === 'blocked') {
    return <GeoBlocker country={country} />
  }

  return (
    <div className="flex flex-col h-screen bg-terminal-bg">
      <TopBar
        unread={unread}
        onNotificationsClick={() => setActiveTab('alerts')}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
      <div className="flex-1 overflow-hidden">
        {activeTab === 'markets' && (
          <MarketsView watchedMap={watchedMap} onToggleWatch={handleToggleWatch} />
        )}
        {activeTab === 'trade' && <TradeView />}
        {activeTab === 'kamino' && <KaminoView />}
        {activeTab === 'alerts' && (
          <AlertsView
            watched={watched}
            notifications={notifications}
            onRemoveWatch={removeWatch}
            onMarkRead={markRead}
          />
        )}
      </div>
    </div>
  )
}

export default function App() {
  return (
    <SolanaWalletProvider>
      <AppContent />
    </SolanaWalletProvider>
  )
}
