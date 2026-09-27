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
