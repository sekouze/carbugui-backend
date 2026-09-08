const nodemailer = require('nodemailer');

const createTransporter = () =>
  nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_PORT === '465',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

const emailTemplates = {
  newStationAccount: {
    subject: '🆕 Nouvel accès station sur Carbugui',
    template: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f97316; color: white; padding: 20px; text-align: center;">
          <h1>⛽ Nouvel accès station</h1>
        </div>
        <div style="padding: 20px; background-color: #f9f9f9;">
          <h2>Bonjour Administrateur,</h2>
          <p>Un accès a été créé pour la station <strong>{{stationName}}</strong>.</p>
          <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <p><strong>Code de connexion :</strong> {{loginCode}}</p>
            <p><strong>Créée le :</strong> {{createdAt}}</p>
          </div>
          <p>L'équipe Carbugui</p>
        </div>
      </div>
    `,
  },
  newReport: {
    subject: '🚩 Nouveau signalement station',
    template: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #dc2626; color: white; padding: 20px; text-align: center;">
          <h1>🚩 Nouveau signalement</h1>
        </div>
        <div style="padding: 20px; background-color: #f9f9f9;">
          <h2>Bonjour Administrateur,</h2>
          <p>Un signalement a été déposé pour la station <strong>{{stationName}}</strong>.</p>
          <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <p><strong>Type :</strong> {{kind}}</p>
            <p><strong>Commentaire :</strong> {{comment}}</p>
          </div>
          <p>L'équipe Carbugui</p>
        </div>
      </div>
    `,
  },
};

const sendEmail = async ({ email, subject, template, data = {}, attachments = [] }) => {
  try {
    const transporter = createTransporter();

    const emailTemplate = emailTemplates[template];
    if (!emailTemplate) {
      throw new Error(`Email template '${template}' not found`);
    }

    let htmlContent = emailTemplate.template;
    Object.keys(data).forEach((key) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      htmlContent = htmlContent.replace(regex, data[key]);
    });

    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: subject || emailTemplate.subject,
      html: htmlContent,
      attachments,
    });

    console.log('Email sent successfully:', { messageId: info.messageId, to: email });

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email sending failed:', error);
    throw new Error('Failed to send email');
  }
};

module.exports = { sendEmail, emailTemplates };
