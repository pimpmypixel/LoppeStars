# Testing Face Blurring with Photo Upload

## Overview
This guide walks through testing the complete photo upload and face pixelation flow in the LoppeStars app.

## Architecture

```
Mobile App → Supabase Storage → FastAPI (/process) → Face Detection → Processed Image → Supabase Storage
```

### Flow Steps:
1. **User takes photo** - CameraModal component captures image
2. **Upload original** - Photo uploaded to `stall-photos` bucket in Supabase Storage
3. **Call FastAPI** - Direct HTTPS call to `https://loppestars.spoons.dk/process`
4. **Face detection** - OpenCV detects faces with Haar Cascade classifier
5. **Pixelation** - Faces are pixelated (15x15 blocks by default)
6. **Save processed** - Processed image saved to `stall-photos-processed` bucket
7. **Return URL** - Processed image URL returned to app
8. **Display** - App shows pixelated image in rating form

---

## Prerequisites

### 1. Environment Variables
Ensure `.env` file has:
```bash
# Supabase
SUPABASE_URL=https://oprevwbturtujbugynct.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# API
API_BASE_URL=https://loppestars.spoons.dk

# Google OAuth (for login)
GOOGLE_WEB_CLIENT_ID=512928992479-...apps.googleusercontent.com
GOOGLE_ANDROID_CLIENT_ID=512928992479-...apps.googleusercontent.com
```

### 2. Supabase Storage Buckets
Ensure these buckets exist in Supabase:
- `stall-photos` (for original uploads)
- `stall-photos-processed` (for processed images with pixelated faces)

Both should have:
- **Public**: Yes
- **File size limit**: 10MB
- **Allowed MIME types**: `image/jpeg`, `image/png`, `image/webp`

### 3. API Deployment
Verify API is running:
```bash
curl https://loppestars.spoons.dk/health
# Expected: {"status":"healthy","service":"loppestars"}
```

---

## Running the App

### Start Expo Development Server

```bash
cd /Users/andreas/Herd/loppestars/app
npx expo start --clear
```

### Open on Android Emulator

1. Ensure emulator is running:
   ```bash
   adb devices
   # Should show: emulator-5554   device
   ```

2. Press `a` in the Expo terminal to open on Android

3. Or use: `npm run android`

### Open on iOS Simulator (macOS only)

```bash
npm run ios
```

---

## Testing Steps

### 1. Login with Google OAuth

1. App should open to login screen
2. Tap "Sign in with Google"
3. Select Google account
4. Grant permissions (camera, location, media library)
5. Should see Home screen

### 2. Navigate to Rating Screen

1. Tap "Add Item" tab (bottom navigation, 3rd icon)
2. Should see "Rate a Stall" form

### 3. Take a Photo with Faces

1. Tap "Take Photo" button
2. Camera modal opens (full screen)
3. Position camera to capture faces (friends, family, or yourself)
4. Tap capture button (circle at bottom)
5. Preview photo, tap "Save" or "Use Photo"

### 4. Observe Upload & Processing

Watch the UI for:
- **Progress indicator** (0% → 25% → 50% → 100%)
- **Status messages**:
  - "Uploading..." (0-25%)
  - "Processing..." (25-50%)
  - "Image processed" (100%)
- **Console logs** (check React Native debugger):
  ```
  [photo-upload] Starting photo upload process
  [photo-upload] Uploading original photo to stall-photos bucket
  [photo-upload] Original photo uploaded successfully: user123/1728155432000.jpg
  [photo-upload] Processing image with FastAPI /process endpoint
  [photo-upload] API response: {success: true, processedImageUrl: "...", facesDetected: 2}
  [photo-upload] Photo upload completed successfully
  ```

### 5. Verify Pixelation

1. **Check preview image** - Faces should be pixelated in the app
2. **Tap to view full screen** - Pixelation should be visible
3. **Compare buckets**:
   ```bash
   # Original in stall-photos bucket
   # Processed in stall-photos-processed bucket
   ```

### 6. Submit Rating

1. Fill in stall name (required)
2. Add optional fields (MobilePay, comments)
3. Tap "Submit" button
4. Should see success message
5. Rating saved to Supabase `ratings` table with processed image URL

---

## Testing Face Detection API Directly

### Test with cURL

```bash
# 1. Upload a test image to Supabase stall-photos bucket
# (Use Supabase dashboard or app)

# 2. Call the API
curl -X POST https://loppestars.spoons.dk/process \
  -H "Content-Type: application/json" \
  -d '{
    "imagePath": "user123/test-photo.jpg",
    "userId": "user123",
    "mode": "pixelate",
    "pixelateSize": 15,
    "blurStrength": 31,
    "downscaleForDetection": 800
  }'

# Expected response:
# {
#   "success": true,
#   "processedImageUrl": "https://oprevwbturtujbugynct.supabase.co/storage/v1/object/public/stall-photos-processed/user123/1728155678000-processed.jpg",
#   "facesDetected": 2,
#   "mode": "pixelate"
# }
```

### Test with Postman

Import the `postman.json` collection from the project root.

**Request: Process Image**
- **Method**: POST
- **URL**: `https://loppestars.spoons.dk/process`
- **Headers**: `Content-Type: application/json`
- **Body**:
  ```json
  {
    "imagePath": "user123/photo.jpg",
    "userId": "user123",
    "mode": "pixelate",
    "pixelateSize": 15,
    "blurStrength": 31,
    "downscaleForDetection": 800
  }
  ```

---

## Troubleshooting

### Photo Upload Fails

**Error**: `Failed to upload image: 401 Unauthorized`

**Solution**:
- Check `SUPABASE_ANON_KEY` in `.env`
- Verify bucket permissions (should be public or have RLS policy)
- Check user is logged in

---

### API Processing Fails

**Error**: `Processing failed: 500 Internal Server Error`

**Solution**:
1. Check CloudWatch logs:
   ```bash
   aws logs tail /ecs/loppestars --follow | cat
   ```
2. Verify image path exists in Supabase:
   ```
   https://oprevwbturtujbugynct.supabase.co/storage/v1/object/public/stall-photos/user123/photo.jpg
   ```
3. Test API health:
   ```bash
   curl https://loppestars.spoons.dk/health
   ```

---

### No Faces Detected

**Issue**: `facesDetected: 0` even though faces are in photo

**Possible Causes**:
- Photo resolution too low (increase `downscaleForDetection`)
- Face angle not frontal (Haar Cascade works best with frontal faces)
- Poor lighting conditions
- Face too small in frame

**Solutions**:
- Use higher resolution images
- Ensure faces are well-lit and frontal
- Reduce `downscaleForDetection` to process at higher resolution (slower)
- Try `mode: "blur"` instead of `"pixelate"`

---

### Processed Image Not Showing

**Error**: Image shows loading spinner indefinitely

**Solution**:
1. Check network tab in React Native debugger
2. Verify processed URL is valid:
   ```bash
   curl -I https://oprevwbturtujbugynct.supabase.co/storage/v1/object/public/stall-photos-processed/...
   ```
3. Check `stall-photos-processed` bucket is public
4. Verify CORS settings in Supabase

---

## Performance Benchmarks

### Expected Processing Times

| Resolution | Faces | Detection Time | Pixelation Time | Total |
|------------|-------|----------------|-----------------|-------|
| 800x600    | 1     | ~200ms         | ~50ms           | ~250ms |
| 1600x1200  | 2     | ~500ms         | ~100ms          | ~600ms |
| 3200x2400  | 3     | ~1500ms        | ~300ms          | ~1.8s  |

### Upload Progress Breakdown

- **0-25%**: Upload original to Supabase (`stall-photos` bucket)
- **25-50%**: Call FastAPI `/process` endpoint
- **50-100%**: Receive processed image URL

---

## API Endpoints

### Face Processing

**Endpoint**: `POST https://loppestars.spoons.dk/process`

**Request**:
```json
{
  "imagePath": "user123/photo.jpg",     // Path in stall-photos bucket
  "userId": "user123",                  // User ID for organizing processed images
  "mode": "pixelate",                   // "pixelate" or "blur"
  "pixelateSize": 15,                   // Size of pixelation blocks (default: 15)
  "blurStrength": 31,                   // Blur kernel size, must be odd (default: 31)
  "downscaleForDetection": 800          // Max dimension for detection (default: 800)
}
```

**Response**:
```json
{
  "success": true,
  "processedImageUrl": "https://oprevwbturtujbugynct.supabase.co/storage/v1/object/public/stall-photos-processed/user123/1728155678000-processed.jpg",
  "facesDetected": 2,
  "mode": "pixelate"
}
```

---

## Monitoring

### CloudWatch Logs

```bash
# Real-time logs
aws logs tail /ecs/loppestars --follow | cat

# Filter for face processing
aws logs tail /ecs/loppestars --follow --filter-pattern "process" | cat

# Check for errors
aws logs tail /ecs/loppestars --since 1h --filter-pattern "ERROR" | cat
```

### Supabase Dashboard

1. **Storage** → `stall-photos-processed` → Check new images
2. **Table Editor** → `ratings` → Verify `photo_url` field
3. **Logs** → Check API requests and errors

---

## Code References

### Mobile App

- **Photo Upload Hook**: `app/hooks/usePhotoUpload.ts`
- **Camera Component**: `app/components/CameraModal.tsx`
- **Rating Screen**: `app/screens/RatingScreen.tsx`
- **Progress Indicator**: `app/components/PhotoUploadProgress.tsx`

### Backend API

- **Main API**: `api/main.py` (FastAPI endpoints)
- **Face Processor**: `api/face_processor.py` (OpenCV face detection)
- **Dockerfile**: Root `Dockerfile` (multi-stage with OpenCV)

---

## Success Criteria

✅ **Photo Upload Works**
- Original photo appears in `stall-photos` bucket
- Progress indicator shows 0% → 25%

✅ **Face Detection Works**
- API returns `facesDetected > 0` for photos with faces
- API returns `facesDetected = 0` for photos without faces

✅ **Pixelation Works**
- Processed image shows pixelated faces
- Processed image appears in `stall-photos-processed` bucket
- Progress indicator shows 25% → 50% → 100%

✅ **Rating Submission Works**
- Rating saved to `ratings` table
- `photo_url` field contains processed image URL
- Success message appears in app

---

## Next Steps

After successful testing:

1. **Test with various photo types**:
   - Single face
   - Multiple faces
   - Side profiles
   - Group photos
   - Poor lighting
   - Sunglasses/hats

2. **Test error scenarios**:
   - Network timeout
   - API unavailable
   - Bucket full
   - Invalid image format

3. **Performance testing**:
   - Large image files (5MB+)
   - Multiple concurrent uploads
   - Slow network conditions

4. **User experience**:
   - Progress indicator clarity
   - Error message helpfulness
   - Retry mechanism
   - Cancel upload option

---

**Happy Testing! 🎪📸**
