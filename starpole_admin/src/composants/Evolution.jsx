import { ArrowDownRight, ArrowRight, ArrowUpRight } from 'lucide-react'

// Évolution par rapport à la période d'avant : en pourcentage (« +12 % »)
// ou en écart absolu pour une note (« +0,3 »). Couleur neutre : plus n'est ni bien ni mal.
export default function Evolution({ texte, pourcentage, ecart }) {
  const valeur = pourcentage ?? ecart
  let variation = null
  if (valeur != null) {
    const signe = valeur > 0 ? '+' : ''
    const affiche = pourcentage != null ? `${signe}${pourcentage} %` : `${signe}${ecart.toFixed(1).replace('.', ',')}`
    const Icone = valeur > 0 ? ArrowUpRight : valeur < 0 ? ArrowDownRight : ArrowRight
    variation = (
      <span className="evolution" title="Par rapport à la période précédente">
        <Icone size={14} />{affiche}
      </span>
    )
  }
  return <span className="indication">{texte}{variation && <> {variation}</>}</span>
}
