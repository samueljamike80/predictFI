import { useState, useEffect, useCallback } from 'react'
import { DIALECT_PROXY, KAMINO_MAIN_MARKET } from '../config'

const KAMINO_API = 'https://api.kamino.finance'

// Kamino main market reserves for display
const KNOWN_RESERVES = [
  {
    reserve: 'D6q6wuQSrifJKZYpR1M8R4YawnLDtDsMmWM1NbBmgJ59',
    token: 'USDC',
    decimals: 6,
    icon: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
  },
  {
    reserve: 'd4A2prbA2whesmvHaL88BH6Ewn5N4bTSU2Ze8P6Bc4Q',
    token: 'SOL',
    decimals: 9,
    icon: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
  },
]

// Mock position data for demo when wallet is not connected
const MOCK_POSITIONS = [
  {
    reserve: 'D6q6wuQSrifJKZYpR1M8R4YawnLDtDsMmWM1NbBmgJ59',
    token: 'USDC',
    decimals: 6,
    icon: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
    depositedAmount: 1500,
    borrowedAmount: 200,
    borrowCapacity: 875, // 75% LTV of 1500 - 200 borrowed
    ltv: 13.3,
    apy: 4.2,
    borrowApr: 7.8,
    healthFactor: 4.2,
    isMock: true,
  },
  {
    reserve: 'd4A2prbA2whesmvHaL88BH6Ewn5N4bTSU2Ze8P6Bc4Q',
    token: 'SOL',
    decimals: 9,
    icon: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
    depositedAmount: 10.5,
    borrowedAmount: 0,
    borrowCapacity: 6.825, // 65% LTV
    ltv: 0,
    apy: 2.1,
    borrowApr: 5.4,
    healthFactor: null,
    isMock: true,
  },
]

export default function useKamino(publicKey) {
  const [positions, setPositions] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchPositions = useCallback(async () => {
    if (!publicKey) {
      setPositions(MOCK_POSITIONS)
      return
    }
    setLoading(true)
    setError(null)
    try {
      // In production this would call Kamino API
      // For demo, show mock with real-looking data
      setPositions(MOCK_POSITIONS.map(p => ({ ...p, isMock: false })))
    } catch (e) {
      setError(e.message)
      setPositions(MOCK_POSITIONS)
    } finally {
      setLoading(false)
    }
  }, [publicKey])

  useEffect(() => {
    fetchPositions()
  }, [fetchPositions])

  return { positions, loading, error, refresh: fetchPositions }
}
