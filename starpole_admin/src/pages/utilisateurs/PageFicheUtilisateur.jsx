import { useCallback, useState } from 'react'
import { Link, useParams } from 'react-router'
import { UserCheck, UserX } from 'lucide-react'
import EnTetePage from '../../composants/EnTetePage.jsx'
import Avatar from '../../composants/Avatar.jsx'
import Etoiles from '../../composants/Etoiles.jsx'
import ModaleConfirmation from '../../composants/ModaleConfirmation.jsx'
import { BadgeCompte, BadgeStatut, BadgeType } from '../../composants/Badges.jsx'
import { Erreur, Vide } from '../../composants/Etats.jsx'
import { CarteSquelette } from '../../composants/Squelette.jsx'
import { useChargement } from '../../noyau/hooks.js'
import {
  alertesDeUtilisateur, avisUtilisateur, chiffresUtilisateur, lireUtilisateur, nomsUtilisateurs,
} from '../../noyau/donnees.js'
import { etatCompte, reactiverUtilisateur, suspendreUtilisateur } from '../../noyau/serveur.js'
import { date, dateHeure, depuis, nombre, note } from '../../noyau/format.js'

async function chargerFiche(uid) {
  const [profil, chiffres, publiees, aidees, recus, donnes] = await Promise.all([
    lireUtilisateur(uid),
    chiffresUtilisateur(uid),
    alertesDeUtilisateur(uid, 'auteurId'),
    alertesDeUtilisateur(uid, 'aidantId'),
    avisUtilisateur(uid, 'pourId'),
    avisUtilisateur(uid, 'deId'),
  ])
  const noms = await nomsUtilisateurs([...recus.map((a) => a.deId), ...donnes.map((a) => a.pourId)])
  return { profil, chiffres, publiees, aidees, recus, donnes, noms }
}

function ListeAlertes({ alertes, vide }) {
  if (!alertes.length) return <Vide texte={vide} />
  return alertes.map((a) => (
    <Link key={a.id} to={`/alertes/${a.id}`} className="element-liste">
      <div>
        <p className="titre-cellule">{a.categorie || 'Sans titre'}</p>
        <p className="indication nombre">{dateHeure(a.creeLe)}</p>
      </div>
      <div className="groupe-boutons"><BadgeType type={a.type} /><BadgeStatut statut={a.statut} /></div>
    </Link>
  ))
}

function ListeAvis({ avis, noms, cleAutre, prefixe, vide }) {
  if (!avis.length) return <Vide texte={vide} />
  return avis.map((v) => (
    <div key={v.id} className={`element-liste`} style={{ alignItems: 'flex-start' }}>
      <div>
        <Etoiles valeur={v.etoiles} />
        {v.commentaire && <p className="secondaire">{v.commentaire}</p>}
        <p className="indication">
          {prefixe} <Link className="lien" to={`/utilisateurs/${v[cleAutre]}`}>{noms[v[cleAutre]]}</Link>
        </p>
      </div>
      <span className="indication nombre">{date(v.creeLe)}</span>
    </div>
  ))
}

export default function PageFicheUtilisateur() {
  const { uid } = useParams()
  const fiche = useChargement(chargerFiche, uid)
  const compte = useChargement(etatCompte, uid)
  const [action, setAction] = useState(null) // 'suspendre' | 'reactiver'
  const fermer = useCallback(() => setAction(null), [])

  const retour = { vers: '/utilisateurs', texte: 'Utilisateurs' }
  if (fiche.erreur) return <><EnTetePage titre="Utilisateur" retour={retour} /><div className="carte"><Erreur erreur={fiche.erreur} /></div></>
  if (!fiche.donnees) {
    return (
      <>
        <EnTetePage titre="Utilisateur" retour={retour} />
        <div className="grille-detail">
          <div className="grille-2"><CarteSquelette lignes={5} /><CarteSquelette lignes={5} /></div>
          <CarteSquelette lignes={7} />
        </div>
      </>
    )
  }

  const { profil, chiffres, publiees, aidees, recus, donnes, noms } = fiche.donnees
  if (!profil) return <><EnTetePage titre="Utilisateur introuvable" retour={retour} /><div className="carte"><Vide texte="Ce profil n'existe pas." /></div></>

  const suspendu = compte.donnees?.suspendu

  return (
    <>
      <EnTetePage titre={profil.nom || 'Sans nom'} sousTitre={profil.email} retour={retour}>
        {compte.donnees && !compte.donnees.admin && (suspendu ? (
          <button className="bouton succes" onClick={() => setAction('reactiver')}><UserCheck size={18} /> Réactiver</button>
        ) : (
          <button className="bouton danger" onClick={() => setAction('suspendre')}><UserX size={18} /> Suspendre</button>
        ))}
      </EnTetePage>

      <div className="grille-detail">
        <div className="pile">
          <div className="grille-2" style={{ marginBottom: 0 }}>
            <div className="carte">
              <div className="carte-titre"><h2>Alertes publiées</h2><span className="indication">{nombre(chiffres.alertes)}</span></div>
              <ListeAlertes alertes={publiees} vide="Aucune alerte publiée." />
            </div>
            <div className="carte">
              <div className="carte-titre"><h2>Alertes aidées</h2><span className="indication">{nombre(chiffres.aides)}</span></div>
              <ListeAlertes alertes={aidees} vide="Aucune aide." />
            </div>
          </div>
          <div className="grille-2" style={{ marginBottom: 0 }}>
            <div className="carte">
              <div className="carte-titre"><h2>Avis reçus</h2><span className="indication">{nombre(chiffres.nombreAvis)}</span></div>
              <ListeAvis avis={recus} noms={noms} cleAutre="deId" prefixe="De" vide="Aucun avis reçu." />
            </div>
            <div className="carte">
              <div className="carte-titre"><h2>Avis donnés</h2></div>
              <ListeAvis avis={donnes} noms={noms} cleAutre="pourId" prefixe="Pour" vide="Aucun avis donné." />
            </div>
          </div>
        </div>

        <div className="carte">
          <div className="personne" style={{ marginBottom: 20 }}>
            <Avatar photo={profil.photo} nom={profil.nom} taille={64} />
            <div>
              <h2>{profil.nom || 'Sans nom'}</h2>
              {compte.erreur
                ? <p className="indication">État du compte indisponible</p>
                : compte.donnees ? <BadgeCompte suspendu={suspendu} /> : <p className="indication">...</p>}
            </div>
          </div>
          <dl className="liste-infos">
            <dt>E-mail</dt><dd>{profil.email || '-'}</dd>
            <dt>Téléphone</dt><dd>{profil.telephone || '-'}</dd>
            <dt>Inscription</dt><dd className="nombre">{date(profil.creeLe)}</dd>
            <dt>Dernière présence</dt><dd>{depuis(profil.vuLe)}</dd>
            <dt>Note moyenne</dt>
            <dd>{chiffres.noteMoyenne == null ? '-' : `${note(chiffres.noteMoyenne)} / 5 (${nombre(chiffres.nombreAvis)} avis)`}</dd>
            <dt>Rôle</dt><dd>{compte.donnees?.admin ? 'Administrateur' : 'Utilisateur'}</dd>
            <dt>Identifiant</dt><dd className="indication">{profil.id}</dd>
          </dl>
          {compte.erreur && <p className="message-erreur" style={{ marginTop: 16 }}>{compte.erreur.message}</p>}
        </div>
      </div>

      {action && (
        <ModaleConfirmation
          titre={action === 'suspendre' ? 'Suspendre ce compte ?' : 'Réactiver ce compte ?'}
          message={action === 'suspendre'
            ? "La personne sera déconnectée et ne pourra plus se connecter à l'appli. Cette action est enregistrée dans le journal."
            : "La personne pourra de nouveau se connecter. Cette action est enregistrée dans le journal."}
          libelleConfirmer={action === 'suspendre' ? 'Suspendre' : 'Réactiver'}
          surFermer={fermer}
          surConfirmer={async (motif) => {
            await (action === 'suspendre' ? suspendreUtilisateur : reactiverUtilisateur)(uid, motif)
            setAction(null)
            compte.recharger()
          }}
        />
      )}
    </>
  )
}
