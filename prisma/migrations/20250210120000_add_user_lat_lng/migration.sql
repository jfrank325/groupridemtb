-- Add latitude/longitude columns to the User table without affecting existing data
ALTER TABLE "User"
    ADD COLUMN "lat" DOUBLE PRECISION,
    ADD COLUMN "lng" DOUBLE PRECISION;

