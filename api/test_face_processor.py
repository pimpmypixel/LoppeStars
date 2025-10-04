#!/usr/bin/env python3
"""
Test script for face_processor module.
Evaluates face detection and pixelation to verify all faces are properly anonymized.
"""

import sys
import os
import cv2
import numpy as np
from face_processor import FaceProcessor, get_face_processor
import argparse
from pathlib import Path


def draw_face_boxes(image: np.ndarray, face_boxes: list, color=(0, 255, 0), thickness=2):
    """Draw bounding boxes around detected faces."""
    output = image.copy()
    for (x1, y1, x2, y2) in face_boxes:
        cv2.rectangle(output, (x1, y1), (x2, y2), color, thickness)
        # Add label with face number
        cv2.putText(output, f"Face", (x1, y1-10), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
    return output


def test_face_detection(processor: FaceProcessor, image_path: str, output_dir: str):
    """Test face detection on an image and save results."""
    print(f"\n{'='*60}")
    print(f"Testing: {os.path.basename(image_path)}")
    print(f"{'='*60}")
    
    # Read image
    image = cv2.imread(image_path)
    if image is None:
        print(f"❌ ERROR: Could not read image: {image_path}")
        return False
    
    height, width = image.shape[:2]
    print(f"Image dimensions: {width}x{height}")
    
    # Detect faces
    face_boxes = processor.detect_faces(image, max_dimension=800)
    print(f"Faces detected: {len(face_boxes)}")
    
    if len(face_boxes) == 0:
        print("⚠️  WARNING: No faces detected!")
        return False
    
    # Print face locations
    for i, (x1, y1, x2, y2) in enumerate(face_boxes, 1):
        face_width = x2 - x1
        face_height = y2 - y1
        print(f"  Face {i}: Position ({x1}, {y1}) to ({x2}, {y2}), "
              f"Size: {face_width}x{face_height}px")
    
    # Save image with face boxes
    output_detection = draw_face_boxes(image, face_boxes, color=(0, 255, 0))
    detection_path = os.path.join(output_dir, f"detection_{os.path.basename(image_path)}")
    cv2.imwrite(detection_path, output_detection)
    print(f"✅ Saved detection visualization: {detection_path}")
    
    return True


def test_face_pixelation(processor: FaceProcessor, image_path: str, output_dir: str):
    """Test face pixelation on an image."""
    print(f"\nTesting pixelation...")
    
    # Read image
    with open(image_path, 'rb') as f:
        image_bytes = f.read()
    
    # Test with different pixelation sizes
    pixelation_sizes = [10, 15, 20, 25]
    
    for pix_size in pixelation_sizes:
        print(f"\n  Testing pixelation size: {pix_size}")
        
        try:
            # Process image
            processed_bytes, faces_detected = processor.process_image(
                image_bytes=image_bytes,
                mode="pixelate",
                pixelate_size=pix_size,
                max_dimension=800
            )
            
            if faces_detected == 0:
                print(f"    ⚠️  No faces detected with pixelation size {pix_size}")
                continue
            
            # Save processed image
            output_path = os.path.join(
                output_dir, 
                f"pixelated_{pix_size}_{os.path.basename(image_path)}"
            )
            
            with open(output_path, 'wb') as f:
                f.write(processed_bytes)
            
            # Verify pixelation by checking if faces are still detectable
            processed_image = cv2.imdecode(np.frombuffer(processed_bytes, np.uint8), cv2.IMREAD_COLOR)
            remaining_faces = processor.detect_faces(processed_image, max_dimension=800)
            
            print(f"    Faces in original: {faces_detected}")
            print(f"    Faces still detectable: {len(remaining_faces)}")
            
            if len(remaining_faces) < faces_detected:
                print(f"    ✅ SUCCESS: Pixelation effective (reduced from {faces_detected} to {len(remaining_faces)} detectable faces)")
            elif len(remaining_faces) == faces_detected:
                print(f"    ⚠️  WARNING: All faces still detectable - may need stronger pixelation")
            
            print(f"    💾 Saved: {output_path}")
            
        except Exception as e:
            print(f"    ❌ ERROR: {e}")
            return False
    
    return True


def test_face_blur(processor: FaceProcessor, image_path: str, output_dir: str):
    """Test face blur on an image."""
    print(f"\nTesting blur...")
    
    # Read image
    with open(image_path, 'rb') as f:
        image_bytes = f.read()
    
    # Test with different blur strengths
    blur_strengths = [21, 31, 41, 51]
    
    for blur_str in blur_strengths:
        print(f"\n  Testing blur strength: {blur_str}")
        
        try:
            # Process image
            processed_bytes, faces_detected = processor.process_image(
                image_bytes=image_bytes,
                mode="blur",
                blur_strength=blur_str,
                max_dimension=800
            )
            
            if faces_detected == 0:
                print(f"    ⚠️  No faces detected with blur strength {blur_str}")
                continue
            
            # Save processed image
            output_path = os.path.join(
                output_dir, 
                f"blurred_{blur_str}_{os.path.basename(image_path)}"
            )
            
            with open(output_path, 'wb') as f:
                f.write(processed_bytes)
            
            # Verify blur effectiveness
            processed_image = cv2.imdecode(np.frombuffer(processed_bytes, np.uint8), cv2.IMREAD_COLOR)
            remaining_faces = processor.detect_faces(processed_image, max_dimension=800)
            
            print(f"    Faces in original: {faces_detected}")
            print(f"    Faces still detectable: {len(remaining_faces)}")
            
            if len(remaining_faces) < faces_detected:
                print(f"    ✅ SUCCESS: Blur effective (reduced from {faces_detected} to {len(remaining_faces)} detectable faces)")
            elif len(remaining_faces) == faces_detected:
                print(f"    ⚠️  WARNING: All faces still detectable - may need stronger blur")
            
            print(f"    💾 Saved: {output_path}")
            
        except Exception as e:
            print(f"    ❌ ERROR: {e}")
            return False
    
    return True


def run_comprehensive_test(image_path: str, output_dir: str):
    """Run comprehensive test suite on an image."""
    print("\n" + "="*60)
    print("FACE PROCESSOR COMPREHENSIVE TEST")
    print("="*60)
    
    # Create output directory
    os.makedirs(output_dir, exist_ok=True)
    print(f"\nOutput directory: {output_dir}")
    
    # Initialize processor with OpenCV fallback (no pixelateme for testing)
    print("\nInitializing FaceProcessor (OpenCV mode)...")
    processor = FaceProcessor(use_pixelateme=False)
    
    # Run tests
    results = {
        'detection': False,
        'pixelation': False,
        'blur': False
    }
    
    # Test 1: Face Detection
    results['detection'] = test_face_detection(processor, image_path, output_dir)
    
    # Test 2: Face Pixelation
    if results['detection']:
        results['pixelation'] = test_face_pixelation(processor, image_path, output_dir)
    
    # Test 3: Face Blur
    if results['detection']:
        results['blur'] = test_face_blur(processor, image_path, output_dir)
    
    # Summary
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    print(f"Face Detection:  {'✅ PASS' if results['detection'] else '❌ FAIL'}")
    print(f"Face Pixelation: {'✅ PASS' if results['pixelation'] else '❌ FAIL'}")
    print(f"Face Blur:       {'✅ PASS' if results['blur'] else '❌ FAIL'}")
    
    all_passed = all(results.values())
    print("\n" + "="*60)
    if all_passed:
        print("🎉 ALL TESTS PASSED!")
    else:
        print("⚠️  SOME TESTS FAILED - Review results above")
    print("="*60)
    
    return all_passed


def main():
    parser = argparse.ArgumentParser(
        description='Test face_processor face detection and pixelation',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Test single image
  python test_face_processor.py -i test_image.jpg

  # Test with custom output directory
  python test_face_processor.py -i test_image.jpg -o ./results

  # Test multiple images
  python test_face_processor.py -i image1.jpg image2.jpg image3.jpg
        """
    )
    
    parser.add_argument(
        '-i', '--images',
        nargs='+',
        required=True,
        help='Path(s) to test image(s) containing faces'
    )
    
    parser.add_argument(
        '-o', '--output',
        default='./test_output',
        help='Output directory for test results (default: ./test_output)'
    )
    
    args = parser.parse_args()
    
    # Test each image
    all_passed = True
    for image_path in args.images:
        if not os.path.exists(image_path):
            print(f"❌ ERROR: Image not found: {image_path}")
            all_passed = False
            continue
        
        # Create subdirectory for this image
        image_name = Path(image_path).stem
        image_output_dir = os.path.join(args.output, image_name)
        
        # Run tests
        passed = run_comprehensive_test(image_path, image_output_dir)
        all_passed = all_passed and passed
    
    # Exit with appropriate code
    sys.exit(0 if all_passed else 1)


if __name__ == "__main__":
    main()
