ALTER TABLE "Comment" DROP CONSTRAINT "Comment_authorId_fkey";
ALTER TABLE "Comment" ALTER COLUMN "authorId" DROP NOT NULL;
ALTER TABLE "Comment"
  ADD CONSTRAINT "Comment_authorId_fkey"
  FOREIGN KEY ("authorId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
