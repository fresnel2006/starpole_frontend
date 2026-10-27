// Étoile StarPole à 8 branches (4 grandes, 4 petites en diagonale) et le nom « Star » « Pole ».
export function Etoile({ taille = 32 }) {
  return (
    <svg width={taille} height={taille} viewBox="-100 -100 200 200" aria-hidden="true">
      <g fill="var(--rouge)">
        {[0, 90, 180, 270].map((angle) => (
          <path key={angle} d="M0-100 14-38 0-6-14-38Z" transform={`rotate(${angle})`} />
        ))}
        {[45, 135, 225, 315].map((angle) => (
          <path key={angle} d="M0-60 9-31 0-9-9-31Z" transform={`rotate(${angle})`} />
        ))}
      </g>
    </svg>
  )
}

export default function Logo({ taille = 34, sousTitre = 'Administration' }) {
  return (
    <div className="logo">
      <Etoile taille={taille} />
      <div className="logo-texte">
        Star<span>Pole</span>
        {sousTitre && <small className="logo-sous-titre">{sousTitre}</small>}
      </div>
    </div>
  )
}
