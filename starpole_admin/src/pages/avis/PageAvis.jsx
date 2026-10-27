import { useCallback } from 'react'
import { Link, useSearchParams } from 'react-router'
import EnTetePage from '../../composants/EnTetePage.jsx'
import Tableau from '../../composants/Tableau.jsx'
import Etoiles from '../../composants/Etoiles.jsx'
import BoutonExport from '../../composants/BoutonExport.jsx'
import { useChargement, usePagination } from '../../noyau/hooks.js'
import { nomsUtilisateurs, pageAvis, toutesLesPages } from '../../noyau/donnees.js'
import { dateHeure } from '../../noyau/format.js'

const FILTRES = {
  '': 'Toutes les notes',
  basses: 'Notes basses (1 et 2)',
  5: '5 étoiles', 4: '4 étoiles', 3: '3 étoiles', 2: '2 étoiles', 1: '1 étoile',
}

const chargerNoms = (cle) => nomsUtilisateurs(cle ? cle.split(',') : [])

// Avis + noms des personnes, pour le fichier CSV.
async function chargerExport(chargerPage) {
  const avis = await toutesLesPages(chargerPage)
  const noms = await nomsUtilisateurs(avis.flatMap((v) => [v.deId, v.pourId]))
  return avis.map((v) => ({ ...v, deNom: noms[v.deId], pourNom: noms[v.pourId] }))
}

const COLONNES_EXPORT = [
  { titre: 'Étoiles', valeur: (v) => v.etoiles },
  { titre: 'Commentaire', valeur: (v) => v.commentaire },
  { titre: 'Étiquettes', valeur: (v) => (v.etiquettes ?? []).join(', ') },
  { titre: 'Donné par', valeur: (v) => v.deNom },
  { titre: 'Pour', valeur: (v) => v.pourNom },
  { titre: 'Alerte', valeur: (v) => v.alerteId },
  { titre: 'Date', valeur: (v) => v.creeLe },
]

export default function PageAvis() {
  const [parametres, setParametres] = useSearchParams()
  const filtre = FILTRES[parametres.get('filtre')] ? parametres.get('filtre') : ''
  const setFiltre = (valeur) => setParametres(valeur ? { filtre: valeur } : {}, { replace: true })
  const chargerPage = useCallback((curseur) => pageAvis(filtre, curseur), [filtre])
  const pagination = usePagination(chargerPage)
  const cle = pagination.elements.flatMap((v) => [v.deId, v.pourId]).join(',')
  const { donnees: noms } = useChargement(chargerNoms, cle)

  const personne = (uid) => (uid
    ? <Link className="lien" to={`/utilisateurs/${uid}`}>{noms?.[uid] ?? '...'}</Link>
    : '-')

  const colonnes = [
    { cle: 'etoiles', titre: 'Note', rendu: (v) => <Etoiles valeur={v.etoiles} /> },
    { cle: 'commentaire', titre: 'Commentaire', rendu: (v) => <div className="tronque" title={v.commentaire}>{v.commentaire || <span className="indication">Sans commentaire</span>}</div> },
    {
      cle: 'etiquettes', titre: 'Étiquettes',
      rendu: (v) => (v.etiquettes?.length
        ? <div className="etiquettes">{v.etiquettes.map((e) => <span key={e} className="badge">{e}</span>)}</div>
        : '-'),
    },
    { cle: 'de', titre: 'Donné par', rendu: (v) => personne(v.deId) },
    { cle: 'pour', titre: 'Pour', rendu: (v) => personne(v.pourId) },
    { cle: 'alerte', titre: 'Alerte', rendu: (v) => (v.alerteId ? <Link className="lien" to={`/alertes/${v.alerteId}`}>Voir</Link> : '-') },
    { cle: 'creeLe', titre: 'Date', rendu: (v) => <span className="nombre">{dateHeure(v.creeLe)}</span> },
  ]

  return (
    <>
      <EnTetePage titre="Avis" sousTitre="Notes laissées après une alerte. Les notes de 1 et 2 sont mises en avant.">
        <BoutonExport nomFichier="avis" colonnes={COLONNES_EXPORT} charger={() => chargerExport(chargerPage)} />
      </EnTetePage>
      <div className="filtres">
        <select className="champ" value={filtre} onChange={(e) => setFiltre(e.target.value)} aria-label="Filtrer par note">
          {Object.entries(FILTRES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>
      <Tableau
        colonnes={colonnes}
        lignes={pagination.elements}
        enCours={pagination.enCours}
        erreur={pagination.erreur}
        vide="Aucun avis."
        classeLigne={(v) => (v.etoiles <= 2 ? 'alerte-note' : '')}
        pagination={pagination}
      />
    </>
  )
}
