/*
  Warnings:

  - You are about to drop the column `content` on the `messages` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "messages" DROP COLUMN "content";

-- CreateTable
CREATE TABLE "message_contents" (
    "id" TEXT NOT NULL,
    "message_id" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "kind" TEXT NOT NULL,
    "text" TEXT,
    "uri" TEXT,
    "mime_type" TEXT,
    "duration_ms" INTEGER,
    "width" INTEGER,
    "height" INTEGER,
    "video_status" TEXT,
    "video_prompt" TEXT,
    "video_failure" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "message_contents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "message_contents_message_id_position_idx" ON "message_contents"("message_id", "position");

-- AddForeignKey
ALTER TABLE "message_contents" ADD CONSTRAINT "message_contents_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
