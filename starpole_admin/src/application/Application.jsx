import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router'
import FournisseurAuth from '../noyau/FournisseurAuth.jsx'
import FournisseurFluxAlertes from '../noyau/FournisseurFluxAlertes.jsx'
import { useAuth } from '../noyau/contexteAuth.js'
import { configurationManquante } from '../noyau/firebase.js'
import { Chargement } from '../composants/Etats.jsx'
import MiseEnPage from './MiseEnPage.jsx'
import ConfigurationManquante from './ConfigurationManquante.jsx'
import PageConnexion from '../pages/connexion/PageConnexion.jsx'

// Pages chargées à la demande (la carte Mapbox et les graphiques sont lourds).
const PageTableauDeBord = lazy(() => import('../pages/tableau-de-bord/PageTableauDeBord.jsx'))
const PageAlertes = lazy(() => import('../pages/alertes/PageAlertes.jsx'))
const PageDetailAlerte = lazy(() => import('../pages/alertes/PageDetailAlerte.jsx'))
const PageCarte = lazy(() => import('../pages/carte/PageCarte.jsx'))
const PageUtilisateurs = lazy(() => import('../pages/utilisateurs/PageUtilisateurs.jsx'))
const PageFicheUtilisateur = lazy(() => import('../pages/utilisateurs/PageFicheUtilisateur.jsx'))
const PageAvis = lazy(() => import('../pages/avis/PageAvis.jsx'))
const PageJournal = lazy(() => import('../pages/journal/PageJournal.jsx'))

// Seul un administrateur connecté voit les pages ; sinon, retour à la connexion,
// qui ramènera ensuite à la page demandée (lien direct vers une alerte, par exemple).
function RouteProtegee() {
  const { statut, utilisateur } = useAuth()
  const location = useLocation()
  if (statut === 'chargement') return <div className="page-connexion"><Chargement texte="Vérification du compte..." /></div>
  if (statut !== 'admin') return <Navigate to="/connexion" replace state={{ depuis: location }} />
  // `key` : l'écoute en direct repart de zéro si un autre compte se connecte.
  return <FournisseurFluxAlertes key={utilisateur.uid}><MiseEnPage /></FournisseurFluxAlertes>
}

function Routage() {
  return (
    <Suspense fallback={<Chargement />}>
      <Routes>
        <Route path="/connexion" element={<PageConnexion />} />
        <Route element={<RouteProtegee />}>
          <Route index element={<PageTableauDeBord />} />
          <Route path="alertes" element={<PageAlertes />} />
          <Route path="alertes/:id" element={<PageDetailAlerte />} />
          <Route path="carte" element={<PageCarte />} />
          <Route path="utilisateurs" element={<PageUtilisateurs />} />
          <Route path="utilisateurs/:uid" element={<PageFicheUtilisateur />} />
          <Route path="avis" element={<PageAvis />} />
          <Route path="journal" element={<PageJournal />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Suspense>
  )
}

export default function Application() {
  if (configurationManquante.length) return <ConfigurationManquante variables={configurationManquante} />
  return (
    <BrowserRouter>
      <FournisseurAuth>
        <Routage />
      </FournisseurAuth>
    </BrowserRouter>
  )
}
