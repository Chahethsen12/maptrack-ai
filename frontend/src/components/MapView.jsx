import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { catClass, formatCoord } from '../utils'
import MapSearchBar from './MapSearchBar'
import RouteLayer from './RouteLayer'

// ── Leaflet default icon fix (Vite breaks the asset paths) ───────────────
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// ── Tile layer configs ────────────────────────────────────────────────────
const TILE_LAYERS = {
  dark: {
    url:         'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains:  'abcd',
    maxZoom:     19,
  },
  light: {
    url:         'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains:  'abcd',
    maxZoom:     19,
  },
  osm: {
    url:         'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    subdomains:  'abc',
    maxZoom:     19,
  },
  topo: {
    url:         'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: 'Map data &copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Style &copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
    subdomains:  'abc',
    maxZoom:     17,
  },
}

// ── Pin icon colours ──────────────────────────────────────────────────────
const PIN_COLORS = {
  study:         '#4f8cff',
  food:          '#f0a500',
  travel:        '#00d4aa',
  work:          '#9664ff',
  meetup:        '#ff7850',
  errands:       '#8b949e',
  personal:      '#ff4d6d',
  uncategorized: '#484f58',
}

// ── SVG pin icon builder ──────────────────────────────────────────────────
function buildIcon(category, active = false) {
  const fill = PIN_COLORS[category] || PIN_COLORS.uncategorized
  const s    = active ? 36 : 28
  const svg  = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 28 28">
      <circle cx="14" cy="11" r="9"   fill="${fill}" opacity="0.2"/>
      <circle cx="14" cy="11" r="5.5" fill="${fill}"/>
      <line x1="14" y1="16.5" x2="14" y2="26" stroke="${fill}" stroke-width="2.5" stroke-linecap="round"/>
      ${active ? `<circle cx="14" cy="11" r="8.5" fill="none" stroke="${fill}" stroke-width="1.5" opacity="0.6"/>` : ''}
    </svg>`
  return L.divIcon({
    html:        svg,
    className:   '',
    iconSize:    [s, s],
    iconAnchor:  [s / 2, s],
    popupAnchor: [0, -s],
  })
}

function buildPendingIcon() {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28">
      <circle cx="14" cy="11" r="9"   fill="#f0a500" opacity="0.2"/>
      <circle cx="14" cy="11" r="5.5" fill="#f0a500"/>
      <line x1="14" y1="16.5" x2="14" y2="26" stroke="#f0a500" stroke-width="2.5" stroke-linecap="round"/>
    </svg>`
  return L.divIcon({
    html:        svg,
    className:   '',
    iconSize:    [28, 28],
    iconAnchor:  [14, 28],
    popupAnchor: [0, -28],
  })
}

// ── Popup HTML ────────────────────────────────────────────────────────────
function buildPopupHTML(place) {
  return `
    <div class="popup-inner">
      <div class="popup-header">
        <div class="popup-title">${place.title}</div>
        <div class="popup-cat">
          <span class="place-cat ${catClass(place.category)}">${place.category}</span>
        </div>
      </div>
      <div class="popup-body">
        ${place.note ? `<div class="popup-note">${place.note}</div>` : ''}
        <div class="popup-coords">${formatCoord(place.lat)}, ${formatCoord(place.lng)}</div>
      </div>
    </div>`
}

// ── Map utility sub-components ────────────────────────────────────────────

/** Forwards map clicks to the parent handler */
function ClickHandler({ onMapClick }) {
  useMapEvents({ click: e => onMapClick(e.latlng) })
  return null
}

/** Smoothly flies to a target coordinate */
function FlyController({ target }) {
  const map = useMap()
  useEffect(() => {
    if (target) map.flyTo([target.lat, target.lng], Math.max(map.getZoom(), 15), { duration: 0.8 })
  }, [target])
  return null
}

/**
 * Fixes the blank-tile bug that occurs when the container is resized
 * (e.g. sidebar toggle). ResizeObserver calls invalidateSize() automatically.
 */
function ResizeHandler() {
  const map = useMap()
  useEffect(() => {
    const observer = new ResizeObserver(() => map.invalidateSize())
    observer.observe(map.getContainer())
    return () => observer.disconnect()
  }, [map])
  return null
}

/**
 * Swaps the tile layer when mapStyle changes.
 * The `key` prop forces React to remount the TileLayer on style change,
 * which clears old tiles cleanly instead of blending them.
 */
function TileLayerSwitcher({ mapStyle }) {
  const tile = TILE_LAYERS[mapStyle] || TILE_LAYERS.dark
  return (
    <TileLayer
      key={mapStyle}
      url={tile.url}
      attribution={tile.attribution}
      subdomains={tile.subdomains}
      maxZoom={tile.maxZoom}
    />
  )
}

// ── Marker components ─────────────────────────────────────────────────────

function SavedMarker({ place, active, onSelect }) {
  return (
    <Marker
      position={[place.lat, place.lng]}
      icon={buildIcon(place.category, active)}
      eventHandlers={{ click: () => onSelect(place) }}
    >
      <Popup>
        <div dangerouslySetInnerHTML={{ __html: buildPopupHTML(place) }} />
      </Popup>
    </Marker>
  )
}

function PendingMarker({ latlng }) {
  return (
    <Marker position={[latlng.lat, latlng.lng]} icon={buildPendingIcon()}>
      <Popup>
        <div className="popup-inner">
          <div className="popup-title" style={{ color: '#f0a500' }}>New place</div>
          <div className="popup-note">Fill in the form to save this location.</div>
          <div className="popup-coords">
            {formatCoord(latlng.lat)}, {formatCoord(latlng.lng)}
          </div>
        </div>
      </Popup>
    </Marker>
  )
}

// ── Main export ───────────────────────────────────────────────────────────

export default function MapView({
  places, pending, activeId, flyTo,
  onMapClick, onSelectPlace, onSearchResult,
  savedRoutes, visibleRoutes, builderRoute,
  mapStyle,
}) {
  return (
    <div className="map-container">
      <MapContainer
        center={[20, 0]}
        zoom={2}
        style={{ height: '100%', width: '100%' }}
        zoomControl
      >
        <TileLayerSwitcher mapStyle={mapStyle} />

        <ClickHandler onMapClick={onMapClick} />
        <ResizeHandler />
        {flyTo && <FlyController target={flyTo} />}

        <RouteLayer
          savedRoutes={savedRoutes || []}
          visibleRoutes={visibleRoutes || []}
          builderRoute={builderRoute}
        />

        {places.map(place => (
          <SavedMarker
            key={place.id}
            place={place}
            active={place.id === activeId}
            onSelect={onSelectPlace}
          />
        ))}

        {pending && <PendingMarker latlng={pending} />}
      </MapContainer>

      {!pending && places.length === 0 && (
        <div className="map-hint">Click anywhere to add a place</div>
      )}

      <MapSearchBar onResult={onSearchResult} />
    </div>
  )
}