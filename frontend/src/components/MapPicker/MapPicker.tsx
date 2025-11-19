import React from 'react'
import 'leaflet/dist/leaflet.css'
import { MapContainer, TileLayer, CircleMarker, useMapEvents, useMap } from 'react-leaflet'

type Props = {
  center: { lat: number; lng: number }
  value?: { lat: number; lng: number } | null
  onSelect: (lat: number, lng: number) => void
}

const ClickHandler: React.FC<{ onClick: (lat: number, lng: number) => void }> = ({ onClick }) => {
  useMapEvents({
    click(e) {
      onClick(e.latlng.lat, e.latlng.lng)
    }
  })
  return null
}

const Recenter: React.FC<{ center: { lat: number; lng: number }; zoom?: number }> = ({ center, zoom = 13 }) => {
  const map = useMap()
  React.useEffect(() => {
    if (!map) return
    map.setView([center.lat, center.lng], zoom)
  }, [center.lat, center.lng, zoom, map])
  return null
}

const MapPicker: React.FC<Props> = ({ center, value = null, onSelect }) => {
  return (
    <div className="w-full h-64 md:h-80 rounded-md overflow-hidden border border-gray-200">
      <MapContainer center={[center.lat, center.lng]} zoom={13} scrollWheelZoom={true} className="w-full h-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Recenter center={center} zoom={13} />
        <ClickHandler onClick={(lat, lng) => onSelect(lat, lng)} />
        {value && (
          <CircleMarker center={[value.lat, value.lng]} pathOptions={{ color: '#16a34a' }} radius={8} />
        )}
      </MapContainer>
    </div>
  )
}

export default MapPicker
