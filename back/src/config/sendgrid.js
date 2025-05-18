const sgMail = require("@sendgrid/mail")

// Set SendGrid API key from environment variables
sgMail.setApiKey(process.env.SENDGRID_API_KEY)

// Function to send verification email
const sendVerificationEmail = async (email, token, username) => {
  const verificationUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/verify-email?token=${token}`

  const msg = {
    to: email,
    from: process.env.FROM_EMAIL,
    subject: "FocusFlow - Verify Your Email",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h2 style="color: #830E13; text-align: center;">Welcome to FocusFlow!</h2>
        <p>Hello ${username},</p>
        <p>Thank you for signing up. Please verify your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" style="background: linear-gradient(to right, #830E13, #6B1E07); color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Verify Email</a>
        </div>
        <p>If the button doesn't work, you can also copy and paste the following link into your browser:</p>
        <p style="word-break: break-all; color: #4a4a4a;">${verificationUrl}</p>
        <p>This link will expire in 24 hours.</p>
        <p>If you didn't sign up for FocusFlow, please ignore this email.</p>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; color: #888;">
          <p>© ${new Date().getFullYear()} FocusFlow. All rights reserved.</p>
        </div>
      </div>
    `,
  }

  try {
    console.log("Attempting to send verification email to:", email);
    console.log("Using FROM_EMAIL:", process.env.FROM_EMAIL);

    // Validate email format
    if (!email || !email.includes('@')) {
      console.error("Invalid email format:", email);
      return false;
    }

    // Validate FROM_EMAIL
    if (!process.env.FROM_EMAIL || !process.env.FROM_EMAIL.includes('@')) {
      console.error("Invalid FROM_EMAIL format:", process.env.FROM_EMAIL);
      return false;
    }

    const result = await sgMail.send(msg);
    console.log("SendGrid verification email sent successfully:", result);
    return true;
  } catch (error) {
    console.error("Error sending verification email:", error);

    if (error.response) {
      console.error("SendGrid API error details:", error.response.body);

      // Check for common errors
      if (error.code === 401) {
        console.error("Authentication error: Your API key may be invalid or revoked");
      } else if (error.code === 403) {
        console.error("Authorization error: You may not have permission to send emails");
      }
    }

    return false;
  }
}

// Function to send password reset email
const sendPasswordResetEmail = async (email, token, username) => {
  const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password?token=${token}`

  const msg = {
    to: email,
    from: process.env.FROM_EMAIL,
    subject: "FocusFlow - Reset Your Password",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h2 style="color: #830E13; text-align: center;">Reset Your Password</h2>
        <p>Hello ${username},</p>
        <p>We received a request to reset your password. Click the button below to create a new password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background: linear-gradient(to right, #830E13, #6B1E07); color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
        </div>
        <p>If the button doesn't work, you can also copy and paste the following link into your browser:</p>
        <p style="word-break: break-all; color: #4a4a4a;">${resetUrl}</p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; color: #888;">
          <p>© ${new Date().getFullYear()} FocusFlow. All rights reserved.</p>
        </div>
      </div>
    `,
  }

  try {
    await sgMail.send(msg)
    return true
  } catch (error) {
    console.error("Error sending password reset email:", error)
    if (error.response) {
      console.error("SendGrid API error:", error.response.body)
    }
    return false
  }
}

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
}

