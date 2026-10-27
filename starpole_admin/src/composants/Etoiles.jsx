import { Star } from 'lucide-react'

export default function Etoiles({ valeur, taille = 14 }) {
  return (
    <span className="etoiles" role="img" aria-label={`${valeur} sur 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} size={taille} className={n <= valeur ? '' : 'vide'} fill="currentColor" strokeWidth={0} />
      ))}
    </span>
  )
}
