import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Circle, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import { getCurrentPosition, reverseGeocode, DEFAULT_CENTER } from '../lib/geo'

// Leaflet's marker images live at known URLs that bundlers can't find on their
// own. Point the default icon at the files Vite actually bundles.
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
})

// A tiny component that listens for "the user tapped the map". Renders nothing
// itself — it can only touch the map because it lives INSIDE MapContainer.
function ClickCatcher({ onSelect }) {
  useMapEvents({
    click(e) {
      onSelect({ latitude: e.latlng.lat, longitude: e.latlng.lng })
    },
  })
  return null
}

// Keeps the map view pointed at `center` whenever it changes (e.g. the first
// moment we learn the user's live location).
function Recenter({ center }) {
  const map = useMap()
  useEffect(() => {
    if (center) map.setView([center.latitude, center.longitude], map.getZoom())
  }, [center, map])
  return null
}

/**
 * LocationPicker — the DEEP module. Its whole interface is three props:
 *   - radius:        number, how big to draw the geofence circle
 *   - initialCenter: { latitude, longitude } | null, for editing an existing reminder
 *   - onLocationSelect({ latitude, longitude, locationName })  <- the ONE output
 *
 * The page never learns that Leaflet, the browser GPS, or the Nominatim API
 * exist. Tap the map -> we pin a marker, reverse-geocode a name, and report the
 * facts back up through onLocationSelect.
 */
function LocationPicker({ radius = 250, initialCenter = null, onLocationSelect }) {
  // Where the map should look. Start on the saved spot (editing) or the
  // fallback; upgrade to the user's live position once we can.
  const [center, setCenter] = useState(() => initialCenter ?? DEFAULT_CENTER)
  // The pin the user dropped: [lat, lng] or null ("nothing picked yet").
  const [marker, setMarker] = useState(
    initialCenter ? [initialCenter.latitude, initialCenter.longitude] : null
  )

  // On first mount, try to centre on the user's live location. Full silent on
  // deny/unavailable — DEFAULT_CENTER already covers us.
  useEffect(() => {
    if (initialCenter) return // editing an existing reminder — already centred
    getCurrentPosition()
      .then((pos) => setCenter(pos))
      .catch(() => {})
  }, [initialCenter])

  const handleSelect = async ({ latitude, longitude }) => {
    setMarker([latitude, longitude])
    const locationName = await reverseGeocode({ latitude, longitude })
    onLocationSelect({ latitude, longitude, locationName })
  }

  return (
    <MapContainer
      center={[center.latitude, center.longitude]}
      zoom={13}
      style={{ height: '240px', width: '100%', borderRadius: '12px', zIndex: 0 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickCatcher onSelect={handleSelect} />
      <Recenter center={center} />
      {marker && <Marker position={marker} />}
      {marker && <Circle center={marker} radius={radius} />}
    </MapContainer>
  )
}

export default LocationPicker
