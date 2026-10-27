import { useEffect, useState } from 'react'

// Charge des données : appelle `charger(parametre)` (une promesse) et relance quand
// `charger` ou `parametre` changent. `charger` doit être stable (useCallback ou hors composant).
export function useChargement(charger, parametre) {
  const [version, setVersion] = useState(0)
  const [etat, setEtat] = useState({ cle: null, donnees: null, erreur: null })

  useEffect(() => {
    let actif = true
    const cle = { charger, parametre, version }
    charger(parametre).then(
      (donnees) => actif && setEtat({ cle, donnees, erreur: null }),
      (erreur) => actif && setEtat({ cle, donnees: null, erreur }),
    )
    return () => { actif = false }
  }, [charger, parametre, version])

  const aJour = etat.cle?.charger === charger && etat.cle?.parametre === parametre
  return {
    // Pendant un rechargement, on garde les anciennes données à l'écran.
    donnees: aJour ? etat.donnees : null,
    erreur: aJour ? etat.erreur : null,
    enCours: !aJour || etat.cle.version !== version,
    recharger: () => setVersion((v) => v + 1),
  }
}

// Pagination par curseur : `chargerPage(curseur)` renvoie { elements, curseurSuivant }.
// Revient à la première page quand `chargerPage` change (nouveaux filtres).
export function usePagination(chargerPage) {
  const [source, setSource] = useState(() => chargerPage)
  const [curseurs, setCurseurs] = useState([null])
  if (source !== chargerPage) {
    setSource(() => chargerPage)
    setCurseurs([null])
  }

  const { donnees, erreur, enCours, recharger } = useChargement(chargerPage, curseurs[curseurs.length - 1])
  const curseurSuivant = donnees?.curseurSuivant
  return {
    elements: donnees?.elements ?? [],
    erreur,
    enCours,
    recharger,
    page: curseurs.length,
    aPrecedente: curseurs.length > 1,
    aSuivante: Boolean(curseurSuivant),
    suivante: () => curseurSuivant && setCurseurs((c) => [...c, curseurSuivant]),
    precedente: () => setCurseurs((c) => (c.length > 1 ? c.slice(0, -1) : c)),
  }
}
