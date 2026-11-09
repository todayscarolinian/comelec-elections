# R&D: OCR for Registration review (S1-09)

| | |
|---|---|
| **Status** | Complete. Decision recorded in [ADR 0006](../adr/0006-advisory-ocr-on-student-profiles.md) (accepted) |
| **Spike** | S1-09, issue #9, timeboxed to 1 day |
| **Date** | 2026-11-09 |
| **Related** | [Software Design §5.4](../software-design.md) · [Sprint plan 2.10a, 2.10b, 2.11](../sprint-plan.md) |

## Summary

- **Applicants upload a screenshot of their ISMIS Student Profile, not their Study Load.** The Study Load doesn't show the student's name, and on mobile it needs 2–3 screenshots. The Student Profile shows name, student ID, Year Level and term in one screenshot on any device.
- **OCR runs on our server with PaddleOCR (PP-OCRv6 models on ONNX Runtime).** Images never leave our infrastructure, so no third-party agreement is needed.
- **Accuracy is good enough:** 36 of 36 field checks passed across 9 screenshots of 5 students on desktop, tablet and mobile. Wrong students were rejected.
- **Speed is the remaining risk.** Most images took 1.5–4 s on a dev machine, but some runs took 10–35 s. This must be measured on a Vercel preview before launch (task 2.10a).
- **OCR stays advisory.** It shows Admins what matched; it never approves or rejects a Registration.

## Question

Admins review every Registration by eye during a four-day Registration Period (Nov 15–18). Can OCR read the uploaded document reliably enough to show Admins which details match the Applicant, and where should it run?

## Options considered

| Option | Outcome | Reason |
|---|---|---|
| Browser OCR (tesseract.js) | Rejected, not tested | The result comes from the Applicant's browser and can be faked, so Admins can't trust it |
| Server-side tesseract | Rejected, not tested | Same trust and privacy as PaddleOCR, but usually less accurate on photos and mixed layouts |
| **Server-side PaddleOCR (ONNX)** | **Chosen, tested** | Trusted result, images stay with us, small enough models for a Vercel function |
| Python OCR engines (EasyOCR, docTR, Surya) | Rejected, not tested | Need PyTorch, too large for Vercel; would need a separate host |
| Cloud OCR API (Google Vision, Textract, Azure) | Rejected, not tested | Sends students' personal documents to a third party, needing client agreement and waiver wording |
| Vision-capable LLM (Claude Haiku, Gemini Flash) | Rejected, not tested | Same third-party concern |
| Free hosted OCR (OCR.space) | Rejected | Weak privacy guarantees for personal documents |

Cost wasn't a deciding factor: every option was free or a few dollars at our volume.

## Method

- **Engine:** RapidOCR 3.10.0 with onnxruntime 1.31.1, which runs PaddleOCR's PP-OCRv6 detection and multilingual recognition models. A Node version would use the same models through `onnxruntime-node`.
- **Harness:** a throwaway Python script, not committed, that runs every screenshot, pulls out the four fields and compares them with what the app would know about the Applicant.
- **Field extraction:** each value is the text to the right of its label ("Full Name", "Student ID", "Year Level"), found by text box position, down to halfway to the next label. The term is found by pattern (`1ST Semester 2026`).
- **Matching:**
  - **Student ID:** must equal the part of the Workspace email before `@`, compared as text
  - **Name:** every word of the Google account name must appear in the profile name, in any order, allowing a 15% spelling difference per word
  - **Year Level:** must equal the declared Year Level
  - **Term:** must equal the current term
- **Machine:** a Windows dev laptop on CPU, so timings are only indicative.

## Finding 1: the Study Load is the wrong document

Three Study Load screenshots (one desktop, two mobile from one student). OCR read them accurately, including "ñ", but:

- **No student name** appears on the page. The only names are faculty, which would cause false name matches.
- **The student ID** only appears in the desktop header. On mobile it's hidden behind the menu.
- **Mobile needs 2–3 screenshots** to show all courses, and only the first shows the term. Supporting that would mean several images per Registration.

## Finding 2: the Student Profile works

9 screenshots of 5 students:

| Sample | Device | Image size | Name | Student ID | Year Level | Term |
|---|---|---|---|---|---|---|
| A | Desktop | 1008×535 | ✅ | ✅ | ✅ | ✅ |
| B1 | Desktop | 1639×697 | ✅ | ✅ | ✅ | ✅ |
| B2 | Mobile | 1170×2532 | ✅ | ✅ | ✅ | ✅ |
| B3 | Tablet | 2732×2048 | ✅ | ✅ | ✅ | ✅ |
| C1 | Tablet, low-resolution crop | 667×702 | ✅ | ✅ | ✅ | ✅ |
| C2 | Tablet | 1424×2049 | ✅ | ✅ | ✅ | ✅ |
| D | Desktop | 1900×1091 | ✅ | ✅ | ✅ | ✅ |
| E1 | Mobile | 1170×2532 | ✅ | ✅ | ✅ | ✅ |
| E2 | Tablet | 1536×2049 | ✅ | ✅ | ✅ | ✅ |
| **Total** | | | **9/9** | **9/9** | **9/9** | **9/9** |

Average OCR confidence was 0.955–0.982 per image.

**Wrong students are rejected.** Each screenshot was also scored against a different student's details. Name, student ID and Year Level failed on all 9. Term still matched, as expected, because every sample was from the same term.

**Notes from the samples:**
- **Names wrap on mobile.** A long name takes two lines, with the label between them. Reading only the label's row caught just the surname. That was the only miss in the first run, and reading down to the next label fixed it.
- **Google account names can differ slightly from the profile.** One account name had an extra letter compared with the profile. The spelling tolerance still matched it, but Admins should see OCR's reading next to the account name.
- **Student IDs can start with zero,** so they must never be stored or compared as numbers.
- **The profile also shows date of birth.** It isn't needed, so only the four fields are stored, never the full OCR text.

## Finding 3: speed is uneven

| | Dev machine |
|---|---|
| Typical time per image | 1.5–4 s |
| Slow runs seen | 10–35 s, on images that took 2–4 s in other runs |
| Peak memory | about 160 MB |
| First image after start-up (includes loading the models) | 1.7–4.7 s |

The slow runs didn't follow any particular image, size or device, and the same file was fast in other runs. They may come from load on the dev machine or from ONNX Runtime adjusting to new image sizes. Either way, dev-machine timings can't decide this; the Vercel measurement can.

## Decision

1. Registration takes a **Student Profile** screenshot instead of a Study Load.
2. After `submitRegistration` returns, the server runs **PaddleOCR (PP-OCRv6 via `onnxruntime-node`)** in the background with Next.js `after()`. It stores only the four fields and their match results in `Registration.ocrResult` (Software Design §5.4).
3. Admins see the OCR findings next to the image. OCR never approves, rejects or blocks a Registration, and if it fails, the Admin reviews without it.

## Risks and follow-ups

| Item | Owner / task | Due |
|---|---|---|
| Measure cold start, time per image and memory on a Vercel preview; set `maxDuration` for `/api/trpc` | 2.10a (#28) | Before the Nov 15 launch |
| Rename Study Load to Student Profile in code (bucket, `studentProfilePath` migration run manually, upload procedure) | 2.11 (#29) | Before 2.2–2.4 |
| Does the Student Profile prove current enrollment, or is a Study Load also needed? | Commission | Nov 12 |
| Retention of Student Profile images, which show date of birth | Client | Nov 19 |
| If OCR is too slow or unreliable on Vercel, launch with manual review only | 2.10a (#28) | Cut first if Sprint 2 is at risk |

## Limitations of this spike

- 9 screenshots of 5 students, all from the same term. Other terms, edited images and photos of a screen weren't tested.
- All timings are from a dev machine, not Vercel.
- The Node implementation wasn't built, so `onnxruntime-node` behavior and function size on Vercel are untested.
- Sample screenshots and OCR output are kept off the repo and are to be deleted after the spike. Samples are identified here only as Students A–E.
