// Mise en forme des dates, durées et textes.

const formatDate = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
const formatDateHeure = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
})
const formatJourCourt = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short' })
const formatNombre = new Intl.NumberFormat('fr-FR')

export const date = (d) => (d ? formatDate.format(d) : '-')
export const dateHeure = (d) => (d ? formatDateHeure.format(d) : '-')
export const jourCourt = (d) => formatJourCourt.format(d)
export const nombre = (n) => (n == null ? '-' : formatNombre.format(n))

export function note(moyenne) {
  return moyenne == null ? '-' : moyenne.toFixed(1).replace('.', ',')
}

// « il y a 5 min », « il y a 3 h », « il y a 2 j »
export function depuis(d, maintenant = new Date()) {
  if (!d) return '-'
  const minutes = Math.round((maintenant - d) / 60000)
  if (minutes < 1) return "à l'instant"
  if (minutes < 60) return `il y a ${minutes} min`
  const heures = Math.round(minutes / 60)
  if (heures < 24) return `il y a ${heures} h`
  const jours = Math.round(heures / 24)
  if (jours < 31) return `il y a ${jours} j`
  return `le ${date(d)}`
}

// Durée en millisecondes : « 12 min », « 2 h 05 », « 3 j 4 h »
export function duree(ms) {
  if (ms == null || Number.isNaN(ms)) return '-'
  const minutes = Math.round(ms / 60000)
  if (minutes < 60) return `${minutes} min`
  const heures = Math.floor(minutes / 60)
  if (heures < 24) return `${heures} h ${String(minutes % 60).padStart(2, '0')}`
  return `${Math.floor(heures / 24)} j ${heures % 24} h`
}

// Minuscules sans accents, pour la recherche.
export function normaliser(texte) {
  return (texte ?? '').toString().normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
}

export function correspond(objet, recherche, champs) {
  const cherche = normaliser(recherche)
  return !cherche || champs.some((champ) => normaliser(objet[champ]).includes(cherche))
}

export const imageBase64 = (photo) => (photo ? `data:image/jpeg;base64,${photo}` : null)
