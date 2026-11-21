-- School is collected on every Registration from the start, so no row is ever without one.
ALTER TABLE "Registration"
ALTER COLUMN "school" SET NOT NULL;

ALTER TABLE "Ballot"
ALTER COLUMN "school" SET NOT NULL;
