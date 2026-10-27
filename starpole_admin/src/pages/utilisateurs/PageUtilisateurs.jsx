import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { Search } from 'lucide-react'
import EnTetePage from '../../composants/EnTetePage.jsx'
import Tableau from '../../composants/Tableau.jsx'
import Avatar from '../../composants/Avatar.jsx'
import BoutonExport from '../../composants/BoutonExport.jsx'
import { useChargement, usePagination } from '../../noyau/hooks.js'
import { chiffresUtilisateur, pageUtilisateurs, toutesLesPages } from '../../noyau/donnees.js'
import { date, depuis, nombre, note } from '../../noyau/format.js'

const COLONNES_EXPORT = [
  { titre: 'Nom', valeur: (u) => u.nom },
  { titre: 'E-mail', valeur: (u) => u.email },
  { titre: 'Téléphone', valeur: (u) => u.telephone },
  { titre: 'Inscription', valeur: (u) => u.creeLe },
  { titre: 'Dernière présence', valeur: (u) => u.vuLe },
  { titre: 'Identifiant', valeur: (u) => u.id },
]

// Chiffres de chaque utilisateur de la page (requêtes d'agrégation en parallèle).
async function chiffresDesUtilisateurs(cle) {
  const uids = cle ? cle.split(',') : []
  const resultats = await Promise.all(uids.map((uid) => chiffresUtilisateur(uid).catch(() => null)))
  return Object.fromEntries(uids.map((uid, i) => [uid, resultats[i]]))
}

export default function PageUtilisateurs() {
  const navigate = useNavigate()
  const [parametres, setParametres] = useSearchParams()
  const filtre = parametres.get('recherche') ?? ''
  const chargerPage = useCallback((curseur) => pageUtilisateurs(filtre, curseur), [filtre])
  const pagination = usePagination(chargerPage)

  const cleUids = pagination.elements.map((u) => u.id).join(',')
  const { donnees: chiffres } = useChargement(chiffresDesUtilisateurs, cleUids)
  const valeur = (uid, cle, format = nombre) => {
    const c = chiffres?.[uid]
    return c === undefined ? <span className="indication">...</span> : (c ? format(c[cle]) : '-')
  }

  const [recherche, setRecherche] = useState(filtre)
  useEffect(() => {
    if (recherche === filtre) return
    const minuteur = setTimeout(() => {
      setParametres(recherche.trim() ? { recherche: recherche.trim() } : {}, { replace: true })
    }, 400)
    return () => clearTimeout(minuteur)
  })

  const colonnes = [
    {
      cle: 'nom', titre: 'Utilisateur',
      rendu: (u) => (
        <div className="personne">
          <Avatar photo={u.photo} nom={u.nom} />
          <span className="titre-cellule">{u.nom || 'Sans nom'}</span>
        </div>
      ),
    },
    { cle: 'email', titre: 'E-mail', rendu: (u) => u.email || '-' },
    { cle: 'telephone', titre: 'Téléphone', rendu: (u) => u.telephone || '-' },
    { cle: 'creeLe', titre: 'Inscription', rendu: (u) => <span className="nombre">{date(u.creeLe)}</span> },
    { cle: 'vuLe', titre: 'Dernière présence', rendu: (u) => depuis(u.vuLe) },
    { cle: 'alertes', titre: 'Alertes', rendu: (u) => <span className="nombre">{valeur(u.id, 'alertes')}</span> },
    { cle: 'aides', titre: 'Aides', rendu: (u) => <span className="nombre">{valeur(u.id, 'aides')}</span> },
    { cle: 'note', titre: 'Note', rendu: (u) => <span className="nombre">{valeur(u.id, 'noteMoyenne', note)}</span> },
  ]

  return (
    <>
      <EnTetePage titre="Utilisateurs" sousTitre="Comptes inscrits, du plus récent au plus ancien.">
        <BoutonExport nomFichier="utilisateurs" colonnes={COLONNES_EXPORT} charger={() => toutesLesPages(chargerPage)} />
      </EnTetePage>
      <div className="filtres">
        <label className="champ-recherche">
          <Search size={16} />
          <input
            className="champ"
            type="search"
            placeholder="Nom, e-mail ou téléphone"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            aria-label="Rechercher un utilisateur"
          />
        </label>
      </div>
      <Tableau
        colonnes={colonnes}
        lignes={pagination.elements}
        enCours={pagination.enCours}
        erreur={pagination.erreur}
        vide="Aucun utilisateur trouvé."
        surClic={(u) => navigate(`/utilisateurs/${u.id}`)}
        pagination={pagination}
      />
    </>
  )
}
