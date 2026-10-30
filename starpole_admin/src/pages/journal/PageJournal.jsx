import { Link } from 'react-router'
import EnTetePage from '../../composants/EnTetePage.jsx'
import Tableau from '../../composants/Tableau.jsx'
import { useChargement, usePagination } from '../../noyau/hooks.js'
import { PROFIL_ABSENT, nomsUtilisateurs, pageJournal } from '../../noyau/donnees.js'
import { useAuth } from '../../noyau/contexteAuth.js'
import { ACTIONS_JOURNAL, ADMIN_IA } from '../../noyau/referentiel.js'
import { dateHeure } from '../../noyau/format.js'

const chargerNoms = (cle) => nomsUtilisateurs(cle ? cle.split(',') : [])

// « alertes/abc » -> lien vers la page de l'alerte (même si elle a été supprimée).
function Cible({ cible, noms }) {
  const [collection, id] = (cible ?? '').split('/')
  if (collection === 'alertes') return <Link className="lien" to={`/alertes/${id}`}>Alerte {id}</Link>
  if (collection === 'utilisateurs') return <Link className="lien" to={`/utilisateurs/${id}`}>{noms?.[id] ?? id}</Link>
  return cible || '-'
}

export default function PageJournal() {
  const pagination = usePagination(pageJournal)
  const cle = pagination.elements
    .flatMap((e) => [e.adminId === ADMIN_IA ? null : e.adminId, e.cible?.startsWith('utilisateurs/') ? e.cible.split('/')[1] : null])
    .filter(Boolean).join(',')
  const { donnees: noms } = useChargement(chargerNoms, cle)
  const { utilisateur } = useAuth()

  // Un admin n'a pas forcément de profil dans l'appli : on affiche alors son nom de connexion.
  function nomAdmin(uid) {
    if (uid === ADMIN_IA) return 'Vérification IA'
    const nom = noms?.[uid]
    if (nom !== PROFIL_ABSENT) return nom ?? '...'
    return uid === utilisateur.uid ? utilisateur.displayName || utilisateur.email : 'Administrateur'
  }

  const colonnes = [
    { cle: 'date', titre: 'Date', rendu: (e) => <span className="nombre">{dateHeure(e.date)}</span> },
    { cle: 'admin', titre: 'Administrateur', rendu: (e) => nomAdmin(e.adminId) },
    { cle: 'action', titre: 'Action', rendu: (e) => <span className="titre-cellule">{ACTIONS_JOURNAL[e.action] ?? e.action}</span> },
    { cle: 'cible', titre: 'Cible', rendu: (e) => <Cible cible={e.cible} noms={noms} /> },
    { cle: 'motif', titre: 'Motif', rendu: (e) => <div className="tronque" title={e.motif}>{e.motif}</div> },
  ]

  return (
    <>
      <EnTetePage titre="Journal" sousTitre="Actions des administrateurs, de la plus récente à la plus ancienne." />
      <Tableau
        colonnes={colonnes}
        lignes={pagination.elements}
        enCours={pagination.enCours}
        erreur={pagination.erreur}
        vide="Aucune action enregistrée."
        pagination={pagination}
      />
    </>
  )
}
