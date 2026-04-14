import React, { useMemo, useEffect } from 'react'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { SOLANA_RPC_PROXY } from '../config'

function useSolflareRecommended() {
  useEffect(() => {
    const STYLE_ID = 'solflare-recommended-styles'
    if (!document.getElementById(STYLE_ID)) {
      const style = document.createElement('style')
      style.id = STYLE_ID
      style.textContent = `
        .wallet-adapter-modal-list li.solflare-recommended {
          order: -1;
          border: 1px solid rgba(252, 163, 17, 0.4);
          border-radius: 8px;
          background: rgba(252, 163, 17, 0.08);
          position: relative;
        }
        .wallet-adapter-modal-list li.solflare-recommended .wallet-adapter-button {
          font-weight: 600;
        }
        .solflare-recommended-badge {
          display: inline-flex;
          align-items: center;
          background: linear-gradient(135deg, #FCA311, #E8920D);
          color: #000;
          font-size: 10px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 4px;
          margin-left: auto;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }
        .solflare-install-banner {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 14px;
          margin-bottom: 12px;
          background: rgba(252, 163, 17, 0.06);
          border: 1px solid rgba(252, 163, 17, 0.3);
          border-radius: 8px;
        }
        .solflare-install-banner-text {
          flex: 1;
          font-size: 12px;
          color: #ccc;
          line-height: 1.4;
        }
        .solflare-install-banner-text strong { color: #fff; font-weight: 600; }
        .solflare-install-banner a {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: linear-gradient(135deg, #FCA311, #E8920D);
          color: #000;
          font-size: 11px;
          font-weight: 700;
          padding: 6px 14px;
          border-radius: 6px;
          text-decoration: none;
          white-space: nowrap;
          flex-shrink: 0;
          transition: opacity 0.15s;
        }
        .solflare-install-banner a:hover { opacity: 0.85; }
      `
      document.head.appendChild(style)
    }

    function promoteSolflare(modalList) {
      const items = modalList.querySelectorAll('li')
      let solflareItem = null
      items.forEach((li) => {
        const btn = li.querySelector('.wallet-adapter-button')
        if (btn && btn.textContent?.toLowerCase().includes('solflare')) {
          solflareItem = li
        }
      })
      if (solflareItem && !solflareItem.classList.contains('solflare-recommended')) {
        modalList.prepend(solflareItem)
        solflareItem.classList.add('solflare-recommended')
        const btn = solflareItem.querySelector('.wallet-adapter-button')
        if (btn && !btn.querySelector('.solflare-recommended-badge')) {
          const badge = document.createElement('span')
          badge.className = 'solflare-recommended-badge'
          badge.textContent = 'Recommended'
          btn.appendChild(badge)
        }
      } else if (!solflareItem && !modalList.parentElement?.querySelector('.solflare-install-banner')) {
        const banner = document.createElement('div')
        banner.className = 'solflare-install-banner'
        banner.innerHTML =
          '<span class="solflare-install-banner-text"><strong>Solflare</strong> is the recommended wallet for the best experience.</span>' +
          '<a href="https://solflare.com/download" target="_blank" rel="noopener noreferrer">Install</a>'
        modalList.parentElement.insertBefore(banner, modalList)
      }
    }

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === 1) {
            const el = node
            const modalList = el.classList?.contains('wallet-adapter-modal-list')
              ? el : el.querySelector?.('.wallet-adapter-modal-list')
            if (modalList) promoteSolflare(modalList)
          }
        }
      }
    })
    observer.observe(document.body, { childList: true, subtree: true })
    const existing = document.querySelector('.wallet-adapter-modal-list')
    if (existing) promoteSolflare(existing)
    return () => observer.disconnect()
  }, [])
}

function InnerProviders({ children }) {
  useSolflareRecommended()
  return children
}

export default function SolanaWalletProvider({ children }) {
  const wallets = useMemo(() => [], [])
  const connectionConfig = useMemo(() => ({
    commitment: 'confirmed',
    wsEndpoint: '',
  }), [])

  return (
    <ConnectionProvider endpoint={SOLANA_RPC_PROXY} config={connectionConfig}>
      <WalletProvider wallets={wallets} autoConnect={false}>
        <WalletModalProvider>
          <InnerProviders>
            {children}
          </InnerProviders>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}
