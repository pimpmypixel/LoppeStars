# Loppestars AWS Infrastructure

## Deployment

### Primary Method (Recommended)
```bash
../scripts/deploy.sh
```

This idempotent script handles:
- ✅ CloudFormation infrastructure
- ✅ Docker build & ECR push
- ✅ ECS task definition & service
- ✅ Cloudflare DNS updates
- ✅ API health verification

### Options
```bash
../scripts/deploy.sh           # Full deployment
../scripts/deploy.sh --status  # Status check only
../scripts/deploy.sh --force   # Force redeployment
```

### Alternative (Node.js)
```bash
node deploy-and-dns.js
```

## Files

**Essential**:
- `../scripts/deploy.sh` - Master deployment script
- `stack-template.yaml` - CloudFormation template
- `deploy-and-dns.js` - Node.js alternative

**CDK (optional, not actively used)**:
- `cdk.json`, `bin/`, `lib/`, `test/` - CDK infrastructure code

## Documentation

See `/docs/MASTER_DEPLOY_SCRIPT.md` for complete usage guide.

## Deprecated Scripts Removed

9 old scripts consolidated into `../scripts/deploy.sh`:
- build-push.sh, check-status.sh, create-service.sh
- deploy-direct.sh, deploy-full.sh, deploy-manual.sh
- deploy-simple.sh, ensure-infrastructure.sh, ../scripts/rebuild-stack.sh

This is a blank project for CDK development with TypeScript.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `npx cdk deploy`  deploy this stack to your default AWS account/region
* `npx cdk diff`    compare deployed stack with current state
* `npx cdk synth`   emits the synthesized CloudFormation template
