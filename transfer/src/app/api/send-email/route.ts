import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  const body = await req.json();

  try {
    const data = await resend.emails.send({
      from: 'no-reply@ticketease.be',
      to: body.to,
      subject: body.subject,
      html: body.html,
    });

    return Response.json({ success: true, data });
  } catch (error) {
    return Response.json({ success: false, error }, { status: 500 });
  }
}