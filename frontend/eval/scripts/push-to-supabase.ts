/**
 * Push Promptfoo eval results to Supabase
 *
 * Usage: npx tsx eval/scripts/push-to-supabase.ts [results-file]
 * Default: eval/results/latest.json
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { join } from "path";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface EvalResult {
  results: {
    results: Array<{
      prompt: { raw: string };
      vars: { question: string; category: string; expected_topics: string[]; ground_truth_stats: string[] };
      response: { output: string };
      provider: { id: string; label?: string };
      latencyMs: number;
      tokenUsage?: { total: number; prompt: number; completion: number };
      gradingResult: {
        pass: boolean;
        score: number;
        componentResults: Array<{
          pass: boolean;
          score: number;
          reason: string;
          assertion: { metric?: string };
        }>;
      };
    }>;
  };
}

async function main() {
  const resultsFile = process.argv[2] || join(__dirname, "../results/latest.json");

  console.log(`Reading results from: ${resultsFile}`);
  const raw = readFileSync(resultsFile, "utf-8");
  const data: EvalResult = JSON.parse(raw);

  const results = data.results.results;
  const runId = `eval-${Date.now()}`;
  const timestamp = new Date().toISOString();

  console.log(`Processing ${results.length} eval results...`);

  // Build rows for Supabase
  const rows = results.map((r) => {
    const metrics: Record<string, number> = {};
    for (const c of r.gradingResult?.componentResults || []) {
      if (c.assertion?.metric) {
        metrics[c.assertion.metric] = c.score;
      }
    }

    return {
      run_id: runId,
      question: r.vars.question,
      category: r.vars.category,
      model: r.provider.id,
      model_label: r.provider.label || r.provider.id,
      response: r.response.output,
      latency_ms: r.latencyMs,
      tokens_total: r.tokenUsage?.total || null,
      tokens_prompt: r.tokenUsage?.prompt || null,
      tokens_completion: r.tokenUsage?.completion || null,
      overall_pass: r.gradingResult?.pass ?? false,
      overall_score: r.gradingResult?.score ?? 0,
      factual_accuracy: metrics.factual_accuracy ?? null,
      hallucination_guard: metrics.hallucination_guard ?? null,
      topic_relevance: metrics.topic_relevance ?? null,
      data_citation: metrics.data_citation ?? null,
      format_compliance: metrics.format_compliance ?? null,
      conciseness: metrics.conciseness ?? null,
      no_preamble: metrics.no_preamble ?? null,
      created_at: timestamp,
    };
  });

  // Insert in batches of 50
  const batchSize = 50;
  let inserted = 0;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const { error } = await supabase.from("model_evals").insert(batch);
    if (error) {
      console.error(`Batch ${i / batchSize + 1} failed:`, error.message);
    } else {
      inserted += batch.length;
    }
  }

  // Insert run summary
  const models = [...new Set(rows.map((r) => r.model))];
  for (const model of models) {
    const modelRows = rows.filter((r) => r.model === model);
    const avgScore = modelRows.reduce((s, r) => s + r.overall_score, 0) / modelRows.length;
    const passRate = modelRows.filter((r) => r.overall_pass).length / modelRows.length;
    const avgLatency = modelRows.reduce((s, r) => s + r.latency_ms, 0) / modelRows.length;

    const { error } = await supabase.from("eval_runs").insert({
      run_id: runId,
      model,
      model_label: modelRows[0].model_label,
      total_questions: modelRows.length,
      pass_count: modelRows.filter((r) => r.overall_pass).length,
      fail_count: modelRows.filter((r) => !r.overall_pass).length,
      avg_score: Math.round(avgScore * 1000) / 1000,
      pass_rate: Math.round(passRate * 1000) / 1000,
      avg_latency_ms: Math.round(avgLatency),
      avg_factual_accuracy: avg(modelRows, "factual_accuracy"),
      avg_hallucination_guard: avg(modelRows, "hallucination_guard"),
      avg_topic_relevance: avg(modelRows, "topic_relevance"),
      avg_data_citation: avg(modelRows, "data_citation"),
      avg_format_compliance: avg(modelRows, "format_compliance"),
      avg_conciseness: avg(modelRows, "conciseness"),
      created_at: timestamp,
    });

    if (error) {
      console.error(`Run summary for ${model} failed:`, error.message);
    } else {
      console.log(`${model}: score=${avgScore.toFixed(3)}, pass=${(passRate * 100).toFixed(1)}%, latency=${avgLatency.toFixed(0)}ms`);
    }
  }

  console.log(`\nDone! Inserted ${inserted} results, run_id: ${runId}`);
}

function avg(rows: any[], field: string): number {
  const vals = rows.map((r) => r[field]).filter((v) => v !== null);
  if (vals.length === 0) return 0;
  return Math.round((vals.reduce((s: number, v: number) => s + v, 0) / vals.length) * 1000) / 1000;
}

main().catch(console.error);
