import { CATEGORY_QUESTIONS, getAllQuestions, type Category } from '@/lib/modes';
import { supabase } from '@/lib/supabase';
import crypto from 'crypto';

export const maxDuration = 30;

function hashQuestion(q: string): string {
  return crypto.createHash('md5').update(q.toLowerCase().trim()).digest('hex');
}

export async function POST(req: Request) {
  try {
    const { category } = await req.json().catch(() => ({}));

    // If a specific category is requested, return those 6 questions
    if (category && CATEGORY_QUESTIONS[category as Category]) {
      return Response.json({ questions: CATEGORY_QUESTIONS[category as Category] });
    }

    // Otherwise return a mix from all categories
    const allQuestions = getAllQuestions();

    // Check which questions have cached answers in the DB
    const hashes = allQuestions.map(q => hashQuestion(q));

    const { data: cached } = await supabase
      .from('cached_answers')
      .select('question_hash')
      .in('question_hash', hashes);

    const cachedHashes = new Set((cached || []).map(r => r.question_hash));

    // Prioritize questions that have cached answers
    const cachedQuestions = allQuestions.filter(q => cachedHashes.has(hashQuestion(q)));

    if (cachedQuestions.length >= 6) {
      // Shuffle and return cached questions
      const shuffled = cachedQuestions.sort(() => Math.random() - 0.5);
      return Response.json({ questions: shuffled.slice(0, 12) });
    }

    // Return all questions if not enough are cached yet
    const shuffled = allQuestions.sort(() => Math.random() - 0.5);
    return Response.json({ questions: shuffled.slice(0, 12) });

  } catch (error) {
    console.error('Suggestion error:', error);
    return Response.json({
      questions: getAllQuestions().slice(0, 12)
    });
  }
}
