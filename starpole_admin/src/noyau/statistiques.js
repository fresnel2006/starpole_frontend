// Statistiques du tableau de bord, calculées dans le navigateur à partir de la liste
// des alertes. Fonctions pures, sans Firebase : faciles à déplacer plus tard dans
// une route FastAPI.
import { QUARTIERS, TYPES } from './referentiel.js'

const UN_JOUR = 86400000

const estEnCours = (a) => a.statut !== 'resolue'

const debutDuJour = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate())

export function compteurs(alertes) {
  return {
    enCours: alertes.filter(estEnCours).length,
    resolues: alertes.filter((a) => a.statut === 'resolue').length,
    urgencesEnCours: alertes.filter((a) => a.type === 'urgence' && estEnCours(a)).length,
  }
}

// [{ jour: Date, nombre }] pour les `jours` derniers jours (aujourd'hui compris).
export function alertesParJour(alertes, jours = 30, maintenant = new Date()) {
  const fin = debutDuJour(maintenant)
  const serie = Array.from({ length: jours }, (_, i) => ({
    jour: new Date(fin.getTime() - (jours - 1 - i) * UN_JOUR),
    nombre: 0,
  }))
  const index = new Map(serie.map((p, i) => [p.jour.getTime(), i]))
  for (const a of alertes) {
    if (!a.creeLe) continue
    const i = index.get(debutDuJour(a.creeLe).getTime())
    if (i !== undefined) serie[i].nombre += 1
  }
  return serie
}

// [{ type, libelle, nombre }] dans l'ordre fixe urgence, don, service.
export function repartitionParType(alertes) {
  return Object.entries(TYPES).map(([type, libelle]) => ({
    type, libelle, nombre: alertes.filter((a) => a.type === type).length,
  }))
}

// [{ quartier, nombre }] triés du plus grand au plus petit ; les quartiers inconnus
// sont regroupés dans « Autres », les alertes sans quartier dans « Non précisé ».
export function alertesParQuartier(alertes) {
  const totaux = new Map(QUARTIERS.map((q) => [q, 0]))
  let autres = 0
  let nonPrecise = 0
  for (const a of alertes) {
    if (!a.quartier) nonPrecise += 1
    else if (totaux.has(a.quartier)) totaux.set(a.quartier, totaux.get(a.quartier) + 1)
    else autres += 1
  }
  const resultat = [...totaux].map(([quartier, nombre]) => ({ quartier, nombre }))
    .sort((x, y) => y.nombre - x.nombre)
  if (autres) resultat.push({ quartier: 'Autres', nombre: autres })
  if (nonPrecise) resultat.push({ quartier: 'Non précisé', nombre: nonPrecise })
  return resultat
}

function moyenne(valeurs) {
  return valeurs.length ? valeurs.reduce((s, v) => s + v, 0) / valeurs.length : null
}

// Délais moyens en millisecondes (null s'il n'y a aucune donnée).
// Prise en charge : accepteLe - creeLe. Résolution : termineLe - creeLe.
export function delaisMoyens(alertes) {
  const ecart = (fin) => alertes
    .filter((a) => a.creeLe && a[fin] && a[fin] >= a.creeLe)
    .map((a) => a[fin] - a.creeLe)
  const priseEnCharge = ecart('accepteLe')
  const resolution = ecart('termineLe')
  return {
    priseEnCharge: moyenne(priseEnCharge),
    nombrePrisesEnCharge: priseEnCharge.length,
    resolution: moyenne(resolution),
    nombreResolutions: resolution.length,
  }
}

// Éléments dont le champ `champ` tombe dans les `jours` derniers jours. Avec `decalage = 1`,
// la période d'avant (pour comparer).
export function dansPeriode(elements, jours, champ = 'creeLe', decalage = 0, maintenant = new Date()) {
  const fin = maintenant.getTime() - decalage * jours * UN_JOUR
  const debut = fin - jours * UN_JOUR
  return elements.filter((e) => e[champ] && e[champ].getTime() > debut && e[champ].getTime() <= fin)
}

// Évolution en pourcentage (null si la période d'avant est vide).
export function evolution(actuel, precedent) {
  if (actuel == null || precedent == null || precedent === 0) return null
  return Math.round(((actuel - precedent) / precedent) * 100)
}

// Comptes qui ont reçu au moins `minimum` notes basses (1 ou 2 étoiles), les plus notés d'abord.
// avisBas : [{ pourId, etoiles, creeLe }]
export function utilisateursASurveiller(avisBas, minimum = 2) {
  const parCompte = new Map()
  for (const avis of avisBas) {
    if (!avis.pourId) continue
    const c = parCompte.get(avis.pourId) ?? { uid: avis.pourId, nombre: 0, somme: 0, dernier: null }
    c.nombre += 1
    c.somme += avis.etoiles
    if (avis.creeLe && (!c.dernier || avis.creeLe > c.dernier)) c.dernier = avis.creeLe
    parCompte.set(avis.pourId, c)
  }
  return [...parCompte.values()]
    .filter((c) => c.nombre >= minimum)
    .map(({ somme, ...c }) => ({ ...c, moyenne: somme / c.nombre }))
    .sort((x, y) => y.nombre - x.nombre || (y.dernier ?? 0) - (x.dernier ?? 0))
}

export function dernieresUrgencesEnCours(alertes, nombre = 5) {
  return alertes
    .filter((a) => a.type === 'urgence' && estEnCours(a))
    .sort((x, y) => (y.creeLe ?? 0) - (x.creeLe ?? 0))
    .slice(0, nombre)
}
