import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// All emails from environment variables - no hardcoded values
const NOTIFY_EMAIL = process.env.NOTIFY_EMAIL;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://undervolt-atx.vercel.app';
const HOMENEST_URL = process.env.HOMENEST_URL; // Only set in local dev

async function sendTelegramNotification(message: string) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.log('Telegram not configured');
    return;
  }

  // Try Homenest gateway if configured (local dev only)
  if (HOMENEST_URL) {
    try {
      const res = await fetch(`${HOMENEST_URL}/api/telegram/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: 'undervolt-signup',
          message,
          parse_mode: 'HTML',
        }),
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok) {
        const result = await res.json();
        if (result.sent) return;
        console.log(`Gateway blocked: ${result.reason}`);
        return; // Respect gateway decision
      }
    } catch {
      console.log('Homenest unreachable, falling back to direct Telegram');
    }
  }

  // Direct Telegram API (prod path, or fallback)
  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'HTML',
      }),
    });
  } catch (error) {
    console.error('Telegram notification failed:', error);
  }
}

async function sendUserWelcomeEmail(email: string) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const EMAIL_FROM = process.env.EMAIL_FROM;

  if (!RESEND_API_KEY || !EMAIL_FROM) {
    console.log('Welcome email not configured - missing RESEND_API_KEY or EMAIL_FROM');
    return;
  }

  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: email,
        subject: "You're on the Undervolt waitlist",
        html: `
          <div style="background:#000;padding:40px 20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
            <div style="max-width:480px;margin:0 auto;">
              <div style="text-align:center;margin-bottom:32px;">
                <div style="display:inline-block;background:linear-gradient(135deg,#f59e0b,#d97706);width:48px;height:48px;border-radius:12px;line-height:48px;font-size:24px;">⚡</div>
              </div>
              <h1 style="color:#fff;font-size:24px;font-weight:700;text-align:center;margin:0 0 8px;">You're on the waitlist!</h1>
              <p style="color:#a1a1aa;font-size:14px;text-align:center;margin:0 0 32px;line-height:1.6;">
                Thanks for signing up for Undervolt. We'll review your request and notify you once your access is approved.
              </p>
              <div style="background:#18181b;border:1px solid #27272a;border-radius:12px;padding:24px;margin-bottom:24px;">
                <p style="color:#d4d4d8;font-size:14px;margin:0 0 16px;line-height:1.6;">
                  While you wait, you can explore Austin's energy infrastructure data — maps, reports, and pre-built analyses are available to everyone.
                </p>
                <div style="text-align:center;">
                  <a href="${APP_URL}/explore" style="display:inline-block;background:#f59e0b;color:#000;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px;">
                    Explore Undervolt
                  </a>
                </div>
              </div>
              <p style="color:#52525b;font-size:12px;text-align:center;margin:0;">
                Undervolt — GPU-accelerated urban intelligence
              </p>
            </div>
          </div>
        `,
      }),
    });
  } catch (error) {
    console.error('Welcome email failed:', error);
  }
}

async function sendEmailNotification(email: string, approveToken: string) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const EMAIL_FROM = process.env.EMAIL_FROM;

  if (!RESEND_API_KEY || !EMAIL_FROM || !NOTIFY_EMAIL) {
    console.log('Email not configured - missing RESEND_API_KEY, EMAIL_FROM, or NOTIFY_EMAIL env vars');
    return;
  }

  const approveUrl = `${APP_URL}/api/approve?token=${approveToken}&email=${encodeURIComponent(email)}`;

  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: NOTIFY_EMAIL,
        subject: `[Undervolt] New signup: ${email}`,
        html: `
          <h2>New Waitlist Signup</h2>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Time:</strong> ${new Date().toISOString()}</p>
          <br/>
          <p><a href="${approveUrl}" style="background:#f59e0b;color:black;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Approve User</a></p>
          <br/>
          <p style="color:#666;font-size:12px;">Or copy this link: ${approveUrl}</p>
        `,
      }),
    });
  } catch (error) {
    console.error('Email notification failed:', error);
  }
}

export async function POST(req: Request) {
  try {
    const { email, reason } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SB_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    );

    // Verify email exists in waitlist (client upserts before calling this endpoint).
    // This prevents unauthenticated abuse — you can't trigger emails to arbitrary addresses.
    const { data: waitlistEntry } = await supabase
      .from('waitlist')
      .select('email, created_at')
      .eq('email', email)
      .single();

    if (!waitlistEntry) {
      return NextResponse.json({ error: 'Email not found in waitlist' }, { status: 403 });
    }

    // Generate a simple approval token
    const approveToken = Buffer.from(`${email}:${Date.now()}`).toString('base64');

    await supabase.from('waitlist').update({ approve_token: approveToken }).eq('email', email);

    // Send Telegram notification with approve link
    const approveUrl = `${APP_URL}/api/approve?token=${approveToken}&email=${encodeURIComponent(email)}`;
    const telegramMessage = `
🔔 <b>New Waitlist Signup</b>

📧 ${email}
💭 ${reason || 'Custom queries'}
⏰ ${new Date().toLocaleString()}

<a href="${approveUrl}">Click to Approve</a>
    `.trim();

    // Only send welcome email if the record was created within the last 60s (fresh signup).
    // Repeat submissions for existing users skip the welcome email.
    const isNewSignup = Date.now() - new Date(waitlistEntry.created_at).getTime() < 60000;

    await Promise.all([
      sendTelegramNotification(telegramMessage),
      sendEmailNotification(email, approveToken),
      ...(isNewSignup ? [sendUserWelcomeEmail(email)] : []),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Notification error:', error);
    return NextResponse.json({ error: 'Notification failed' }, { status: 500 });
  }
}
