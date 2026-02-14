import { getAllQuestions } from '@/lib/modes';

export async function POST() {
  const allQuestions = getAllQuestions();
  const shuffled = allQuestions.sort(() => Math.random() - 0.5);
  return Response.json({ questions: shuffled.slice(0, 6) });
}
