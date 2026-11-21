CREATE TYPE "OcrStatus" AS ENUM ('PENDING', 'DONE', 'FAILED');

ALTER TABLE "Registration"
    ADD COLUMN "ocrStatus" "OcrStatus" NOT NULL DEFAULT 'PENDING', 
    ADD COLUMN "ocrResult" JSONB;