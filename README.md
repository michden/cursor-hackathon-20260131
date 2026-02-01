# VisionCheck AI - Mobile Eye Health Pre-Screening

An accessible, AI-powered application that performs preliminary vision and eye health assessments using your device camera and OpenAI's GPT-5 Vision API.

## Features

### Vision Tests

- **Visual Acuity Test** - Tumbling E test to assess visual clarity (Snellen equivalent)
- **Color Vision Test** - Ishihara-style plates to screen for color vision deficiencies
- **Contrast Sensitivity Test** - Measures ability to distinguish subtle differences in shading
- **Astigmatism Test** - Detects irregular cornea curvature using line patterns
- **Amsler Grid Test** - Screens for macular degeneration and central vision issues
- **Peripheral Vision Test** - Assesses side vision and visual field

### AI-Powered Analysis

- **Eye Photo Analysis** - GPT-5 Vision API analyzes eye photos for visible health indicators
- **AI Chat Assistant** - Get answers to eye health questions with context-aware responses
- **Health Snapshot** - Aggregated results with PDF export and shareable summary

### Accessibility & UX

- **Voice Commands** - Control the app hands-free with speech recognition
- **Audio Instructions** - Text-to-speech guidance for all tests
- **Dark/Light Mode** - Comfortable viewing in any lighting condition
- **Multi-language Support** - English and German with i18next
- **Find a Doctor** - Quick access to locate eye care professionals

### Privacy & Compliance

- **GDPR Compliant** - Consent management and data control
- **Data Settings** - View, export, or delete your data
- **Privacy Policy & Terms** - Transparent legal documentation

## Tech Stack

- **React 19** + **Vite 7** - Fast development and optimized builds
- **Tailwind CSS 4** - Modern utility-first styling
- **OpenAI GPT-5 Vision API** - AI-powered eye photo analysis and chat
- **i18next** - Internationalization framework
- **html2pdf.js** - PDF report generation
- **Playwright** - End-to-end testing
- **Vitest** - Unit testing with React Testing Library

## Getting Started

### Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### With API Features (Eye Photo Analysis & Chat)

For AI features, you need an OpenAI API key:

```bash
# Terminal 1: Start the local API server
cd server
npm install
cp .env.example .env  # Add your OPENAI_API_KEY
npm run dev

# Terminal 2: Start the frontend
npm run dev
```

Or use Vercel CLI:

```bash
vercel dev
```

## Deployment

VisionCheck AI is designed for easy deployment on Vercel:

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set your OpenAI API key
vercel env add OPENAI_API_KEY
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment options including Netlify, Docker, and custom server configurations.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run test` | Run unit tests in watch mode |
| `npm run test:run` | Run unit tests once |
| `npm run test:e2e` | Run Playwright E2E tests |
| `npm run test:e2e:ui` | Run Playwright with UI |

## Project Structure

```
├── api/                    # Vercel serverless functions
│   ├── analyze.js          # Eye photo analysis endpoint
│   ├── chat.js             # AI chat endpoint
│   └── health.js           # Health check endpoint
├── e2e/                    # Playwright E2E tests
├── server/                 # Express API server (for non-Vercel deployments)
├── src/
│   ├── components/         # Reusable UI components
│   ├── context/            # React context providers
│   ├── hooks/              # Custom React hooks
│   ├── i18n/               # Internationalization config and locales
│   └── pages/              # Page components (tests, settings, legal)
└── public/                 # Static assets and audio files
```

## Medical Disclaimer

**IMPORTANT:** This application is for **educational screening purposes only** and is **NOT a medical diagnosis tool**.

- Results are approximate and should not replace professional eye care
- Always consult a qualified eye care professional for accurate assessment
- Do not make medical decisions based on this app's results

## License

MIT
