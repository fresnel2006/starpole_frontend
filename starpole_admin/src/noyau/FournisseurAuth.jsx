import { useCallback, useEffect, useState } from 'react'
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from 'firebase/auth'
import { auth } from './firebase.js'
import { ContexteAuth } from './contexteAuth.js'

const REFUS = 'Accès réservé aux administrateurs.'

// Messages en français pour les erreurs Firebase les plus courantes.
const MESSAGES = {
  'auth/invalid-credential': 'Adresse e-mail ou mot de passe incorrect.',
  'auth/invalid-email': 'Adresse e-mail invalide.',
  'auth/user-disabled': 'Ce compte est désactivé.',
  'auth/too-many-requests': 'Trop de tentatives. Réessayez dans quelques minutes.',
  'auth/network-request-failed': 'Connexion internet indisponible.',
  'auth/popup-blocked': 'La fenêtre de connexion Google a été bloquée par le navigateur.',
  'auth/unauthorized-domain': "Cette adresse n'est pas autorisée dans Firebase Authentication.",
  'auth/operation-not-allowed': "Ce mode de connexion n'est pas activé dans Firebase.",
}

function messageErreur(erreur) {
  return MESSAGES[erreur?.code] ?? 'Connexion impossible. Réessayez.'
}

// Fournit l'administrateur connecté. Un compte sans la revendication `admin: true`
// est aussitôt déconnecté.
export default function FournisseurAuth({ children }) {
  const [etat, setEtat] = useState({ statut: 'chargement', utilisateur: null, refus: null })

  useEffect(() => onAuthStateChanged(auth, async (utilisateur) => {
    if (!utilisateur) {
      setEtat((precedent) => ({ statut: 'deconnecte', utilisateur: null, refus: precedent.refus }))
      return
    }
    try {
      // `true` : on relit le jeton pour voir un rôle donné ou retiré récemment.
      const jeton = await utilisateur.getIdTokenResult(true)
      if (jeton.claims.admin === true) {
        setEtat({ statut: 'admin', utilisateur, refus: null })
      } else {
        setEtat({ statut: 'deconnecte', utilisateur: null, refus: REFUS })
        await signOut(auth)
      }
    } catch (erreur) {
      setEtat({ statut: 'deconnecte', utilisateur: null, refus: messageErreur(erreur) })
      await signOut(auth)
    }
  }), [])

  // `message` : raison affichée sur la page de connexion (session expirée, par exemple).
  // Fonction stable : la déconnexion pour inactivité l'utilise dans un effet.
  const deconnexion = useCallback((message = null) => {
    setEtat((e) => ({ ...e, refus: message }))
    return signOut(auth)
  }, [])

  const valeur = {
    ...etat,
    async connexionGoogle() {
      setEtat((e) => ({ ...e, refus: null }))
      try {
        await signInWithPopup(auth, new GoogleAuthProvider())
      } catch (erreur) {
        if (erreur?.code !== 'auth/popup-closed-by-user' && erreur?.code !== 'auth/cancelled-popup-request') {
          setEtat((e) => ({ ...e, refus: messageErreur(erreur) }))
        }
      }
    },
    async connexionEmail(email, motDePasse) {
      setEtat((e) => ({ ...e, refus: null }))
      try {
        await signInWithEmailAndPassword(auth, email.trim(), motDePasse)
      } catch (erreur) {
        setEtat((e) => ({ ...e, refus: messageErreur(erreur) }))
      }
    },
    deconnexion,
  }

  return <ContexteAuth.Provider value={valeur}>{children}</ContexteAuth.Provider>
}
