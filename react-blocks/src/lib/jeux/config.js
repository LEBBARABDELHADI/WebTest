// Configuration centrale du jeu : toutes les valeurs de physique et de présentation sont ici.
// Unités : pixels logiques (1 tuile = 16 px), temps en images (le moteur tourne à pas fixe de 1/60 s).
export const TUILE = 16
export const VUE_L = 256            // largeur logique de l'écran (16 tuiles)
export const VUE_H = 144            // hauteur logique de l'écran (9 tuiles)
export const HAUTEUR = 12           // hauteur des niveaux en tuiles
export const SOL_Y = 10 * TUILE     // ordonnée du haut du sol

export const JOUEUR = { w: 10, hPetit: 14, hGrand: 24 }

export const PHYS = {
  gravité: 0.24,            // montée
  gravitéChute: 0.29,       // descente (plus lourde : sensation de poids)
  gravitéApex: 0.13,        // au sommet du saut, bouton maintenu : « flottement » court
  chuteMax: 5.6,
  marche: 1.3,
  course: 2.0,
  accélSol: 0.14,
  accélAir: 0.085,
  accélCourse: 0.09,        // montée en vitesse de course (plus progressive)
  frein: 0.26,              // changement de direction au sol (dérapage)
  freinAir: 0.13,
  frottement: 0.11,         // décélération au sol sans commande
  traînéeAir: 0.01,
  saut: 4.95,               // vitesse initiale du saut
  bonusCourse: 0.4,         // saut plus haut quand on court
  coupeSaut: 1.7,           // vitesse montante maximale conservée si on relâche A
  coyote: 6,                // images de tolérance après avoir quitté une plateforme
  tampon: 6,                // images de mémorisation d'un saut demandé juste avant l'atterrissage
  rebond: 3.5,              // rebond après avoir écrasé un ennemi
  rebondSaut: 5.0,          // idem en maintenant A
  invuln: 110,
  gel: 26,                  // images de gel pendant la transformation
}

export const ENNEMIS = {
  mousse:   { w: 12, h: 12, vit: 0.35, écrasable: true,  gravité: true },
  pic:      { w: 12, h: 12, vit: 0.3,  écrasable: false, gravité: true },
  sauteur:  { w: 12, h: 12, vit: 0.5,  écrasable: true,  gravité: true },
  chauve:   { w: 12, h: 10, vit: 0.45, écrasable: true,  gravité: false },
  rampant:  { w: 12, h: 12, vit: 1.1,  écrasable: true,  gravité: true },
}

export const CAMÉRA = { zoneMorte: 20, avance: 26, lissageX: 0.14, lissageY: 0.07, basY: 104 }
