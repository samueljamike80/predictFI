import { useState, useEffect } from 'react'

export default function useGeoCheck() {
  const [status, setStatus] = useState('loading') // loading | allowed | blocked
  const [country, setCountry] = useState(null)

  useEffect(() => {
    const cached = sessionStorage.getItem('geo_check')
    if (cached) {
      const data = JSON.parse(cached)
      setCountry(data.country)
      setStatus(data.predictionMarketsAllowed ? 'allowed' : 'blocked')
      return
    }

    fetch('/api/geo-check')
      .then(r => r.json())
      .then(data => {
        sessionStorage.setItem('geo_check', JSON.stringify(data))
        setCountry(data.country)
        setStatus(data.predictionMarketsAllowed ? 'allowed' : 'blocked')
      })
      .catch(() => {
        // Fail open
        setStatus('allowed')
      })
  }, [])

  return { status, country }
}
