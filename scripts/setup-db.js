const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

console.log('🚀 Setting up PDF Analyzer database...')

// Check if .env.local exists
const envPath = path.join(process.cwd(), '.env.local')
if (!fs.existsSync(envPath)) {
  console.log('📝 Creating .env.local file...')
  const envContent = `# OpenAI API Key
OPENAI_API_KEY=your_openai_api_key_here

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_here

# Google OAuth Credentials
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# Database
DATABASE_URL="file:./dev.db"
`
  fs.writeFileSync(envPath, envContent)
  console.log('✅ .env.local created! Please update it with your actual credentials.')
} else {
  console.log('✅ .env.local already exists!')
}

// Initialize Prisma
console.log('🗄️  Initializing Prisma...')
try {
  execSync('npx prisma generate', { stdio: 'inherit' })
  console.log('✅ Prisma client generated!')
  
  execSync('npx prisma db push', { stdio: 'inherit' })
  console.log('✅ Database schema pushed!')
} catch (error) {
  console.error('❌ Error setting up database:', error.message)
  process.exit(1)
}

console.log('🎉 Database setup complete!')
console.log('📋 Next steps:')
console.log('1. Update .env.local with your Google OAuth credentials')
console.log('2. Get Google OAuth credentials from: https://console.developers.google.com/')
console.log('3. Run: npm run dev')
