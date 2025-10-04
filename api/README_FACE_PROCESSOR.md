# Face Processor Module

## Overview

The `face_processor.py` module provides a unified interface for anonymizing faces in images. It supports two processing backends:

1. **pixelateme library** (Recommended) - Advanced face detection and pixelation with soft masking
2. **OpenCV DNN fallback** - Manual implementation using OpenCV's deep learning module

## Features

- 🎭 **Multiple Anonymization Modes**: Pixelate, blur, or color faces
- 🚀 **Automatic Fallback**: Uses pixelateme when available, falls back to OpenCV
- 🔄 **Singleton Pattern**: Reuses model instances for efficiency
- 🎨 **Soft Masking**: Smooth transitions between anonymized and original areas
- ⚙️ **Configurable**: Adjustable pixelation size, blur strength, and detection thresholds

## Installation

### Install Dependencies

```bash
pip install -r requirements.txt
```

This installs:
- `pixelateme` - Advanced face anonymization library
- `opencv-python-headless` - Computer vision library
- `numpy` - Numerical operations

### Download Face Detection Model

The OpenCV fallback requires pre-trained models:

```bash
# Download Caffe model files
wget -P /models/ https://github.com/opencv/opencv_3rdparty/raw/dnn_samples_face_detector_20170830/deploy.prototxt
wget -P /models/ https://github.com/opencv/opencv_3rdparty/raw/dnn_samples_face_detector_20170830/res10_300x300_ssd_iter_140000.caffemodel
```

## Usage

### Basic Usage

```python
from face_processor import get_face_processor

# Initialize processor (singleton)
processor = get_face_processor()

# Load image
with open("image.jpg", "rb") as f:
    image_bytes = f.read()

# Process image with pixelation
processed_bytes, faces_count = processor.process_image(
    image_bytes=image_bytes,
    mode="pixelate",
    pixelate_size=15
)

# Save result
with open("processed.jpg", "wb") as f:
    f.write(processed_bytes)

print(f"Processed {faces_count} faces")
```

### Advanced Usage with pixelateme

```python
from face_processor import FaceProcessor

# Create processor with custom settings
processor = FaceProcessor(
    model_proto_path="/models/deploy.prototxt",
    model_weights_path="/models/res10_300x300_ssd_iter_140000.caffemodel",
    confidence_threshold=0.5,
    use_pixelateme=True
)

# Process with pixelateme library
processed_bytes, faces_count = processor.process_image_with_pixelateme(
    image_bytes=image_bytes,
    mode="pixelate",
    pixelate_size=3,
    soft_mask=True,
    soft_mask_strength=7
)
```

### Manual Face Detection and Processing

```python
import cv2
import numpy as np
from face_processor import FaceProcessor

processor = FaceProcessor()

# Load image
image = cv2.imread("image.jpg")

# Detect faces
face_boxes = processor.detect_faces(image, max_dimension=800)
print(f"Found {len(face_boxes)} faces at: {face_boxes}")

# Pixelate faces
pixelated = processor.pixelate_faces(image, face_boxes, pixelate_size=15)
cv2.imwrite("pixelated.jpg", pixelated)

# Or blur faces
blurred = processor.blur_faces(image, face_boxes, blur_strength=31)
cv2.imwrite("blurred.jpg", blurred)
```

## API Reference

### `FaceProcessor` Class

#### Constructor

```python
FaceProcessor(
    model_proto_path: str = "/models/deploy.prototxt",
    model_weights_path: str = "/models/res10_300x300_ssd_iter_140000.caffemodel",
    confidence_threshold: float = 0.5,
    use_pixelateme: bool = True
)
```

**Parameters:**
- `model_proto_path`: Path to Caffe prototxt file for face detection
- `model_weights_path`: Path to Caffe model weights
- `confidence_threshold`: Minimum confidence for face detection (0.0-1.0)
- `use_pixelateme`: Whether to use pixelateme library if available

#### Methods

##### `process_image()`

Process an image to anonymize faces (main method).

```python
process_image(
    image_bytes: bytes,
    mode: str = "pixelate",
    pixelate_size: int = 15,
    blur_strength: int = 31,
    max_dimension: int = 800
) -> Tuple[bytes, int]
```

**Parameters:**
- `image_bytes`: Input image as bytes
- `mode`: Anonymization mode ("pixelate" or "blur")
- `pixelate_size`: Pixelation block size (higher = more pixelated)
- `blur_strength`: Blur kernel size (must be odd)
- `max_dimension`: Maximum dimension for detection downscaling

**Returns:**
- Tuple of `(processed_image_bytes, faces_detected)`

##### `detect_faces()`

Detect faces in an image using OpenCV DNN.

```python
detect_faces(
    image: np.ndarray,
    max_dimension: int = 800
) -> List[Tuple[int, int, int, int]]
```

**Returns:**
- List of face bounding boxes as `(x1, y1, x2, y2)` tuples

##### `pixelate_faces()`

Pixelate detected faces in an image.

```python
pixelate_faces(
    image: np.ndarray,
    face_boxes: List[Tuple[int, int, int, int]],
    pixelate_size: int = 15
) -> np.ndarray
```

##### `blur_faces()`

Blur detected faces in an image.

```python
blur_faces(
    image: np.ndarray,
    face_boxes: List[Tuple[int, int, int, int]],
    blur_strength: int = 31
) -> np.ndarray
```

### `get_face_processor()` Function

Get or create a singleton FaceProcessor instance.

```python
get_face_processor(
    model_proto_path: str = "/models/deploy.prototxt",
    model_weights_path: str = "/models/res10_300x300_ssd_iter_140000.caffemodel",
    use_pixelateme: bool = True
) -> FaceProcessor
```

## Configuration

### Environment Variables

None required, but you can customize paths:

```bash
export MODEL_PROTO_PATH="/custom/path/deploy.prototxt"
export MODEL_WEIGHTS_PATH="/custom/path/res10_300x300_ssd_iter_140000.caffemodel"
```

### Recommended Settings

#### For Best Quality (pixelateme)
```python
processor.process_image(
    image_bytes=img,
    mode="pixelate",
    pixelate_size=15,  # Moderate pixelation
    max_dimension=1200  # Higher resolution detection
)
```

#### For Fast Processing (OpenCV fallback)
```python
processor.process_image(
    image_bytes=img,
    mode="pixelate",
    pixelate_size=10,  # Lower pixelation
    max_dimension=640   # Faster detection
)
```

#### For Maximum Privacy
```python
processor.process_image(
    image_bytes=img,
    mode="pixelate",
    pixelate_size=25,  # Heavy pixelation
    max_dimension=800
)
```

## Performance

### Processing Times (approximate)

| Image Size | pixelateme | OpenCV Fallback |
|-----------|-----------|----------------|
| 640x480   | ~100ms    | ~80ms          |
| 1920x1080 | ~300ms    | ~200ms         |
| 3840x2160 | ~800ms    | ~500ms         |

**Note:** Times vary based on:
- Number of faces in image
- Detection resolution (max_dimension)
- Pixelation/blur strength
- GPU availability (pixelateme supports GPU acceleration)

## Troubleshooting

### pixelateme Not Available

If you see "Warning: pixelateme not available, using fallback", install it:

```bash
pip install pixelateme
```

For GPU support:
```bash
pip install pixelateme[gpu]
```

### Model Loading Errors

Ensure models are downloaded:

```bash
ls -la /models/deploy.prototxt
ls -la /models/res10_300x300_ssd_iter_140000.caffemodel
```

### Low Face Detection

Try adjusting:
- Increase `max_dimension` for better detection on larger images
- Decrease `confidence_threshold` to detect more faces (may increase false positives)

```python
processor = FaceProcessor(confidence_threshold=0.3)
```

## Integration with FastAPI

Example endpoint using the face processor:

```python
from fastapi import FastAPI, File, UploadFile
from face_processor import get_face_processor

app = FastAPI()
processor = get_face_processor()

@app.post("/anonymize")
async def anonymize_image(file: UploadFile):
    # Read uploaded image
    image_bytes = await file.read()
    
    # Process image
    processed, faces = processor.process_image(
        image_bytes=image_bytes,
        mode="pixelate"
    )
    
    return {
        "faces_detected": faces,
        "processed_size": len(processed)
    }
```

## Credits

- **pixelateme**: [github.com/mbpictures/pixelateme](https://github.com/mbpictures/pixelateme)
- **OpenCV**: [opencv.org](https://opencv.org/)
- **CenterFace**: Face detection model
- **Caffe**: Deep learning framework

## License

This module is part of the Loppestars project (MIT License).
