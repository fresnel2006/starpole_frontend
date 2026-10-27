import { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router'
import { useAuth } from '../../noyau/contexteAuth.js'
import Logo from '../../composants/Logo.jsx'
import { definirTitrePage } from '../../noyau/titre.js'

function IconeGoogle() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  )
}

export default function PageConnexion() {
  const { statut, refus, connexionGoogle, connexionEmail } = useAuth()
  const [email, setEmail] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const location = useLocation()
  useEffect(() => { definirTitrePage('Connexion') }, [])

  if (statut === 'admin') return <Navigate to={location.state?.depuis ?? '/'} replace />

  async function avec(action) {
    setEnvoi(true)
    await action()
    setEnvoi(false)
  }

  return (
    <div className="page-connexion">
      <div className="carte boite-connexion">
        <Logo taille={40} />
        <div>
          <h2>Console d'administration</h2>
          <p className="secondaire">Accès réservé aux administrateurs de StarPole.</p>
        </div>

        {refus && <p className="message-erreur" role="alert">{refus}</p>}

        <button className="bouton large" onClick={() => avec(connexionGoogle)} disabled={envoi}>
          <IconeGoogle /> Continuer avec Google
        </button>

        <div className="separateur">ou</div>

        <form
          className="pile"
          onSubmit={(e) => { e.preventDefault(); avec(() => connexionEmail(email, motDePasse)) }}
        >
          <label className="etiquette-champ">
            Adresse e-mail
            <input className="champ" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label className="etiquette-champ">
            Mot de passe
            <input className="champ" type="password" autoComplete="current-password" required value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} />
          </label>
          <button className="bouton principal large" type="submit" disabled={envoi}>
            {envoi ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  )
}
