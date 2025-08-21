import "server-only";
import { Resend } from "resend";

/**
 * Mailer singleton pour éviter de recréer le client à chaque appel.
 */
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Envoie un email HTML via Resend.
 */
export async function sendEmailHtml(
  to: string,
  subject: string,
  html: string
): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.error("RESEND_API_KEY manquante");
    return;
  }
  try {
    await resend.emails.send({
      from: "no-reply@ticketease.be",
      to,
      subject,
      html,
    });
  } catch (e) {
    console.error("Erreur Resend:", e);
  }
}

/**
 * Email de bienvenu.
 */
export function resendEmail(
  firstName: string,
  lastName: string,
  emailProfessional: string,
  tempPassword?: string
): string {
  return `
    <p>Bonjour ${firstName} ${lastName},</p>
    <p>Votre compte professionnel a été créé : ${emailProfessional}</p>
    ${tempPassword ? `<p>Mot de passe temporaire : ${tempPassword}</p>` : ""}
    <p>Veuillez le changer lors de votre première connexion.</p>
  `;
}
