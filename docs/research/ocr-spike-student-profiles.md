# R&D: OCR for Registration review (S1-09)

| | |
|---|---|
| **Status** | Complete. Decision recorded in [ADR 0006](../adr/0006-advisory-ocr-on-student-profiles.md) (accepted) |
| **Spike** | S1-09, issue #9, timeboxed to 1 day |
| **Vercel feasibility** | S2-10a, issue #28: **go** (2026-11-16). See [Finding 4](#finding-4-it-runs-well-enough-on-vercel-s2-10a) |
| **Date** | 2026-11-09 |
| **Related** | [Software Design §5.4](../software-design.md) · [Sprint plan 2.10a, 2.10b, 2.11](../sprint-plan.md) |

## Summary

- **Applicants upload a screenshot of their ISMIS Student Profile, not their Study Load.** The Study Load doesn't show the student's name, and on mobile it needs 2–3 screenshots. The Student Profile shows name, student ID, Year Level and term in one screenshot on any device.
- **OCR runs on our server with PaddleOCR (PP-OCRv6 models on ONNX Runtime).** Images never leave our infrastructure, so no third-party agreement is needed.
- **Accuracy is good enough:** 36 of 36 field checks passed across 9 screenshots of 5 students on desktop, tablet and mobile. Wrong students were rejected.
- **Speed on Vercel is good enough (S2-10a: go).** On a 1 vCPU, 2 GB Vercel function, OCR takes 2–12 s per image and peaks at about 1.5 GB of memory. The 10–35 s slow runs from the dev machine didn't happen on Vercel. Because OCR runs in `after()`, Applicants don't wait for it.
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

## Finding 4: it runs well enough on Vercel (S2-10a)

Measured on a Vercel preview of a throwaway branch (`S2-12`, not merged), with a Node pipeline for the same PP-OCRv6 det and rec models on `onnxruntime-node` 1.31.1. The angle classifier was dropped because screenshots aren't rotated. 11 consented screenshots of 7 students were sent to a test route in the request body. Nothing was stored and no OCR text was logged.

The function ran on Fluid compute with 1 vCPU and 2,048 MB in `iad1`.

| | Vercel |
|---|---|
| Function size | about 100 MB (limit 250 MB). Only the linux-x64 `onnxruntime-node` binary is included |
| OCR time per image, warm | desktop 3.6 s median, 9.3 s worst; tablet 8.4 s median, 11.9 s worst; mobile 3.9 s median, 4.4 s worst |
| Largest image (2732×2048, 3.8 MB) | 8.9 s |
| Cold start | +0.3–0.4 s to load the models; worst cold request 14.9 s end to end |
| Peak memory | 1.3–1.65 GB (limit 2,048 MB) |
| Slow runs | none; the same image never varied more than 1.45× |
| Field accuracy | 89/89 requests matched all four fields |

- **`after()` works.** The response returned in 1.1–1.5 s, and OCR finished 2–11 s later in the same invocation.
- **Concurrency.** 3 simultaneous requests ran on 3 separate instances. Two OCR jobs on one instance would exceed 2 GB, so the feature runs one OCR job per instance at a time.
- **Time grows with image dimensions**, not file size. On 1 vCPU it's slower than the dev machine (2–6 s on 16 threads).
- **Vercel caps request bodies at 4.5 MB**, so images near the 5 MB upload limit couldn't be sent to the test route. The feature downloads images from Supabase instead, so this doesn't apply to it.

**Settings for 2.10b (#25):** `maxDuration = 300` on `/api/trpc` (the worst run was 12.5 s, but jobs queued behind the one-job-per-instance lock count against the same limit), 2,048 MB memory, one OCR job at a time per instance, and the model files and linux-x64 binary added to the route's file tracing with other platforms' binaries excluded. `onnxruntime-node`'s postinstall stays blocked, because it downloads CUDA libraries that would exceed the 250 MB limit. The full measurements and config are in [#28](https://github.com/todayscarolinian/comelec-elections/issues/28).

## Decision

1. Registration takes a **Student Profile** screenshot instead of a Study Load.
2. After `submitRegistration` returns, the server runs **PaddleOCR (PP-OCRv6 via `onnxruntime-node`)** in the background with Next.js `after()`. It stores only the four fields and their match results in `Registration.ocrResult` (Software Design §5.4).
3. Admins see the OCR findings next to the image. OCR never approves, rejects or blocks a Registration, and if it fails, the Admin reviews without it.

## Risks and follow-ups

| Item | Owner / task | Due |
|---|---|---|
| ~~Measure cold start, time per image and memory on a Vercel preview; set `maxDuration` for `/api/trpc`~~ Done: go, `maxDuration = 300` (Finding 4) | 2.10a (#28) | Done Nov 16 |
| Rename Study Load to Student Profile in code (bucket, `studentProfilePath` migration run manually, upload procedure) | 2.11 (#29) | Before 2.2–2.4 |
| Does the Student Profile prove current enrollment, or is a Study Load also needed? | Commission | Nov 12 |
| Retention of Student Profile images, which show date of birth | Client | Nov 19 |
| If OCR is too slow or unreliable on Vercel, launch with manual review only | 2.10a (#28) | Not needed: Vercel result is a go. OCR is still cut first if Sprint 2 is at risk |

## Limitations of this spike

- 9 screenshots of 5 students, all from the same term. Other terms, edited images and photos of a screen weren't tested.
- Findings 1–3 use dev-machine timings. Vercel timings are in Finding 4.
- The Vercel test ran on one region (`iad1`) with only a few concurrent requests. Load during the Registration Period wasn't simulated.
- Sample screenshots and OCR output are kept off the repo and are to be deleted after the spike. Samples are identified here only as Students A–E.
