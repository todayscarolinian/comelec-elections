export type RegistrationStatus = "PENDING" | "APPROVED" | "REJECTED";
export type OcrFindings =
  | { state: "processing" | "unavailable" }
  | {
      state: "available";
      name: string;
      studentId: string;
      year: number;
      term: string;
    };

export type Registration = {
  id: string;
  name: string;
  email: string;
  year: number;
  status: RegistrationStatus;
  ocr: OcrFindings;
  reason?: string;
};

export const EXPECTED_TERM = "1ST Semester 2026";
export const YEAR_LEVELS = [1, 2, 3, 4];

// UI fixtures only. Replace with authorized server data when S2-05 is integrated.
export const SAMPLE_REGISTRATIONS: Registration[] = [
  {
    id: "21012345",
    name: "Juan Dela Cruz",
    email: "21012345@usc.edu.ph",
    year: 3,
    status: "PENDING",
    ocr: {
      state: "available",
      name: "Juan Dela Cruz",
      studentId: "21012345",
      year: 2,
      term: EXPECTED_TERM,
    },
  },
  {
    id: "22045678",
    name: "Patricia Ong",
    email: "22045678@usc.edu.ph",
    year: 2,
    status: "PENDING",
    ocr: { state: "processing" },
  },
  {
    id: "01234567",
    name: "Rico Mendoza",
    email: "01234567@usc.edu.ph",
    year: 4,
    status: "PENDING",
    ocr: { state: "unavailable" },
  },
  {
    id: "23011122",
    name: "Alyssa Fernandez",
    email: "23011122@usc.edu.ph",
    year: 1,
    status: "PENDING",
    ocr: {
      state: "available",
      name: "Alyssa Fernandez",
      studentId: "23011122",
      year: 1,
      term: EXPECTED_TERM,
    },
  },
  {
    id: "21098765",
    name: "Mark Villarin",
    email: "21098765@usc.edu.ph",
    year: 3,
    status: "PENDING",
    ocr: { state: "unavailable" },
  },
  {
    id: "22123456",
    name: "Sofia Reyes",
    email: "22123456@usc.edu.ph",
    year: 2,
    status: "PENDING",
    ocr: { state: "processing" },
  },
  {
    id: "20112233",
    name: "Elena Tan",
    email: "20112233@usc.edu.ph",
    year: 4,
    status: "APPROVED",
    ocr: { state: "unavailable" },
  },
  {
    id: "23112233",
    name: "Miguel Santos",
    email: "23112233@usc.edu.ph",
    year: 1,
    status: "REJECTED",
    reason: "Upload a readable student profile for the current term.",
    ocr: { state: "unavailable" },
  },
];
