# Face Processor Testing Guide

## Overview

The `test_face_processor.py` script provides comprehensive testing for the face detection and anonymization functionality. It verifies that all faces in images are properly detected and pixelated/blurred.

## Prerequisites

```bash
cd /Users/andreas/Herd/loppestars/api
pip install -r requirements.txt
```

Ensure the face detection models are downloaded:
```bash
mkdir -p /models
wget -O /models/deploy.prototxt https://raw.githubusercontent.com/opencv/opencv/master/samples/dnn/face_detector/deploy.prototxt
wget -O /models/res10_300x300_ssd_iter_140000.caffemodel https://raw.githubusercontent.com/opencv/opencv_3rdparty/dnn_samples_face_detector_20170830/res10_300x300_ssd_iter_140000.caffemodel
```

## Usage

### Basic Test

Test a single image:
```bash
python test_face_processor.py -i test_image.jpg
```

### Test Multiple Images

```bash
python test_face_processor.py -i image1.jpg image2.jpg image3.jpg
```

### Custom Output Directory

```bash
python test_face_processor.py -i test_image.jpg -o ./my_test_results
```

## What the Test Does

### 1. Face Detection Test
- Loads the image
- Detects all faces using OpenCV DNN
- Draws bounding boxes around detected faces
- Saves visualization with face locations
- Reports number and positions of detected faces

### 2. Face Pixelation Test
Tests multiple pixelation strengths (10, 15, 20, 25):
- Applies pixelation to detected faces
- Saves pixelated images
- Re-runs face detection on pixelated image
- Verifies faces are no longer detectable (or less detectable)
- **✅ PASS**: If faces become undetectable or significantly reduced
- **⚠️ WARNING**: If all faces still detectable after pixelation

### 3. Face Blur Test
Tests multiple blur strengths (21, 31, 41, 51):
- Applies Gaussian blur to detected faces
- Saves blurred images
- Re-runs face detection on blurred image
- Verifies blur effectiveness
- Reports detection reduction

## Output Files

The test creates a directory structure:
```
test_output/
  ├── image1/
  │   ├── detection_image1.jpg          # Original with face boxes
  │   ├── pixelated_10_image1.jpg       # Pixelation size 10
  │   ├── pixelated_15_image1.jpg       # Pixelation size 15
  │   ├── pixelated_20_image1.jpg       # Pixelation size 20
  │   ├── pixelated_25_image1.jpg       # Pixelation size 25
  │   ├── blurred_21_image1.jpg         # Blur strength 21
  │   ├── blurred_31_image1.jpg         # Blur strength 31
  │   ├── blurred_41_image1.jpg         # Blur strength 41
  │   └── blurred_51_image1.jpg         # Blur strength 51
  └── image2/
      └── ...
```

## Interpreting Results

### Success Indicators

```
✅ SUCCESS: Pixelation effective (reduced from 3 to 0 detectable faces)
```
This means all faces were successfully anonymized and are no longer detectable by the face detector.

### Warning Indicators

```
⚠️ WARNING: All faces still detectable - may need stronger pixelation
```
This means the anonymization wasn't strong enough. Recommendations:
- Increase pixelation size (higher values = more pixelation)
- Use stronger blur (higher kernel size)
- Check if faces are too small or at extreme angles

### Face Detection Results

```
Faces detected: 3
  Face 1: Position (120, 85) to (245, 210), Size: 125x125px
  Face 2: Position (350, 120) to (425, 195), Size: 75x75px
  Face 3: Position (500, 200) to (600, 300), Size: 100x100px
```

## Example Test Session

```bash
$ python test_face_processor.py -i family_photo.jpg

============================================================
FACE PROCESSOR COMPREHENSIVE TEST
============================================================

Output directory: ./test_output/family_photo

Initializing FaceProcessor (OpenCV mode)...

============================================================
Testing: family_photo.jpg
============================================================
Image dimensions: 1920x1080
Faces detected: 4
  Face 1: Position (234, 156) to (389, 311), Size: 155x155px
  Face 2: Position (678, 234) to (789, 345), Size: 111x111px
  Face 3: Position (1123, 189) to (1267, 333), Size: 144x144px
  Face 4: Position (1456, 278) to (1578, 400), Size: 122x122px
✅ Saved detection visualization: ./test_output/family_photo/detection_family_photo.jpg

Testing pixelation...

  Testing pixelation size: 15
    Faces in original: 4
    Faces still detectable: 0
    ✅ SUCCESS: Pixelation effective (reduced from 4 to 0 detectable faces)
    💾 Saved: ./test_output/family_photo/pixelated_15_family_photo.jpg

============================================================
TEST SUMMARY
============================================================
Face Detection:  ✅ PASS
Face Pixelation: ✅ PASS
Face Blur:       ✅ PASS

============================================================
🎉 ALL TESTS PASSED!
============================================================
```

## Troubleshooting

### No Faces Detected

**Problem**: Test reports 0 faces detected

**Solutions**:
- Verify image contains visible faces
- Check image quality (not too blurry, good lighting)
- Ensure faces are front-facing (profile faces harder to detect)
- Try images with faces at least 50x50 pixels

### Models Not Found

**Problem**: `Warning: Could not load face detection model`

**Solution**:
```bash
# Download models to /models directory
mkdir -p /models
wget -O /models/deploy.prototxt https://raw.githubusercontent.com/opencv/opencv/master/samples/dnn/face_detector/deploy.prototxt
wget -O /models/res10_300x300_ssd_iter_140000.caffemodel https://raw.githubusercontent.com/opencv/opencv_3rdparty/dnn_samples_face_detector_20170830/res10_300x300_ssd_iter_140000.caffemodel
```

### Pixelation Not Effective

**Problem**: Faces still detectable after pixelation

**Solutions**:
- Increase pixelation size in production: `pixelate_size=25` or higher
- Use blur mode instead: `mode="blur"` with `blur_strength=51`
- Check if faces are very small (harder to anonymize effectively)

## Production Recommendations

Based on test results:

### For Maximum Privacy
```python
processed, faces = processor.process_image(
    image_bytes=img,
    mode="pixelate",
    pixelate_size=25,  # Strong pixelation
    max_dimension=800
)
```

### For Balanced Results
```python
processed, faces = processor.process_image(
    image_bytes=img,
    mode="pixelate",
    pixelate_size=15,  # Moderate pixelation
    max_dimension=800
)
```

### For Softer Anonymization
```python
processed, faces = processor.process_image(
    image_bytes=img,
    mode="blur",
    blur_strength=31,  # Moderate blur
    max_dimension=800
)
```

## Automated Testing

Add to your CI/CD pipeline:

```bash
# Run tests on sample images
python test_face_processor.py -i tests/fixtures/face1.jpg tests/fixtures/face2.jpg

# Check exit code
if [ $? -eq 0 ]; then
    echo "✅ Face processor tests passed"
else
    echo "❌ Face processor tests failed"
    exit 1
fi
```

## Visual Verification

After running tests:

1. Open `detection_*.jpg` - Verify all faces have green boxes
2. Open `pixelated_*.jpg` - Verify faces are unrecognizable
3. Compare different pixelation/blur strengths
4. Choose appropriate strength for your use case

## Performance Notes

- Detection speed: ~100-300ms per image (depends on size and face count)
- Pixelation speed: ~50-150ms per image
- Larger `max_dimension` = slower but more accurate detection
- Smaller `max_dimension` = faster but may miss small/distant faces

Recommended: `max_dimension=800` for good balance
