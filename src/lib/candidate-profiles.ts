import type { PartyId } from '@/election'

export type CandidateProfileContent = {
  id: string
  number: number
  name: string
  photo?: string
  school?: string
  program?: string
  year?: number
  party?: PartyId
  motto?: string
  personalTrait?: string
  leadershipTrait?: string
  projects: readonly { name: string; description: string }[]
}

type CandidateOffice = {
  id: string
  title: string
  candidates: readonly CandidateProfileContent[]
}

const tingog = 'TINGOG!'

function candidatePhoto(folder: 'Tingog' | 'STAND' | 'SPP', filename: string) {
  return `/candidates/${folder}/${encodeURIComponent(filename)}`
}

// Public profile submissions are independent of the voting configuration in src/election.ts.
export const CANDIDATE_OFFICES: readonly CandidateOffice[] = [
  {
    id: 'president',
    title: 'President',
    candidates: [
      {
        id: 'mark-lawrence-gavas',
        number: 1,
        name: 'Gavas, Mark Lawrence L.',
        photo: candidatePhoto('Tingog', '#1-Gavas_Mark.webp'),
        school: 'SAS',
        program: 'BS Psychology',
        year: 3,
        party: tingog,
        motto: 'Doing it scared is just as brave',
        personalTrait: 'outspoken',
        leadershipTrait: 'proactive',
        projects: [
          {
            name: 'Carolinian Consensus',
            description:
              'This is a university-wide student satisfaction survey to assess campus facilities, academic experiences, student services, and SSC initiatives.',
          },
          {
            name: 'Presidential Commission on Accountability and Evaluation',
            description:
              'This aims to monitor and evaluate the performance and contributions of SSC officers. Through semestral evaluations and student pulse surveys, the Commission will strengthen internal accountability and ensure that officers remain transparent, responsive, and responsible for their respective duties.',
          },
          {
            name: 'Constitutional Convention',
            description:
              'This aims to comprehensively review and reform the USC Supreme Student Council Constitution. The proposed reforms will cover the restructuring of the SSC and its committees.',
          },
        ],
      },
      {
        id: 'dyane-jhen-wagas',
        number: 2,
        name: 'Wagas, Dyane Jhen P.',
        party: 'STAND',
        photo: candidatePhoto('STAND', '#2-Wagas_Dyane_Jhen.webp'),
        school: 'SAS',
        program: 'BS Psychology',
        year: 4,
        motto: 'Serve the people',
        personalTrait: 'Resilient',
        leadershipTrait: 'Gritty',
        projects: [],
      },
    ],
  },
  {
    id: 'vice-president',
    title: 'Vice President',
    candidates: [
      {
        id: 'monica-denise-rodriguez',
        number: 1,
        name: 'Rodriguez, Monica Denise T.',
        party: 'STAND',
        photo: candidatePhoto('STAND', '#1-Rodriguez_Monica_Denise_T.webp'),
        school: 'SBE',
        program: 'BSBA Operations Management',
        year: 3,
        motto: 'Fortune will always favor the bold.',
        personalTrait: 'Thinker',
        leadershipTrait: 'Perseverant',
        projects: [],
      },
      {
        id: 'princess-jannah-ungab',
        number: 2,
        name: 'Ungab, Princess Jannah',
        photo: candidatePhoto('Tingog', '#2-Ungab_Princess_Jannah.webp'),
        school: 'SBE',
        program: 'BS Management Accounting',
        year: 4,
        party: tingog,
        motto: 'Have courage and be kind.',
        personalTrait: 'Extra',
        leadershipTrait: 'Compassionate',
        projects: [
          {
            name: 'Inter-University Student Council Roundtable',
            description:
              'This brings together student council leaders and External Relations officers from different universities. This initiative aims to strengthen student advocacies and advance common welfare concerns before relevant institutions and government agencies.',
          },
          {
            name: 'Carolinian Student Organization Pipeline',
            description:
              'This is a centralized event calendar and streamlines coordination system for recognized and unrecognized student organizations in collaboration with the CSO. This initiative will help prevent scheduling conflicts, identify administrative bottlenecks, clarify event filing and approval procedures, and assist organizations in securing clearances for external partnerships, sponsors, and speakers.',
          },
          {
            name: 'Office of the Vice President External Relations Directorate',
            description:
              'This is a two-desk External Relations Directorate to secure external resources and partnership for student welfare and campus development. Through Corporate and Brand Partnerships Desk, and the NGO, Civic and Institutional Alliances Desk, the initiative will pursue sponsorships, student discounts, career opportunities, facility improvements, and accessible health, wellness, and community welfare programs.',
          },
        ],
      },
    ],
  },
  {
    id: 'councilors',
    title: 'Councilors',
    candidates: [
      {
        id: 'andrie-levy-arizobal',
        number: 1,
        name: 'Arizobal, Andrie Levy',
        photo: candidatePhoto('Tingog', '#1-Arizobal_Andrie_Levy.webp'),
        school: 'SAS',
        program: 'BS Psychology',
        year: 2,
        party: tingog,
        motto: "If it doesn't challenge you, it won't change you",
        personalTrait: 'Straightforward',
        leadershipTrait: 'Open-minded',
        projects: [
          {
            name: 'TULAY',
            description:
              'A student governance initiative that aims to make the USC Supreme Student Council more accessible, transparent, and participatory by helping Carolinians understand how student concerns are addressed and how they can take part in decision-making. Through this platform, students will gain practical knowledge on turning concerns into legislative proposals, lobbying for student welfare, and understanding the processes of student governance through initiatives like Tinig at Mensahe, the Student Lobbying and Advocacy Guide, and The People’s Agenda.',
          },
        ],
      },
      {
        id: 'briar-cymone-cuizon',
        number: 2,
        name: 'Cuizon, Briar Cymone',
        photo: candidatePhoto('Tingog', '#2-Cuizon_Cymone.webp'),
        school: 'SLG',
        program: 'BA Political Science',
        year: 2,
        party: tingog,
        motto:
          "It's okay not to be okay, and it's okay to fail; what's not okay is to stay that way forever.",
        personalTrait: 'Reliable',
        leadershipTrait: 'Approachable',
        projects: [
          {
            name: 'LARGA TA, CAROLINIAN',
            description:
              'A commuter-focused initiative that aims to make daily travel safer, more affordable, and more convenient for Carolinians through road-safety education, transportation partnerships, and accessible commuter information. This platform will pursue road-safety seminars with the LTO, explore possible student discounts with transportation providers like Angkas, Move It, and Grab, and develop the Carolinian Compass, a digital guide containing transportation information, emergency hotlines, nearby essential establishments, and commuting reminders.',
          },
        ],
      },
      {
        id: 'ravioli-bueri-blanc-gabales',
        number: 3,
        name: 'Gabales, Ravioli Bueri Blanc Manayaga',
        photo: candidatePhoto('Tingog', '#3-Gabales_Ravioli.webp'),
        school: 'SAS',
        program: 'BS Psychology',
        year: 2,
        party: tingog,
        motto: '“With an open Mind, Comes an Open heart”',
        personalTrait: 'Outgoing',
        leadershipTrait: 'Free Flowing',
        projects: [
          {
            name: 'E - Baligya',
            description:
              'A digital marketplace for Carolinian-owned small businesses. Carolinian students can discover local student-run businesses, while entrepreneurs gain opportunities to connect with fellow business owners. The platform will be established through coordination with different school councils and refreshed annually to feature emerging student businesses.',
          },
        ],
      },
      {
        id: 'tristan-jude-gacrama',
        number: 4,
        name: 'Gacrama, Tristan Jude G.',
        party: 'SPP',
        photo: candidatePhoto('SPP', '#4-Gacrama_Tristan_Jude_Garcia-v3.webp'),
        school: 'SOE',
        program: 'BS Mechanical Engineering',
        year: 2,
        motto: 'Lift as you climb.',
        personalTrait: 'Grounded',
        leadershipTrait: 'Advocacy-driven',
        projects: [
          {
            name: 'C.A.R.E.E.R. (Creating Access for Relevant Experiences and Employment Resources)',
            description:
              'A student employment initiative that partners with companies to connect Carolinians with internships, part-time jobs, and entry-level roles—equipping students with practical skills, extra income.',
          },
        ],
      },
      {
        id: 'adam-zachary-gaviola',
        number: 5,
        name: 'Gaviola, Adam Zachary D.',
        party: 'STAND',
        photo: candidatePhoto('STAND', '#5-Gaviola_Adam_Zachary.webp'),
        school: 'SBE',
        program: 'BS Accountancy',
        year: 2,
        motto:
          'Life moves pretty fast. You don’t stop and look around once in a while. You could miss it.',
        personalTrait: 'Optimistic',
        leadershipTrait: 'Coherent',
        projects: [
          {
            name: 'Grievance System through College Councils: Online Reklamo and Problem Exploration (GSCOPE)',
            description: '',
          },
        ],
      },
      {
        id: 'yoshua-luke-majam',
        number: 6,
        name: 'Majam, Yoshua Luke Lobitonia',
        photo: candidatePhoto('Tingog', '#6-Majam_Yoshua.webp'),
        school: 'SLG',
        program: 'BA Political Science',
        year: 3,
        party: tingog,
        motto:
          '“The world becomes a little brighter when we choose kindness over judgment, and respect over differences.”',
        personalTrait: 'Empathetic',
        leadershipTrait: 'Determined',
        projects: [
          {
            name: 'SILINGAN CAROLINIAN',
            description:
              'A community-building and student assistance initiative designed to help provincial and international Carolinians adjust to independent living in Cebu by providing peer support, practical resources, and accessible information. Through this platform, students can connect with fellow non-local Carolinians, access updated dormitory listings and directories of nearby essential services, and find travel guides covering transportation routes, booking information, and trips to their home provinces.',
          },
        ],
      },
      {
        id: 'kent-deloria-reyes',
        number: 7,
        name: 'Reyes, Kent Deloria',
        photo: candidatePhoto('Tingog', '#7-Reyes_Kent.webp'),
        school: 'SBE',
        program: 'BS Accountancy',
        year: 2,
        party: tingog,
        projects: [
          {
            name: 'FINANCE-ABLE CAROLINIANS',
            description:
              'A financial accountability and transparency initiative that seeks to address the USC Supreme Student Council’s funding limitations following the removal of the P12.25 Student Council dues. This platform advocates for the appropriate restoration of SSC funds while institutionalizing monthly financial disclosures, liquidation reports, standardized accounting procedures, and financial management training in partnership with USC - JPIA.',
          },
        ],
      },
      {
        id: 'renie-jr-rizaldo',
        number: 8,
        name: 'Rizaldo, Renie Jr. D.',
        party: 'SPP',
        photo: candidatePhoto('SPP', '#8-Rizaldo_Renie_Jr.webp'),
        school: 'SHCP',
        program: 'BS Nutrition and Dietetics',
        year: 3,
        motto: 'Be the change you wish to see in the world.',
        personalTrait: 'Compassionate',
        leadershipTrait: 'Visionary',
        projects: [
          {
            name: 'Alagad Sa Kaalam (A.S.K.)',
            description:
              'Grounded in the belief that knowledge serves best when shared. As a Nutrition & Dietetics student, this initiative makes health and wellness accessible to every Carolinian through peer-led nutrition literacy, budget-friendly healthy eating guides, and campus wellness drives.',
          },
        ],
      },
      {
        id: 'sean-joseph-solibaga',
        number: 9,
        name: 'Solibaga, Sean Joseph',
        photo: candidatePhoto('Tingog', '#9-Solibaga_Sean.webp'),
        school: 'SLG',
        program: 'BA Political Science',
        year: 3,
        party: tingog,
        motto: 'to live is to experience',
        projects: [
          {
            name: 'GABAY',
            description:
              'A centralized student assistance information platform that connects Carolinians to verified scholarships, financial aid, academic opportunities, and university support services. The initiative aims to make essential resources easier to find and access, ensuring that students are being informed and guided in navigating their academic and financial needs.',
          },
        ],
      },
      {
        id: 'weighne-princess-tan',
        number: 10,
        name: 'Tan, Weighne Princess',
        photo: candidatePhoto('Tingog', '#10-Tan_Weighne.webp'),
        school: 'SAS',
        program: 'BS Psychology',
        year: 2,
        party: tingog,
        motto: 'For the people, by the people',
        personalTrait: 'Bubbly',
        leadershipTrait: 'Adaptable',
        projects: [
          {
            name: 'CAREEROLINIAN',
            description:
              'A career development initiative that prepares Carolinians for the professional world through practical career guidance, employability training, and industry exposure. Through this platform, Carolinians can participate in career development seminars and career preparation workshop alongside networking activities with companies, alumni, and industry professionals who can introduce internship and employment opportunities.',
          },
        ],
      },
      {
        id: 'peter-allan-vilbar',
        number: 11,
        name: 'Vilbar, Peter Allan',
        photo: candidatePhoto('Tingog', '#11-Vilbar_Peter.webp'),
        school: 'SLG',
        program: 'BA Political Science',
        year: 3,
        party: tingog,
        motto: 'Service by commitment not by obligation',
        personalTrait: 'Committed',
        leadershipTrait: 'Resourceful',
        projects: [
          {
            name: 'CONNECT',
            description:
              'A partnership development initiative that strengthens the USC Supreme Student Council’s existing network of sponsors, organizations, and external partners through a more organized and sustainable partnership system. This platform will reactivate previous partnerships, establish a centralized directory and tracking system for partnership requests, and facilitate new collaborations that provide collaborations that provide SSC committees with access to sponsorships, resources, and opportunities. This initiative aims to support the implementation of the council’s projects and create more opportunities for the Carolinian community.',
          },
        ],
      },
    ],
  },
]
