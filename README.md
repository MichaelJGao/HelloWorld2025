# PDF Keyword Analyzer

A modern web application that analyzes PDF documents to extract and explain keywords with intelligent hover tooltips. Perfect for research papers, textbooks, and technical documents.

## Features

- **PDF Upload**: Drag and drop PDF files for analysis
- **Text Extraction**: Automatic text extraction from PDF documents
- **Keyword Detection**: Intelligent detection of technical terms, acronyms, and jargon
- **Hover Tooltips**: Wikipedia-style summaries with hover interactions
- **Manual Highlighting**: Select any text to get instant definitions
- **Context-Aware**: Summaries consider document context before searching online
- **Modern UI**: Beautiful, responsive design with smooth animations

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS
- **PDF Processing**: PDF.js
- **AI Integration**: OpenAI GPT-3.5-turbo
- **UI Components**: Lucide React icons, Framer Motion

## Setup Instructions

1. **Clone and Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Variables**
   Create a `.env.local` file in the root directory:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   ```

3. **Get OpenAI API Key**
   - Visit [OpenAI Platform](https://platform.openai.com/)
   - Create an account and generate an API key
   - Add the key to your `.env.local` file

4. **Run the Development Server**
   ```bash
   npm run dev
   ```

5. **Open in Browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

1. **Upload a PDF**: Drag and drop or click to select a PDF file
2. **Wait for Processing**: The app will extract text and detect keywords
3. **Hover for Definitions**: Hover over highlighted keywords for instant summaries
4. **Manual Selection**: Select any text to get definitions for custom terms
5. **Search**: Use the search bar to find specific content in the document

## How It Works

1. **PDF Processing**: Uses PDF.js to extract text content from uploaded PDFs
2. **Keyword Detection**: Analyzes text for technical terms, acronyms, and domain-specific vocabulary
3. **Context Analysis**: Considers document context when generating summaries
4. **AI Summaries**: Uses OpenAI GPT-3.5-turbo to generate concise, accurate definitions
5. **Interactive UI**: Provides hover tooltips and manual text selection for enhanced user experience

## API Endpoints

- `POST /api/generate-summary`: Generates keyword summaries using OpenAI

## Project Structure

```
├── app/
│   ├── api/generate-summary/    # API route for summary generation
│   ├── globals.css              # Global styles
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Main page
├── components/
│   ├── PDFViewer.tsx            # PDF display and interaction
│   └── KeywordTooltip.tsx       # Hover tooltip component
├── lib/
│   ├── pdfProcessor.ts          # PDF text extraction
│   └── keywordDetector.ts       # Keyword detection logic
└── README.md
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details
