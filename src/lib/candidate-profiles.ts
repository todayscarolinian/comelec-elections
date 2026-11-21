export type CandidateProfileContent = {
  sample: boolean
  academicDetails?: string
  introduction: string
  priorities: readonly string[]
  commitments: readonly string[]
  experience: readonly string[]
}

// Demonstration copy, not statements or credentials supplied by real candidates.
// Replace these entries with commission-approved content when it becomes available.
export const CANDIDATE_PROFILES: Readonly<Partial<Record<string, CandidateProfileContent>>> = {
  'placeholder-question-1-candidate-a': {
    sample: true,
    introduction: 'A sample platform focused on making everyday student life more accessible.',
    priorities: [
      'Expand access to study spaces during examination weeks',
      'Create a clearer channel for student concerns',
      'Publish regular updates on council projects and spending',
    ],
    commitments: [
      'Hold open consultations with students',
      'Share progress reports throughout the term',
      'Work with student organizations on campus initiatives',
    ],
    experience: ['Candidate experience will be published after commission review.'],
  },
  'placeholder-question-1-candidate-b': {
    sample: true,
    introduction: 'A sample platform centered on student participation and well-being.',
    priorities: [
      'Make student support services easier to discover',
      'Build a regular student feedback and consultation program',
      'Support inclusive activities across the campus community',
    ],
    commitments: [
      'Keep consultation schedules accessible to everyone',
      'Report on issues raised by the student body',
      'Partner with campus groups on well-being activities',
    ],
    experience: ['Candidate experience will be published after commission review.'],
  },
  'placeholder-question-2-candidate-c': {
    sample: true,
    introduction: 'A sample platform for stronger collaboration between student organizations.',
    priorities: [
      'Coordinate a shared calendar of student-led activities',
      'Improve access to resources for organization projects',
      'Encourage collaboration across programs and year levels',
    ],
    commitments: [
      'Meet regularly with organization representatives',
      'Share opportunities for students to get involved',
      'Make project updates available to the student body',
    ],
    experience: ['Candidate experience will be published after commission review.'],
  },
  'placeholder-question-2-candidate-d': {
    sample: true,
    introduction: 'A sample independent platform emphasizing transparent student representation.',
    priorities: [
      'Create a simple way to follow council decisions',
      'Bring student feedback into project planning',
      'Promote accessible and sustainable campus activities',
    ],
    commitments: [
      'Publish clear summaries of ongoing projects',
      'Invite feedback before launching new initiatives',
      'Maintain an open channel for student suggestions',
    ],
    experience: ['Candidate experience will be published after commission review.'],
  },
}
