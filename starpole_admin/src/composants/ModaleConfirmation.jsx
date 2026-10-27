import { useEffect, useId, useState } from 'react'

// Demande une confirmation et un motif obligatoire, puis appelle `surConfirmer(motif)`.
// Affiche l'erreur éventuelle sans fermer la fenêtre.
export default function ModaleConfirmation({
  titre, message, libelleConfirmer, surConfirmer, surFermer,
}) {
  const [motif, setMotif] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState(null)
  const idTitre = useId()
  const valide = motif.trim().length >= 3

  useEffect(() => {
    const touche = (e) => e.key === 'Escape' && !envoi && surFermer()
    window.addEventListener('keydown', touche)
    return () => window.removeEventListener('keydown', touche)
  }, [envoi, surFermer])

  async function confirmer(e) {
    e.preventDefault()
    if (!valide) return
    setEnvoi(true)
    setErreur(null)
    try {
      await surConfirmer(motif.trim())
    } catch (err) {
      setErreur(err.message)
      setEnvoi(false)
    }
  }

  return (
    <div className="voile" onMouseDown={(e) => e.target === e.currentTarget && !envoi && surFermer()}>
      <form className="modale" role="dialog" aria-modal="true" aria-labelledby={idTitre} onSubmit={confirmer}>
        <h2 id={idTitre}>{titre}</h2>
        {message && <p className="secondaire">{message}</p>}
        <label className="etiquette-champ">
          Motif (obligatoire)
          <textarea
            className="champ"
            value={motif}
            onChange={(e) => setMotif(e.target.value)}
            maxLength={300}
            placeholder="Expliquez la raison de cette action"
            autoFocus
          />
        </label>
        {erreur && <p className="message-erreur">{erreur}</p>}
        <div className="modale-actions">
          <button type="button" className="bouton" onClick={surFermer} disabled={envoi}>Annuler</button>
          <button type="submit" className="bouton principal" disabled={!valide || envoi}>
            {envoi ? 'Envoi...' : libelleConfirmer}
          </button>
        </div>
      </form>
    </div>
  )
}
