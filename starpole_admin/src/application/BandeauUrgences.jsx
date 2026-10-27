import { Link } from 'react-router'
import { MapPin, Siren, X } from 'lucide-react'
import { useFluxAlertes } from '../noyau/contexteFlux.js'
import { depuis } from '../noyau/format.js'

// Annonce les nouvelles urgences arrivées pendant que la console est ouverte.
export default function BandeauUrgences() {
  const { nouvelles, marquerVue, marquerToutesVues } = useFluxAlertes()
  if (!nouvelles.length) return null

  const a = nouvelles[0]
  const autres = nouvelles.length - 1
  const lieu = [a.quartier, a.ville].filter(Boolean).join(', ') || 'Lieu non précisé'

  return (
    <div className="bandeau-urgence carte" role="status" aria-live="polite">
      <div className="chiffre-icone rouge"><Siren size={20} strokeWidth={1.75} /></div>
      <div className="pile" style={{ gap: 8, minWidth: 0, flex: 1 }}>
        <div>
          <p className="titre-cellule">Nouvelle urgence : {a.categorie || 'Sans titre'}</p>
          <p className="indication">{lieu} - {a.auteurNom || 'Auteur inconnu'} - {depuis(a.creeLe)}</p>
        </div>
        <div className="groupe-boutons">
          <Link className="bouton principal" to={`/alertes/${a.id}`} onClick={() => marquerVue(a.id)}>Voir le détail</Link>
          {typeof a.latitude === 'number' && (
            <Link className="bouton" to={`/carte?alerte=${a.id}&statut=en_cours`} onClick={() => marquerVue(a.id)}>
              <MapPin size={16} /> Sur la carte
            </Link>
          )}
        </div>
        {autres > 0 && (
          <Link className="lien" to="/alertes?type=urgence&statut=en_cours" onClick={marquerToutesVues}>
            et {autres} autre{autres > 1 ? 's' : ''} nouvelle{autres > 1 ? 's' : ''} urgence{autres > 1 ? 's' : ''}
          </Link>
        )}
      </div>
      <button className="bouton icone" onClick={marquerToutesVues} aria-label="Masquer les nouvelles urgences">
        <X size={16} />
      </button>
    </div>
  )
}
