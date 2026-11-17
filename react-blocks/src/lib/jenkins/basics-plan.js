// Jenkins Basics : les étapes de la formation courte (2 h maximum). Ce fichier est léger et chargé tout de
// suite ; le contenu des leçons (basics.js) est chargé à la demande.
export const PLAN_BASES = [
  { id: 'b1', num: 'Lesson 1', court: '1', titre: 'What Jenkins does', durée: 10, but: 'CI/CD, the controller and its agents, and the words of Jenkins.' },
  { id: 'b2', num: 'Lesson 2', court: '2', titre: 'Install Jenkins with Docker', durée: 20, but: 'A Compose file, one command, the setup wizard: your own Jenkins.' },
  { id: 'b3', num: 'Lesson 3', court: '3', titre: 'Find your way around', durée: 10, but: 'The dashboard, Manage Jenkins, and where to find what.' },
  { id: 'b4', num: 'Lesson 4', court: '4', titre: 'Your first job (Freestyle)', durée: 15, but: 'A shell step, a build, its console and its workspace.' },
  { id: 'b5', num: 'Lesson 5', court: '5', titre: 'Your first pipeline', durée: 25, but: 'A Jenkinsfile with stages: run it, break it, repair it.' },
  { id: 'b6', num: 'Lesson 6', court: '6', titre: 'Pipelines from Git, started by a push', durée: 10, but: 'Pipeline script from SCM, and webhooks.' },
  { id: 'b7', num: 'Lesson 7', court: '7', titre: 'Tests, artifacts and build results', durée: 10, but: 'JUnit reports, archived files, SUCCESS / UNSTABLE / FAILURE.' },
  { id: 'b8', num: 'Lesson 8', court: '8', titre: 'Credentials: secrets out of the code', durée: 10, but: 'Store a token in Jenkins and use it without leaking it.' },
  { id: 'b9', num: 'Wrap-up', court: '✓', titre: 'Recap, quiz and next steps', durée: 10, but: 'Check what you learned, then choose what comes next.' },
]

export const DURÉE_TOTALE = PLAN_BASES.reduce((n, l) => n + l.durée, 0)

// « 1 h 45 », « 25 min ».
export function durée(minutes) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h ? `${h} h${m ? ` ${String(m).padStart(2, '0')}` : ''}` : `${m} min`
}
