import { STATUTS, TYPES } from '../noyau/referentiel.js'

export function BadgeType({ type }) {
  return <span className={`badge ${type}`}><span className="point" />{TYPES[type] ?? type ?? '-'}</span>
}

// L'appli mobile traite toute valeur autre que « resolue » comme « en cours ».
export function BadgeStatut({ statut }) {
  const valeur = statut === 'resolue' ? 'resolue' : 'en_cours'
  return <span className={`badge ${valeur}`}>{STATUTS[valeur]}</span>
}

export function BadgeCompte({ suspendu }) {
  return <span className={`badge ${suspendu ? 'suspendu' : 'actif'}`}>{suspendu ? 'Suspendu' : 'Actif'}</span>
}
