# LoppeStars

A React Native/Expo mobile application for rating flea market stalls with photo processing and location-based market discovery.

## Project Structure

```
├── app/                    # React Native/Expo application
│   ├── components/         # Reusable UI components
│   ├── screens/           # Application screens
│   ├── navigation/        # Navigation configuration
│   ├── contexts/          # React contexts for state management
│   ├── hooks/             # Custom React hooks
│   ├── utils/             # Utility functions
│   ├── locales/           # Localization files
│   ├── assets/            # Images, fonts, and other assets
│   ├── android/           # Android-specific configuration
│   ├── ios/               # iOS-specific configuration
│   └── package.json       # App dependencies and scripts
├── docs/                  # Documentation
├── supabase/              # Supabase configuration and migrations
├── aws/                   # AWS CDK infrastructure and deployment
└── .env                   # Environment variables
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