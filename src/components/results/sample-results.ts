import type { ResultsOutput } from '@/server/trpc/api/v1/results/schema'

/** Fixed layout-preview data for /results/sample. Never shown as real Results. */
export const SAMPLE_RESULTS: ResultsOutput = {
  releasedAt: null,
  countedBallots: 2000,
  heldPending: 0,
  heldRejected: 0,
  questions: [
    {
      id: 'sample-president',
      title: 'President',
      selectionLimit: 1,
      ballotsSeen: 2000,
      abstentions: 80,
      candidates: [
        { id: 'a', name: 'Andrea Villanueva', votes: 1120 },
        { id: 'b', name: 'Miguel Ramos', votes: 620 },
        { id: 'c', name: 'Kristine Uy', votes: 180 },
      ],
    },
    {
      id: 'sample-vice-president',
      title: 'Vice President',
      selectionLimit: 1,
      ballotsSeen: 2000,
      abstentions: 100,
      candidates: [
        { id: 'd', name: 'Paolo Lim', votes: 1040 },
        { id: 'e', name: 'Bea Navarro', votes: 860 },
      ],
    },
    {
      id: 'sample-councilors',
      title: 'Councilors',
      selectionLimit: 3,
      ballotsSeen: 2000,
      abstentions: 150,
      candidates: [
        { id: 'f', name: 'Carla Tan', votes: 1200 },
        { id: 'g', name: 'Jerome Abella', votes: 1060 },
        { id: 'h', name: 'Nina Ocampo', votes: 980 },
        { id: 'i', name: 'Rafael Go', votes: 820 },
        { id: 'j', name: 'Sofia Reyes', votes: 760 },
        { id: 'k', name: 'Luis Bautista', votes: 500 },
      ],
    },
  ],
}
