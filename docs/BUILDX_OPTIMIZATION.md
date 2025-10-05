# BuildX Optimization for Loppestars API

## Overview

The Loppestars API Dockerfile has been optimized to use Docker BuildX with multi-stage builds, layer caching, and incremental builds for faster, more efficient container builds.

## Key Optimizations

### 1. Multi-Stage Build Architecture

The Dockerfile uses 4 distinct stages:

```
base → dependencies → models → runtime
```

**Stage 1: Base** - System dependencies (rarely changes)
- Installs apt packages
- Uses apt cache mount for faster rebuilds

**Stage 2: Dependencies** - Python packages (changes when requirements.txt changes)
- Installs NumPy and Python dependencies
- Uses pip cache mount for faster package installation

**Stage 3: Models** - Face detection models (never changes)
- Downloads OpenCV models once
- Fully cached after first build

**Stage 4: Runtime** - Application code (changes most frequently)
- Copies application code last
- Smallest layer that changes most often

### 2. BuildX Cache Features

#### Local Cache Mounts
```dockerfile
RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt,sharing=locked
```
- Persists apt cache between builds
- Eliminates redundant package downloads

```dockerfile
RUN --mount=type=cache,target=/root/.cache/pip
```
- Persists pip cache between builds
- Speeds up Python package installation significantly

#### Registry Cache
The deploy script uses ECR as a remote cache:
```bash
--cache-from type=registry,ref="$ecr_repo:buildcache" \
--cache-to type=registry,ref="$ecr_repo:buildcache",mode=max
```

### 3. Layer Optimization

**Before:**
- Single-stage build
- All layers rebuilt on any change
- Large monolithic layers

**After:**
- Multi-stage build with optimal layer ordering
- Only changed stages rebuild
- Small, focused layers

### 4. Build Context Optimization

The `.dockerignore` file excludes:
- Mobile app code (`app/`)
- Documentation (`docs/`)
- AWS infrastructure (`aws/`)
- Development files
- Git history
- ~80% reduction in build context size

## Build Performance

### Expected Build Times

**Cold Build (no cache):**
- First time: 5-8 minutes
- Downloads all packages and models

**Warm Build (with cache):**
- Code changes only: 30-60 seconds
- Requirements.txt changes: 2-3 minutes
- System dependencies changes: 4-5 minutes

### Cache Hit Scenarios

| Change | Layers Rebuilt | Build Time |
|--------|---------------|------------|
| Python code only | Runtime stage only | ~30s |
| requirements.txt | Dependencies + Runtime | ~2m |
| System packages | Base + all downstream | ~5m |
| No changes | None (cache hit) | ~10s |

## Usage

### Automatic (via deploy.sh)

The deployment script automatically uses BuildX:

```bash
cd aws
./deploy.sh
```

Features:
- Creates BuildX builder instance if needed
- Uses ECR registry cache
- Platform: linux/amd64 (for ECS Fargate)
- Pushes directly to ECR (no intermediate steps)

### Manual BuildX Build

```bash
# Create builder (one time)
docker buildx create --name loppestars-builder --use

# Build with cache
docker buildx build \
  --platform linux/amd64 \
  --cache-from type=registry,ref=035338517878.dkr.ecr.eu-central-1.amazonaws.com/loppestars:buildcache \
  --cache-to type=registry,ref=035338517878.dkr.ecr.eu-central-1.amazonaws.com/loppestars:buildcache,mode=max \
  --build-arg SUPABASE_URL="$SUPABASE_URL" \
  --build-arg SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY" \
  --build-arg SUPABASE_ANON_KEY="$SUPABASE_ANON_KEY" \
  --build-arg SOURCE_BUCKET="stall-photos" \
  --build-arg STORAGE_BUCKET="stall-photos-processed" \
  -t loppestars:latest \
  --load \
  -f Dockerfile .
```

### Local Testing

```bash
# Build for local testing (loads into docker)
docker buildx build \
  --platform linux/amd64 \
  --build-arg SUPABASE_URL="$SUPABASE_URL" \
  --build-arg SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY" \
  --build-arg SUPABASE_ANON_KEY="$SUPABASE_ANON_KEY" \
  --build-arg SOURCE_BUCKET="stall-photos" \
  --build-arg STORAGE_BUCKET="stall-photos-processed" \
  -t loppestars:local \
  --load \
  -f Dockerfile .

# Run locally
docker run -p 8080:8080 loppestars:local
```

## Cache Management

### View Cache Usage

```bash
# Check builder disk usage
docker buildx du loppestars-builder

# List builders
docker buildx ls
```

### Clear Cache

```bash
# Prune BuildX cache
docker buildx prune -a

# Remove builder instance
docker buildx rm loppestars-builder
```

### ECR Cache Management

The registry cache (`buildcache` tag) grows over time. Clean periodically:

```bash
# Delete old buildcache tag from ECR (if needed)
aws ecr batch-delete-image \
  --repository-name loppestars \
  --image-ids imageTag=buildcache \
  --region eu-central-1
```

## Best Practices

### 1. Code Organization
- Keep Python code changes separate from dependency changes
- Update requirements.txt only when absolutely necessary
- Group related changes together

### 2. Layer Ordering
The Dockerfile follows optimal layer ordering:
1. System dependencies (least frequently changed)
2. Python dependencies
3. Model downloads
4. Application code (most frequently changed)

### 3. Cache Invalidation
- Changes to any file in a `COPY` instruction invalidate that layer and all downstream layers
- The Dockerfile copies code last to maximize cache hits

### 4. Build Arguments
- Build args are resolved at build time
- Changing build args invalidates from that point forward
- Keep build args in later stages when possible

## CI/CD Integration

The GitHub Actions workflow (`.github/workflows/deploy-ecs.yml`) already uses BuildX implicitly through the Docker build action. Consider adding explicit BuildX configuration:

```yaml
- name: Set up Docker Buildx
  uses: docker/setup-buildx-action@v2

- name: Build and push
  uses: docker/build-push-action@v4
  with:
    context: .
    file: ./Dockerfile
    push: true
    tags: ${{ env.ECR_REGISTRY }}/${{ env.ECR_REPOSITORY }}:${{ github.sha }}
    cache-from: type=registry,ref=${{ env.ECR_REGISTRY }}/${{ env.ECR_REPOSITORY }}:buildcache
    cache-to: type=registry,ref=${{ env.ECR_REGISTRY }}/${{ env.ECR_REPOSITORY }}:buildcache,mode=max
    build-args: |
      SUPABASE_URL=${{ secrets.SUPABASE_URL }}
      SUPABASE_SERVICE_ROLE_KEY=${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
      SUPABASE_ANON_KEY=${{ secrets.SUPABASE_ANON_KEY }}
      SOURCE_BUCKET=stall-photos
      STORAGE_BUCKET=stall-photos-processed
```

## Troubleshooting

### "buildx: command not found"
BuildX is included in Docker Desktop 19.03+. Update Docker:
```bash
# macOS with Homebrew
brew upgrade --cask docker
```

### "builder instance not found"
Create a new builder:
```bash
docker buildx create --name loppestars-builder --use --bootstrap
```

### Slow builds despite cache
1. Check cache mount paths are correct
2. Verify ECR cache tag exists
3. Ensure builder is persistent (not ephemeral)
4. Check network speed to ECR

### Cache not persisting
BuildX cache is tied to the builder instance. Don't remove the builder:
```bash
# Keep this builder
docker buildx use loppestars-builder
```

## Metrics and Monitoring

Track build performance over time:

```bash
# Build with timing
time docker buildx build ...

# Check layer cache hits
docker buildx build ... --progress=plain 2>&1 | grep "CACHED"
```

## References

- [Docker BuildX Documentation](https://docs.docker.com/buildx/working-with-buildx/)
- [BuildKit Cache Storage](https://docs.docker.com/build/cache/backends/)
- [Multi-stage Build Best Practices](https://docs.docker.com/build/building/multi-stage/)
