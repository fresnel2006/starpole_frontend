# Console d'administration StarPole

Console web réservée aux administrateurs de StarPole : tableau de bord, alertes (liste, détail, modération), carte d'Abidjan, utilisateurs, avis et journal des actions.

React (Vite, JavaScript), React Router, Firebase JS SDK (Auth et Firestore), Recharts, Mapbox GL JS. Les administrateurs ne lisent jamais les conversations, les messages ni les appels.

Points pratiques :

- **Nouvelles urgences en direct** : bandeau en bas à droite, compteur rouge sur « Alertes », nombre dans le titre de l'onglet, et bouton « Sur la carte ».
- **Recherche rapide** : `Ctrl+K` partout (alertes et utilisateurs), flèches et Entrée pour ouvrir.
- **Tableau de bord** : période de 7, 30 ou 90 jours avec l'évolution par rapport à la période d'avant, comptes à surveiller (au moins 2 notes de 1 ou 2 étoiles), bouton « Imprimer » (enregistrable en PDF).
- **Export CSV** (ouvrable dans Excel) sur Alertes, Utilisateurs et Avis, avec les filtres en cours.
- **Carte** : filtres type, statut et quartier, repères proches regroupés, lien direct vers une alerte (`/carte?alerte=<id>`).
- Les liens directs (une alerte, une période...) sont conservés après la connexion.

## 1. Installer et lancer

```bash
npm install
cp .env.exemple .env.local     # PowerShell : Copy-Item .env.exemple .env.local
npm run dev                    # http://localhost:5173
```

Remplissez `.env.local` (ignoré par Git) :

- **Configuration Firebase web** : console Firebase > projet `starpole-3d84d` > Paramètres du projet > Vos applications. S'il n'y a pas encore d'application **Web**, ajoutez-en une (icône `</>`), puis copiez les valeurs `apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId`.
- **Jeton Mapbox public** (`pk.`) : compte Mapbox > Tokens. Limitez-le aux adresses de la console (URL restrictions).
- `VITE_URL_SERVEUR` : adresse du serveur FastAPI (par défaut `https://starpole-backend.vercel.app`).

Autres commandes : `npm run build` (dossier `dist/`), `npm run lint`, `npm run preview`.

## 2. Activer la connexion dans Firebase

Console Firebase > Authentication :

1. **Sign-in method** : activez **Google** et, si besoin, **Adresse e-mail/Mot de passe**.
2. **Settings > Authorized domains** : `localhost` y est déjà ; ajoutez l'adresse de la console une fois hébergée.

## 3. Donner le rôle administrateur

Un administrateur est un compte Firebase qui porte la revendication `admin: true`. Sans elle, la console affiche « Accès réservé aux administrateurs » et déconnecte.

1. Connectez-vous une première fois à la console avec le compte voulu (le compte est alors créé, puis refusé).
2. Téléchargez une clé du compte de service (console Firebase > Paramètres du projet > Comptes de service > Générer une nouvelle clé privée). Rangez-la **hors du dépôt**. Ne la commitez jamais.
3. Lancez, en local :

```bash
pip install firebase-admin
python outils/role_admin.py donner  adresse@exemple.com --cle C:/chemin/vers/cle.json
python outils/role_admin.py voir    adresse@exemple.com --cle C:/chemin/vers/cle.json
python outils/role_admin.py retirer adresse@exemple.com --cle C:/chemin/vers/cle.json
```

4. Reconnectez-vous à la console.

## 4. Règles Firestore

Les règles et les index sont dans le projet Flutter (`projet_starpole/firestore.rules` et `firestore.indexes.json`). La fonction `estAdmin()` donne aux admins la lecture de `utilisateurs` (sans la limite de 30), `alertes`, `progression`, `avis` et `journal_admin`, et rien sur les conversations, messages, appels, candidats, appareils et contacts.

Tests sur l'émulateur (demande **Java 21** ou plus) :

```bash
npm run test:regles
```

Déploiement (depuis le projet Flutter) :

```bash
firebase deploy --only firestore:rules,firestore:indexes --project starpole-3d84d
```

Les nouveaux index mettent quelques minutes à se construire. Si une combinaison de filtres demande un index manquant, la console affiche le message de Firestore avec le lien pour le créer.

## 5. Serveur FastAPI

Les modifications (supprimer ou résoudre une alerte, suspendre ou réactiver un compte) passent par les routes `/admin/...` du serveur, qui vérifie le rôle et écrit dans `journal_admin`. Sur Vercel, ajoutez la variable `ORIGINES_ADMIN` avec l'adresse de la console (par exemple `https://starpole-admin.web.app,http://localhost:5173`) pour autoriser les appels du navigateur (CORS), puis redéployez.

## 6. Héberger (gratuit)

Firebase Hosting (forfait Spark) :

```bash
npm run build
firebase deploy --only hosting --project starpole-3d84d
```

Ou Vercel : importez le dossier, commande `npm run build`, dossier `dist`, et ajoutez les variables `VITE_...` dans les réglages du projet.

## 7. Organisation du code

```
src/
  application/   thème (theme.css), couleurs, routes (Application.jsx), mise en page (barre latérale)
  noyau/         firebase.js, authentification, accès aux données (donnees.js),
                 statistiques (statistiques.js), appels au serveur (serveur.js), hooks
  pages/         connexion, tableau-de-bord, alertes, carte, utilisateurs, avis, journal
  composants/    tableau, carte de chiffre, badges, modale de confirmation, carte Mapbox...
outils/          role_admin.py (rôle administrateur, à lancer en local)
tests-regles/    tests des règles Firestore (émulateur)
```

Les statistiques sont calculées dans le navigateur (`noyau/statistiques.js`, fonctions pures) : on pourra les déplacer dans une route FastAPI quand les volumes grandiront.
