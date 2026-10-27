// Formes grisées affichées pendant le chargement, à la place du contenu.
export default function Squelette({ largeur = '100%', hauteur = 14, rond = false, style }) {
  return (
    <span
      className="squelette"
      aria-hidden="true"
      style={{ width: largeur, height: hauteur, borderRadius: rond ? '50%' : undefined, ...style }}
    />
  )
}

// Carte entière en chargement : un titre et quelques lignes.
export function CarteSquelette({ lignes = 4, hauteur }) {
  return (
    <div className="carte pile" style={{ gap: 12 }} aria-busy="true">
      <Squelette largeur="40%" hauteur={18} />
      {hauteur
        ? <Squelette hauteur={hauteur} />
        : Array.from({ length: lignes }, (_, i) => <Squelette key={i} largeur={`${90 - i * 12}%`} />)}
    </div>
  )
}
