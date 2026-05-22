import { useEffect, useRef } from 'react'

export default function CensusMarker({ census, onClick, map }) {
  const marker_ref = useRef(null)

  useEffect(() => {
    if (!map || !window.google || !window.google.maps) return

    const color = census.color || '#7c3aed'
    const pet   = census.pet || census.mascota || {}

    const svg_pin = `
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40">
        <path d="M16 0C7.163 0 0 7.163 0 16c0 10 16 24 16 24s16-14 16-24C32 7.163 24.837 0 16 0z"
              fill="${color}" stroke="white" stroke-width="2"/>
        <circle cx="16" cy="16" r="6" fill="white" opacity="0.9"/>
      </svg>
    `

    const icon = {
      url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg_pin)}`,
      scaledSize: new window.google.maps.Size(32, 40),
      anchor:     new window.google.maps.Point(16, 40)
    }

    const marker = new window.google.maps.Marker({
      map,
      position: { lat: parseFloat(census.lat), lng: parseFloat(census.lon) },
      icon,
      title: pet.nombre || 'Census'
    })

    marker.addListener('click', () => onClick(census))
    marker_ref.current = marker

    return () => {
      if (marker_ref.current) {
        marker_ref.current.setMap(null)
        marker_ref.current = null
      }
    }
  }, [map, census, onClick])

  return null
}