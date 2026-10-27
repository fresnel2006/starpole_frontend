import { CircleAlert, Inbox } from 'lucide-react'

export function Chargement({ texte = 'Chargement...' }) {
  return <div className="etat" role="status"><div className="chargeur" /><p>{texte}</p></div>
}

export function Vide({ texte = 'Aucun élément.' }) {
  return <div className="etat"><Inbox size={28} strokeWidth={1.5} /><p>{texte}</p></div>
}

// Le détail technique aide à corriger (par exemple le lien de création d'un index Firestore).
export function Erreur({ erreur, texte = 'Impossible de charger les données.' }) {
  return (
    <div className="etat erreur" role="alert">
      <CircleAlert size={28} strokeWidth={1.5} />
      <p>{texte}</p>
      {erreur?.message && <p className="detail">{erreur.message}</p>}
    </div>
  )
}
