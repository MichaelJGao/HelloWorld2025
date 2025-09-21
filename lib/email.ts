import nodemailer from 'nodemailer'
import crypto from 'crypto'

// Create a transporter for sending emails
const createTransporter = () => {
  // Use Gmail SMTP with your credentials
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: 'adarshsiva297@gmail.com',
      pass: ''
    },
    tls: {
      rejectUnauthorized: false
    }
  })
}

export interface EmailInviteData {
  inviterName: string
  inviterEmail: string
  documentName: string
  inviteeEmail: string
  message?: string
  inviteUrl: string
}

export const sendDocumentInvite = async (data: EmailInviteData): Promise<boolean> => {
  try {
    const transporter = createTransporter()
    
    const mailOptions = {
      from: `"PDF Analyzer" <adarshsiva297@gmail.com>`,
      to: data.inviteeEmail,
      subject: `📄 Document Invitation: ${data.documentName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Document Invitation</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
            <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
              Hello!
            </p>
            
            <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
              <strong>${data.inviterName}</strong> (${data.inviterEmail}) has invited you to view a document:
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin: 20px 0;">
              <h3 style="color: #333; margin: 0 0 10px 0; font-size: 18px;">📄 ${data.documentName}</h3>
              ${data.message ? `<p style="color: #666; font-style: italic; margin: 10px 0 0 0;">"${data.message}"</p>` : ''}
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.inviteUrl}" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; 
                        text-decoration: none; 
                        padding: 15px 30px; 
                        border-radius: 25px; 
                        font-weight: bold; 
                        font-size: 16px;
                        display: inline-block;
                        box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">
                View Document
              </a>
            </div>
            
            <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="color: #1976d2; font-size: 14px; margin: 0; text-align: center;">
                <strong>Note:</strong> This invitation link will expire in 7 days for security reasons.
              </p>
            </div>
            
            <hr style="border: none; border-top: 1px solid #e9ecef; margin: 30px 0;">
            
            <p style="color: #666; font-size: 14px; line-height: 1.5; margin: 0;">
              If you didn't expect this invitation, you can safely ignore this email. 
              The document will not be accessible without this special link.
            </p>
          </div>
        </div>
      `,
      text: `
        Document Invitation
        
        Hello!
        
        ${data.inviterName} (${data.inviterEmail}) has invited you to view a document: ${data.documentName}
        
        ${data.message ? `Message: "${data.message}"` : ''}
        
        Click here to view the document: ${data.inviteUrl}
        
        Note: This invitation link will expire in 7 days for security reasons.
        
        If you didn't expect this invitation, you can safely ignore this email.
      `
    }

    const info = await transporter.sendMail(mailOptions)
    
    // Log the preview URL for testing (Ethereal provides this)
    console.log('Email sent successfully! Preview URL: ' + nodemailer.getTestMessageUrl(info))
    
    return true
  } catch (error) {
    console.error('Error sending email:', error)
    return false
  }
}

export const generateInviteToken = (): string => {
  return crypto.randomBytes(32).toString('hex')
}
