import { Suspense, useEffect, useState } from 'react'
import { NavLink, Outlet } from 'react-router'
import {
  Bell, LayoutDashboard, LogOut, Map as IconeCarte, ScrollText, Search, Star, Users,
} from 'lucide-react'
import { useAuth } from '../noyau/contexteAuth.js'
import { useFluxAlertes } from '../noyau/contexteFlux.js'
import { useDeconnexionInactivite } from '../noyau/useDeconnexionInactivite.js'
import Logo from '../composants/Logo.jsx'
import Avatar from '../composants/Avatar.jsx'
import RechercheRapide from '../composants/RechercheRapide.jsx'
import { Chargement } from '../composants/Etats.jsx'
import BandeauUrgences from './BandeauUrgences.jsx'

const LIENS = [
  { vers: '/', texte: 'Tableau de bord', icone: LayoutDashboard },
  { vers: '/alertes', texte: 'Alertes', icone: Bell },
  { vers: '/carte', texte: 'Carte', icone: IconeCarte },
  { vers: '/utilisateurs', texte: 'Utilisateurs', icone: Users },
  { vers: '/avis', texte: 'Avis', icone: Star },
  { vers: '/journal', texte: 'Journal', icone: ScrollText },
]

// Barre latérale à gauche, page courante à droite.
export default function MiseEnPage() {
  const { utilisateur, deconnexion } = useAuth()
  const { nouvelles } = useFluxAlertes()
  const [recherche, setRecherche] = useState(false)
  useDeconnexionInactivite(deconnexion)
  const nom = utilisateur.displayName || utilisateur.email

  // Ctrl+K (ou Cmd+K) ouvre la recherche rapide depuis n'importe quelle page.
  useEffect(() => {
    const touche = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setRecherche(true)
      }
    }
    window.addEventListener('keydown', touche)
    return () => window.removeEventListener('keydown', touche)
  }, [])

  return (
    <div className="structure">
      <aside className="barre-laterale">
        <NavLink to="/" className="logo" aria-label="Tableau de bord"><Logo taille={30} /></NavLink>
        <button className="bouton-recherche" onClick={() => setRecherche(true)} title="Recherche rapide (Ctrl+K)">
          <Search size={18} strokeWidth={1.75} />
          <span>Rechercher</span>
          <kbd>Ctrl K</kbd>
        </button>
        <nav className="navigation" aria-label="Navigation principale">
          {LIENS.map(({ vers, texte, icone: Icone }) => (
            <NavLink key={vers} to={vers} end={vers === '/'} title={texte}>
              <Icone size={20} strokeWidth={1.75} />
              <span>{texte}</span>
              {vers === '/alertes' && nouvelles.length > 0 && (
                <b className="pastille" aria-label={`${nouvelles.length} nouvelle(s) urgence(s)`}>{nouvelles.length}</b>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="admin-connecte">
          {utilisateur.photoURL
            ? <img className="avatar" src={utilisateur.photoURL} alt="" width={36} height={36} referrerPolicy="no-referrer" />
            : <Avatar nom={nom} />}
          <div className="identite">
            <p>{utilisateur.displayName || 'Administrateur'}</p>
            <p className="indication">{utilisateur.email}</p>
          </div>
          <button className="bouton icone" onClick={() => deconnexion()} title="Se déconnecter" aria-label="Se déconnecter">
            <LogOut size={18} />
          </button>
        </div>
      </aside>
      <main className="contenu">
        <Suspense fallback={<Chargement />}>
          <Outlet />
        </Suspense>
      </main>
      <BandeauUrgences />
      {recherche && <RechercheRapide surFermer={() => setRecherche(false)} />}
    </div>
  )
}
