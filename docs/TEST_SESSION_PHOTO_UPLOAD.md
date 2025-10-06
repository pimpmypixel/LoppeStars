# Photo Upload Test Session

**Date:** October 5, 2025  
**Time:** 20:47 CEST  
**Tester:** Andreas  
**Environment:** Android Emulator (Medium_Phone_API_36.1)  
**API:** https://loppestars.spoons.dk (LIVE)  

---

## Test Objective

Test complete end-to-end photo upload flow with face pixelation:
1. Camera functionality
2. Photo capture/selection
3. Upload to Supabase Storage (stall-photos)
4. API processing with OpenCV face detection
5. Face pixelation (15x15 blocks)
6. Upload to processed bucket (stall-photos-processed)
7. Display processed image in app
8. Submit rating with processed photo

---

## Pre-Test Verification

### API Status
- [x] Health check: `curl https://loppestars.spoons.dk/health`
- [x] Response: `{"status":"healthy","service":"loppestars"}`
- [x] Task definition: loppestars:36 (with Supabase fix)
- [x] Deployment status: COMPLETED
- [x] Running tasks: 1/1 HEALTHY

### App Status
- [x] Build: SUCCESSFUL (576 actionable tasks)
- [x] APK: Installing to emulator
- [ ] App launched on emulator
- [ ] Logged in with Google OAuth
- [ ] Permissions granted (camera, location, media)

---

## Test Scenarios

### Scenario 1: Single Face Photo
**Objective:** Upload photo with 1 face, verify pixelation

**Steps:**
1. Navigate to "Add Item" tab (3rd icon in bottom navigation)
2. Tap "Take Photo" button
3. Camera modal opens
4. Capture photo with 1 visible face (use emulator virtual scene or gallery)
5. Tap "Use Photo"
6. Observe progress indicator: 0% → 25% → 50% → 100%
7. Verify face is pixelated in preview (15x15 pixel blocks)
8. Submit rating

**Expected Results:**
- ✅ Progress updates smoothly
- ✅ 1 face detected by API
- ✅ Face pixelated with 15x15 blocks
- ✅ Non-face areas remain clear
- ✅ Processed URL returned and displayed
- ✅ Rating submitted successfully

**Actual Results:**
- [ ] Progress: ___% → ___% → ___% → ___%
- [ ] Faces detected: ___
- [ ] Pixelation: ✅ / ❌
- [ ] Processing time: ___ seconds
- [ ] Status: ✅ SUCCESS / ❌ FAILED
- [ ] Notes: ___

---

### Scenario 2: Multiple Faces Photo
**Objective:** Upload photo with 2+ faces, verify all are pixelated

**Steps:**
1. Navigate to "Add Item" tab
2. Tap "Take Photo"
3. Select photo with multiple faces from gallery
4. Tap "Use Photo"
5. Watch progress indicator
6. Verify all faces are pixelated

**Expected Results:**
- ✅ All faces detected (e.g., 2 faces detected)
- ✅ All faces pixelated
- ✅ Processing completes successfully

**Actual Results:**
- [ ] Faces in photo: ___
- [ ] Faces detected: ___
- [ ] All pixelated: ✅ / ❌
- [ ] Processing time: ___ seconds
- [ ] Status: ✅ SUCCESS / ❌ FAILED
- [ ] Notes: ___

---

### Scenario 3: No Faces Photo
**Objective:** Upload photo without faces (landscape, object, etc.)

**Steps:**
1. Navigate to "Add Item" tab
2. Tap "Take Photo"
3. Select photo with no faces
4. Tap "Use Photo"
5. Watch progress indicator

**Expected Results:**
- ✅ Processing completes
- ✅ 0 faces detected
- ✅ Image looks identical to original
- ✅ No pixelation applied

**Actual Results:**
- [ ] Faces detected: ___
- [ ] Processing time: ___ seconds
- [ ] Status: ✅ SUCCESS / ❌ FAILED
- [ ] Notes: ___

---

### Scenario 4: Large Image (High Resolution)
**Objective:** Test with large image file (5MB+)

**Steps:**
1. Navigate to "Add Item" tab
2. Tap "Take Photo"
3. Select high-resolution photo from gallery
4. Tap "Use Photo"
5. Watch progress indicator

**Expected Results:**
- ✅ Upload succeeds (may take 5-8 seconds)
- ✅ Processing completes
- ✅ Faces pixelated correctly

**Actual Results:**
- [ ] File size: ___ MB
- [ ] Upload time: ___ seconds
- [ ] Processing time: ___ seconds
- [ ] Total time: ___ seconds
- [ ] Status: ✅ SUCCESS / ❌ FAILED
- [ ] Notes: ___

---

## Progress Tracking Verification

### Progress Stages Expected
| Stage | Progress % | Action | Expected Duration |
|-------|-----------|--------|-------------------|
| Start | 10% | Initialize upload | Instant |
| Upload Original | 10% → 25% | Upload to stall-photos | 1-3s |
| Call API | 25% → 50% | POST to /process | 0.5s |
| Face Detection | 50% | OpenCV processing | 0.2-1.5s |
| Pixelation | 50% | Apply 15x15 blocks | 0.05-0.3s |
| Upload Processed | 50% → 75% | Upload to stall-photos-processed | 0.5-1s |
| Complete | 75% → 100% | Return URL | Instant |

### Observed Progress
- [ ] 10% - Initialize: ___ ms
- [ ] 25% - Upload original: ___ s
- [ ] 50% - Processing: ___ s
- [ ] 100% - Complete: ___ s
- [ ] **Total time:** ___ s

---

## Error Scenarios

### Test 1: Network Error (Simulate)
**Action:** Disable network mid-upload

**Expected:**
- ⚠️ Error message: "Upload failed: Network error"
- ⚠️ Progress stops
- ⚠️ Can retry

**Actual:**
- [ ] Error displayed: ✅ / ❌
- [ ] Message: ___
- [ ] Can retry: ✅ / ❌

---

### Test 2: API Timeout
**Action:** Check behavior if API takes >30 seconds

**Expected:**
- ⚠️ Timeout error after 30s
- ⚠️ Error message displayed
- ⚠️ Original photo remains in preview

**Actual:**
- [ ] Timeout occurred: ✅ / ❌
- [ ] Error message: ___
- [ ] Handled gracefully: ✅ / ❌

---

## Supabase Storage Verification

### Check stall-photos Bucket
**After upload, verify original image exists:**

```bash
# Via Supabase Dashboard
# Navigate to: Storage → stall-photos
# Look for: {userId}/{timestamp}.jpg
```

**Expected:**
- ✅ Original image exists
- ✅ File size matches uploaded image
- ✅ Timestamp matches upload time

**Actual:**
- [ ] File path: ___
- [ ] File size: ___ KB
- [ ] Exists: ✅ / ❌

---

### Check stall-photos-processed Bucket
**After processing, verify processed image exists:**

```bash
# Via Supabase Dashboard
# Navigate to: Storage → stall-photos-processed
# Look for: {userId}/{timestamp}-processed.jpg
```

**Expected:**
- ✅ Processed image exists
- ✅ File size similar to original
- ✅ Downloading shows pixelated faces

**Actual:**
- [ ] File path: ___
- [ ] File size: ___ KB
- [ ] Exists: ✅ / ❌
- [ ] Faces pixelated: ✅ / ❌

---

## CloudWatch Logs Verification

**Command:**
```bash
aws logs tail /ecs/loppestars --follow --region eu-central-1 | grep "process"
```

**Expected Logs:**
```
POST /process - Processing image...
Downloading image from stall-photos: {userId}/{timestamp}.jpg
Face detection complete: X faces detected
Applying pixelation with 15x15 blocks
Uploading processed image to stall-photos-processed
Processing complete: {userId}/{timestamp}-processed.jpg
POST /process - 200 OK
```

**Actual Logs:**
- [ ] POST /process received: ✅ / ❌
- [ ] Download successful: ✅ / ❌
- [ ] Faces detected: ___
- [ ] Pixelation applied: ✅ / ❌
- [ ] Upload successful: ✅ / ❌
- [ ] Response 200 OK: ✅ / ❌

---

## Performance Metrics

### Target Performance
- **Good:** 2-4 seconds total
- **Acceptable:** 4-8 seconds total
- **Slow:** >8 seconds (investigate)

### Measured Performance
- [ ] Test 1 (single face): ___ seconds
- [ ] Test 2 (multiple faces): ___ seconds
- [ ] Test 3 (no faces): ___ seconds
- [ ] Test 4 (large image): ___ seconds
- [ ] **Average:** ___ seconds

### Performance Rating
- [ ] ✅ Excellent (2-4s)
- [ ] ✅ Good (4-6s)
- [ ] ⚠️ Acceptable (6-8s)
- [ ] ❌ Poor (>8s)

---

## UI/UX Observations

### Photo Preview
- [ ] Original photo displays immediately: ✅ / ❌
- [ ] Preview is clear and full resolution: ✅ / ❌
- [ ] Updates to processed image smoothly: ✅ / ❌

### Progress Indicator
- [ ] Circular progress displays: ✅ / ❌
- [ ] Percentage updates smoothly: ✅ / ❌
- [ ] Status text changes appropriately: ✅ / ❌
- [ ] Modal dismisses after completion: ✅ / ❌

### Error Handling
- [ ] Error messages are clear: ✅ / ❌
- [ ] Can retry after error: ✅ / ❌
- [ ] App doesn't crash on error: ✅ / ❌

### Overall Experience
- [ ] Rating: ⭐⭐⭐⭐⭐ (1-5 stars)
- [ ] Notes: ___

---

## Issues Encountered

### Issue 1
**Description:** ___

**Severity:** 🔴 Critical / 🟡 Medium / 🟢 Low

**Steps to Reproduce:**
1. ___
2. ___
3. ___

**Expected:** ___

**Actual:** ___

**Error Message:** ___

**Screenshots/Logs:** ___

**Status:** ⏳ Open / ✅ Fixed

---

### Issue 2
**Description:** ___

(Repeat as needed)

---

## Test Summary

### Overall Status
- [ ] ✅ All tests passed
- [ ] ⚠️ Tests passed with minor issues
- [ ] ❌ Tests failed (critical issues)

### Pass/Fail Breakdown
- [ ] Scenario 1 (Single Face): ✅ / ❌
- [ ] Scenario 2 (Multiple Faces): ✅ / ❌
- [ ] Scenario 3 (No Faces): ✅ / ❌
- [ ] Scenario 4 (Large Image): ✅ / ❌
- [ ] Progress Tracking: ✅ / ❌
- [ ] Error Handling: ✅ / ❌
- [ ] Storage Verification: ✅ / ❌
- [ ] CloudWatch Logs: ✅ / ❌

### Performance Summary
- **Average Processing Time:** ___ seconds
- **Success Rate:** ___% (___ / ___ tests passed)
- **Faces Detected:** ___% accuracy

---

## Recommendations

### Immediate Actions
1. ___
2. ___
3. ___

### Future Improvements
1. ___
2. ___
3. ___

### Optimizations
1. ___
2. ___
3. ___

---

## Conclusion

**Ready for Production:** ✅ Yes / ❌ No / ⚠️ With Conditions

**Condition Details:** ___

**Sign-off:** _______________  **Date:** _______________

---

**Next Steps:**
1. [ ] Fix any critical issues discovered
2. [ ] Optimize performance if needed
3. [ ] Add additional test scenarios
4. [ ] Deploy to production
5. [ ] Monitor production metrics

---

**Testing Notes:**
- Use photos with clear, front-facing faces for best results
- Test in good lighting conditions
- Try various photo sizes and resolutions
- Test with both camera and gallery selection
- Monitor API logs in real-time during testing
- Check Supabase Storage dashboard after each test

**Happy Testing! 📸🔲✨**
