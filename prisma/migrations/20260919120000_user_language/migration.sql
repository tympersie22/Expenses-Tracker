ALTER TABLE "User" ADD COLUMN "language" TEXT NOT NULL DEFAULT 'en';
ALTER TABLE "User" ADD CONSTRAINT "User_language_check" CHECK ("language" IN ('en', 'sw'));
