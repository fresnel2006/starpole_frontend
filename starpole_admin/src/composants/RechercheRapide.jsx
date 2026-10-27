import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { Bell, Search, User } from 'lucide-react'
import { useFluxAlertes } from '../noyau/contexteFlux.js'
import { pageUtilisateurs } from '../noyau/donnees.js'
import { correspond, depuis } from '../noyau/format.js'
import { TYPES } from '../noyau/referentiel.js'

const MAXIMUM = 6

// Fenêtre de recherche (Ctrl+K) : alertes (déjà en mémoire) et utilisateurs (Firestore).
export default function RechercheRapide({ surFermer }) {
  const navigate = useNavigate()
  const { alertes } = useFluxAlertes()
  const [texte, setTexte] = useState('')
  const [trouves, setTrouves] = useState({ cle: '', liste: [] })
  const [actif, setActif] = useState(0)
  const cherche = texte.trim()

  // Les utilisateurs sont cherchés 300 ms après la dernière frappe.
  useEffect(() => {
    if (!cherche) return
    let enVie = true
    const minuteur = setTimeout(() => {
      pageUtilisateurs(cherche, null)
        .then((page) => enVie && setTrouves({ cle: cherche, liste: page.elements.slice(0, MAXIMUM) }))
        .catch(() => enVie && setTrouves({ cle: cherche, liste: [] }))
    }, 300)
    return () => { enVie = false; clearTimeout(minuteur) }
  }, [cherche])

  const resultatsAlertes = cherche
    ? alertes
      .filter((a) => correspond(a, cherche, ['categorie', 'auteurNom', 'aidantNom', 'quartier']))
      .sort((x, y) => (y.creeLe ?? 0) - (x.creeLe ?? 0))
      .slice(0, MAXIMUM)
      .map((a) => ({
        cle: `a-${a.id}`, icone: Bell, titre: a.categorie || 'Sans titre',
        detail: `${TYPES[a.type] ?? ''} - ${a.quartier || a.ville || ''} - ${depuis(a.creeLe)}`, vers: `/alertes/${a.id}`,
      }))
    : []
  const utilisateursAJour = trouves.cle === cherche
  const resultatsUtilisateurs = cherche && utilisateursAJour
    ? trouves.liste.map((u) => ({
      cle: `u-${u.id}`, icone: User, titre: u.nom || 'Sans nom',
      detail: [u.email, u.telephone].filter(Boolean).join(' - '), vers: `/utilisateurs/${u.id}`,
    }))
    : []
  const resultats = [...resultatsAlertes, ...resultatsUtilisateurs]
  const indexActif = Math.min(actif, Math.max(resultats.length - 1, 0))

  function ouvrir(resultat) {
    navigate(resultat.vers)
    surFermer()
  }

  function touche(e) {
    if (e.key === 'Escape') surFermer()
    else if (e.key === 'ArrowDown') { e.preventDefault(); setActif((indexActif + 1) % Math.max(resultats.length, 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActif((indexActif - 1 + resultats.length) % Math.max(resultats.length, 1)) }
    else if (e.key === 'Enter' && resultats[indexActif]) ouvrir(resultats[indexActif])
  }

  const groupe = (titre, liste, decalage) => liste.length > 0 && (
    <>
      <p className="recherche-groupe">{titre}</p>
      {liste.map((r, i) => {
        const Icone = r.icone
        return (
          <button
            key={r.cle}
            type="button"
            className={`recherche-resultat ${decalage + i === indexActif ? 'actif' : ''}`}
            onMouseEnter={() => setActif(decalage + i)}
            onClick={() => ouvrir(r)}
          >
            <Icone size={18} strokeWidth={1.75} />
            <span style={{ minWidth: 0 }}>
              <span className="titre-cellule">{r.titre}</span>
              <span className="indication recherche-detail">{r.detail}</span>
            </span>
          </button>
        )
      })}
    </>
  )

  return (
    <div className="voile voile-haut" onMouseDown={(e) => e.target === e.currentTarget && surFermer()}>
      <div className="modale recherche" role="dialog" aria-modal="true" aria-label="Recherche rapide">
        <label className="recherche-champ">
          <Search size={20} />
          <input
            autoFocus
            value={texte}
            onChange={(e) => { setTexte(e.target.value); setActif(0) }}
            onKeyDown={touche}
            placeholder="Chercher une alerte ou un utilisateur"
            aria-label="Chercher une alerte ou un utilisateur"
          />
          <kbd>Échap</kbd>
        </label>
        <div className="recherche-liste">
          {!cherche && <p className="indication recherche-vide">Titre, auteur ou quartier d'une alerte ; nom, e-mail ou téléphone d'un utilisateur.</p>}
          {groupe('Alertes', resultatsAlertes, 0)}
          {groupe('Utilisateurs', resultatsUtilisateurs, resultatsAlertes.length)}
          {cherche && !utilisateursAJour && <p className="indication recherche-vide">Recherche des utilisateurs...</p>}
          {cherche && utilisateursAJour && !resultats.length && <p className="indication recherche-vide">Aucun résultat.</p>}
        </div>
      </div>
    </div>
  )
}
