# Email Setup for Document Invitations

This application includes a document invitation feature that allows users to share documents with others via email. Here's how to set it up:

## Development Setup (Ethereal Email)

For development, the app uses Ethereal Email, which creates fake email accounts for testing:

1. **No additional setup required** - Ethereal Email works out of the box
2. **View sent emails**: Check the console logs for preview URLs when emails are sent
3. **Test emails**: All emails will be captured by Ethereal and can be viewed in the browser

## Production Setup

For production, you'll need to configure a real email service. Here are the environment variables you need to set:

### Gmail Setup (Recommended)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate an App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a password for "Mail"
3. **Set environment variables**:
   ```bash
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-16-character-app-password
   ```

### Other Email Services

#### SendGrid
```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

#### AWS SES
```bash
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-ses-smtp-username
SMTP_PASS=your-ses-smtp-password
```

## Environment Variables

Add these to your `.env.local` file:

```bash
# Email Configuration (Development - Ethereal Email)
ETHEREAL_USER=ethereal.user@ethereal.email
ETHEREAL_PASS=ethereal.pass

# Email Configuration (Production)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Base URL for invitation links
NEXTAUTH_URL=http://localhost:3000  # or your production URL
```

## Features

- **Secure Invitations**: Each invitation has a unique token that expires in 7 days
- **One-time Use**: Invitation links can only be used once
- **Beautiful Email Templates**: Professional HTML email templates with responsive design
- **Personal Messages**: Users can add personal messages to invitations
- **Public Document Viewing**: Invited users can view documents without creating an account

## Testing

1. **Start the development server**: `npm run dev`
2. **Upload a document** and save it
3. **Click the Share button** (Share2 icon) in the document history or viewer
4. **Enter an email address** and send the invitation
5. **Check the console** for the Ethereal email preview URL
6. **Click the preview URL** to see the sent email
7. **Click the invitation link** in the email to test the public document viewer

## Security Notes

- Invitation tokens are cryptographically secure (32 random bytes)
- Tokens expire after 7 days
- Each token can only be used once
- Documents are only accessible via valid invitation tokens
- No authentication required for invited users (read-only access)
