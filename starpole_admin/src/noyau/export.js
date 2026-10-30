// Export CSV lisible par Excel en français : séparateur « ; », encodage UTF-8 avec BOM.

function cellule(valeur) {
  if (valeur == null) return ''
  let texte = valeur instanceof Date ? valeur.toLocaleString('fr-FR') : String(valeur)
  // Injection de formule : un texte saisi dans l'appli qui commence par = + - @ serait
  // exécuté comme formule par Excel. On le neutralise avec une apostrophe.
  if (typeof valeur === 'string' && /^[=+\-@\t\r]/.test(texte)) texte = `'${texte}`
  return /[";\n\r]/.test(texte) ? `"${texte.replace(/"/g, '""')}"` : texte
}

// colonnes : [{ titre, valeur: (ligne) => ... }]
export function versCsv(colonnes, lignes) {
  const entete = colonnes.map((c) => cellule(c.titre)).join(';')
  const corps = lignes.map((l) => colonnes.map((c) => cellule(c.valeur(l))).join(';'))
  return [entete, ...corps].join('\r\n')
}

export function telechargerCsv(nomFichier, colonnes, lignes) {
  const blob = new Blob(['﻿' + versCsv(colonnes, lignes)], { type: 'text/csv;charset=utf-8' })
  const lien = document.createElement('a')
  lien.href = URL.createObjectURL(blob)
  const jour = new Date().toISOString().slice(0, 10)
  lien.download = `${nomFichier}-${jour}.csv`
  lien.click()
  URL.revokeObjectURL(lien.href)
}
