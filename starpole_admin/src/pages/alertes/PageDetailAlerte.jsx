import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { CircleCheck, MapPin, Trash2 } from 'lucide-react'
import EnTetePage from '../../composants/EnTetePage.jsx'
import CarteAbidjan from '../../composants/CarteAbidjan.jsx'
import ModaleConfirmation from '../../composants/ModaleConfirmation.jsx'
import Etoiles from '../../composants/Etoiles.jsx'
import { BadgeStatut, BadgeType } from '../../composants/Badges.jsx'
import { Erreur, Vide } from '../../composants/Etats.jsx'
import { CarteSquelette } from '../../composants/Squelette.jsx'
import { useFluxAlertes } from '../../noyau/contexteFlux.js'
import { useChargement } from '../../noyau/hooks.js'
import { avisDeLAlerte, lireAlerte, nomsUtilisateurs, progressionAlerte } from '../../noyau/donnees.js'
import { resoudreAlerte, supprimerAlerte } from '../../noyau/serveur.js'
import { MODERATION } from '../../noyau/referentiel.js'
import { dateHeure, duree, imageBase64 } from '../../noyau/format.js'

// Tout ce qu'il faut pour la page : l'alerte, sa timeline, ses avis et les noms liés.
async function chargerDetail(id) {
  const [alerte, progression, avis] = await Promise.all([
    lireAlerte(id), progressionAlerte(id), avisDeLAlerte(id),
  ])
  const noms = await nomsUtilisateurs(avis.flatMap((a) => [a.deId, a.pourId]))
  return { alerte, progression, avis, noms }
}

function LienPersonne({ uid, nom }) {
  if (!uid) return <span className="indication">Personne</span>
  return <Link className="lien" to={`/utilisateurs/${uid}`}>{nom || 'Sans nom'}</Link>
}

export default function PageDetailAlerte() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { donnees, erreur, enCours, recharger } = useChargement(chargerDetail, id)
  const [action, setAction] = useState(null) // 'resoudre' | 'supprimer'
  const fermer = useCallback(() => setAction(null), [])

  // Ouvrir une nouvelle urgence la marque comme vue.
  const { marquerVue } = useFluxAlertes()
  useEffect(() => { marquerVue(id) }, [id, marquerVue])

  const retour = { vers: '/alertes', texte: 'Alertes' }
  if (erreur) return <><EnTetePage titre="Alerte" retour={retour} /><div className="carte"><Erreur erreur={erreur} /></div></>
  if (enCours && !donnees) {
    return (
      <>
        <EnTetePage titre="Alerte" retour={retour} />
        <div className="grille-detail">
          <CarteSquelette lignes={7} />
          <div className="pile"><CarteSquelette hauteur={220} /><CarteSquelette lignes={3} /></div>
        </div>
      </>
    )
  }
  if (!donnees.alerte) return <><EnTetePage titre="Alerte introuvable" retour={retour} /><div className="carte"><Vide texte="Cette alerte n'existe pas ou a été supprimée." /></div></>

  const { alerte: a, progression, avis, noms } = donnees
  const aPosition = typeof a.latitude === 'number' && typeof a.longitude === 'number'

  return (
    <>
      <EnTetePage titre={a.categorie || 'Sans titre'} sousTitre={`Publiée le ${dateHeure(a.creeLe)}`} retour={retour}>
        {aPosition && (
          <Link className="bouton" to={`/carte?alerte=${a.id}&statut=`}>
            <MapPin size={18} /> Voir sur la carte
          </Link>
        )}
        {a.statut !== 'resolue' && (
          <button className="bouton succes" onClick={() => setAction('resoudre')}>
            <CircleCheck size={18} /> Marquer résolue
          </button>
        )}
        <button className="bouton danger" onClick={() => setAction('supprimer')}>
          <Trash2 size={18} /> Supprimer
        </button>
      </EnTetePage>

      <div className="grille-detail">
        <div className="pile">
          <div className="carte">
            <div className="groupe-boutons" style={{ marginBottom: 16 }}>
              <BadgeType type={a.type} />
              <BadgeStatut statut={a.statut} />
            </div>
            <p className="description" style={{ marginBottom: 20 }}>{a.description || 'Pas de description.'}</p>
            <dl className="liste-infos">
              <dt>Lieu</dt><dd>{[a.quartier, a.ville].filter(Boolean).join(', ') || '-'}</dd>
              <dt>Auteur</dt><dd><LienPersonne uid={a.auteurId} nom={a.auteurNom} /></dd>
              <dt>Aidant</dt><dd><LienPersonne uid={a.aidantId} nom={a.aidantNom} /></dd>
              <dt>Publiée</dt><dd className="nombre">{dateHeure(a.creeLe)}</dd>
              <dt>Prise en charge</dt>
              <dd className="nombre">{a.accepteLe ? `${dateHeure(a.accepteLe)} (après ${duree(a.accepteLe - a.creeLe)})` : '-'}</dd>
              <dt>Terminée</dt>
              <dd className="nombre">{a.termineLe ? `${dateHeure(a.termineLe)} (après ${duree(a.termineLe - a.creeLe)})` : '-'}</dd>
              <dt>Vérification IA</dt><dd>{MODERATION[a.moderation] ?? <span className="indication">En attente</span>}</dd>
              <dt>Identifiant</dt><dd className="indication">{a.id}</dd>
            </dl>
          </div>

          {a.photo && (
            <div className="carte">
              <div className="carte-titre"><h2>Photo</h2></div>
              <img className="photo-entiere" src={imageBase64(a.photo)} alt={`Photo de l'alerte ${a.categorie ?? ''}`} />
            </div>
          )}
        </div>

        <div className="pile">
          <div className="carte">
            <div className="carte-titre"><h2>Position</h2></div>
            {aPosition ? (
              <div style={{ height: 260 }}>
                <CarteAbidjan reperes={[{ ...a, titre: a.categorie }]} centre={a} zoom={14} regrouper={false} />
              </div>
            ) : <Vide texte="Pas de position pour cette alerte." />}
          </div>

          <div className="carte">
            <div className="carte-titre"><h2>Suivi</h2></div>
            {progression.length === 0 ? <Vide texte="Aucun message de suivi." /> : (
              <ol className="chronologie">
                {progression.map((p) => (
                  <li key={p.id}>
                    <p>{p.texte}</p>
                    <p className="indication">{p.auteurNom || 'Inconnu'} - {dateHeure(p.creeLe)}</p>
                  </li>
                ))}
              </ol>
            )}
          </div>

          <div className="carte">
            <div className="carte-titre"><h2>Avis liés</h2></div>
            {avis.length === 0 ? <Vide texte="Aucun avis pour cette alerte." /> : avis.map((v) => (
              <div key={v.id} className="element-liste" style={{ alignItems: 'flex-start' }}>
                <div>
                  <Etoiles valeur={v.etoiles} />
                  {v.commentaire && <p className="secondaire">{v.commentaire}</p>}
                  <p className="indication">
                    {noms[v.deId]} pour {noms[v.pourId]}
                  </p>
                </div>
                <span className="indication nombre">{dateHeure(v.creeLe)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {action === 'resoudre' && (
        <ModaleConfirmation
          titre="Marquer l'alerte comme résolue ?"
          message="L'alerte passera au statut « Résolue » dans l'appli. Cette action est enregistrée dans le journal."
          libelleConfirmer="Marquer résolue"
          surFermer={fermer}
          surConfirmer={async (motif) => {
            await resoudreAlerte(a.id, motif)
            setAction(null)
            recharger()
          }}
        />
      )}
      {action === 'supprimer' && (
        <ModaleConfirmation
          titre="Supprimer cette alerte ?"
          message="L'alerte et son suivi seront supprimés définitivement. Cette action est enregistrée dans le journal."
          libelleConfirmer="Supprimer"
          surFermer={fermer}
          surConfirmer={async (motif) => {
            await supprimerAlerte(a.id, motif)
            navigate('/alertes', { replace: true })
          }}
        />
      )}
    </>
  )
}
