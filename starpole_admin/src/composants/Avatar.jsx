import { imageBase64 } from '../noyau/format.js'

function initiales(nom) {
  const mots = (nom ?? '').trim().split(/\s+/).filter(Boolean)
  return (mots.slice(0, 2).map((m) => m[0]).join('') || '?').toUpperCase()
}

// Photo de profil (base64) ou initiales.
export default function Avatar({ photo, nom, taille = 36 }) {
  const style = { width: taille, height: taille, fontSize: taille * 0.38 }
  return photo
    ? <img className="avatar" src={imageBase64(photo)} alt="" style={style} loading="lazy" />
    : <span className="avatar" style={style} aria-hidden="true">{initiales(nom)}</span>
}
