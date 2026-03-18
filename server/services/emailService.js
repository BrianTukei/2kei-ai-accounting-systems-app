const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendEmail({ recipients, subject, message }) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: recipients,
    subject,
    text: message,
  };
  try {
    const info = await transporter.sendMail(mailOptions);
    return { success: true, info };
  } catch (error) {
    return { success: false, error };
  }
}

module.exports = { sendEmail };
