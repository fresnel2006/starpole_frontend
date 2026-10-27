import { useEffect } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router'
import { definirTitrePage } from '../noyau/titre.js'

// Titre de la page, aussi utilisé pour l'onglet du navigateur.
export default function EnTetePage({ titre, sousTitre, retour, children }) {
  useEffect(() => { definirTitrePage(titre) }, [titre])
  return (
    <>
      {retour && <Link className="retour" to={retour.vers}><ArrowLeft size={16} />{retour.texte}</Link>}
      <div className="en-tete-page">
        <div>
          <h1>{titre}</h1>
          {sousTitre && <p className="secondaire">{sousTitre}</p>}
        </div>
        {children && <div className="groupe-boutons">{children}</div>}
      </div>
    </>
  )
}
