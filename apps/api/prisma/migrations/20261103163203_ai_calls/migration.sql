-- CreateTable
CREATE TABLE "ai_call" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "use_case" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "prompt_version" TEXT NOT NULL,
    "tokens_in" INTEGER NOT NULL,
    "tokens_cached" INTEGER NOT NULL,
    "tokens_out" INTEGER NOT NULL,
    "latency_ms" INTEGER NOT NULL,
    "cost_usd" DOUBLE PRECISION NOT NULL,
    "outcome" TEXT NOT NULL,
    "tool_rounds" INTEGER NOT NULL,
    "input_text" TEXT,
    "proposal" JSONB,
    "feedback" JSONB,
    "created_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "ai_call_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ai_call_user_id_created_at_idx" ON "ai_call"("user_id", "created_at");

-- AddForeignKey
ALTER TABLE "ai_call" ADD CONSTRAINT "ai_call_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
