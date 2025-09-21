# MongoDB Setup Guide

This guide will help you set up MongoDB for the PDF Keyword Analyzer to store user documents and data.

## Prerequisites

1. A MongoDB Atlas account (free tier available)
2. Node.js and npm installed
3. The project dependencies installed (`npm install`)

## Step 1: MongoDB Atlas Setup

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free account or sign in
3. Create a new cluster:
   - Choose the free tier (M0)
   - Select a region close to you
   - Give your cluster a name (e.g., "pdf-analyzer")
4. Create a database user:
   - Go to "Database Access" in the left sidebar
   - Click "Add New Database User"
   - Choose "Password" authentication
   - Create a username and password (save these!)
   - Set privileges to "Read and write to any database"

## Step 2: Get Connection String

1. Go to "Clusters" in the left sidebar
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Select "Node.js" as the driver
5. Copy the connection string (it will look like):
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

## Step 3: Update Environment Variables

1. Open your `.env.local` file
2. Replace the MongoDB URI with your actual connection string:
   ```env
   MONGODB_URI=mongodb+srv://your-username:your-password@cluster0.xxxxx.mongodb.net/pdf-analyzer?retryWrites=true&w=majority
   ```
   **Important:** Replace `<username>`, `<password>`, and the cluster URL with your actual values.

## Step 4: Configure Network Access

1. Go to "Network Access" in the left sidebar
2. Click "Add IP Address"
3. For development, you can add "0.0.0.0/0" (allow access from anywhere)
   - **Note:** For production, you should restrict this to your server's IP
4. Click "Confirm"

## Step 5: Test the Connection

1. Restart your development server:
   ```bash
   npm run dev
   ```
2. Go to `http://localhost:3000`
3. Sign in with your account
4. Upload a PDF and click "Save Document"
5. Check the "History" tab to see if the document was saved

## Database Structure

The application will automatically create the following collections:

### Users Collection
```javascript
{
  _id: ObjectId,
  email: string,
  name: string,
  image: string,
  createdAt: Date,
  updatedAt: Date
}
```

### Documents Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  fileName: string,
  originalName: string,
  fileSize: number,
  fileType: string,
  extractedText: string,
  keywords: Array<{
    word: string,
    definition: string,
    context: string
  }>,
  summary: {
    mainTopic: string,
    keyFindings: string[],
    methodology: string,
    importantConcepts: string[],
    targetAudience: string,
    practicalApplications: string[],
    documentType: string,
    summary: string,
    readingTime: string,
    complexity: string
  },
  uploadDate: Date,
  lastAccessed: Date,
  isPublic: boolean,
  tags: string[]
}
```

### Projects Collection (for future collaboration features)
```javascript
{
  _id: ObjectId,
  name: string,
  description: string,
  ownerId: ObjectId,
  members: Array<{
    userId: ObjectId,
    role: 'owner' | 'admin' | 'member',
    joinedAt: Date
  }>,
  documents: ObjectId[],
  createdAt: Date,
  updatedAt: Date,
  isPublic: boolean,
  tags: string[]
}
```

## Features Available

With MongoDB set up, you can now:

1. **Save Documents**: Upload PDFs and save them to your account
2. **View History**: See all your previously uploaded documents
3. **Search & Filter**: Find documents by name, topic, or tags
4. **Document Management**: Delete documents you no longer need
5. **User Profiles**: Each user has their own document collection

## Troubleshooting

### Common Issues

1. **Connection Error**: 
   - Check your connection string format
   - Ensure your IP is whitelisted in Network Access
   - Verify your database user credentials

2. **Authentication Failed**:
   - Double-check username and password
   - Make sure the user has read/write permissions

3. **Documents Not Saving**:
   - Check browser console for errors
   - Verify MongoDB URI in `.env.local`
   - Ensure you're signed in

### Development Tips

- Use MongoDB Compass to view your data visually
- Check the browser's Network tab to see API calls
- Look at the server console for any error messages

## Security Notes

- Never commit your `.env.local` file to version control
- Use environment-specific connection strings for production
- Regularly rotate your database passwords
- Consider using MongoDB's built-in security features for production

## Next Steps

With MongoDB set up, you can now:
1. Test document saving and retrieval
2. Implement collaboration features
3. Add document sharing capabilities
4. Build team management features
