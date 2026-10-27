// Tests des règles Firestore sur l'émulateur : `npm run test:regles`.
// Les règles sont lues dans le projet Flutter (variable REGLES_FIRESTORE pour changer le chemin).
import { readFileSync } from 'node:fs'
import { after, before, beforeEach, describe, it } from 'node:test'
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing'
import {
  addDoc, collection, doc, getDoc, getDocs, limit, query, serverTimestamp,
  setDoc, updateDoc, deleteDoc, where,
} from 'firebase/firestore'

const CHEMIN_REGLES = process.env.REGLES_FIRESTORE
  ?? 'C:/Users/fresnel/StudioProjects/projet_starpole/firestore.rules'

let env

before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-starpole-regles',
    firestore: { rules: readFileSync(CHEMIN_REGLES, 'utf8') },
  })
})

after(async () => { await env.cleanup() })

// Données de départ, écrites sans règles.
beforeEach(async () => {
  await env.clearFirestore()
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore()
    for (const uid of ['alice', 'bob', 'chef']) {
      await setDoc(doc(db, 'utilisateurs', uid), { nom: uid, email: `${uid}@exemple.ci` })
      await setDoc(doc(db, 'utilisateurs', uid, 'appareils', `jeton-${uid}`), { plateforme: 'android' })
      await setDoc(doc(db, 'utilisateurs', uid, 'contacts', 'c1'), { nom: 'X', telephone: '0102' })
    }
    await setDoc(doc(db, 'alertes', 'a1'), {
      type: 'urgence', categorie: 'Malaise', description: 'd', ville: 'Abidjan',
      auteurId: 'alice', auteurNom: 'alice', statut: 'en_cours', aidantId: null,
    })
    await setDoc(doc(db, 'alertes', 'a1', 'progression', 'p1'), { texte: 'En route', auteurId: 'alice' })
    await setDoc(doc(db, 'avis', 'v1'), { alerteId: 'a1', deId: 'alice', pourId: 'bob', etoiles: 5, commentaire: '' })
    await setDoc(doc(db, 'conversations', 'alice_bob'), { participants: ['alice', 'bob'] })
    await setDoc(doc(db, 'conversations', 'alice_bob', 'messages', 'm1'), { texte: 'salut', auteurId: 'alice' })
    await setDoc(doc(db, 'appels', 'ap1'), { appelantId: 'alice', appeleId: 'bob', statut: 'sonne' })
    await setDoc(doc(db, 'appels', 'ap1', 'candidats', 'c1'), { de: 'alice' })
    await setDoc(doc(db, 'journal_admin', 'j1'), { adminId: 'chef', action: 'resoudre_alerte' })
  })
})

const admin = () => env.authenticatedContext('chef', { admin: true }).firestore()
const alice = () => env.authenticatedContext('alice').firestore()
const faussement = () => env.authenticatedContext('bob', { admin: 'true' }).firestore()
const anonyme = () => env.unauthenticatedContext().firestore()

describe('administrateur', () => {
  it('liste tous les profils, sans limite', async () => {
    await assertSucceeds(getDocs(collection(admin(), 'utilisateurs')))
  })
  it('lit alertes, progression et avis', async () => {
    const db = admin()
    await assertSucceeds(getDocs(collection(db, 'alertes')))
    await assertSucceeds(getDocs(collection(db, 'alertes', 'a1', 'progression')))
    await assertSucceeds(getDocs(collection(db, 'avis')))
  })
  it('lit le journal mais ne peut pas y écrire', async () => {
    const db = admin()
    await assertSucceeds(getDocs(collection(db, 'journal_admin')))
    await assertFails(addDoc(collection(db, 'journal_admin'), { action: 'x' }))
  })
  it("n'a aucun accès aux conversations, messages, appels, candidats", async () => {
    const db = admin()
    await assertFails(getDoc(doc(db, 'conversations', 'alice_bob')))
    await assertFails(getDocs(collection(db, 'conversations')))
    await assertFails(getDocs(collection(db, 'conversations', 'alice_bob', 'messages')))
    await assertFails(getDoc(doc(db, 'appels', 'ap1')))
    await assertFails(getDocs(collection(db, 'appels', 'ap1', 'candidats')))
  })
  it("n'a aucun accès aux appareils ni aux contacts", async () => {
    const db = admin()
    await assertFails(getDocs(collection(db, 'utilisateurs', 'alice', 'appareils')))
    await assertFails(getDocs(collection(db, 'utilisateurs', 'alice', 'contacts')))
  })
  it("ne peut pas modifier les données directement (tout passe par le serveur)", async () => {
    const db = admin()
    await assertFails(updateDoc(doc(db, 'alertes', 'a1'), { statut: 'resolue' }))
    await assertFails(deleteDoc(doc(db, 'alertes', 'a1')))
    await assertFails(updateDoc(doc(db, 'utilisateurs', 'alice'), { nom: 'Pirate' }))
  })
})

describe('utilisateur ordinaire (règles de l\'appli mobile inchangées)', () => {
  it('lit un profil et cherche au plus 30 profils', async () => {
    const db = alice()
    await assertSucceeds(getDoc(doc(db, 'utilisateurs', 'bob')))
    await assertSucceeds(getDocs(query(collection(db, 'utilisateurs'), where('nom', '==', 'bob'), limit(30))))
  })
  it('ne peut pas lister les profils sans limite ou au-delà de 30', async () => {
    const db = alice()
    await assertFails(getDocs(collection(db, 'utilisateurs')))
    await assertFails(getDocs(query(collection(db, 'utilisateurs'), limit(31))))
  })
  it("une revendication admin qui n'est pas le booléen true ne compte pas", async () => {
    await assertFails(getDocs(collection(faussement(), 'utilisateurs')))
    await assertFails(getDocs(collection(faussement(), 'journal_admin')))
  })
  it('ne lit pas le journal', async () => {
    await assertFails(getDocs(collection(alice(), 'journal_admin')))
    await assertFails(getDoc(doc(alice(), 'journal_admin', 'j1')))
  })
  it('garde ses accès habituels', async () => {
    const db = alice()
    await assertSucceeds(getDocs(collection(db, 'alertes')))
    await assertSucceeds(getDoc(doc(db, 'conversations', 'alice_bob')))
    await assertSucceeds(getDocs(collection(db, 'conversations', 'alice_bob', 'messages')))
    await assertSucceeds(getDoc(doc(db, 'appels', 'ap1')))
    await assertSucceeds(getDocs(collection(db, 'utilisateurs', 'alice', 'contacts')))
    await assertSucceeds(updateDoc(doc(db, 'utilisateurs', 'alice'), { nom: 'Alice K.' }))
    await assertSucceeds(updateDoc(doc(db, 'alertes', 'a1'), { statut: 'resolue', termineLe: serverTimestamp() }))
  })
  it("ne lit pas les conversations des autres", async () => {
    const db = env.authenticatedContext('carole').firestore()
    await assertFails(getDoc(doc(db, 'conversations', 'alice_bob')))
    await assertFails(getDocs(collection(db, 'utilisateurs', 'alice', 'contacts')))
  })
  it('un visiteur non connecté ne lit rien', async () => {
    await assertFails(getDoc(doc(anonyme(), 'utilisateurs', 'alice')))
    await assertFails(getDocs(collection(anonyme(), 'alertes')))
  })
})
