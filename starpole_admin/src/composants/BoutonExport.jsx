import { useState } from 'react'
import { Download } from 'lucide-react'
import { telechargerCsv } from '../noyau/export.js'

// Charge toute la liste (avec les filtres en cours) puis la télécharge en CSV.
// charger : () => Promise<lignes> ; colonnes : [{ titre, valeur }]
export default function BoutonExport({ charger, colonnes, nomFichier }) {
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState(null)

  async function exporter() {
    setEnvoi(true)
    setErreur(null)
    try {
      telechargerCsv(nomFichier, colonnes, await charger())
    } catch (e) {
      setErreur(e.message)
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <button className="bouton" onClick={exporter} disabled={envoi} title={erreur ?? 'Télécharger la liste filtrée (CSV, ouvrable dans Excel)'}>
      <Download size={18} /> {envoi ? 'Export...' : erreur ? "Échec de l'export" : 'Exporter'}
    </button>
  )
}
