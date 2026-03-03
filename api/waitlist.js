import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Weryfikacja środowiska bazy danych Supabase
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    console.error('BŁĄD: Brak zmiennych konfiguracyjnych SUPABASE_URL lub SUPABASE_ANON_KEY.');
    return res.status(500).json({ error: 'Brak aktywnego połączenia z serwerami bazy danych formularza.' });
  }

  // Weryfikacja haseł aplikacji Gmail
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.error('BŁĄD: Brak zmiennych GMAIL_USER lub GMAIL_APP_PASSWORD z App Passwords.');
    return res.status(500).json({ error: 'Brak konfiguracji skrzynek wysyłkowych SMTP po stronie serwera.' });
  }

  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Adres email jest wymagany.' });
    }

    // --- ZAPIS DO BAZY SUPABASE ---
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
    
    const { error: dbError } = await supabase
      .from('waitlist')
      .insert([{ email }]);

    if (dbError) {
      // 23505 oznacza "unique violation" (zduplikowany wpis) w bazach typu PostgreSQL
      if (dbError.code === '23505') {
         return res.status(400).json({ error: 'Ten adres e-mail zapisał się już na premierę POCKET!' });
      }
      console.error('Błąd Supabase:', dbError);
      return res.status(500).json({ error: 'Odrzut Supabase: ' + (dbError.message || dbError.details || JSON.stringify(dbError)) });
    }

    // --- PROCEDURA WYSYŁKI E-MAIL ---
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    const mailOptions = {
      from: `"POCKET Team" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: 'Dołączyłeś do POCKET. Teraz paragon rządzi budżetem 🔍',
      html: `
         <div style="background:#020617; padding:32px 24px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; color:#e5e7eb;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;margin:0 auto;">
      <tr>
        <td style="text-align:left; padding-bottom:24px;">
          <span style="display:inline-block; padding:6px 10px; border-radius:999px; background:#022c22; color:#6ee7b7; font-size:11px; letter-spacing:0.08em; text-transform:uppercase;">
            Wczesny dostęp • POCKET
          </span>
        </td>
      </tr>

      <tr>
        <td style="padding-bottom:16px;">
          <h1 style="margin:0 0 8px; font-size:26px; line-height:1.2; color:#f9fafb;">
            Twoje paragony. Twoje oszczędności. Twoja kolej.
          </h1>
          <p style="margin:0; font-size:14px; color:#9ca3af;">
            Dołączyłeś do listy oczekujących POCKET – aplikacji, która z paragonów robi mapę Twojego budżetu.
          </p>
        </td>
      </tr>

      <tr>
        <td style="padding:20px 16px; border-radius:16px; background:radial-gradient(circle at top,#0f172a,#020617); border:1px solid #1e293b;">
          <p style="margin:0 0 8px; font-size:13px; color:#9ca3af;">W skrócie:</p>
          <ul style="margin:0; padding-left:18px; font-size:13px; color:#e5e7eb;">
            <li>skanujesz paragony, a Asystent AI sam kategoryzuje wydatki,</li>
            <li>Planer Zakupów podpowiada, kiedy i gdzie kupić taniej to, co i tak kupujesz,</li>
            <li>dostajesz jasne alerty, zanim budżet wymknie się spod kontroli.</li>
          </ul>
        </td>
      </tr>

      <tr>
        <td style="padding:24px 0 8px;">
          <h2 style="margin:0 0 8px; font-size:16px; color:#f9fafb;">Co możesz zrobić już teraz?</h2>
          <ol style="margin:0; padding-left:18px; font-size:13px; color:#d1d5db;">
            <li style="margin-bottom:6px;">Odpowiedz jednym zdaniem na tego maila: <strong>jak dziś ogarniasz swoje wydatki?</strong></li>
            <li style="margin-bottom:6px;">Zapisz ten adres w kontaktach, żeby nie gubić kolejnych maili z dostępem.</li>
            <li>Wyślij link do POCKET jednej osobie, która zawsze mówi: „Nie wiem, gdzie mi ta kasa znika”.</li>
          </ol>
        </td>
      </tr>

      <tr>
        <td style="padding:20px 0;">
          <a href="https://try-pocket.vercel.app" 
             style="display:inline-block; padding:10px 18px; border-radius:999px; background:#22c55e; color:#022c22; font-size:13px; font-weight:600; text-decoration:none;">
            Zobacz, jak POCKET wygląda na żywo →
          </a>
        </td>
      </tr>

      <tr>
        <td style="padding-top:12px; border-top:1px solid #1f2937;">
          <p style="margin:8px 0 0; font-size:11px; color:#6b7280;">
            Ten mail został wysłany, ponieważ zapisałeś się na wczesny dostęp do POCKET.
            Jeśli to pomyłka, po prostu go zignoruj.
          </p>
        </td>
      </tr>
    </table>
  </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    return res.status(200).json({ success: true, message: 'Mail powitalny został wysłany!' });
  } catch (error) {
    console.error('Błąd serwera (Nodemailer):', error);
    return res.status(500).json({ error: 'Wystąpił nieoczekiwany błąd przy połączeniu SMTP Google.' });
  }
}
