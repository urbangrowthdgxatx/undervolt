import { NextResponse } from 'next/server';

// Your notification settings
const NOTIFY_EMAIL = process.env.NOTIFY_EMAIL || 'signup-undervolt@aisoft.us';
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

async function sendTelegramNotification(message: string) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.log('Telegram not configured, skipping notification');
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

async function sendEmailNotification(email: string, userId: string) {
  // Using Supabase's built-in email or you can integrate Resend/SendGrid
  // For now, we'll log and rely on Telegram
  console.log(`New signup: ${email} (${userId})`);

  // If you have Resend API key:
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (RESEND_API_KEY) {
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || 'Undervolt <noreply@aisoft.us>',
          to: NOTIFY_EMAIL,
          subject: `New Undervolt Signup: ${email}`,
          html: `
            <h2>New User Signup</h2>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>User ID:</strong> ${userId}</p>
            <p><strong>Time:</strong> ${new Date().toISOString()}</p>
          `,
        }),
      });
    } catch (error) {
      console.error('Email notification failed:', error);
    }
  }
}

export async function POST(req: Request) {
  try {
    const { email, userId, reason } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    const isWaitlist = userId === 'waitlist';

    // Send Telegram notification
    const telegramMessage = isWaitlist
      ? `
🔔 <b>New Waitlist Signup!</b>

📧 Email: ${email}
💭 Reason: ${reason || 'Not provided'}
⏰ Time: ${new Date().toLocaleString()}
      `.trim()
      : `
🎉 <b>New Undervolt Signup!</b>

📧 Email: ${email}
🆔 User ID: ${userId}
⏰ Time: ${new Date().toLocaleString()}

<a href="https://supabase.com/dashboard">View in Supabase</a>
      `.trim();

    await Promise.all([
      sendTelegramNotification(telegramMessage),
      sendEmailNotification(email, userId),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Notification error:', error);
    return NextResponse.json({ error: 'Notification failed' }, { status: 500 });
  }
}
