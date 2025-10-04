"""
Face processing module for anonymizing faces in images.
Uses pixelateme library for face detection and pixelation.
"""

import cv2
import numpy as np
from typing import Tuple, Optional
import tempfile
import os

# Try to import pixelateme, fall back to manual implementation if not available
try:
    from pixelateme.main import run as pixelateme_run
    PIXELATEME_AVAILABLE = True
except ImportError:
    PIXELATEME_AVAILABLE = False
    print("Warning: pixelateme not available, using fallback OpenCV implementation")


class FaceProcessor:
    """
    Handles face detection and anonymization in images.
    Supports both pixelateme library and fallback OpenCV implementation.
    """
    
    def __init__(
        self,
        model_proto_path: str = "/models/deploy.prototxt",
        model_weights_path: str = "/models/res10_300x300_ssd_iter_140000.caffemodel",
        confidence_threshold: float = 0.5,
        use_pixelateme: bool = True
    ):
        """
        Initialize the face processor.
        
        Args:
            model_proto_path: Path to Caffe prototxt file for face detection
            model_weights_path: Path to Caffe model weights
            confidence_threshold: Minimum confidence for face detection (0.0-1.0)
            use_pixelateme: Whether to use pixelateme library (if available)
        """
        self.confidence_threshold = confidence_threshold
        self.use_pixelateme = use_pixelateme and PIXELATEME_AVAILABLE
        
        # Initialize OpenCV DNN face detector (fallback or for manual detection)
        if not self.use_pixelateme or model_proto_path and model_weights_path:
            try:
                self.net = cv2.dnn.readNetFromCaffe(model_proto_path, model_weights_path)
            except Exception as e:
                print(f"Warning: Could not load face detection model: {e}")
                self.net = None
    
    def detect_faces(
        self,
        image: np.ndarray,
        max_dimension: int = 800
    ) -> list[Tuple[int, int, int, int]]:
        """
        Detect faces in an image using OpenCV DNN.
        
        Args:
            image: Input image as numpy array (BGR format)
            max_dimension: Maximum dimension for downscaling during detection
            
        Returns:
            List of face bounding boxes as (x1, y1, x2, y2) tuples
        """
        if self.net is None:
            return []
        
        height, width = image.shape[:2]
        
        # Downscale for faster detection if needed
        scale = min(1.0, max_dimension / float(max(height, width)))
        if scale < 1.0:
            small_img = cv2.resize(image, (int(width * scale), int(height * scale)))
        else:
            small_img = image.copy()
        
        # Prepare blob for DNN
        blob = cv2.dnn.blobFromImage(
            cv2.resize(small_img, (300, 300)),
            1.0,
            (300, 300),
            (104.0, 177.0, 123.0)
        )
        
        # Detect faces
        self.net.setInput(blob)
        detections = self.net.forward()
        
        # Parse detections
        face_boxes = []
        small_height, small_width = small_img.shape[:2]
        
        for i in range(detections.shape[2]):
            confidence = detections[0, 0, i, 2]
            
            if confidence > self.confidence_threshold:
                # Get bounding box coordinates
                box = detections[0, 0, i, 3:7] * np.array([
                    small_width, small_height, small_width, small_height
                ])
                (x1, y1, x2, y2) = box.astype("int")
                
                # Scale back to original size if needed
                if scale < 1.0:
                    x1 = int(x1 / scale)
                    y1 = int(y1 / scale)
                    x2 = int(x2 / scale)
                    y2 = int(y2 / scale)
                
                face_boxes.append((x1, y1, x2, y2))
        
        return face_boxes
    
    def pixelate_faces(
        self,
        image: np.ndarray,
        face_boxes: list[Tuple[int, int, int, int]],
        pixelate_size: int = 15
    ) -> np.ndarray:
        """
        Pixelate faces in an image using manual implementation.
        
        Args:
            image: Input image as numpy array
            face_boxes: List of face bounding boxes
            pixelate_size: Size of pixelation blocks (higher = more pixelated)
            
        Returns:
            Image with pixelated faces
        """
        output = image.copy()
        
        for (x1, y1, x2, y2) in face_boxes:
            # Ensure coordinates are within image bounds
            x1 = max(0, x1)
            y1 = max(0, y1)
            x2 = min(image.shape[1], x2)
            y2 = min(image.shape[0], y2)
            
            # Extract face region
            face_roi = output[y1:y2, x1:x2]
            
            if face_roi.size == 0:
                continue
            
            # Calculate new dimensions for pixelation
            roi_height, roi_width = face_roi.shape[:2]
            temp_height = max(1, roi_height // pixelate_size)
            temp_width = max(1, roi_width // pixelate_size)
            
            # Pixelate by downscaling and upscaling
            temp = cv2.resize(face_roi, (temp_width, temp_height), interpolation=cv2.INTER_LINEAR)
            pixelated = cv2.resize(temp, (roi_width, roi_height), interpolation=cv2.INTER_NEAREST)
            
            # Replace face region with pixelated version
            output[y1:y2, x1:x2] = pixelated
        
        return output
    
    def blur_faces(
        self,
        image: np.ndarray,
        face_boxes: list[Tuple[int, int, int, int]],
        blur_strength: int = 31
    ) -> np.ndarray:
        """
        Blur faces in an image using Gaussian blur.
        
        Args:
            image: Input image as numpy array
            face_boxes: List of face bounding boxes
            blur_strength: Kernel size for Gaussian blur (must be odd)
            
        Returns:
            Image with blurred faces
        """
        output = image.copy()
        
        # Ensure blur strength is odd
        if blur_strength % 2 == 0:
            blur_strength += 1
        
        for (x1, y1, x2, y2) in face_boxes:
            # Ensure coordinates are within image bounds
            x1 = max(0, x1)
            y1 = max(0, y1)
            x2 = min(image.shape[1], x2)
            y2 = min(image.shape[0], y2)
            
            # Extract and blur face region
            face_roi = output[y1:y2, x1:x2]
            
            if face_roi.size == 0:
                continue
            
            blurred = cv2.GaussianBlur(face_roi, (blur_strength, blur_strength), 0)
            output[y1:y2, x1:x2] = blurred
        
        return output
    
    def process_image_with_pixelateme(
        self,
        image_bytes: bytes,
        mode: str = "pixelate",
        pixelate_size: int = 3,
        blur_strength: int = 3,
        threshold: float = 0.5,
        soft_mask: bool = True,
        soft_mask_strength: int = 7
    ) -> Tuple[bytes, int]:
        """
        Process image using pixelateme library.
        
        Args:
            image_bytes: Input image as bytes
            mode: Anonymization mode ("pixelate", "blur", or "color")
            pixelate_size: Pixelation block size
            blur_strength: Blur kernel strength
            threshold: Face detection confidence threshold
            soft_mask: Enable soft mask transition
            soft_mask_strength: Feather strength for mask edge
            
        Returns:
            Tuple of (processed_image_bytes, faces_detected)
        """
        if not PIXELATEME_AVAILABLE:
            raise RuntimeError("pixelateme library not available")
        
        # Create temporary files for input and output
        with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as input_file:
            input_path = input_file.name
            input_file.write(image_bytes)
        
        output_dir = tempfile.mkdtemp()
        
        try:
            # Run pixelateme
            pixelateme_run(
                path=[input_path],
                output=output_dir,
                mode=mode,
                threshold=threshold,
                pixelate_size=pixelate_size,
                blur_strength=blur_strength,
                soft_mask=soft_mask,
                soft_mask_strength=soft_mask_strength,
                preview=False
            )
            
            # Read processed image
            input_filename = os.path.basename(input_path)
            output_path = os.path.join(output_dir, input_filename)
            
            if not os.path.exists(output_path):
                # If no output file, no faces were detected
                return image_bytes, 0
            
            with open(output_path, "rb") as f:
                processed_bytes = f.read()
            
            # Try to count faces by detecting them in the original image
            arr = np.frombuffer(image_bytes, np.uint8)
            img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
            faces = self.detect_faces(img) if img is not None else []
            
            return processed_bytes, len(faces)
            
        finally:
            # Cleanup temporary files
            try:
                os.unlink(input_path)
                if os.path.exists(output_path):
                    os.unlink(output_path)
                os.rmdir(output_dir)
            except Exception as e:
                print(f"Warning: Could not cleanup temporary files: {e}")
    
    def process_image(
        self,
        image_bytes: bytes,
        mode: str = "pixelate",
        pixelate_size: int = 15,
        blur_strength: int = 31,
        max_dimension: int = 800
    ) -> Tuple[bytes, int]:
        """
        Process image to anonymize faces.
        Uses pixelateme library if available and enabled, otherwise falls back to OpenCV.
        
        Args:
            image_bytes: Input image as bytes
            mode: Anonymization mode ("pixelate" or "blur")
            pixelate_size: Pixelation block size (manual mode)
            blur_strength: Blur kernel size (manual mode)
            max_dimension: Maximum dimension for detection downscaling
            
        Returns:
            Tuple of (processed_image_bytes, faces_detected)
        """
        # Try pixelateme first if enabled
        if self.use_pixelateme:
            try:
                return self.process_image_with_pixelateme(
                    image_bytes,
                    mode=mode,
                    pixelate_size=max(1, pixelate_size // 5),  # Adjust for pixelateme scale
                    blur_strength=max(1, blur_strength // 10),  # Adjust for pixelateme scale
                    soft_mask=True
                )
            except Exception as e:
                print(f"Warning: pixelateme failed, falling back to OpenCV: {e}")
        
        # Fallback to manual OpenCV implementation
        arr = np.frombuffer(image_bytes, np.uint8)
        image = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        
        if image is None:
            raise ValueError("Invalid image data")
        
        # Detect faces
        face_boxes = self.detect_faces(image, max_dimension)
        
        # Process faces
        if face_boxes:
            if mode == "blur":
                processed = self.blur_faces(image, face_boxes, blur_strength)
            else:  # pixelate
                processed = self.pixelate_faces(image, face_boxes, pixelate_size)
        else:
            processed = image
        
        # Encode back to JPEG
        success, encoded = cv2.imencode(
            ".jpg",
            processed,
            [int(cv2.IMWRITE_JPEG_QUALITY), 95]
        )
        
        if not success:
            raise RuntimeError("Failed to encode processed image")
        
        return encoded.tobytes(), len(face_boxes)


# Singleton instance for reuse
_processor_instance: Optional[FaceProcessor] = None


def get_face_processor(
    model_proto_path: str = "/models/deploy.prototxt",
    model_weights_path: str = "/models/res10_300x300_ssd_iter_140000.caffemodel",
    use_pixelateme: bool = True
) -> FaceProcessor:
    """
    Get or create a singleton FaceProcessor instance.
    
    Args:
        model_proto_path: Path to face detection model prototxt
        model_weights_path: Path to face detection model weights
        use_pixelateme: Whether to use pixelateme library
        
    Returns:
        FaceProcessor instance
    """
    global _processor_instance
    
    if _processor_instance is None:
        _processor_instance = FaceProcessor(
            model_proto_path=model_proto_path,
            model_weights_path=model_weights_path,
            use_pixelateme=use_pixelateme
        )
    
    return _processor_instance
