import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Erreur, Vide } from './Etats.jsx'
import Squelette from './Squelette.jsx'

// Tableau générique.
// colonnes : [{ cle, titre, rendu: (ligne) => contenu }]
// pagination : objet renvoyé par usePagination (facultatif)
export default function Tableau({
  colonnes, lignes, enCours, erreur, vide, surClic, classeLigne, pagination,
}) {
  const premierChargement = enCours && !lignes.length && !erreur
  let corps
  if (erreur) corps = <Erreur erreur={erreur} />
  else if (!enCours && !lignes.length) corps = <Vide texte={vide} />

  return (
    <div className="carte tableau-conteneur">
      <table className="tableau">
        <thead>
          <tr>{colonnes.map((c) => <th key={c.cle} scope="col">{c.titre}</th>)}</tr>
        </thead>
        {premierChargement && (
          <tbody aria-busy="true">
            {Array.from({ length: 8 }, (_, i) => (
              <tr key={i}>
                {colonnes.map((c, j) => (
                  <td key={c.cle}><Squelette largeur={j === 0 ? 36 : `${60 + ((i + j) % 4) * 10}%`} hauteur={j === 0 ? 36 : 14} rond={j === 0} /></td>
                ))}
              </tr>
            ))}
          </tbody>
        )}
        {!corps && !premierChargement && (
          <tbody style={{ opacity: enCours ? 0.5 : 1 }}>
            {lignes.map((ligne) => (
              <tr
                key={ligne.id}
                className={[surClic && 'cliquable', classeLigne?.(ligne)].filter(Boolean).join(' ')}
                onClick={surClic ? () => surClic(ligne) : undefined}
              >
                {colonnes.map((c) => <td key={c.cle}>{c.rendu ? c.rendu(ligne) : ligne[c.cle]}</td>)}
              </tr>
            ))}
          </tbody>
        )}
      </table>
      {corps}
      {pagination && (pagination.aPrecedente || pagination.aSuivante) && (
        <div className="pagination">
          <span className="indication">Page {pagination.page}</span>
          <button className="bouton icone" onClick={pagination.precedente} disabled={!pagination.aPrecedente || enCours} aria-label="Page précédente">
            <ChevronLeft size={18} />
          </button>
          <button className="bouton icone" onClick={pagination.suivante} disabled={!pagination.aSuivante || enCours} aria-label="Page suivante">
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  )
}
