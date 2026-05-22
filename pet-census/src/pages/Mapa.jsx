import { useState, useEffect, useCallback } from 'react'
import { getAllCensusMock } from '../api/censos_api'
import MapView             from '../components/MapView/MapView'
import CensusMarker        from '../components/MapView/CensusMarker'
import InfoWindow          from '../components/InfoWindow/InfoWindow'

export default function Mapa() {
  const [census_list, setCensusList]         = useState([])
  const [selected_census, setSelectedCensus] = useState(null)
  const [is_loading, setIsLoading]           = useState(true)
  const [error_msg, setErrorMsg]             = useState('')
  const [map_ref, setMapRef]                 = useState(null)

  // Declare handlers BEFORE using them
  const handleMarkerClick = useCallback((census) => {
    setSelectedCensus(census)
  }, [])

  const handleCloseInfo = useCallback(() => {
    setSelectedCensus(null)
  }, [])

  const handleMapLoad = useCallback((map) => {
    setMapRef(map)
  }, [])

  const fitBounds = useCallback((map, data) => {
    if (!window.google || data.length === 0) return
    const bounds = new window.google.maps.LatLngBounds()
    data.forEach(c => bounds.extend({
      lat: parseFloat(c.lat),
      lng: parseFloat(c.lon)
    }))
    map.fitBounds(bounds)
  }, [])

  const loadCensus = useCallback(async () => {
    setIsLoading(true)
    setErrorMsg('')
    try {
      const data = await getAllCensusMock()
      setCensusList(data)
      if (map_ref && data.length > 0) fitBounds(map_ref, data)
    } catch (err) {
      setErrorMsg('Error loading census data.')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [map_ref, fitBounds])

  useEffect(() => {
    loadCensus()
  }, [loadCensus])

  return (
    <div className="flex flex-col gap-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Census Map</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {is_loading
              ? 'Loading census data...'
              : `${census_list.length} census record${census_list.length !== 1 ? 's' : ''} on map`
            }
          </p>
        </div>
        <button
          onClick={loadCensus}
          disabled={is_loading}
          className="bg-white border border-gray-200 hover:border-violet-300
                     text-gray-600 text-sm font-medium px-4 py-2 rounded-lg
                     transition-colors flex items-center gap-2"
        >
          {is_loading ? '⏳' : '🔄'} Refresh
        </button>
      </div>

      {error_msg && (
        <div className="bg-red-50 border border-red-200 text-red-600
                        text-sm rounded-lg px-4 py-3">
          ⚠️ {error_msg}
        </div>
      )}

      {/* Map container */}
      <div
        className="bg-white rounded-xl shadow overflow-hidden"
        style={{ height: 'calc(100vh - 220px)', minHeight: '400px' }}
      >
        <MapView onMapLoad={handleMapLoad}>
          {census_list.map(census => (
            <CensusMarker
              key={census.id}
              census={census}
              map={map_ref}
              onClick={handleMarkerClick}
            />
          ))}
          {selected_census && (
            <InfoWindow
              census={selected_census}
              onClose={handleCloseInfo}
            />
          )}
        </MapView>
      </div>

      {/* Legend */}
      {census_list.length > 0 && (
        <div className="bg-white rounded-xl shadow px-6 py-4">
          <p className="text-xs text-gray-400 mb-3 uppercase tracking-wide">
            Census records
          </p>
          <div className="flex flex-wrap gap-2">
            {census_list.map(census => {
              const pet = census.pet || census.mascota || {}
              return (
                <button
                  key={census.id}
                  onClick={() => setSelectedCensus(census)}
                  className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100
                             border border-gray-200 rounded-lg px-3 py-1.5
                             transition-colors text-left"
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: census.color || '#7c3aed' }}
                  />
                  <span className="text-xs text-gray-700 font-medium">
                    {pet.nombre || 'Unknown'}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

    </div>
  )
}