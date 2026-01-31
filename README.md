# EyeCheck - Eye Health Assessment PWA

A smartphone-friendly web app that performs preliminary vision and eye health assessments using the phone camera and AI.

## Features

- **Visual Acuity Test** - Tumbling E test to assess visual clarity (Snellen equivalent)
- **Color Vision Test** - Ishihara-style plates to screen for color vision deficiencies
- **AI Eye Photo Analysis** - GPT-5 Vision API analyzes eye photos for visible health indicators
- **Health Snapshot** - Aggregated results with shareable/downloadable summary

## Tech Stack

- **React 19** + **Vite** - Fast development and builds
- **Tailwind CSS 4** - Modern styling
- **OpenAI GPT-5 Vision API** - AI-powered eye photo analysis
- **Playwright** - E2E testing
- **Vitest** - Unit testing

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm run test:run      # Unit tests
npm run test:e2e      # E2E tests
```

## Environment Variables

For the Eye Photo Analysis feature, you'll need an OpenAI API key. The key is entered directly in the app and is only used locally (never stored on any server).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run test` | Run unit tests in watch mode |
| `npm run test:run` | Run unit tests once |
| `npm run test:e2e` | Run Playwright E2E tests |
| `npm run test:e2e:ui` | Run Playwright with UI |

## Medical Disclaimer

**IMPORTANT:** This application is for **educational screening purposes only** and is **NOT a medical diagnosis tool**. 

- Results are approximate and should not replace professional eye care
- Always consult a qualified eye care professional for accurate assessment
- Do not make medical decisions based on this app's results

## License

MIT
