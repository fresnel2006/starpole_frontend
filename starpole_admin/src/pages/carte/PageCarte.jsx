import { useCallback, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router'
import { X } from 'lucide-react'
import EnTetePage from '../../composants/EnTetePage.jsx'
import CarteAbidjan from '../../composants/CarteAbidjan.jsx'
import { BadgeStatut, BadgeType } from '../../composants/Badges.jsx'
import { Erreur } from '../../composants/Etats.jsx'
import { useFluxAlertes } from '../../noyau/contexteFlux.js'
import { QUARTIERS, STATUTS, TYPES } from '../../noyau/referentiel.js'
import { COULEUR_TYPE, COULEURS } from '../../application/couleurs.js'
import { depuis, nombre } from '../../noyau/format.js'

const aUnePosition = (a) => typeof a.latitude === 'number' && typeof a.longitude === 'number'

// Filtres et alerte choisie dans l'adresse : /carte?statut=en_cours&alerte=abc
export default function PageCarte() {
  const { alertes, erreur } = useFluxAlertes()
  const [parametres, setParametres] = useSearchParams()
  const type = parametres.get('type') ?? ''
  const statut = parametres.get('statut') ?? 'en_cours'
  const quartier = parametres.get('quartier') ?? ''
  const choisieId = parametres.get('alerte')
  const choisie = alertes.find((a) => a.id === choisieId)

  const changer = useCallback((valeurs) => {
    setParametres((p) => {
      const suivant = new URLSearchParams(p)
      for (const [nom, valeur] of Object.entries(valeurs)) {
        if (valeur == null) suivant.delete(nom)
        else suivant.set(nom, valeur)
      }
      return suivant
    }, { replace: true })
  }, [setParametres])

  const reperes = useMemo(() => alertes
    .filter(aUnePosition)
    .filter((a) => a.id === choisieId || (
      (!type || a.type === type)
      && (!statut || (statut === 'resolue' ? a.statut === 'resolue' : a.statut !== 'resolue'))
      && (!quartier || a.quartier === quartier)))
    .map((a) => ({ ...a, titre: a.categorie })), [alertes, type, statut, quartier, choisieId])

  const choisir = useCallback((r) => changer({ alerte: r.id }), [changer])
  const pluriel = reperes.length > 1 ? 's' : ''

  const choix = (nom, valeur, libelleTous, options) => (
    <select className="champ" value={valeur} onChange={(e) => changer({ [nom]: e.target.value })} aria-label={libelleTous}>
      <option value="">{libelleTous}</option>
      {Object.entries(options).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  )

  return (
    <>
      <EnTetePage titre="Carte" sousTitre={`${nombre(reperes.length)} alerte${pluriel} affichée${pluriel} à Abidjan, en direct.`}>
        {choix('type', type, 'Tous les types', TYPES)}
        {choix('statut', statut, 'Tous les statuts', STATUTS)}
        {choix('quartier', quartier, 'Tous les quartiers', Object.fromEntries(QUARTIERS.map((q) => [q, q])))}
      </EnTetePage>

      {erreur ? <div className="carte"><Erreur erreur={erreur} /></div> : (
        <div className="carte page-carte">
          <CarteAbidjan reperes={reperes} surClic={choisir} selection={choisie} />

          {choisie && (
            <div className="carte resume-carte">
              <div className="carte-titre" style={{ marginBottom: 0 }}>
                <h3>{choisie.categorie || 'Sans titre'}</h3>
                <button className="bouton icone" onClick={() => changer({ alerte: null })} aria-label="Fermer le résumé">
                  <X size={16} />
                </button>
              </div>
              <div className="groupe-boutons">
                <BadgeType type={choisie.type} />
                <BadgeStatut statut={choisie.statut} />
              </div>
              <p className="secondaire lignes-3">{choisie.description}</p>
              <p className="indication">
                {[choisie.quartier, choisie.ville].filter(Boolean).join(', ')} - {choisie.auteurNom} - {depuis(choisie.creeLe)}
              </p>
              {!aUnePosition(choisie) && <p className="indication">Cette alerte n'a pas de position.</p>}
              <Link className="bouton principal" to={`/alertes/${choisie.id}`}>Voir le détail</Link>
            </div>
          )}

          <div className="carte legende" aria-hidden="true">
            {Object.entries(TYPES).map(([v, l]) => (
              <span key={v}><i style={{ background: COULEUR_TYPE[v] }} />{l}</span>
            ))}
            <span><i style={{ background: COULEURS.texteSecondaire }} />Groupe d'alertes</span>
          </div>
        </div>
      )}
    </>
  )
}
