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
    <div style="font-family: Arial, sans-serif; font-size: 15px; color: #333;">
      <p>Bonjour ${firstName} ${lastName},</p>

      <p>Bienvenue sur <strong>TicketEase</strong> ! Votre compte a bien été créé.</p>

      <p>Vous pouvez vous connecter avec :</p>
      <ul>
        <li><strong>Email professionnel :</strong> ${emailProfessional}</li>
        ${
          tempPassword
            ? `<li><strong>Mot de passe temporaire :</strong> ${tempPassword}</li>`
            : ""
        }
      </ul>

      <p>
        Pour des raisons de sécurité, vous devrez changer ce mot de passe lors de votre première connexion.
      </p>

      <br />
      <p>
        À bientôt,<br />
        <em>L'équipe TicketEase</em>
      </p>
    </div>
  `;
}
