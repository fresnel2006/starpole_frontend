import { createContext, useContext } from 'react'

// État de connexion de l'administrateur, fourni par <FournisseurAuth>.
export const ContexteAuth = createContext(null)

export function useAuth() {
  return useContext(ContexteAuth)
}
