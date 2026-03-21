import { useState, useCallback, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, useMap, useMapEvents, Marker } from 'react-leaflet'
import L from 'leaflet'
import Supercluster from 'supercluster'
import { useNavigate } from 'react-router-dom'
import { useDeliveries } from '../hooks/useDeliveries'
import { GlassCard } from '../components/GlassCard'
import type { Delivery } from '../types'

// ── Custom Marker Icons ───────────────────────────
const createIcon = (color: string, label?: number) =>
  L.divIcon({
    className: '',
    html: `
      <div style="
        width:${label ? 40 : 32}px;height:${label ? 40 : 32}px;
        background:${color};border:2.5px solid white;
        border-radius:50%;display:flex;align-items:center;justify-content:center;
        font-size:${label ? '13px' : '16px'};font-weight:bold;color:white;
        box-shadow:0 2px 8px rgba(0,0,0,0.3);cursor:pointer;
        transition:transform 0.1s;
      ">
        ${label ? label : '📦'}
      </div>
    `,
    iconSize: label ? [40, 40] : [32, 32],
    iconAnchor: label ? [20, 20] : [16, 16],
  })

const deliveryIcon = createIcon('#22c55e')

// ── Clustered Markers ─────────────────────────────
interface ClusteredMarkersProps {
  deliveries: Delivery[]
  onSelect: (d: Delivery) => void
}

function ClusteredMarkers({ deliveries, onSelect }: ClusteredMarkersProps) {
  const map = useMap()
  const [markers, setMarkers] = useState<JSX.Element[]>([])
  const scRef = useRef<Supercluster | null>(null)

  const updateClusters = useCallback(() => {
    if (!scRef.current) return
    const bounds = map.getBounds()
    const zoom = map.getZoom()

    const clusters = scRef.current.getClusters(
      [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()],
      zoom
    )

    const els = clusters.map(cluster => {
      const [lng, lat] = cluster.geometry.coordinates
      const { cluster: isCluster, cluster_id, point_count, delivery_id } = cluster.properties as {
        cluster: boolean
        cluster_id?: number
        point_count?: number
        delivery_id?: string
      }

      if (isCluster && cluster_id !== undefined) {
        const icon = createIcon('#0ea5e9', point_count)
        return (
          <Marker
            key={`c-${cluster_id}`}
            position={[lat, lng]}
            icon={icon}
            eventHandlers={{
              click: () => {
                const z = scRef.current!.getClusterExpansionZoom(cluster_id)
                map.flyTo([lat, lng], z, { animate: true, duration: 0.5 })
              }
            }}
          />
        )
      }

      const delivery = deliveries.find(d => d.id === delivery_id)
      if (!delivery) return null

      return (
        <Marker
          key={`d-${delivery.id}`}
          position={[delivery.lat, delivery.lng]}
          icon={deliveryIcon}
          eventHandlers={{ click: () => onSelect(delivery) }}
        />
      )
    }).filter(Boolean) as JSX.Element[]

    setMarkers(els)
  }, [map, deliveries, onSelect])

  useEffect(() => {
    const sc = new Supercluster({ radius: 60, maxZoom: 16 })
    sc.load(deliveries.map(d => ({
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: [d.lng, d.lat] },
      properties: { delivery_id: d.id },
    })))
    scRef.current = sc
    updateClusters()
  }, [deliveries, updateClusters])

  useMapEvents({ zoomend: updateClusters, moveend: updateClusters })

  return <>{markers.map(m => m)}</>
}

// ── Map Page ──────────────────────────────────────
export function MapPage() {
  const { deliveries, isLoading } = useDeliveries()
  const [selected, setSelected] = useState<Delivery | null>(null)
  const navigate = useNavigate()

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={[35.6762, 139.6503]}
        zoom={5}
        className="w-full h-full z-0"
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='© <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
        />
        <ClusteredMarkers deliveries={deliveries} onSelect={setSelected} />
        <ZoomControl />
      </MapContainer>

      {/* Count Badge */}
      {!isLoading && deliveries.length > 0 && (
        <div className="absolute top-20 left-3 z-10">
          <GlassCard className="px-3 py-1.5">
            <span className="text-xs font-semibold text-brand-700">
              📍 {deliveries.length}件
            </span>
          </GlassCard>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-10">
          <GlassCard className="px-4 py-2.5 flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-gray-600">読み込み中...</span>
          </GlassCard>
        </div>
      )}

      {/* Bottom Sheet */}
      {selected && (
        <div
          className="absolute bottom-28 left-0 right-0 z-10 px-4 animate-slide-up"
          onClick={() => setSelected(null)}
        >
          <div onClick={e => e.stopPropagation()}>
            <GlassCard className="p-4">
              {/* Drag handle */}
              <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-3" />

              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-brand-100 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                  📦
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 truncate">{selected.name}</h3>
                  <p className="text-sm text-gray-500">{selected.prefecture}</p>
                  <p className="text-xs text-brand-600 font-medium mt-0.5">{selected.product}</p>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="text-gray-400 text-lg"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-gray-500 mt-2 pl-15">📍 {selected.address}</p>

              <button
                onClick={() => navigate(`/delivery/${selected.id}`)}
                className="
                  w-full mt-3 py-2.5 bg-brand-500 text-white rounded-xl
                  font-semibold text-sm active:scale-[0.98] transition-transform
                "
              >
                詳細を見る →
              </button>
            </GlassCard>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Zoom Control ──────────────────────────────────
function ZoomControl() {
  const map = useMap()
  return (
    <div className="absolute bottom-36 right-3 z-10 flex flex-col gap-1">
      <button
        onClick={() => map.zoomIn()}
        className="w-9 h-9 bg-white/90 backdrop-blur-sm rounded-xl shadow-md text-gray-700 font-bold text-lg flex items-center justify-center active:scale-90 transition-transform"
      >
        +
      </button>
      <button
        onClick={() => map.zoomOut()}
        className="w-9 h-9 bg-white/90 backdrop-blur-sm rounded-xl shadow-md text-gray-700 font-bold text-lg flex items-center justify-center active:scale-90 transition-transform"
      >
        −
      </button>
      <button
        onClick={() => map.locate({ setView: true, maxZoom: 14 })}
        className="w-9 h-9 bg-white/90 backdrop-blur-sm rounded-xl shadow-md text-gray-700 text-base flex items-center justify-center active:scale-90 transition-transform"
      >
        🎯
      </button>
    </div>
  )
}
