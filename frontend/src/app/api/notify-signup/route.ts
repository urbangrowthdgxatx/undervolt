import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// All emails from environment variables - no hardcoded values
const NOTIFY_EMAIL = process.env.NOTIFY_EMAIL;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://undervolt-atx.vercel.app';

async function sendTelegramNotification(message: string) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.log('Telegram not configured');
    return;
  }

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

    // Generate a simple approval token
    const approveToken = Buffer.from(`${email}:${Date.now()}`).toString('base64');

    // Store token in database for verification
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    );

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

    await Promise.all([
      sendTelegramNotification(telegramMessage),
      sendEmailNotification(email, approveToken),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Notification error:', error);
    return NextResponse.json({ error: 'Notification failed' }, { status: 500 });
  }
}
