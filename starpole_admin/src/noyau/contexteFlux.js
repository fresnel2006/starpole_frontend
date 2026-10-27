import { createContext, useContext } from 'react'

// Toutes les alertes en direct et les nouvelles urgences, fournies par <FournisseurFluxAlertes>.
export const ContexteFlux = createContext(null)

export function useFluxAlertes() {
  return useContext(ContexteFlux)
}
