import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

// Configuration web Firebase, lue dans .env.local (jamais dans le code).
const configuration = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const OBLIGATOIRES = ['apiKey', 'authDomain', 'projectId', 'appId']

export const configurationManquante = OBLIGATOIRES
  .filter((cle) => !configuration[cle])
  .map((cle) => 'VITE_FIREBASE_' + cle.replace(/[A-Z]/g, (l) => '_' + l).toUpperCase())

const app = configurationManquante.length ? null : initializeApp(configuration)

export const auth = app ? getAuth(app) : null
export const db = app ? getFirestore(app) : null
