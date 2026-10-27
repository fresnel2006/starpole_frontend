// Carte d'un chiffre clé du tableau de bord.
export default function CarteChiffre({ icone: Icone, libelle, valeur, detail, ton }) {
  return (
    <div className="carte chiffre">
      <div className={`chiffre-icone ${ton ?? ''}`}><Icone size={20} strokeWidth={1.75} /></div>
      <div>
        <div className="chiffre-valeur nombre">{valeur}</div>
        <div className="chiffre-libelle">{libelle}</div>
        {detail && <div className="indication">{detail}</div>}
      </div>
    </div>
  )
}
