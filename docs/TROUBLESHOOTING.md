# Troubleshooting Guide

Common issues and solutions for Loppestars development and deployment.

---

## Mobile App Issues

### Authentication Problems

**Google Sign-In Fails**

```
Error: DEVELOPER_ERROR
```

**Solution:**
1. Check `GOOGLE_WEB_CLIENT_ID` in `.env` matches Google Cloud Console
2. Verify `server_client_id` in `android/app/src/main/res/values/strings.xml`
3. Ensure SHA-1 fingerprint is registered in Google Console:
   ```bash
   keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey
   ```
4. Restart Metro bundler: `npx expo start --clear`

**Session Not Persisting**

**Solution:**
1. Check AsyncStorage permissions
2. Clear app data and re-login:
   ```bash
   # Android
   adb shell pm clear com.loppestars
   
   # iOS
   xcrun simctl erase all
   ```

---

### Network Connectivity

**Cannot Connect to Supabase (Android)**

```
Error: Failed to fetch
```

**Solution:**
1. Use `10.0.2.2` for Android emulator (not `localhost`)
2. Set `SUPABASE_URL_ANDROID=http://10.0.2.2:54321`
3. Check Supabase is running: `supabase status`
4. Test connectivity:
   ```bash
   adb shell
   curl http://10.0.2.2:54321
   ```

**Cannot Connect to Supabase (iOS)**

**Solution:**
1. Use `127.0.0.1` for iOS simulator
2. Set `SUPABASE_URL_IOS=http://127.0.0.1:54321`
3. Check firewall isn't blocking port 54321

---

### Camera and Permissions

**Camera Not Working**

```
Error: Camera permission denied
```

**Solution:**
1. Grant permissions manually in settings
2. Reset permissions:
   ```bash
   # Android
   adb shell pm reset-permissions
   
   # iOS
   Delete app and reinstall
   ```
3. Check `app.json` has camera permissions:
   ```json
   {
     "expo": {
       "plugins": [
         [
           "expo-camera",
           {
             "cameraPermission": "Allow $(PRODUCT_NAME) to access your camera"
           }
         ]
       ]
     }
   }
   ```

**Face Blurring Not Working**

**Solution:**
1. Check API is running: `curl http://localhost:8080/health`
2. Verify `API_BASE_URL` in `.env`
3. Check CloudWatch logs for errors:
   ```bash
   aws logs tail /ecs/loppestars --follow
   ```

---

### Build Errors

**TypeScript Errors**

```bash
npm run ts:check
```

**Common Fixes:**
- Update types: `npm install --save-dev @types/react-native`
- Clear cache: `rm -rf node_modules && npm install`
- Check `tsconfig.json` settings

**Metro Bundler Crashes**

```bash
npx expo start --clear
rm -rf .expo
rm -rf node_modules
npm install
```

**Android Build Fails**

```bash
cd android
./gradlew clean
cd ..
npx expo run:android
```

**iOS Build Fails (CocoaPods)**

```bash
cd ios
rm -rf Pods Podfile.lock
pod install
cd ..
npx expo run:ios
```

---

## API Issues

### Deployment Problems

**BuildX Error: "push access denied"**

**Solution:**
1. Login to ECR:
   ```bash
   aws ecr get-login-password --region eu-central-1 | \
     docker login --username AWS --password-stdin 035338517878.dkr.ecr.eu-central-1.amazonaws.com
   ```
2. Don't tag local images, only ECR images
3. Use `--push` with BuildX (already in `deploy.sh`)

**Task Definition JSON Invalid**

```
Error: Invalid JSON received
```

**Solution:**
1. Check environment variable escaping
2. Verify no color codes in JSON:
   ```bash
   cat /tmp/task-def.json | python3 -m json.tool
   ```
3. Use `deploy.sh` (handles escaping automatically)

**Service Won't Stabilize**

```
Error: Waiter ServicesStable failed: Max attempts exceeded
```

**Solutions:**
1. Check container logs:
   ```bash
   aws logs tail /ecs/loppestars --follow
   ```
2. Check task stopped reason:
   ```bash
   aws ecs describe-tasks --cluster LoppestarsCluster --tasks <task-id>
   ```
3. Common causes:
   - Container port mismatch (must be 8080)
   - Health check path wrong (must be `/health`)
   - Missing environment variables
   - Out of memory

**Health Check Fails**

```
Target.Timeout: Request timed out
```

**Solutions:**
1. Increase timeout:
   ```bash
   aws elbv2 modify-target-group \
     --target-group-arn <arn> \
     --health-check-timeout-seconds 10
   ```
2. Check path is `/health` (not `/`)
3. Verify container responds:
   ```bash
   # Get task private IP
   aws ecs describe-tasks ...
   
   # Test from within VPC
   curl http://10.0.x.x:8080/health
   ```

---

### Docker Build Issues

**Cache Not Working**

**Solution:**
1. Create BuildX builder:
   ```bash
   docker buildx create --name loppestars-builder --use --bootstrap
   ```
2. Verify cache tag exists:
   ```bash
   aws ecr describe-images --repository-name loppestars --image-ids imageTag=buildcache
   ```
3. Check network speed to ECR

**Build Freezes**

**Solution:**
1. Restart Docker Desktop
2. Clear builder cache:
   ```bash
   docker buildx prune -a
   ```
3. Check disk space: `df -h`

**Dependencies Fail to Install**

**Solution:**
1. Check `requirements.txt` syntax
2. Pin versions: `package==1.2.3`
3. Use `--no-cache-dir` flag (already in Dockerfile)

---

## Infrastructure Issues

### CloudFormation Stack Errors

**Stack Creation Failed**

```bash
aws cloudformation describe-stack-events \
  --stack-name LoppestarsEcsStack \
  --region eu-central-1 \
  --max-items 20
```

**Common Issues:**
- Certificate ARN invalid → Check ACM certificate exists
- IAM permissions → Verify user has CloudFormation permissions
- VPC limits → Check service quotas

**Stack Update Rollback**

**Solution:**
1. Check what failed:
   ```bash
   aws cloudformation describe-stack-events --stack-name LoppestarsEcsStack | grep FAILED
   ```
2. Fix the issue in `stack-template.yaml`
3. Redeploy:
   ```bash
   cd aws
   ./deploy.sh --force
   ```

---

### DNS and SSL Issues

**Cloudflare Error 1016**

```
Error 1016: Origin DNS Error
```

**Solution:**
1. Check DNS record points to correct ALB:
   ```bash
   dig +short loppestars.spoons.dk
   ```
2. Update Cloudflare DNS:
   ```bash
   # Get ALB DNS
   aws cloudformation describe-stacks ... | grep LoadBalancerDNS
   
   # Update in Cloudflare dashboard or via API
   ```
3. Wait 5 minutes for DNS propagation

**SSL Certificate Invalid**

**Solution:**
1. Verify certificate is issued (not pending):
   ```bash
   aws acm describe-certificate --certificate-arn <arn>
   ```
2. Check domain name matches: `*.spoons.dk` or `loppestars.spoons.dk`
3. Renew if expired (ACM auto-renews if DNS validation works)

---

### Database Issues

**Supabase Connection Timeout**

**Solution:**
1. Check `SUPABASE_URL` in `.env`
2. Verify API key is correct
3. Check Supabase dashboard for outages
4. Test connection:
   ```bash
   curl -H "apikey: $SUPABASE_ANON_KEY" $SUPABASE_URL/rest/v1/
   ```

**Row-Level Security Blocking Queries**

**Solution:**
1. Check RLS policies in Supabase dashboard
2. Use service role key for admin access
3. Disable RLS temporarily for debugging (not in production!)

**Migration Fails**

```bash
supabase db reset
supabase db push
```

---

## Performance Issues

### Slow API Response

**Diagnosis:**
```bash
# Check task CPU/memory
aws ecs describe-services --cluster LoppestarsCluster --services loppestars-service

# Check CloudWatch metrics
# Go to AWS Console → CloudWatch → Metrics
```

**Solutions:**
- Scale up: Increase CPU/memory in `stack-template.yaml`
- Scale out: Increase desired count in service
- Optimize queries: Add indexes, use EXPLAIN
- Enable caching: CloudFlare, Redis

### Slow Image Processing

**Solution:**
1. Reduce image size before upload
2. Use lower resolution for face detection
3. Process asynchronously (queue system)
4. Cache processed images

---

## Common Error Messages

### "Cannot find module"

```bash
npm install <missing-module>
```

### "Command not found"

```bash
npm install -g <tool>
# or
npx <tool>
```

### "Permission denied"

```bash
chmod +x <script>
# or
sudo <command>
```

### "Port already in use"

```bash
# Find process using port
lsof -i :8080

# Kill process
kill -9 <PID>
```

---

## Getting Help

### Debug Checklist

- [ ] Check error message carefully
- [ ] Search error in GitHub issues
- [ ] Check CloudWatch logs
- [ ] Verify environment variables
- [ ] Test with curl/Postman
- [ ] Try in clean environment

### Useful Commands

**Status Checks:**
```bash
# App
cd app && npm run ts:check

# API
curl http://localhost:8080/health

# Supabase
supabase status

# AWS
cd aws && ./deploy.sh --status
```

**Logs:**
```bash
# Mobile
npx react-native log-android
npx react-native log-ios

# API (local)
docker logs -f <container-id>

# API (production)
aws logs tail /ecs/loppestars --follow
```

**Reset Everything:**
```bash
# Mobile app
rm -rf node_modules package-lock.json
npm install
npx expo start --clear

# Docker
docker system prune -a
docker buildx prune -a

# Database
supabase db reset
```

---

## Still Stuck?

1. **Check Documentation:**
   - [Deployment Guide](DEPLOYMENT.md)
   - [Development Guide](DEVELOPMENT.md)
   - [Architecture](ARCHITECTURE.md)

2. **Check Logs:**
   - CloudWatch: `/ecs/loppestars`
   - Metro bundler console
   - Browser developer tools

3. **Search Issues:**
   - GitHub repository issues
   - Stack Overflow
   - Expo forums

4. **Create Issue:**
   - Include error message
   - Include steps to reproduce
   - Include environment details
   - Include logs (sanitize secrets!)

---

**Most issues can be solved by restarting, clearing cache, or checking environment variables!** 🔧
