// Lecture des données Firestore pour la console (lecture seule : les modifications
// passent par le serveur, voir serveur.js). Jamais de lecture des conversations ni des appels.
import {
  Timestamp, average, collection, count, doc, getAggregateFromServer,
  getCountFromServer, getDoc, getDocs, limit, onSnapshot, orderBy, query,
  startAfter, where,
} from 'firebase/firestore'
import { db } from './firebase.js'
import { correspond } from './format.js'

export const TAILLE_PAGE = 20

// Document Firestore -> objet simple, avec les dates converties en Date.
function versObjet(instantane) {
  const objet = { id: instantane.id }
  for (const [cle, valeur] of Object.entries(instantane.data())) {
    objet[cle] = valeur instanceof Timestamp ? valeur.toDate() : valeur
  }
  return objet
}

const ilYA = (jours) => Timestamp.fromDate(new Date(Date.now() - jours * 86400000))

// Une page de `TAILLE_PAGE` éléments. Avec un `filtre` (recherche de texte, que
// Firestore ne sait pas faire), on lit lot après lot jusqu'à remplir la page.
async function pageFiltree(reference, contraintes, curseur, filtre) {
  const elements = []
  let dernier = curseur
  for (;;) {
    const lot = await getDocs(query(
      reference, ...contraintes, ...(dernier ? [startAfter(dernier)] : []), limit(TAILLE_PAGE),
    ))
    for (const instantane of lot.docs) {
      dernier = instantane
      const objet = versObjet(instantane)
      if (!filtre || filtre(objet)) elements.push(objet)
      if (elements.length === TAILLE_PAGE) return { elements, curseurSuivant: instantane }
    }
    if (lot.docs.length < TAILLE_PAGE) return { elements, curseurSuivant: null }
  }
}

// ---------- Alertes ----------

// Toutes les alertes en direct, sans la photo (lourde) : pour les statistiques et la carte.
export function ecouterAlertes(surDonnees, surErreur) {
  return onSnapshot(
    collection(db, 'alertes'),
    (resultat) => surDonnees(resultat.docs.map((d) => {
      const { photo, ...alerte } = versObjet(d)
      return { ...alerte, aPhoto: Boolean(photo) }
    })),
    surErreur,
  )
}

// filtres : { type, statut, quartier, jours, recherche }
export function pageAlertes(filtres, curseur) {
  const contraintes = []
  if (filtres.type) contraintes.push(where('type', '==', filtres.type))
  if (filtres.statut) contraintes.push(where('statut', '==', filtres.statut))
  if (filtres.quartier) contraintes.push(where('quartier', '==', filtres.quartier))
  if (filtres.jours) contraintes.push(where('creeLe', '>=', ilYA(Number(filtres.jours))))
  contraintes.push(orderBy('creeLe', 'desc'))
  const filtre = filtres.recherche
    ? (a) => correspond(a, filtres.recherche, ['categorie', 'auteurNom', 'aidantNom'])
    : null
  return pageFiltree(collection(db, 'alertes'), contraintes, curseur, filtre)
}

export async function lireAlerte(id) {
  const instantane = await getDoc(doc(db, 'alertes', id))
  return instantane.exists() ? versObjet(instantane) : null
}

export async function progressionAlerte(id) {
  const resultat = await getDocs(query(collection(db, 'alertes', id, 'progression'), orderBy('creeLe')))
  return resultat.docs.map(versObjet)
}

export async function avisDeLAlerte(id) {
  const resultat = await getDocs(query(collection(db, 'avis'), where('alerteId', '==', id)))
  return resultat.docs.map(versObjet)
}

// Alertes publiées (role = 'auteurId') ou aidées (role = 'aidantId') par un utilisateur.
export async function alertesDeUtilisateur(uid, role) {
  const resultat = await getDocs(query(
    collection(db, 'alertes'), where(role, '==', uid), orderBy('creeLe', 'desc'), limit(TAILLE_PAGE),
  ))
  return resultat.docs.map(versObjet)
}

// ---------- Utilisateurs ----------

export function pageUtilisateurs(recherche, curseur) {
  const filtre = recherche ? (u) => correspond(u, recherche, ['nom', 'email', 'telephone']) : null
  return pageFiltree(collection(db, 'utilisateurs'), [orderBy('creeLe', 'desc')], curseur, filtre)
}

export async function lireUtilisateur(uid) {
  const instantane = await getDoc(doc(db, 'utilisateurs', uid))
  return instantane.exists() ? versObjet(instantane) : null
}

// Nombre d'alertes publiées, d'aides et note moyenne reçue (requêtes d'agrégation, légères).
export async function chiffresUtilisateur(uid) {
  const [alertes, aides, avis] = await Promise.all([
    getCountFromServer(query(collection(db, 'alertes'), where('auteurId', '==', uid))),
    getCountFromServer(query(collection(db, 'alertes'), where('aidantId', '==', uid))),
    getAggregateFromServer(query(collection(db, 'avis'), where('pourId', '==', uid)), {
      moyenne: average('etoiles'), nombre: count(),
    }),
  ])
  return {
    alertes: alertes.data().count,
    aides: aides.data().count,
    noteMoyenne: avis.data().nombre ? avis.data().moyenne : null,
    nombreAvis: avis.data().nombre,
  }
}

// Noms des utilisateurs, mis en cache (un profil contient une photo : on évite de le relire).
// Un compte sans profil (par exemple un admin qui n'utilise que la console) donne PROFIL_ABSENT.
export const PROFIL_ABSENT = 'Profil introuvable'
const cacheNoms = new Map()

export async function nomsUtilisateurs(uids) {
  const uniques = [...new Set(uids.filter(Boolean))]
  await Promise.all(uniques.map((uid) => {
    if (!cacheNoms.has(uid)) {
      cacheNoms.set(uid, getDoc(doc(db, 'utilisateurs', uid))
        .then((d) => (d.exists() ? d.data().nom || d.data().email || 'Sans nom' : PROFIL_ABSENT))
        .catch(() => 'Inconnu'))
    }
    return cacheNoms.get(uid)
  }))
  const noms = {}
  for (const uid of uniques) noms[uid] = await cacheNoms.get(uid)
  return noms
}

// ---------- Avis ----------

// filtre : '' (tous), '1' à '5', ou 'basses' (1 et 2)
export function pageAvis(filtre, curseur) {
  const contraintes = []
  if (filtre === 'basses') contraintes.push(where('etoiles', 'in', [1, 2]))
  else if (filtre) contraintes.push(where('etoiles', '==', Number(filtre)))
  contraintes.push(orderBy('creeLe', 'desc'))
  return pageFiltree(collection(db, 'avis'), contraintes, curseur)
}

// Avis reçus (sens = 'pourId') ou donnés (sens = 'deId').
export async function avisUtilisateur(uid, sens) {
  const resultat = await getDocs(query(
    collection(db, 'avis'), where(sens, '==', uid), orderBy('creeLe', 'desc'), limit(TAILLE_PAGE),
  ))
  return resultat.docs.map(versObjet)
}

// ---------- Journal ----------

export function pageJournal(curseur) {
  return pageFiltree(collection(db, 'journal_admin'), [orderBy('date', 'desc')], curseur)
}

// ---------- Chiffres du tableau de bord ----------

// Requête sur une période : les `jours` derniers jours, ou la période d'avant (decalage = 1).
const periode = (champ, jours, decalage) => [
  where(champ, '>', ilYA(jours * (decalage + 1))),
  ...(decalage ? [where(champ, '<=', ilYA(jours * decalage))] : []),
]

const AGREGAT_AVIS = { moyenne: average('etoiles'), nombre: count() }
const moyenneOuNull = (r) => (r.data().nombre ? r.data().moyenne : null)

// Chiffres sur les utilisateurs et les avis, avec la période choisie et celle d'avant.
export async function chiffresGeneraux(jours) {
  const utilisateurs = collection(db, 'utilisateurs')
  const avis = collection(db, 'avis')
  // Chiffres secondaires (évolutions) : s'ils échouent (index en cours de création,
  // par exemple), on les masque sans faire échouer les chiffres principaux.
  const facultatif = (promesse) => promesse.catch(() => null)
  const [inscrits, actifs, tousAvis, nouveaux, nouveauxAvant, avisPeriode, avisAvant] = await Promise.all([
    getCountFromServer(utilisateurs),
    getCountFromServer(query(utilisateurs, where('vuLe', '>=', ilYA(1)))),
    getAggregateFromServer(avis, AGREGAT_AVIS),
    facultatif(getCountFromServer(query(utilisateurs, ...periode('creeLe', jours, 0)))),
    facultatif(getCountFromServer(query(utilisateurs, ...periode('creeLe', jours, 1)))),
    // La moyenne filtrée par date demande l'index composé avis (creeLe, etoiles).
    facultatif(getAggregateFromServer(query(avis, ...periode('creeLe', jours, 0)), AGREGAT_AVIS)),
    facultatif(getAggregateFromServer(query(avis, ...periode('creeLe', jours, 1)), AGREGAT_AVIS)),
  ])
  return {
    inscrits: inscrits.data().count,
    actifs: actifs.data().count,
    noteMoyenne: moyenneOuNull(tousAvis),
    nombreAvis: tousAvis.data().nombre,
    nouveaux: nouveaux?.data().count ?? null,
    nouveauxAvant: nouveauxAvant?.data().count ?? null,
    notePeriode: avisPeriode ? moyenneOuNull(avisPeriode) : null,
    noteAvant: avisAvant ? moyenneOuNull(avisAvant) : null,
  }
}

// Notes de 1 et 2 étoiles (au plus 500, les plus récentes), pour repérer les comptes à surveiller.
export async function avisBas() {
  const resultat = await getDocs(query(
    collection(db, 'avis'), where('etoiles', 'in', [1, 2]), orderBy('creeLe', 'desc'), limit(500),
  ))
  return resultat.docs.map(versObjet)
}

// ---------- Export ----------

// Lit toutes les pages d'une liste paginée (pour l'export), au plus `maximum` éléments.
export async function toutesLesPages(chargerPage, maximum = 5000) {
  const elements = []
  let curseur = null
  do {
    const page = await chargerPage(curseur)
    elements.push(...page.elements)
    curseur = page.curseurSuivant
  } while (curseur && elements.length < maximum)
  return elements
}
