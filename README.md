# LoppeStars

A React Native/Expo mobile application for rating flea market stalls with photo processing and location-based market discovery.

## 📁 Project Structure

```
loppestars/
├── 📱 app/                  # React Native/Expo mobile application
├── 🐳 api/                  # FastAPI backend (Docker container)
├── ☁️ aws/                  # AWS CDK infrastructure configuration
├── 🗄️ supabase/             # Supabase database migrations and functions
├── 📜 scripts/              # Operational scripts (deployment, development)
├── 📚 docs/                 # Complete project documentation
├── 🔧 .env                  # Environment variables (not committed)
├── 🐳 docker-compose.dev.yml # Local development setup
└── 🐳 Dockerfile           # Production container definition
```

## 🚀 Quick Start

### Mobile App Development
```bash
cd app && bun install && bun run start
```

### Local API Development  
```bash
./scripts/start-local-api.sh
```

### Production Deployment
```bash
./scripts/deploy.sh
```

## 📚 Documentation

Complete documentation is available in the [`docs/`](./docs/) folder:

- **[`docs/README.md`](./docs/README.md)** - Comprehensive project guide
- **[`docs/MAINTENANCE_COMMANDS.md`](./docs/MAINTENANCE_COMMANDS.md)** - All operational commands

## 🛠️ Scripts

All operational scripts are centralized in the [`scripts/`](./scripts/) folder:

- **`scripts/deploy.sh`** - AWS ECS deployment
- **`scripts/start-local-api.sh`** - Local development server
- **`scripts/rebuild-stack.sh`** - Infrastructure rebuild

## 🔧 Environment Setup

1. Copy environment template: `cp .env.example .env`
2. Configure your environment variables
3. See [`docs/README.md`](./docs/README.md) for detailed setup instructions

## 🏗️ Architecture

- **Frontend**: React Native + Expo
- **Backend**: FastAPI + Docker (AWS ECS)
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage (photo uploads)
- **Infrastructure**: AWS (ECS, ECR, ALB, CloudFormation)
- **DNS**: Cloudflare

## 📄 License

[Add your license information here]

---

**For complete documentation, see [`docs/README.md`](./docs/README.md)**