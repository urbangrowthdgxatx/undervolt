-- Undervolt Model Eval Tables
-- Run this in Supabase SQL Editor

-- Individual question results per model per run
CREATE TABLE IF NOT EXISTS model_evals (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  run_id text NOT NULL,
  question text NOT NULL,
  category text NOT NULL,
  model text NOT NULL,
  model_label text,
  response text,
  latency_ms integer,
  tokens_total integer,
  tokens_prompt integer,
  tokens_completion integer,
  overall_pass boolean DEFAULT false,
  overall_score real DEFAULT 0,
  -- Scoring dimensions
  factual_accuracy real,
  hallucination_guard real,
  topic_relevance real,
  data_citation real,
  format_compliance real,
  conciseness real,
  no_preamble real,
  created_at timestamptz DEFAULT now()
);

-- Run-level summary per model
CREATE TABLE IF NOT EXISTS eval_runs (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  run_id text NOT NULL,
  model text NOT NULL,
  model_label text,
  total_questions integer,
  pass_count integer,
  fail_count integer,
  avg_score real,
  pass_rate real,
  avg_latency_ms integer,
  -- Average scores per dimension
  avg_factual_accuracy real,
  avg_hallucination_guard real,
  avg_topic_relevance real,
  avg_data_citation real,
  avg_format_compliance real,
  avg_conciseness real,
  created_at timestamptz DEFAULT now()
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_model_evals_run ON model_evals(run_id);
CREATE INDEX IF NOT EXISTS idx_model_evals_model ON model_evals(model);
CREATE INDEX IF NOT EXISTS idx_model_evals_category ON model_evals(category);
CREATE INDEX IF NOT EXISTS idx_eval_runs_model ON eval_runs(model);
CREATE INDEX IF NOT EXISTS idx_eval_runs_created ON eval_runs(created_at DESC);
