// Valeurs fixes des données Firestore, lues telles quelles par l'appli mobile.

export const TYPES = {
  urgence: 'Urgence',
  don: 'Don',
  service: 'Service',
}

export const STATUTS = {
  en_cours: 'En cours',
  resolue: 'Résolue',
}

// Les quartiers (communes) proposés par l'appli mobile.
export const QUARTIERS = [
  'Plateau', 'Treichville', 'Marcory', 'Koumassi',
  'Cocody', 'Yopougon', 'Adjamé', 'Abobo',
]

// Centre de la carte : Abidjan.
export const CENTRE_ABIDJAN = { longitude: -4.0083, latitude: 5.3484 }

export const PERIODES = {
  '': 'Toute période',
  7: '7 derniers jours',
  30: '30 derniers jours',
  90: '90 derniers jours',
}

// Libellés des actions du journal.
export const ACTIONS_JOURNAL = {
  supprimer_alerte: 'Alerte supprimée',
  resoudre_alerte: 'Alerte marquée résolue',
  suspendre_utilisateur: 'Compte suspendu',
  reactiver_utilisateur: 'Compte réactivé',
}
