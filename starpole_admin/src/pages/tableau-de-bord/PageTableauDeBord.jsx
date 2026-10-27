import { useCallback } from 'react'
import { Link, useSearchParams } from 'react-router'
import {
  Activity, CircleCheck, Clock, Printer, ShieldAlert, Siren, Star, TriangleAlert, UserCheck, Users,
} from 'lucide-react'
import EnTetePage from '../../composants/EnTetePage.jsx'
import CarteChiffre from '../../composants/CarteChiffre.jsx'
import Evolution from '../../composants/Evolution.jsx'
import Squelette, { CarteSquelette } from '../../composants/Squelette.jsx'
import { Erreur, Vide } from '../../composants/Etats.jsx'
import { useFluxAlertes } from '../../noyau/contexteFlux.js'
import { useChargement } from '../../noyau/hooks.js'
import { avisBas, chiffresGeneraux, nomsUtilisateurs } from '../../noyau/donnees.js'
import * as stats from '../../noyau/statistiques.js'
import { dateHeure, depuis, duree, nombre, note } from '../../noyau/format.js'
import { GraphiqueParJour, GraphiqueParQuartier, GraphiqueParType } from './Graphiques.jsx'

const PERIODES = { 7: '7 derniers jours', 30: '30 derniers jours', 90: '90 derniers jours' }

// Comptes qui ont reçu au moins 2 notes basses, avec leur nom.
async function chargerASurveiller() {
  const liste = stats.utilisateursASurveiller(await avisBas()).slice(0, 5)
  const noms = await nomsUtilisateurs(liste.map((c) => c.uid))
  return liste.map((c) => ({ ...c, nom: noms[c.uid] }))
}

function DelaiMoyen({ icone: Icone, ton, valeur, libelle, nombreAlertes }) {
  return (
    <div className="chiffre">
      <div className={`chiffre-icone ${ton ?? ''}`}><Icone size={20} strokeWidth={1.75} /></div>
      <div>
        <div className="chiffre-valeur nombre">{duree(valeur)}</div>
        <div className="chiffre-libelle">{libelle}</div>
        <div className="indication">sur {nombre(nombreAlertes)} alertes</div>
      </div>
    </div>
  )
}

export default function PageTableauDeBord() {
  const [parametres, setParametres] = useSearchParams()
  const jours = PERIODES[parametres.get('periode')] ? Number(parametres.get('periode')) : 30
  const { alertes, enCours, erreur } = useFluxAlertes()
  const generaux = useChargement(chiffresGeneraux, jours)
  const surveillance = useChargement(chargerASurveiller)
  const changerPeriode = useCallback((valeur) => setParametres({ periode: valeur }, { replace: true }), [setParametres])

  const g = generaux.donnees
  const libellePeriode = PERIODES[jours].toLowerCase()

  const enTete = (
    <EnTetePage titre="Tableau de bord" sousTitre={`Activité de StarPole sur les ${libellePeriode}, mise à jour en direct.`}>
      <select className="champ" value={jours} onChange={(e) => changerPeriode(e.target.value)} aria-label="Période">
        {Object.entries(PERIODES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
      <button className="bouton" onClick={() => window.print()}><Printer size={18} /> Imprimer</button>
    </EnTetePage>
  )

  if (erreur) return <>{enTete}<div className="carte"><Erreur erreur={erreur} /></div></>
  if (enCours) {
    return (
      <>
        {enTete}
        <div className="grille-chiffres">{Array.from({ length: 6 }, (_, i) => <CarteSquelette key={i} lignes={2} />)}</div>
        <CarteSquelette hauteur={240} />
      </>
    )
  }

  // Alertes de la période choisie et de la période d'avant.
  const periode = stats.dansPeriode(alertes, jours)
  const avant = stats.dansPeriode(alertes, jours, 'creeLe', 1)
  const resolues = stats.dansPeriode(alertes, jours, 'termineLe').length
  const resoluesAvant = stats.dansPeriode(alertes, jours, 'termineLe', 1).length
  const c = stats.compteurs(alertes)
  const delais = stats.delaisMoyens(periode)
  const urgences = stats.dernieresUrgencesEnCours(alertes)
  // En cas d'échec, le détail de l'erreur s'affiche au survol.
  const attente = generaux.erreur
    ? <span title={generaux.erreur.message}>-</span>
    : <Squelette largeur={56} hauteur={26} />

  return (
    <>
      <p className="impression-seulement indication">Rapport StarPole du {dateHeure(new Date())} - {libellePeriode}</p>
      {enTete}

      <div className="grille-chiffres">
        <CarteChiffre icone={Activity} libelle="Alertes en cours" valeur={nombre(c.enCours)} />
        <CarteChiffre
          icone={CircleCheck} ton="vert" libelle="Alertes résolues" valeur={nombre(c.resolues)}
          detail={<Evolution texte={`${nombre(resolues)} sur la période`} pourcentage={stats.evolution(resolues, resoluesAvant)} />}
        />
        <CarteChiffre icone={Siren} ton="rouge" libelle="Urgences en cours" valeur={nombre(c.urgencesEnCours)} />
        <CarteChiffre
          icone={Users} libelle="Utilisateurs inscrits" valeur={g ? nombre(g.inscrits) : attente}
          detail={g?.nouveaux != null && <Evolution texte={`+${nombre(g.nouveaux)} sur la période`} pourcentage={stats.evolution(g.nouveaux, g.nouveauxAvant)} />}
        />
        <CarteChiffre icone={UserCheck} ton="bleu" libelle="Actifs sur 24 h" valeur={g ? nombre(g.actifs) : attente} />
        <CarteChiffre
          icone={Star} libelle="Note moyenne des avis"
          valeur={g ? (g.noteMoyenne == null ? '-' : `${note(g.noteMoyenne)} / 5`) : attente}
          detail={g && (g.notePeriode == null
            ? `${nombre(g.nombreAvis)} avis`
            : <Evolution texte={`${note(g.notePeriode)} sur la période`} ecart={g.noteAvant == null ? null : g.notePeriode - g.noteAvant} />)}
        />
      </div>

      <div className="carte" style={{ marginBottom: 16 }}>
        <div className="carte-titre">
          <h2>Alertes par jour</h2>
          <Evolution texte={`${nombre(periode.length)} alertes publiées`} pourcentage={stats.evolution(periode.length, avant.length)} />
        </div>
        <GraphiqueParJour donnees={stats.alertesParJour(alertes, jours)} />
      </div>

      <div className="grille-2">
        <div className="carte">
          <div className="carte-titre"><h2>Répartition par type</h2><span className="indication">{libellePeriode}</span></div>
          {periode.length ? <GraphiqueParType donnees={stats.repartitionParType(periode)} /> : <Vide texte="Aucune alerte sur la période." />}
          <div className="carte-titre" style={{ marginTop: 24, marginBottom: 12 }}><h2>Délais moyens</h2></div>
          <div className="grille-2" style={{ marginBottom: 0 }}>
            <DelaiMoyen icone={Clock} valeur={delais.priseEnCharge} libelle="Prise en charge" nombreAlertes={delais.nombrePrisesEnCharge} />
            <DelaiMoyen icone={CircleCheck} ton="vert" valeur={delais.resolution} libelle="Résolution" nombreAlertes={delais.nombreResolutions} />
          </div>
        </div>
        <div className="carte">
          <div className="carte-titre"><h2>Alertes par quartier</h2><span className="indication">{libellePeriode}</span></div>
          {periode.length ? <GraphiqueParQuartier donnees={stats.alertesParQuartier(periode)} /> : <Vide texte="Aucune alerte sur la période." />}
        </div>
      </div>

      <div className="grille-2">
        <div className="carte">
          <div className="carte-titre">
            <h2>Dernières urgences en cours</h2>
            <span className="groupe-boutons masque-impression">
              <Link className="lien" to="/carte?type=urgence&statut=en_cours">Sur la carte</Link>
              <Link className="lien" to="/alertes?type=urgence&statut=en_cours">Tout voir</Link>
            </span>
          </div>
          {urgences.length === 0 ? <Vide texte="Aucune urgence en cours." /> : urgences.map((a) => (
            <Link key={a.id} to={`/alertes/${a.id}`} className="element-liste">
              <div className="personne">
                <div className="chiffre-icone rouge"><TriangleAlert size={18} strokeWidth={1.75} /></div>
                <div style={{ minWidth: 0 }}>
                  <p className="titre-cellule">{a.categorie || 'Sans titre'}</p>
                  <p className="indication">{[a.quartier, a.ville].filter(Boolean).join(', ') || 'Lieu non précisé'} - {a.auteurNom || 'Auteur inconnu'}</p>
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <p className="secondaire">{depuis(a.creeLe)}</p>
                <p className="indication">{a.aidantNom ? `Aidé par ${a.aidantNom}` : 'Personne pour aider'}</p>
              </div>
            </Link>
          ))}
        </div>

        <div className="carte">
          <div className="carte-titre">
            <h2>Utilisateurs à surveiller</h2>
            <Link className="lien masque-impression" to="/avis?filtre=basses">Notes basses</Link>
          </div>
          <p className="indication" style={{ marginTop: -8, marginBottom: 12 }}>Au moins 2 notes de 1 ou 2 étoiles reçues.</p>
          {surveillance.erreur ? <Erreur erreur={surveillance.erreur} />
            : !surveillance.donnees ? <Squelette hauteur={120} />
              : surveillance.donnees.length === 0 ? <Vide texte="Aucun compte à surveiller." />
                : surveillance.donnees.map((u) => (
                  <Link key={u.uid} to={`/utilisateurs/${u.uid}`} className="element-liste">
                    <div className="personne">
                      <div className="chiffre-icone rouge"><ShieldAlert size={18} strokeWidth={1.75} /></div>
                      <div style={{ minWidth: 0 }}>
                        <p className="titre-cellule">{u.nom}</p>
                        <p className="indication">Dernière note basse {depuis(u.dernier)}</p>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p className="titre-cellule nombre">{u.nombre} notes basses</p>
                      <p className="indication">moyenne {note(u.moyenne)} / 5</p>
                    </div>
                  </Link>
                ))}
        </div>
      </div>
    </>
  )
}
