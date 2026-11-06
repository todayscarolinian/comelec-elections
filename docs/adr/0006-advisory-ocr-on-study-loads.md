---
status: proposed
---

# Study Loads are read by OCR to assist Admins, but an Admin still decides every Registration

Reviewing every Study Load by eye is the slowest part of the Registration Period, which is only about four days long (Nov 15–18). After a Study Load is uploaded, the system runs OCR on it and shows the Admin what it found next to the image, for example whether the name matches the Applicant's Google account and whether the enrollment term is current. The OCR result is **advisory only**: it never approves or rejects a Registration by itself. This reverses the Product Spec non-goal "Automatically verifying a Study Load or Year Level" in part. Verification is now partially automated, but the decision stays with an Admin.

Where OCR runs is **not yet decided**. It depends on the Sprint 1 OCR spike (S1-09), which runs 5–10 real sample Study Loads through each option below. This ADR is accepted once the spike recommends one option and the client agrees to it.

## Considered Options

- **Auto-approve when OCR matches**: rejected. A Study Load is a screenshot and is easy to edit, so auto-approval gives the decision to whoever can fake an image. It also hides OCR errors that an Admin would catch.
- **No OCR (manual review only, the original design)**: the fallback. If the spike shows OCR is unreliable or too slow, Registration launches with manual review only.
- **OCR in the browser (tesseract.js)**: free, and the image is never sent anywhere new. But the result comes from the client and can be faked, so it can only warn Applicants before they upload an unreadable image. Admins can't trust it.
- **OCR on the server after upload (tesseract on Vercel)**: the result can be trusted, and the image stays within our infrastructure. It may be slow or hit Vercel function time and memory limits.
- **Cloud OCR API (for example Google Cloud Vision)**: the most accurate. But it sends personal documents to a third party, which needs the client's agreement and probably wording in the developer access waiver.

## Consequences

- Admins still review every Registration. OCR changes how fast they can review, not who decides.
- OCR failure must never block a Registration. If OCR errors or times out, the Registration is submitted as normal and the Admin reviews it without OCR results.
- `Registration` gains fields for the OCR result, such as an OCR status and the extracted fields as `Json?`. If these aren't in the initial migration, they need a second migration, which a developer runs manually.
- OCR results come from personal documents, so the client's data retention decision for Study Loads applies to them too.
- The Product Spec (§2 non-goals, §5.2 US-3, §8 known limitations) and the Software Design (§5) must be updated once this ADR is accepted.
- OCR is scoped separately in Sprint 2 (task 2.10) and is the first thing cut if the Nov 15 Registration launch is at risk.
