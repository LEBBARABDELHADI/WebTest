const chemins = {
  crayon: 'M12 20h9 M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z',
  corbeille: 'M3 6h18 M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2 M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6 M10 11v6 M14 11v6',
  plus: 'M12 5v14 M5 12h14',
  calendrier: 'M8 2v4 M16 2v4 M3 9h18 M4 5h16a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z M12 13v4 M10 15h4',
  chevronBas: 'm6 9 6 6 6-6',
  x: 'M18 6 6 18 M6 6l12 12',
  lien: 'M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71 M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71',
  telecharger: 'M12 3v12 M7 10l5 5 5-5 M4 21h16',
  televerser: 'M12 21V9 M7 14l5-5 5 5 M4 3h16',
  fleche: 'm9 18 6-6-6-6',
  point: 'M12 12h.01',
  horloge: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z M12 7v5l3 3',
  etiquette: 'M12.59 2.59A2 2 0 0 0 11.17 2H4a2 2 0 0 0-2 2v7.17a2 2 0 0 0 .59 1.41l9 9a2 2 0 0 0 2.82 0l7.17-7.17a2 2 0 0 0 0-2.82ZM7 7h.01',
  checklist: 'M9 11l3 3L22 4 M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11',
  cible: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z',
  texte: 'M4 6h16 M4 12h11 M4 18h16',
  radio: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  note: 'M14 3v4a1 1 0 0 0 1 1h4 M6 3h8l6 6v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z M9 13h6 M9 17h4',
  epingle: 'M12 2 9 9l-6 1 4.5 4.5L6 21l6-3.5 6 3.5-1.5-6.5L21 10l-6-1-3-7Z',
  chevronHaut: 'm18 15-6-6-6 6',
  archive: 'M3 4h18v4H3z M5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8 M10 13h4',
  repeter: 'M17 1l4 4-4 4 M3 11V9a4 4 0 0 1 4-4h14 M7 23l-4-4 4-4 M21 13v2a4 4 0 0 1-4 4H3',
  annuler: 'M9 14 4 9l5-5 M4 9h10.5a5.5 5.5 0 0 1 0 11H11',
  glisser: 'M8 6h.01 M8 12h.01 M8 18h.01 M16 6h.01 M16 12h.01 M16 18h.01',
}

export default function Icon({ nom, taille = 16, trait = 2, ...props }) {
  const d = chemins[nom]
  if (!d) return null
  return (
    <svg
      width={taille} height={taille} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth={trait}
      strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink: 0, display: 'block' }}
      {...props}
    >
      <path d={d} />
    </svg>
  )
}
