-- Nullable so existing Registrations and Ballots stay valid while the Election is open.
-- People registered before this column existed are asked for their School once.
ALTER TABLE "Registration"
ADD COLUMN "school" TEXT;

ALTER TABLE "Ballot"
ADD COLUMN "school" TEXT;
