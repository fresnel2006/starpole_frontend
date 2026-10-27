import {
  Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { COULEURS, COULEUR_TYPE } from '../../application/couleurs.js'
import { jourCourt } from '../../noyau/format.js'

const AXE = { stroke: COULEURS.indication, fontSize: 11, tickLine: false, axisLine: false }

function Infobulle({ active, payload, libelle }) {
  if (!active || !payload?.length) return null
  const point = payload[0].payload
  return (
    <div className="infobulle">
      <p>{libelle(point)}</p>
      <p><strong className="nombre">{payload[0].value}</strong> alerte{payload[0].value > 1 ? 's' : ''}</p>
    </div>
  )
}

// Alertes par jour : une seule série, en barres fines.
export function GraphiqueParJour({ donnees }) {
  return (
    <div className="graphique" role="img" aria-label="Nombre d'alertes publiées chaque jour sur les 30 derniers jours">
      <ResponsiveContainer>
        <BarChart data={donnees} margin={{ top: 8, right: 4, bottom: 0, left: -24 }} barCategoryGap={2}>
          <CartesianGrid vertical={false} stroke={COULEURS.fondSecondaire} />
          <XAxis dataKey="jour" tickFormatter={jourCourt} interval={Math.max(Math.ceil(donnees.length / 6) - 1, 0)} {...AXE} />
          <YAxis allowDecimals={false} {...AXE} />
          <Tooltip cursor={{ fill: COULEURS.fondSecondaire }} content={<Infobulle libelle={(p) => jourCourt(p.jour)} />} />
          <Bar dataKey="nombre" fill={COULEURS.rouge} radius={[4, 4, 0, 0]} maxBarSize={18} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// Barres horizontales avec le nom et la valeur écrits (la couleur n'est jamais seule).
function BarresHorizontales({ donnees, cle, libelle, couleur, hauteurLigne = 34, description }) {
  return (
    <div style={{ width: '100%', height: Math.max(donnees.length * hauteurLigne, 80) }} role="img" aria-label={description}>
      <ResponsiveContainer>
        <BarChart data={donnees} layout="vertical" margin={{ top: 0, right: 40, bottom: 0, left: 0 }} barCategoryGap={8}>
          <XAxis type="number" hide allowDecimals={false} />
          <YAxis type="category" dataKey={libelle} width={96} {...AXE} stroke={COULEURS.texteSecondaire} fontSize={12} />
          <Tooltip cursor={{ fill: COULEURS.fondSecondaire }} content={<Infobulle libelle={(p) => p[libelle]} />} />
          <Bar dataKey={cle} radius={[0, 4, 4, 0]} maxBarSize={18} minPointSize={2} isAnimationActive={false}>
            {donnees.map((d) => <Cell key={d[libelle]} fill={couleur(d)} />)}
            <LabelList dataKey={cle} position="right" fill={COULEURS.texte} fontSize={12} fontWeight={600} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function GraphiqueParType({ donnees }) {
  return (
    <BarresHorizontales
      donnees={donnees}
      cle="nombre"
      libelle="libelle"
      couleur={(d) => COULEUR_TYPE[d.type]}
      hauteurLigne={44}
      description="Répartition des alertes par type : urgence, don, service"
    />
  )
}

export function GraphiqueParQuartier({ donnees }) {
  return (
    <BarresHorizontales
      donnees={donnees}
      cle="nombre"
      libelle="quartier"
      couleur={() => COULEURS.rouge}
      description="Nombre d'alertes par quartier d'Abidjan"
    />
  )
}
