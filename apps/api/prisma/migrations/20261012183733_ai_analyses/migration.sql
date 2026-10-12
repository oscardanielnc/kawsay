-- When a user ran an AI analysis (F17): only the time (ADR 0013). Hand-edited: Prisma also proposed dropping
-- sync_record_seq, a false drift of its dbgenerated default; that part was removed.
-- CreateTable
CREATE TABLE "ai_analyses" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "ai_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ai_analyses_user_id_created_at_idx" ON "ai_analyses"("user_id", "created_at");

-- AddForeignKey
ALTER TABLE "ai_analyses" ADD CONSTRAINT "ai_analyses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
