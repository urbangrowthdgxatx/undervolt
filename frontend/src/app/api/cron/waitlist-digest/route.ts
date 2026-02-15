import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function sendTelegram(message: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'HTML' }),
  });
}

export async function GET(req: Request) {
  // Verify cron secret to prevent unauthorized calls
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SB_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  );

  // Get signups from the last 3 hours
  const since = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();

  const { data: recent, error } = await supabase
    .from('waitlist')
    .select('email, reason, approved, created_at')
    .gte('created_at', since)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Cron waitlist query failed:', error);
    return NextResponse.json({ error: 'Query failed' }, { status: 500 });
  }

  // Get total counts for context
  const { count: totalCount } = await supabase
    .from('waitlist')
    .select('*', { count: 'exact', head: true });

  const { count: approvedCount } = await supabase
    .from('waitlist')
    .select('*', { count: 'exact', head: true })
    .eq('approved', true);

  const newSignups = recent || [];
  const pending = (totalCount || 0) - (approvedCount || 0);

  // Always send a digest — even if no new signups
  let message: string;

  if (newSignups.length === 0) {
    message = `📊 <b>Undervolt 3h Digest</b>\n\nNo new signups in the last 3 hours.\n\n👥 Total: ${totalCount} | ✅ Approved: ${approvedCount} | ⏳ Pending: ${pending}`;
  } else {
    const signupLines = newSignups
      .map((s) => `  • ${s.email}${s.reason ? ` — ${s.reason}` : ''}`)
      .join('\n');

    message = `📊 <b>Undervolt 3h Digest</b>\n\n🆕 <b>${newSignups.length} new signup${newSignups.length > 1 ? 's' : ''}</b>:\n${signupLines}\n\n👥 Total: ${totalCount} | ✅ Approved: ${approvedCount} | ⏳ Pending: ${pending}`;
  }

  await sendTelegram(message);

  return NextResponse.json({ sent: true, newSignups: newSignups.length, total: totalCount });
}
