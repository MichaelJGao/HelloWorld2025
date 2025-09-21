# Authentication Setup Guide

This guide will help you set up Google OAuth authentication for the PDF Keyword Analyzer.

## Prerequisites

1. A Google Cloud Platform account
2. Node.js and npm installed
3. The project dependencies installed (`npm install`)

## Step 1: Google OAuth Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API" and enable it
4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Choose "Web application"
   - Add authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback/google` (for development)
     - `https://yourdomain.com/api/auth/callback/google` (for production)
5. Copy the Client ID and Client Secret

## Step 2: Environment Variables

1. Create a `.env.local` file in the project root
2. Add the following variables:

```env
# OpenAI API Key
OPENAI_API_KEY=your_openai_api_key_here

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_here

# Google OAuth Credentials
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# Database
DATABASE_URL="file:./dev.db"
```

3. Replace the placeholder values with your actual credentials
4. Generate a random secret for `NEXTAUTH_SECRET` (you can use `openssl rand -base64 32`)

## Step 3: Database Setup

Run the setup script to initialize the database:

```bash
npm run setup
```

This will:
- Create the `.env.local` file if it doesn't exist
- Generate the Prisma client
- Push the database schema

## Step 4: Start the Application

```bash
npm run dev
```

## Features Added

### Authentication Components
- **LoginButton**: Handles sign-in/sign-out with Google
- **UserMenu**: Dropdown menu with user info and options
- **AuthContext**: React context for authentication state

### Database Models
- **User**: User accounts with Google OAuth
- **Project**: Collaboration projects
- **ProjectMember**: Project membership and roles
- **Document**: Shared documents within projects

### Pages
- **Sign In**: Custom sign-in page with Google OAuth
- **Error**: Authentication error handling

### API Routes
- **NextAuth**: Handles all authentication flows
- **Database**: SQLite database with Prisma ORM

## Usage

1. Users can sign in with their Google account
2. Authentication state is managed globally
3. User information is displayed in the navigation
4. Ready for collaboration features implementation

## Next Steps

With authentication in place, you can now:
1. Implement project creation and management
2. Add document sharing and collaboration
3. Create user-specific document storage
4. Add team management features

## Troubleshooting

### Common Issues

1. **"Invalid redirect URI"**: Make sure the redirect URI in Google Console matches exactly
2. **"Client ID not found"**: Verify your Google OAuth credentials
3. **Database errors**: Run `npm run db:push` to update the schema
4. **Session issues**: Check that `NEXTAUTH_SECRET` is set and consistent

### Development Tips

- Use `npm run db:studio` to view the database
- Check browser console for authentication errors
- Verify environment variables are loaded correctly
