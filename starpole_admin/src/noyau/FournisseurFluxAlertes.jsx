import { useCallback, useEffect, useState } from 'react'
import { ecouterAlertes } from './donnees.js'
import { definirCompteur } from './titre.js'
import { ContexteFlux } from './contexteFlux.js'

// Une seule écoute en direct de la collection `alertes` (sans les photos), partagée par
// le tableau de bord, la carte, la recherche rapide et l'annonce des nouvelles urgences.
export default function FournisseurFluxAlertes({ children }) {
  const [etat, setEtat] = useState({ alertes: [], enCours: true, erreur: null })
  const [nouvellesIds, setNouvellesIds] = useState([])

  useEffect(() => {
    let connues = null
    return ecouterAlertes(
      (alertes) => {
        // Après le premier chargement, toute urgence en cours jamais vue est « nouvelle ».
        if (connues) {
          const arrivees = alertes
            .filter((a) => !connues.has(a.id) && a.type === 'urgence' && a.statut !== 'resolue')
            .map((a) => a.id)
          if (arrivees.length) setNouvellesIds((ids) => [...arrivees, ...ids])
        }
        connues = new Set(alertes.map((a) => a.id))
        setEtat({ alertes, enCours: false, erreur: null })
      },
      (erreur) => setEtat({ alertes: [], enCours: false, erreur }),
    )
  }, [])

  // Une urgence supprimée ou résolue entre-temps n'est plus annoncée.
  const nouvelles = nouvellesIds
    .map((id) => etat.alertes.find((a) => a.id === id))
    .filter((a) => a && a.statut !== 'resolue')

  useEffect(() => { definirCompteur(nouvelles.length) }, [nouvelles.length])

  // Fonctions stables : les pages les utilisent dans des effets.
  const marquerVue = useCallback((id) => {
    setNouvellesIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : ids))
  }, [])
  const marquerToutesVues = useCallback(() => setNouvellesIds((ids) => (ids.length ? [] : ids)), [])

  const valeur = { ...etat, nouvelles, marquerVue, marquerToutesVues }
  return <ContexteFlux.Provider value={valeur}>{children}</ContexteFlux.Provider>
}
