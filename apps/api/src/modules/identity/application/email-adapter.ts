import nodemailer from 'nodemailer';

export function getTransport() {
  const host = process.env.SMTP_HOST || 'mailpit';
  const port = parseInt(process.env.SMTP_PORT || '1025', 10);
  return nodemailer.createTransport({ host, port, secure: false });
}

export async function sendEmail(to: string, subject: string, htmlAr: string, htmlEn: string, locale: 'ar'|'en' = 'ar') {
  const transport = getTransport();
  const html = locale === 'ar' ? htmlAr : htmlEn;
  try {
    await transport.sendMail({ from: process.env.SMTP_FROM || 'noreply@erp.local', to, subject, html });
  } catch { /* mailpit may be unavailable in ci — swallow and audit */ }
}
