# LoppeStars

A React Native/Expo mobile application for rating flea market stalls with photo processing and location-based market discovery.

## Project Structure

```
loppestars/
├── 📱 app/                  # React Native/Expo mobile application
│   ├── components/         # Reusable UI components
│   ├── screens/           # Application screens
│   ├── navigation/        # Navigation configuration
│   ├── contexts/          # React contexts for state management
│   ├── hooks/             # Custom React hooks
│   ├── utils/             # Utility functions
│   ├── locales/           # Localization files (Danish/English)
│   ├── assets/            # Images, fonts, and other assets
│   ├── android/           # Android-specific configuration
│   ├── ios/               # iOS-specific configuration
│   └── package.json       # App dependencies and scripts
├── 🐳 api/                  # FastAPI backend with face detection
├── ☁️ aws/                  # AWS CDK infrastructure and deployment
├── 🗄️ supabase/             # Database migrations and Edge Functions
├── 📜 scripts/              # Operational scripts (moved from various locations)
│   ├── deploy.sh          # AWS ECS deployment script
│   ├── start-local-api.sh # Local development server
│   └── rebuild-stack.sh   # Infrastructure rebuild
├── 📚 docs/                 # Complete project documentation (this folder)
├── 🔧 .env                  # Environment variables (not committed)
├── 🐳 docker-compose.dev.yml # Local development setup
└── 🐳 Dockerfile           # Production container definition
```

## Development

### Mobile App

```bash
cd app
npm install
npm start          # Start Expo development server
npm run android    # Run on Android emulator
npm run ios        # Run on iOS simulator
npm run web        # Run in web browser
```

### AWS Infrastructure

```bash
cd aws
npm install
npm run deploy-aws # Deploy to AWS ECS
```

## Documentation

See the [docs/](docs/) directory for detailed documentation including:
- Setup and configuration guides
- API documentation
- Deployment instructions
- Environment setup