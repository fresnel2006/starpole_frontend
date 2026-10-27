import Logo from '../composants/Logo.jsx'

// Affiché quand .env.local n'est pas rempli.
export default function ConfigurationManquante({ variables }) {
  return (
    <div className="page-connexion">
      <div className="carte boite-connexion">
        <Logo />
        <h2>Configuration incomplète</h2>
        <p className="secondaire">
          Copiez <code>.env.exemple</code> en <code>.env.local</code>, remplissez les valeurs, puis
          relancez <code>npm run dev</code>. Variables manquantes :
        </p>
        <ul className="secondaire">{variables.map((v) => <li key={v}><code>{v}</code></li>)}</ul>
      </div>
    </div>
  )
}
