import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * POST /api/send-email
 * Envoie un email via le service Resend.
 */
export async function POST(req: Request) {
  // Lecture et parsing du corps JSON de la requête
  const body = await req.json();

  try {
    // Envoi de l'email via Resend
    const data = await resend.emails.send({
      from: "no-reply@ticketease.be",
      to: body.to,
      subject: body.subject,
      html: body.html,
    });

    return Response.json({ success: true, data });
  } catch (error) {
    return Response.json({ success: false, error }, { status: 500 });
  }
}
