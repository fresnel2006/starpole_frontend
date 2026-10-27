import { auth } from './firebase.js'

// Appels aux routes /admin du serveur FastAPI. Le serveur vérifie le jeton et le rôle admin.
const URL_SERVEUR = (import.meta.env.VITE_URL_SERVEUR || 'https://starpole-backend.vercel.app').replace(/\/$/, '')

async function appeler(chemin, { methode = 'POST', corps } = {}) {
  const jeton = await auth.currentUser?.getIdToken()
  if (!jeton) throw new Error('Session expirée. Reconnectez-vous.')
  let reponse
  try {
    reponse = await fetch(URL_SERVEUR + chemin, {
      method: methode,
      headers: {
        Authorization: `Bearer ${jeton}`,
        ...(corps ? { 'Content-Type': 'application/json' } : {}),
      },
      body: corps ? JSON.stringify(corps) : undefined,
    })
  } catch {
    throw new Error('Serveur StarPole injoignable. Vérifiez la connexion ou le déploiement du serveur.')
  }
  const donnees = await reponse.json().catch(() => ({}))
  if (!reponse.ok) {
    throw new Error(donnees.erreur || `Erreur du serveur (${reponse.status}).`)
  }
  return donnees
}

export const supprimerAlerte = (id, motif) =>
  appeler(`/admin/alertes/${encodeURIComponent(id)}/supprimer`, { corps: { motif } })

export const resoudreAlerte = (id, motif) =>
  appeler(`/admin/alertes/${encodeURIComponent(id)}/resoudre`, { corps: { motif } })

export const suspendreUtilisateur = (uid, motif) =>
  appeler(`/admin/utilisateurs/${encodeURIComponent(uid)}/suspendre`, { corps: { motif } })

export const reactiverUtilisateur = (uid, motif) =>
  appeler(`/admin/utilisateurs/${encodeURIComponent(uid)}/reactiver`, { corps: { motif } })

// { suspendu, admin }
export const etatCompte = (uid) =>
  appeler(`/admin/utilisateurs/${encodeURIComponent(uid)}`, { methode: 'GET' })
