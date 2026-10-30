import { useEffect } from 'react'

const EVENEMENTS = ['pointerdown', 'keydown', 'wheel', 'touchstart']

// Déconnecte l'administrateur après `minutes` sans clic, frappe ni défilement.
export function useDeconnexionInactivite(deconnexion, minutes = 30) {
  useEffect(() => {
    let derniere = Date.now()
    const activite = () => { derniere = Date.now() }
    for (const e of EVENEMENTS) window.addEventListener(e, activite, { passive: true })
    const verification = setInterval(() => {
      if (Date.now() - derniere > minutes * 60000) {
        deconnexion(`Session fermée après ${minutes} minutes d'inactivité. Reconnectez-vous.`)
      }
    }, 30000)
    return () => {
      clearInterval(verification)
      for (const e of EVENEMENTS) window.removeEventListener(e, activite)
    }
  }, [deconnexion, minutes])
}
