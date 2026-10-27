// Titre de l'onglet : « (2) Alertes - StarPole Admin ».
// Le nombre est celui des nouvelles urgences pas encore vues.
let titrePage = ''
let compteur = 0

function appliquer() {
  const base = titrePage ? `${titrePage} - StarPole Admin` : 'StarPole Admin'
  document.title = compteur ? `(${compteur}) ${base}` : base
}

export function definirTitrePage(titre) {
  titrePage = titre
  appliquer()
}

export function definirCompteur(nombre) {
  compteur = nombre
  appliquer()
}
