import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { CENTRE_ABIDJAN } from '../noyau/referentiel.js'
import { COULEURS } from '../application/couleurs.js'
import { Erreur } from './Etats.jsx'

const JETON = import.meta.env.VITE_MAPBOX_JETON
const SOURCE = 'alertes'

// Repères -> GeoJSON (seules les alertes qui ont une position).
function versGeoJson(reperes) {
  return {
    type: 'FeatureCollection',
    features: reperes
      .filter((r) => typeof r.latitude === 'number' && typeof r.longitude === 'number')
      .map((r) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [r.longitude, r.latitude] },
        properties: { id: r.id, type: r.type, statut: r.statut === 'resolue' ? 'resolue' : 'en_cours', titre: r.titre ?? '' },
      })),
  }
}

const seul = ['!', ['has', 'point_count']]
const urgenceEnCours = ['all', seul, ['==', ['get', 'type'], 'urgence'], ['==', ['get', 'statut'], 'en_cours']]

function ajouterCouches(carte, regrouper) {
  carte.addSource(SOURCE, {
    type: 'geojson', data: versGeoJson([]), cluster: regrouper, clusterRadius: 45, clusterMaxZoom: 14,
  })
  // Groupes de repères proches, avec leur nombre.
  carte.addLayer({
    id: 'groupes', type: 'circle', source: SOURCE, filter: ['has', 'point_count'],
    paint: {
      'circle-color': COULEURS.texteSecondaire,
      'circle-radius': ['step', ['get', 'point_count'], 16, 10, 20, 50, 26],
      'circle-stroke-width': 3,
      'circle-stroke-color': '#FFFFFF',
    },
  })
  carte.addLayer({
    id: 'groupes-nombre', type: 'symbol', source: SOURCE, filter: ['has', 'point_count'],
    layout: { 'text-field': ['get', 'point_count_abbreviated'], 'text-font': ['DIN Pro Bold', 'Arial Unicode MS Bold'], 'text-size': 13 },
    paint: { 'text-color': '#FFFFFF' },
  })
  // Halo qui pulse autour des urgences en cours.
  carte.addLayer({
    id: 'halo', type: 'circle', source: SOURCE, filter: urgenceEnCours,
    paint: { 'circle-color': COULEURS.rouge, 'circle-radius': 14, 'circle-opacity': 0.25 },
  })
  // Repères seuls, colorés par type ; les alertes résolues sont atténuées.
  carte.addLayer({
    id: 'points', type: 'circle', source: SOURCE, filter: seul,
    paint: {
      'circle-color': ['match', ['get', 'type'], 'urgence', COULEURS.rouge, 'don', COULEURS.vert, 'service', COULEURS.bleu, COULEURS.texteSecondaire],
      'circle-radius': 8,
      'circle-stroke-width': 2,
      'circle-stroke-color': '#FFFFFF',
      'circle-opacity': ['case', ['==', ['get', 'statut'], 'resolue'], 0.45, 1],
      'circle-stroke-opacity': ['case', ['==', ['get', 'statut'], 'resolue'], 0.45, 1],
    },
  })
  // Anneau autour de l'alerte choisie.
  carte.addLayer({
    id: 'selection', type: 'circle', source: SOURCE, filter: ['==', ['get', 'id'], ''],
    paint: { 'circle-radius': 13, 'circle-color': 'rgba(0,0,0,0)', 'circle-stroke-width': 3, 'circle-stroke-color': COULEURS.texte },
  })
}

// Carte Mapbox centrée sur Abidjan. Le logo Mapbox et la mention
// « © Mapbox © OpenStreetMap » restent affichés (conditions d'utilisation).
// reperes : [{ id, latitude, longitude, type, statut, titre }]
// selection : l'alerte choisie ({ id, latitude, longitude }), entourée et centrée.
// cleCadrage : quand elle change (nouveaux filtres), la carte se recadre sur tous les repères.
export default function CarteAbidjan({ reperes, surClic, zoom = 11.5, centre, selection, regrouper = true, cleCadrage }) {
  const conteneur = useRef(null)
  const carte = useRef(null)
  const surClicActuel = useRef(surClic)
  const dernierCadrage = useRef(null)
  const [prete, setPrete] = useState(false)

  useEffect(() => { surClicActuel.current = surClic }, [surClic])

  // Création de la carte, une seule fois. Le centre, le zoom et le regroupement
  // ne servent qu'à l'ouverture.
  useEffect(() => {
    if (!JETON) return
    mapboxgl.accessToken = JETON
    const instance = new mapboxgl.Map({
      container: conteneur.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: centre ? [centre.longitude, centre.latitude] : [CENTRE_ABIDJAN.longitude, CENTRE_ABIDJAN.latitude],
      zoom,
      language: 'fr',
    })
    instance.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right')
    let animation = null

    instance.on('load', () => {
      ajouterCouches(instance, regrouper)

      // Clic sur un groupe : on zoome jusqu'à le séparer. Clic sur un repère : résumé.
      instance.on('click', 'groupes', (e) => {
        const groupe = e.features[0]
        instance.getSource(SOURCE).getClusterExpansionZoom(groupe.properties.cluster_id, (erreur, z) => {
          if (!erreur) instance.easeTo({ center: groupe.geometry.coordinates, zoom: z })
        })
      })
      instance.on('click', 'points', (e) => surClicActuel.current?.(e.features[0].properties))
      for (const couche of ['groupes', 'points']) {
        instance.on('mouseenter', couche, () => { instance.getCanvas().style.cursor = 'pointer' })
        instance.on('mouseleave', couche, () => { instance.getCanvas().style.cursor = '' })
      }

      // Pulsation du halo des urgences (désactivée si l'utilisateur réduit les animations).
      if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        const tourner = (temps) => {
          const t = (temps % 1600) / 1600
          instance.setPaintProperty('halo', 'circle-radius', 9 + t * 18)
          instance.setPaintProperty('halo', 'circle-opacity', 0.5 * (1 - t))
          animation = requestAnimationFrame(tourner)
        }
        animation = requestAnimationFrame(tourner)
      }
      setPrete(true)
    })

    carte.current = instance
    return () => {
      cancelAnimationFrame(animation)
      instance.remove()
      carte.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Données : mises à jour sans recréer la carte. Au premier affichage et à chaque
  // changement de filtres, on cadre la carte pour voir tous les repères.
  const idSelection = selection?.id
  useEffect(() => {
    if (!prete) return
    const donnees = versGeoJson(reperes)
    carte.current.getSource(SOURCE).setData(donnees)
    if (cleCadrage === undefined || idSelection || dernierCadrage.current === cleCadrage || !donnees.features.length) return
    dernierCadrage.current = cleCadrage
    const limites = new mapboxgl.LngLatBounds()
    for (const f of donnees.features) limites.extend(f.geometry.coordinates)
    carte.current.fitBounds(limites, { padding: 80, maxZoom: 15, duration: 600 })
  }, [prete, reperes, cleCadrage, idSelection])

  // Alerte choisie : anneau et centrage.
  const idChoisi = selection?.id ?? ''
  const latitude = selection?.latitude
  const longitude = selection?.longitude
  useEffect(() => {
    if (!prete) return
    carte.current.setFilter('selection', ['all', seul, ['==', ['get', 'id'], idChoisi]])
    if (idChoisi && typeof latitude === 'number' && typeof longitude === 'number') {
      carte.current.flyTo({ center: [longitude, latitude], zoom: Math.max(carte.current.getZoom(), 15) })
    }
  }, [prete, idChoisi, latitude, longitude])

  if (!JETON) {
    return <Erreur texte="Carte indisponible : le jeton Mapbox (VITE_MAPBOX_JETON) manque dans .env.local." />
  }
  return <div ref={conteneur} className="carte-mapbox" />
}
