import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { Search } from 'lucide-react'
import EnTetePage from '../../composants/EnTetePage.jsx'
import Tableau from '../../composants/Tableau.jsx'
import BoutonExport from '../../composants/BoutonExport.jsx'
import { BadgeStatut, BadgeType } from '../../composants/Badges.jsx'
import { usePagination } from '../../noyau/hooks.js'
import { pageAlertes, toutesLesPages } from '../../noyau/donnees.js'
import { PERIODES, QUARTIERS, STATUTS, TYPES } from '../../noyau/referentiel.js'
import { dateHeure, imageBase64 } from '../../noyau/format.js'

// Colonnes du fichier CSV (sans les photos).
const COLONNES_EXPORT = [
  { titre: 'Titre', valeur: (a) => a.categorie },
  { titre: 'Type', valeur: (a) => TYPES[a.type] ?? a.type },
  { titre: 'Statut', valeur: (a) => STATUTS[a.statut === 'resolue' ? 'resolue' : 'en_cours'] },
  { titre: 'Quartier', valeur: (a) => a.quartier },
  { titre: 'Ville', valeur: (a) => a.ville },
  { titre: 'Auteur', valeur: (a) => a.auteurNom },
  { titre: 'Aidant', valeur: (a) => a.aidantNom },
  { titre: 'Publiée le', valeur: (a) => a.creeLe },
  { titre: 'Prise en charge le', valeur: (a) => a.accepteLe },
  { titre: 'Terminée le', valeur: (a) => a.termineLe },
  { titre: 'Latitude', valeur: (a) => a.latitude },
  { titre: 'Longitude', valeur: (a) => a.longitude },
  { titre: 'Description', valeur: (a) => a.description },
  { titre: 'Identifiant', valeur: (a) => a.id },
]

const FILTRES = ['type', 'statut', 'quartier', 'jours', 'recherche']

const COLONNES = [
  {
    cle: 'photo', titre: '',
    rendu: (a) => (a.photo ? <img className="vignette" src={imageBase64(a.photo)} alt="" loading="lazy" /> : <span className="vignette" />),
  },
  { cle: 'categorie', titre: 'Titre', rendu: (a) => <span className="titre-cellule">{a.categorie || 'Sans titre'}</span> },
  { cle: 'type', titre: 'Type', rendu: (a) => <BadgeType type={a.type} /> },
  { cle: 'statut', titre: 'Statut', rendu: (a) => <BadgeStatut statut={a.statut} /> },
  { cle: 'lieu', titre: 'Lieu', rendu: (a) => [a.quartier, a.ville].filter(Boolean).join(', ') || '-' },
  { cle: 'auteurNom', titre: 'Auteur', rendu: (a) => a.auteurNom || '-' },
  { cle: 'aidantNom', titre: 'Aidant', rendu: (a) => a.aidantNom || <span className="indication">Personne</span> },
  { cle: 'creeLe', titre: 'Date', rendu: (a) => <span className="nombre">{dateHeure(a.creeLe)}</span> },
]

// Liste paginée des alertes. Les filtres sont dans l'adresse (?type=urgence...).
export default function PageAlertes() {
  const navigate = useNavigate()
  const [parametres, setParametres] = useSearchParams()
  const cleFiltres = FILTRES.map((f) => parametres.get(f) ?? '').join('|')
  const filtres = useMemo(() => {
    const valeurs = cleFiltres.split('|')
    return Object.fromEntries(FILTRES.map((f, i) => [f, valeurs[i]]))
  }, [cleFiltres])

  const chargerPage = useCallback((curseur) => pageAlertes(filtres, curseur), [filtres])
  const pagination = usePagination(chargerPage)

  function changer(nom, valeur) {
    setParametres((p) => {
      const suivant = new URLSearchParams(p)
      if (valeur) suivant.set(nom, valeur)
      else suivant.delete(nom)
      return suivant
    }, { replace: true })
  }

  // La recherche part 400 ms après la dernière frappe.
  const [recherche, setRecherche] = useState(filtres.recherche)
  useEffect(() => {
    if (recherche === filtres.recherche) return
    const minuteur = setTimeout(() => changer('recherche', recherche.trim()), 400)
    return () => clearTimeout(minuteur)
  })

  const choix = (nom, libelleTous, options) => (
    <select className="champ" value={filtres[nom]} onChange={(e) => changer(nom, e.target.value)} aria-label={libelleTous}>
      <option value="">{libelleTous}</option>
      {Object.entries(options).map(([valeur, libelle]) => <option key={valeur} value={valeur}>{libelle}</option>)}
    </select>
  )

  return (
    <>
      <EnTetePage titre="Alertes" sousTitre="Urgences, dons et services publiés dans l'appli.">
        <BoutonExport nomFichier="alertes" colonnes={COLONNES_EXPORT} charger={() => toutesLesPages(chargerPage)} />
      </EnTetePage>
      <div className="filtres">
        <label className="champ-recherche">
          <Search size={16} />
          <input
            className="champ"
            type="search"
            placeholder="Rechercher un titre ou un auteur"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            aria-label="Rechercher un titre ou un auteur"
          />
        </label>
        {choix('type', 'Tous les types', TYPES)}
        {choix('statut', 'Tous les statuts', STATUTS)}
        {choix('quartier', 'Tous les quartiers', Object.fromEntries(QUARTIERS.map((q) => [q, q])))}
        {choix('jours', PERIODES[''], Object.fromEntries(Object.entries(PERIODES).filter(([k]) => k)))}
      </div>
      <Tableau
        colonnes={COLONNES}
        lignes={pagination.elements}
        enCours={pagination.enCours}
        erreur={pagination.erreur}
        vide="Aucune alerte ne correspond à ces filtres."
        surClic={(a) => navigate(`/alertes/${a.id}`)}
        pagination={pagination}
      />
    </>
  )
}
