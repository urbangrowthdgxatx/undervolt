import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  if (!token || !email) {
    return new NextResponse('Missing token or email', { status: 400 });
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SB_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    );

    // Verify token matches
    const { data: user } = await supabase
      .from('waitlist')
      .select('approve_token')
      .eq('email', email)
      .single();

    if (!user || user.approve_token !== token) {
      return new NextResponse(`
        <html>
          <body style="font-family: system-ui; padding: 40px; text-align: center;">
            <h1>Invalid or expired link</h1>
            <p>This approval link is no longer valid.</p>
          </body>
        </html>
      `, { 
        status: 400,
        headers: { 'Content-Type': 'text/html' }
      });
    }

    // Approve the user
    const { error } = await supabase
      .from('waitlist')
      .update({ 
        approved: true, 
        approved_at: new Date().toISOString(),
        approve_token: null // Clear token after use
      })
      .eq('email', email);

    if (error) {
      throw error;
    }

    // Return success page
    return new NextResponse(`
      <html>
        <head>
          <title>User Approved - Undervolt</title>
          <style>
            body { font-family: system-ui; padding: 40px; text-align: center; background: #0a0a0a; color: white; }
            .success { color: #22c55e; font-size: 48px; margin-bottom: 20px; }
            h1 { margin-bottom: 10px; }
            p { color: #888; }
          </style>
        </head>
        <body>
          <div class="success">✓</div>
          <h1>User Approved!</h1>
          <p><strong>${email}</strong> can now ask custom questions.</p>
          <p style="margin-top: 30px;"><a href="/" style="color: #f59e0b;">Back to Undervolt</a></p>
        </body>
      </html>
    `, { 
      headers: { 'Content-Type': 'text/html' }
    });

  } catch (error) {
    console.error('Approval error:', error);
    return new NextResponse('Approval failed', { status: 500 });
  }
}
