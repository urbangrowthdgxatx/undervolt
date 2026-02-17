-- Migration: Add model versioning to cached_answers
-- Run this in Supabase SQL Editor before deploying the code changes.

-- 1. Add model column (backfill existing rows as 'claude-cached')
ALTER TABLE cached_answers ADD COLUMN IF NOT EXISTS model TEXT NOT NULL DEFAULT 'claude-cached';

-- 2. Add model_metadata JSONB for storing generation params, timestamps, etc.
ALTER TABLE cached_answers ADD COLUMN IF NOT EXISTS model_metadata JSONB DEFAULT '{}';

-- 3. Drop old unique constraint on question_hash alone
-- (allows storing multiple answers per question, one per model)
ALTER TABLE cached_answers DROP CONSTRAINT IF EXISTS cached_answers_question_hash_key;
DROP INDEX IF EXISTS cached_answers_question_hash_key;

-- 4. Create composite unique index on (question_hash, model)
CREATE UNIQUE INDEX IF NOT EXISTS cached_answers_question_hash_model_idx
  ON cached_answers(question_hash, model);

-- 5. Index for fast lookups by model
CREATE INDEX IF NOT EXISTS cached_answers_model_idx ON cached_answers(model);

-- 6. Backfill: tag existing rows as claude-cached
UPDATE cached_answers SET model = 'claude-cached' WHERE model = 'claude-cached';
