const nodemailer = require('nodemailer');
const logger = require('./logger');

/**
 * Email Service using Brevo (formerly Sendinblue) SMTP
 * 
 * Setup Instructions:
 * 1. Create a Brevo account at https://www.brevo.com
 * 2. Go to SMTP & API settings
 * 3. Create SMTP credentials (username and password)
 * 4. Add credentials to .env file
 */

// Create transporter with Brevo SMTP
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.BREVO_SMTP_HOST || 'smtp-relay.brevo.com',
    port: process.env.BREVO_SMTP_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.BREVO_SMTP_USER, // Your Brevo SMTP username
      pass: process.env.BREVO_SMTP_PASSWORD // Your Brevo SMTP password
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

/**
 * Send email using Brevo SMTP
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML content
 * @param {string} options.text - Plain text content
 */
const sendEmail = async (options) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'MeritAI'}" <${process.env.EMAIL_FROM || 'noreply@meritai.com'}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html
    };

    const info = await transporter.sendMail(mailOptions);
    
    logger.info(`Email sent successfully to ${options.to}`, {
      messageId: info.messageId,
      response: info.response
    });

    return {
      success: true,
      messageId: info.messageId
    };
  } catch (error) {
    logger.error('Error sending email:', {
      error: error.message,
      to: options.to,
      subject: options.subject
    });
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

/**
 * Send password reset email
 * @param {string} email - User email
 * @param {string} resetToken - Reset token
 * @param {string} userName - User name
 */
const sendPasswordResetEmail = async (email, resetToken, userName) => {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/reset-password/${resetToken}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          background-color: #f4f4f4;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 20px auto;
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
          background: linear-gradient(135deg, #059669 0%, #14b8a6 100%);
          color: white;
          padding: 30px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
        }
        .content {
          padding: 30px;
        }
        .button {
          display: inline-block;
          padding: 14px 28px;
          background: linear-gradient(135deg, #059669 0%, #14b8a6 100%);
          color: white;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 600;
          margin: 20px 0;
          text-align: center;
        }
        .button:hover {
          background: linear-gradient(135deg, #047857 0%, #0d9488 100%);
        }
        .footer {
          background: #f9f9f9;
          padding: 20px;
          text-align: center;
          font-size: 12px;
          color: #666;
          border-top: 1px solid #eee;
        }
        .warning {
          background: #fef3c7;
          border-left: 4px solid #f59e0b;
          padding: 15px;
          margin: 20px 0;
          border-radius: 4px;
        }
        .info-box {
          background: #f0f9ff;
          border-left: 4px solid #3b82f6;
          padding: 15px;
          margin: 20px 0;
          border-radius: 4px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔐 Password Reset Request</h1>
        </div>
        <div class="content">
          <p>Hello <strong>${userName}</strong>,</p>
          
          <p>We received a request to reset your password for your MeritAI account. Don't worry, we're here to help! 🚀</p>
          
          <p>Click the button below to create a new password:</p>
          
          <div style="text-align: center;">
            <a href="${resetUrl}" class="button">Reset My Password</a>
          </div>
          
          <div class="warning">
            <strong>⚠️ Important:</strong> This link will expire in <strong>30 minutes</strong> for security reasons.
          </div>
          
          <div class="info-box">
            <p style="margin: 0;"><strong>💡 Didn't request this?</strong></p>
            <p style="margin: 5px 0 0 0;">If you didn't request a password reset, please ignore this email or contact our support team if you have concerns. Your account is still secure.</p>
          </div>
          
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #059669; font-size: 14px;">
            ${resetUrl}
          </p>
          
          <p style="margin-top: 30px;">Best regards,<br><strong>The MeritAI Team</strong> 💪</p>
        </div>
        <div class="footer">
          <p>This is an automated email. Please do not reply to this message.</p>
          <p>&copy; ${new Date().getFullYear()} MeritAI. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Hello ${userName},

We received a request to reset your password for your MeritAI account.

Click the link below to reset your password:
${resetUrl}

This link will expire in 30 minutes for security reasons.

If you didn't request a password reset, please ignore this email.

Best regards,
The MeritAI Team
  `;

  return await sendEmail({
    to: email,
    subject: '🔐 Reset Your Password - MeritAI',
    html,
    text
  });
};

/**
 * Send password reset confirmation email
 * @param {string} email - User email
 * @param {string} userName - User name
 */
const sendPasswordResetConfirmation = async (email, userName) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Reset Successful</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          background-color: #f4f4f4;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 20px auto;
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
          background: linear-gradient(135deg, #059669 0%, #14b8a6 100%);
          color: white;
          padding: 30px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
        }
        .content {
          padding: 30px;
        }
        .success-icon {
          text-align: center;
          font-size: 64px;
          margin: 20px 0;
        }
        .button {
          display: inline-block;
          padding: 14px 28px;
          background: linear-gradient(135deg, #059669 0%, #14b8a6 100%);
          color: white;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 600;
          margin: 20px 0;
        }
        .footer {
          background: #f9f9f9;
          padding: 20px;
          text-align: center;
          font-size: 12px;
          color: #666;
          border-top: 1px solid #eee;
        }
        .warning {
          background: #fef3c7;
          border-left: 4px solid #f59e0b;
          padding: 15px;
          margin: 20px 0;
          border-radius: 4px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Password Reset Successful</h1>
        </div>
        <div class="content">
          <div class="success-icon">🎉</div>
          
          <p>Hello <strong>${userName}</strong>,</p>
          
          <p>Great news! Your password has been successfully reset. You can now log in to your MeritAI account with your new password.</p>
          
          <div style="text-align: center;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3001'}/login" class="button">Go to Login</a>
          </div>
          
          <div class="warning">
            <strong>⚠️ Security Alert:</strong> If you didn't make this change, please contact our support team immediately at <a href="mailto:support@meritai.com">support@meritai.com</a>
          </div>
          
          <p style="margin-top: 30px;">Best regards,<br><strong>The MeritAI Team</strong> 💪</p>
        </div>
        <div class="footer">
          <p>This is an automated email. Please do not reply to this message.</p>
          <p>&copy; ${new Date().getFullYear()} MeritAI. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Hello ${userName},

Your password has been successfully reset!

You can now log in to your MeritAI account with your new password.

If you didn't make this change, please contact our support team immediately.

Best regards,
The MeritAI Team
  `;

  return await sendEmail({
    to: email,
    subject: '✅ Password Reset Successful - MeritAI',
    html,
    text
  });
};

module.exports = {
  sendEmail,
  sendPasswordResetEmail,
  sendPasswordResetConfirmation
};
