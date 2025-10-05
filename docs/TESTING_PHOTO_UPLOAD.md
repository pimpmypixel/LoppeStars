# Testing Photo Upload with Face Pixelation

## Quick Test Guide

### 1. Prerequisites

**✅ Before Testing:**
- [ ] API deployed successfully (check GitHub Actions)
- [ ] Android emulator running with app installed
- [ ] Logged in with Google OAuth
- [ ] Camera and location permissions granted

**Check API Health:**
```bash
curl https://loppestars.spoons.dk/health | cat
# Expected: {"status":"healthy"}
```

---

## 2. Test Scenario: Single Face

### Steps:
1. **Open app** on Android emulator
2. **Navigate** to "Add Item" tab (bottom navigation, 3rd icon)
3. **Tap** "Take Photo" button
4. **Position** camera to capture a face (use emulator virtual scene or select photo from gallery)
5. **Capture** photo
6. **Tap** "Use Photo" button

### Expected Behavior:

**Immediate:**
- ✅ Photo preview appears instantly with original photo
- ✅ Progress modal appears overlay
- ✅ Circular progress indicator shows

**Progress Updates:**
- ✅ 10% - "Uploading..."
- ✅ 25% - "Uploading..." (uploaded to stall-photos)
- ✅ 50% - "Processing faces..." (API processing)
- ✅ 100% - "Image processed" (complete)

**Final Result:**
- ✅ Photo preview updates with pixelated face(s)
- ✅ Success toast: "Image uploaded and processed successfully"
- ✅ Progress modal disappears
- ✅ Face(s) have 15x15 pixel blocks over them

**Timeline:** 2-8 seconds total

---

## 3. Verification Steps

### A. Check Logs in React Native

**Open React Native debugger:**
```bash
# In Android Studio Logcat or Metro bundler console
# Look for:
```

**Expected Logs:**
```
[photo-upload] Starting photo upload process
[photo-upload] Uploading original photo to stall-photos bucket
[photo-upload] Original photo uploaded successfully: user123/1728155432000.jpg
[photo-upload] Processing image with FastAPI /process endpoint
[photo-upload] API response: {success: true, facesDetected: 1, processedImageUrl: "https://..."}
[photo-upload] Photo upload completed successfully
```

### B. Check API Logs in CloudWatch

```bash
# Watch live logs
aws logs tail /ecs/loppestars --follow | cat

# Or check recent logs
aws logs tail /ecs/loppestars --since 5m | cat
```

**Expected Logs:**
```
POST /process - 200 OK
Downloading image from stall-photos: user123/1728155432000.jpg
Face detection complete: 1 faces detected
Applying pixelation with 15x15 blocks
Uploading processed image to stall-photos-processed
Processing complete: user123/1728155678000-processed.jpg
```

### C. Check Supabase Storage

**Navigate to Supabase Dashboard:**
1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to **Storage** section

**Check stall-photos bucket:**
- ✅ Original image exists: `user123/{timestamp}.jpg`
- ✅ File size matches uploaded image

**Check stall-photos-processed bucket:**
- ✅ Processed image exists: `user123/{timestamp}-processed.jpg`
- ✅ File size similar to original
- ✅ Download and verify faces are pixelated

---

## 4. Test Scenarios

### Scenario 1: No Faces in Photo
**Test:** Upload photo without any faces (landscape, object, etc.)

**Expected:**
- ✅ Upload succeeds
- ✅ Processing completes
- ✅ `facesDetected: 0` in response
- ✅ Processed image looks identical to original
- ✅ No pixelation applied

**Verify:**
```bash
# API logs should show:
# "Face detection complete: 0 faces detected"
```

---

### Scenario 2: Multiple Faces
**Test:** Upload photo with 2+ people's faces

**Expected:**
- ✅ Upload succeeds
- ✅ Processing completes
- ✅ `facesDetected: 2` (or more) in response
- ✅ All detected faces are pixelated
- ✅ Non-face areas remain clear

**Verify:**
```bash
# API logs should show:
# "Face detection complete: 2 faces detected"
```

---

### Scenario 3: Large Image (5MB+)
**Test:** Upload high-resolution photo (4000x3000px+)

**Expected:**
- ✅ Upload succeeds (may take 5-8 seconds)
- ✅ Progress updates smoothly
- ✅ Processing completes
- ✅ Faces pixelated correctly
- ⚠️ Longer processing time (6-10s total)

**Verify:**
```bash
# Check file sizes in Supabase Storage
# Both original and processed should be similar size
```

---

### Scenario 4: Poor Network Connection
**Test:** Simulate slow network (Chrome DevTools throttling or Android emulator settings)

**Expected:**
- ⏳ Upload takes longer (10-20s)
- ✅ Progress updates smoothly
- ✅ Eventually completes successfully
- ❌ If timeout: Shows error message
- ✅ Can retry upload

**Verify:**
```bash
# Check that timeout errors are handled gracefully
# No app crashes
```

---

### Scenario 5: API Error (503 Service Unavailable)
**Test:** Stop ECS task to simulate API downtime

**Expected:**
- ✅ Upload to stall-photos succeeds
- ❌ API call fails with network error
- ✅ Error message shown: "Processing failed: Service unavailable"
- ✅ Photo remains in preview (original, not processed)
- ✅ Can retry processing later

**Simulate:**
```bash
# Stop ECS task
aws ecs update-service \
  --cluster <cluster-name> \
  --service <service-name> \
  --desired-count 0 | cat

# Test upload in app (should fail gracefully)

# Restart service
aws ecs update-service \
  --cluster <cluster-name> \
  --service <service-name> \
  --desired-count 1 | cat
```

---

## 5. Performance Benchmarks

### Ideal Performance (Good Network, Small Image)
| Stage | Duration |
|-------|----------|
| Upload Original | 1-2s |
| Call API | 0.5s |
| Face Detection | 0.2-0.5s |
| Pixelation | 0.05-0.1s |
| Upload Processed | 0.5-1s |
| **Total** | **2-4s** |

### Acceptable Performance (Slow Network, Large Image)
| Stage | Duration |
|-------|----------|
| Upload Original | 3-5s |
| Call API | 1s |
| Face Detection | 1-2s |
| Pixelation | 0.2-0.5s |
| Upload Processed | 1-2s |
| **Total** | **6-10s** |

### Unacceptable Performance (Investigate)
- **> 15 seconds total**: Network issues or API bottleneck
- **> 5 seconds for face detection**: Image too large, increase downscale
- **Upload fails repeatedly**: Check Supabase quotas/limits

---

## 6. Common Issues & Solutions

### Issue: "Progress stuck at 25%"
**Cause:** API /process endpoint not responding

**Debug:**
```bash
# Check API health
curl https://loppestars.spoons.dk/health | cat

# Check ECS service
aws ecs describe-services \
  --cluster <cluster-name> \
  --services <service-name> | cat

# Check recent logs
aws logs tail /ecs/loppestars --since 10m | cat
```

**Solution:**
- Restart ECS service
- Check CloudWatch for errors
- Verify environment variables

---

### Issue: "Download failed: 400 token error"
**Cause:** Supabase signed URL not created properly

**Debug:**
```bash
# Check API logs
aws logs tail /ecs/loppestars --since 5m | grep "sign" | cat
```

**Solution:**
- ✅ FIXED in commit 60d2983
- Ensure API uses POST to create signed URL
- Verify SUPABASE_SERVICE_ROLE_KEY is correct

---

### Issue: "No faces detected" (when faces clearly visible)
**Cause:** Face detection parameters too strict or image downscaled too much

**Debug:**
- Check face size in image
- Check lighting conditions
- Check if face is partially obscured

**Solution:**
- Increase `downscaleForDetection` (e.g., 1200 instead of 800)
- Use better lighting
- Ensure faces are front-facing (profile faces harder to detect)

---

### Issue: "Processed image looks identical to original"
**Cause:** `facesDetected: 0` or pixelation not applied

**Debug:**
```bash
# Check API response
# Look for: "facesDetected": 0
```

**Solution:**
- Verify faces are visible in original image
- Check API logs for face detection errors
- Try different image with clear front-facing faces

---

### Issue: "Error: No processed image URL returned"
**Cause:** API upload to stall-photos-processed failed

**Debug:**
```bash
# Check API logs
aws logs tail /ecs/loppestars --since 5m | grep "upload" | cat
```

**Solution:**
- Check bucket permissions in Supabase
- Verify bucket name matches API config
- Check Supabase storage quotas

---

## 7. Manual API Testing

### Test /process Endpoint Directly

**1. Upload a test image to stall-photos:**
```bash
# Use Supabase dashboard or curl to upload test image
# Path: test-user/test-image.jpg
```

**2. Call /process endpoint:**
```bash
curl -X POST https://loppestars.spoons.dk/process \
  -H "Content-Type: application/json" \
  -d '{
    "imagePath": "test-user/test-image.jpg",
    "userId": "test-user",
    "mode": "pixelate",
    "pixelateSize": 15,
    "blurStrength": 31,
    "downscaleForDetection": 800
  }' | jq '.'
```

**Expected Response:**
```json
{
  "success": true,
  "processedImageUrl": "https://oprevwbturtujbugynct.supabase.co/storage/v1/object/public/stall-photos-processed/test-user/1728155678000-processed.jpg",
  "facesDetected": 1,
  "mode": "pixelate"
}
```

**3. Download and verify processed image:**
```bash
# Copy processedImageUrl from response
curl -o processed.jpg "https://oprevwbturtujbugynct.supabase.co/storage/v1/object/public/stall-photos-processed/test-user/1728155678000-processed.jpg"

# Open in image viewer
open processed.jpg  # macOS
```

---

## 8. Deployment Verification

### After GitHub Actions Deployment

**1. Check deployment status:**
```bash
gh run list --limit 1 | cat
# Wait until status is "completed" (not "in_progress")
```

**2. Verify ECS task is running:**
```bash
aws ecs list-tasks \
  --cluster <cluster-name> \
  --service-name <service-name> | cat

# Should show at least 1 task ARN
```

**3. Check task logs:**
```bash
aws logs tail /ecs/loppestars --since 1m | cat
# Should show recent "healthy" checks
```

**4. Test API endpoint:**
```bash
curl https://loppestars.spoons.dk/health | cat
# Expected: {"status":"healthy"}
```

**5. Run full end-to-end test in app** (see Section 2)

---

## 9. Success Criteria

### ✅ All Tests Pass When:
1. Photo upload completes in < 10 seconds
2. Progress indicator updates smoothly (10% → 25% → 50% → 100%)
3. Faces are correctly pixelated in processed image
4. Original and processed images both exist in Supabase Storage
5. No errors in app logs
6. No errors in API logs
7. User can submit rating with processed photo
8. Processed photo URL is publicly accessible

### 🎉 Ready for Production When:
- All 5 test scenarios pass
- Performance benchmarks met
- Error handling works correctly
- Logs show no errors
- Deployment pipeline works smoothly

---

**Now go test! 📸 → 🔲🔳 → ✅**
