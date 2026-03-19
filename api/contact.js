const Mailgun = require('mailgun.js');
const FormData = require('form-data');

const mailgun = new Mailgun(FormData);
let mg = null;
if (process.env.MAILGUN_API_KEY) {
  mg = mailgun.client({ username: 'api', key: process.env.MAILGUN_API_KEY });
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, phone, email, interest } = req.body;

  if (!name || !phone || !email) {
    return res.status(400).json({ error: 'Please fill in all required fields.' });
  }

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, rgba(60, 77, 95, 1), rgba(93, 110, 129, 1)); padding: 24px; text-align: center;">
        <h1 style="color: #fff; margin: 0; font-size: 22px;">New Consultation Request - Love Is Blinds</h1>
      </div>
      <div style="padding: 24px; background: #f9f9f9;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px; font-weight: bold;">Name:</td><td style="padding: 8px;">${name}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">Email:</td><td style="padding: 8px;"><a href="mailto:${email}">${email}</a></td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">Phone:</td><td style="padding: 8px;"><a href="tel:${phone}">${phone}</a></td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">Interest:</td><td style="padding: 8px;">${interest || 'Not specified'}</td></tr>
        </table>
      </div>
    </div>`;

  const textBody = `New Consultation Request - Love Is Blinds\n\nName: ${name}\nEmail: ${email}\nPhone: ${phone}\nInterest: ${interest || 'Not specified'}\n`;

  try {
    if (!mg) {
      console.log('Mailgun not configured. Data:', { name, phone, email, interest });
      return res.json({ success: true, message: 'Request received!' });
    }

    await mg.messages.create(process.env.MAILGUN_DOMAIN, {
      from: `${process.env.MAILGUN_FROM_NAME} <${process.env.MAILGUN_FROM_EMAIL}>`,
      to: process.env.NOTIFY_EMAIL,
      subject: `New Consultation Request from ${name} - Love Is Blinds`,
      html: htmlBody,
      text: textBody,
      'h:Reply-To': email,
    });

    res.json({ success: true, message: 'Your request has been sent!' });
  } catch (error) {
    console.error('Mailgun error:', error);
    res.status(500).json({ error: 'Failed to send. Please try again or call us directly.' });
  }
};
