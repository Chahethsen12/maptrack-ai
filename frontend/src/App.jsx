/**
 * MapTrack AI — Main Application Component
 * 
 * Architecture:
 * - Places: CRUD operations with AI categorization suggestions
 * - Routes: Built with OSRM, stored as JSON [lat,lng] geometry (not GeoJSON)
 *   Reasoning: Simpler format for CS50 scope, easier to visualize on map
 * - State: Centralized in App; cascaded to Map + Sidebar
 * - UI: Obsidian Glass design system (dark mode, glassmorphism)
 */

import { useState, useEffect, useCallback } from 'react'
import MapView from './components/MapView'
import Sidebar from './components/Sidebar'
import { ToastContainer, useToasts } from './components/Toast'
import { getPlaces, createPlace, updatePlace, deletePlace, getRoutes } from './api'
import { exportPDF } from './services/pdfExport'

export default function App() {
  const [places, setPlaces]     = useState([])
  const [savedRoutes, setSavedRoutes] = useState([])
  const [visibleRoutes, setVisibleRoutes] = useState([])
  const [builderRoute, setBuilderRoute] = useState(null)

  const [pending, setPending]   = useState(null)
  const [editing, setEditing]   = useState(null)
  const [activeId, setActiveId] = useState(null)
  const [flyTo, setFlyTo]       = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [locating, setLocating] = useState(false)
  const [userLoc, setUserLoc]   = useState(null)
  const [exporting, setExporting] = useState(false)
  const [mapStyle, setMapStyle] = useState(localStorage.getItem('mapStyle') || 'dark')
  const { toasts, push: toast } = useToasts()

  useEffect(() => { loadPlaces(); loadRoutes() }, [])

  useEffect(() => {
    localStorage.setItem('mapStyle', mapStyle)
  }, [mapStyle])

  async function loadPlaces() {
    try { setPlaces(await getPlaces()) }
    catch { toast('Could not connect to the backend', 'error') }
  }

  async function loadRoutes() {
    try { setSavedRoutes(await getRoutes()) }
    catch { } // Errors handeled in RoutesPanel
  }

  const handleMapClick = useCallback((latlng) => {
    setPending(latlng); setEditing(null); setSidebarOpen(true)
  }, [])

  const handleSearchResult = useCallback(({ lat, lng }) => {
    setFlyTo({ lat, lng })
    setTimeout(() => setFlyTo(null), 1200)
    setPending({ lat, lng })
    setEditing(null)
    setSidebarOpen(true)
  }, [])

  function handleSelectPlace(place) {
    setActiveId(place.id)
    setFlyTo({ lat: place.lat, lng: place.lng })
    setTimeout(() => setFlyTo(null), 1000)
  }

  function handleGeolocate() {
    if (!navigator.geolocation) { toast('Geolocation not supported', 'error'); return }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false)
        const latlng = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setUserLoc(latlng)
        setPending(latlng); setEditing(null)
        setFlyTo(latlng); setTimeout(() => setFlyTo(null), 1000)
        setSidebarOpen(true)
      },
      () => { setLocating(false); toast('Could not get location', 'error') }
    )
  }

  async function handleSave(formData) {
    try {
      if (editing) {
        const updated = await updatePlace(editing.id, formData)
        setPlaces(ps => ps.map(p => p.id === updated.id ? updated : p))
        setEditing(null); toast('Place updated')
      } else {
        const created = await createPlace(formData)
        setPlaces(ps => [created, ...ps])
        setPending(null); setActiveId(created.id); toast('Place saved!')
      }
    } catch { toast('Failed to save place', 'error') }
  }

  function handleCancel() { setPending(null); setEditing(null) }

  async function handleDelete(place) {
    if (!confirm(`Delete "${place.title}"?`)) return
    try {
      await deletePlace(place.id)
      setPlaces(ps => ps.filter(p => p.id !== place.id))
      if (activeId === place.id) setActiveId(null)
      toast('Place deleted')
    } catch { toast('Failed to delete place', 'error') }
  }

  async function handleExportPDF() {
    if (places.length === 0) { toast('No places to export', 'error'); return }
    setExporting(true)
    try {
      await exportPDF({ places, userLoc })
      toast('PDF downloaded!')
    } catch (e) {
      console.error(e)
      toast('PDF export failed', 'error')
    } finally { setExporting(false) }
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <a className="logo" href="#" aria-label="MapTrack AI home">
          <span className="logo-icon">⬡</span>
          <span className="logo-name">MapTrack <span>AI</span></span>
        </a>
        <div className="header-spacer" />
        <button 
          className={`header-btn ${locating ? 'active' : ''}`} 
          onClick={handleGeolocate} 
          disabled={locating}
          aria-label={locating ? 'Detecting location' : userLoc ? 'Current location set' : 'Use my location'}
          title="Get your current location via geolocation"
        >
          {locating ? <span className="spinner" /> : '◉'}
          {locating ? 'Locating…' : userLoc ? 'Location set' : 'My Location'}
        </button>
        <button 
          className={`header-btn ${sidebarOpen ? 'active' : ''}`} 
          onClick={() => setSidebarOpen(o => !o)}
          aria-label={sidebarOpen ? 'Hide sidebar panel' : 'Show sidebar panel'}
          aria-pressed={sidebarOpen}
          title="Toggle sidebar panel (Esc to close)"
        >
          ☰ Panel
        </button>
      </header>

      <div className="app-body">
        <MapView
          places={places} pending={pending} activeId={activeId} flyTo={flyTo}
          onMapClick={handleMapClick} onSelectPlace={handleSelectPlace}
          onSearchResult={handleSearchResult}
          savedRoutes={savedRoutes} visibleRoutes={visibleRoutes} builderRoute={builderRoute}
          mapStyle={mapStyle}
        />
        {sidebarOpen && (
          <Sidebar
            places={places} pending={pending} editing={editing} activeId={activeId}
            onSave={handleSave} onCancel={handleCancel}
            onSelectPlace={handleSelectPlace}
            onEdit={place => { setEditing(place); setPending(null) }}
            onDelete={handleDelete}
            userLoc={userLoc} onGetLocation={handleGeolocate} locating={locating}
            onExportPDF={handleExportPDF} exporting={exporting}
            savedRoutes={savedRoutes} setSavedRoutes={setSavedRoutes}
            visibleRoutes={visibleRoutes} setVisibleRoutes={setVisibleRoutes}
            builderRoute={builderRoute} setBuilderRoute={setBuilderRoute}
            mapStyle={mapStyle} setMapStyle={setMapStyle}
            toast={toast}
          />
        )}
      </div>
      <ToastContainer toasts={toasts} />
    </div>
  )
}
