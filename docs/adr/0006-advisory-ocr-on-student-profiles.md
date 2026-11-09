---
status: accepted
---

# Applicants upload their Student Profile, which the server reads with OCR to assist Admins, but an Admin still decides every Registration

Reviewing every Registration by eye is the slowest part of the Registration Period, which is only about four days long (Nov 15–18). Applicants upload a screenshot of their **Student Profile** (the profile modal in ISMIS), not their Study Load. After it is uploaded, the server reads it with OCR and shows the Admin what it found next to the image: whether the student ID matches the Applicant's Workspace email, whether the name matches their Google account, whether the Year Level matches the one they declared, and whether the term is current. The OCR result is **advisory only**: it never approves or rejects a Registration by itself. This reverses the Product Spec non-goal "Automatically verifying eligibility or Year Level" in part. Verification is now partially automated, but the decision stays with an Admin.

OCR runs **on our server with PaddleOCR's PP-OCRv6 models through ONNX Runtime in Node**, so the image never leaves our infrastructure and no third-party agreement is needed.

## Why the Student Profile, not the Study Load

The OCR spike (S1-09) found that OCR read both documents accurately, including names with "ñ", but the Study Load is the wrong document to check:

- **The Study Load page doesn't show the student's name.** The only names on it are faculty, which would cause false name matches.
- **The student ID only appears on desktop**, in the page header. On mobile it is hidden behind the menu.
- **On mobile, the Study Load needs 2–3 screenshots** to show the whole course list, and only the first one shows the term.

The Student Profile fits in one screenshot on desktop, tablet and mobile, and shows the student's Full Name, Student ID, Year Level and current term. Each field is compared with what the app already knows about the Applicant:

| Field | Compared with |
|---|---|
| Student ID | The local part of the Applicant's Workspace email, which is their student ID (`12345678@usc.edu.ph` → `12345678`) |
| Full Name | Every word of the Google account name must appear in it, in any order (the profile also includes middle names) |
| Year Level | The Year Level the Applicant declared |
| Term | The current term, set in the Election definition |

Each field is read from the text to the right of its label, using text box positions, so text from the page behind the modal is ignored. The value can span several lines down to halfway to the next label, because long names wrap onto two lines on mobile.

### Spike results

Full write-up: [R&D: OCR for Registration review](../research/ocr-spike-student-profiles.md).

9 screenshots of 5 students: 4 desktop, 2 mobile and 3 tablet, including one low-resolution, slightly soft crop (667×702).

| Field | Correct and matched |
|---|---|
| Full Name | 9/9 |
| Student ID | 9/9 |
| Year Level | 9/9 |
| Term | 9/9 |

- **Wrong students are rejected.** Scoring each screenshot against another student's details failed name, student ID and Year Level on all 9. Term still matched, as expected, because every sample was from the same term.
- **The Google account name and the profile can be spelled differently.** In one sample, the account name had an extra letter in a given name compared with the profile. The name check allows small differences, so it still matched, but the review screen should show OCR's reading next to the account name.
- **Student IDs can start with zero** (for example `01234567`), so they must be compared as text, never as numbers.
- **Speed is the main risk, not accuracy.** Most images took 1.5–4 s with about 160 MB of memory on a dev machine. But the same image sometimes took 10–23 s on one run and 4 s on another, for no clear reason. Whether this is fast enough has to be measured on a Vercel preview (task 2.10a).

## Considered Options

- **Auto-approve when OCR matches**: rejected. The Student Profile is a screenshot and is easy to edit, so auto-approval gives the decision to whoever can fake an image. It also hides OCR errors that an Admin would catch.
- **No OCR (manual review only, the original design)**: the fallback. If OCR proves unreliable or too slow on Vercel, Registration launches with manual review only.
- **OCR in the browser (tesseract.js)**: rejected. Free, and the image is never sent anywhere new, but the result comes from the client and can be faked. Admins can't trust it.
- **OCR on the server with tesseract**: rejected in favor of PaddleOCR, which has the same trust and privacy benefits and is usually more accurate on photos, skewed images and mixed layouts.
- **OCR on the server with PaddleOCR (ONNX models in Node)**: **chosen**. The result can be trusted, the image stays within our infrastructure, and the models are small enough for a Vercel function. Cold start, time and memory limits still need to be measured on a Vercel preview.
- **Python OCR engines (EasyOCR, docTR, Surya)**: rejected. They depend on PyTorch, which is too large for Vercel functions, so they would need a separate container host the timeline can't absorb.
- **Cloud OCR API (for example Google Cloud Vision, AWS Textract, Azure Document Intelligence)**: rejected. Accurate and cheap, but it sends personal documents to a third party, which needs the client's agreement and probably wording in the developer access waiver. PaddleOCR was accurate enough without it.
- **Vision-capable LLM (for example Claude Haiku or Gemini Flash)**: rejected for the same third-party reason as a cloud OCR API.
- **Free hosted OCR services (for example OCR.space)**: rejected. Weaker privacy guarantees than the major cloud providers, which isn't acceptable for students' personal documents.

## Consequences

- Admins still review every Registration. OCR changes how fast they can review, not who decides.
- OCR failure must never block a Registration. OCR runs after `submitRegistration` returns. If it errors or times out, the Registration stays pending as normal and the Admin reviews it without OCR results.
- `Registration` gains an OCR status and the extracted fields as `Json?`. This needs a migration, which a developer runs manually.
- **Only the four extracted fields and their match results are stored, never the full OCR text.** The Student Profile also shows date of birth, which we don't need. The image itself still contains it, so the client's data retention decision applies to Student Profile images.
- The Study Load upload built in S1-08 is renamed: the `study-loads` bucket becomes `student-profiles`, `Registration.studyLoadPath` becomes `studentProfilePath` (a migration a developer runs manually), and `createStudyLoadUpload` becomes `createStudentProfileUpload`.
- The Glossary, Product Spec and Software Design now use Student Profile in place of Study Load.
- OCR is scoped separately in Sprint 2: a Vercel go/no-go (task 2.10a), then the feature (task 2.10b). It is the first thing cut if the Nov 15 Registration launch is at risk.

## Open questions

- **Does the Student Profile prove current enrollment?** The Study Load did, by listing enrolled courses. If the profile also shows the current semester for students who aren't enrolled, the commission must decide whether that is acceptable, or whether a Study Load is also needed.
- **Speed on Vercel:** cold start, time per image and memory, including the unexplained slow runs seen on a dev machine (task 2.10a).
