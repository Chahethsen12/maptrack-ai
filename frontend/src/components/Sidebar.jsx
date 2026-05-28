import { useState } from 'react'
import PlaceForm from './PlaceForm'
import PlaceList from './PlaceList'
import DistancePanel from './DistancePanel'
import RoutesPanel from './RoutesPanel'
import SettingsPanel from './SettingsPanel'

const TABS = [
  { key: 'add',      icon: '＋', label: 'Add' },
  { key: 'list',     icon: '⊞',  label: 'Places' },
  { key: 'routes',   icon: '⬡',  label: 'Routes' },
  { key: 'dist',     icon: '⊿',  label: 'Dist.' },
  { key: 'settings', icon: '◈',  label: 'Map' },
]

export default function Sidebar({
  places, pending, editing, activeId,
  onSave, onCancel, onSelectPlace, onEdit, onDelete,
  userLoc, onGetLocation, locating,
  onExportPDF, exporting,
  savedRoutes, setSavedRoutes,
  visibleRoutes, setVisibleRoutes, builderRoute, setBuilderRoute,
  mapStyle, setMapStyle,
  toast,
}) {
  const [tab, setTab] = useState('list')
  const activeTab = (pending || editing) ? 'add' : tab

  function switchTab(key) {
    setTab(key)
    if (pending && key !== 'add') onCancel()
  }

  return (
    <div className="sidebar">
      {/* Pill navigator */}
      <div className="sidebar-nav">
        <div className="sidebar-nav-pills">
          {TABS.map(({ key, icon, label }) => {
            const isActive = activeTab === key
            const badge = key === 'list' && places.length > 0 ? places.length : null
            return (
              <button
                key={key}
                className={`nav-pill ${isActive ? 'active' : ''}`}
                onClick={() => switchTab(key)}
                title={label}
                aria-label={label + (badge ? ` (${badge} items)` : '')}
                aria-current={isActive ? 'page' : undefined}
              >
                <span className="nav-pill-icon" aria-hidden="true">{icon}</span>
                <span>{label}</span>
                {badge && (
                  <span style={{
                    position: 'absolute', top: 4, right: 4,
                    background: 'var(--teal)', color: '#07090e',
                    fontSize: 8, fontWeight: 800, width: 14, height: 14,
                    borderRadius: '50%', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    lineHeight: 1,
                  }}>
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Content */}
      <div className="sidebar-body" key={activeTab}>
        {activeTab === 'add' && (
          <PlaceForm pending={pending} editing={editing} onSave={onSave} onCancel={onCancel} toast={toast} />
        )}
        {activeTab === 'list' && (
          <PlaceList
            places={places} activeId={activeId}
            onSelect={p => { onSelectPlace(p); setTab('list') }}
            onEdit={p => { onEdit(p); setTab('add') }}
            onDelete={onDelete} toast={toast}
          />
        )}
        {activeTab === 'routes' && (
          <RoutesPanel
            places={places} userLoc={userLoc}
            savedRoutes={savedRoutes} setSavedRoutes={setSavedRoutes}
            visibleRoutes={visibleRoutes} setVisibleRoutes={setVisibleRoutes}
            builderRoute={builderRoute} setBuilderRoute={setBuilderRoute}
            toast={toast}
          />
        )}
        {activeTab === 'dist' && (
          <DistancePanel
            places={places} userLoc={userLoc}
            onGetLocation={onGetLocation} locating={locating}
            onExportPDF={onExportPDF} exporting={exporting}
          />
        )}
        {activeTab === 'settings' && (
          <SettingsPanel mapStyle={mapStyle} setMapStyle={setMapStyle} toast={toast} />
        )}
      </div>
    </div>
  )
}
