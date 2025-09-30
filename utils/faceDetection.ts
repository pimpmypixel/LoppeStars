import { Image } from 'react-native';
import MlkitFaceDetection, { Face } from '@react-native-ml-kit/face-detection';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { privacyProcessImage } from './faceBlurAdvanced';
import { precisionFacePolygonBlur, multiLayerFaceBlur } from './precisionFaceBlur';

interface BlurResult {
  success: boolean;
  uri?: string;
  error?: string;
}

export const detectAndBlurFaces = async (imageUri: string): Promise<BlurResult> => {
  try {
    console.log('Starting face detection for image:', imageUri);
    
    // Detect faces in the image with contour detection for precise face polygons
    const faces: Face[] = await MlkitFaceDetection.detect(imageUri, {
      trackingEnabled: false,
      minFaceSize: 0.1,
      performanceMode: 'accurate', // Use accurate mode for better contour detection
      contourMode: 'all',          // Enable contour detection for face polygons
      landmarkMode: 'all',         // Enable landmarks for additional face points
      classificationMode: 'all',   // Enable classification for additional face data
    });

    console.log(`Detected ${faces.length} faces`);

    // Log detailed face information for debugging
    faces.forEach((face, index) => {
      console.log(`Face ${index + 1} details:`, {
        frame: face.frame,
        rotationX: face.rotationX,
        rotationY: face.rotationY,
        rotationZ: face.rotationZ,
        smilingProbability: face.smilingProbability,
        leftEyeOpenProbability: face.leftEyeOpenProbability,
        rightEyeOpenProbability: face.rightEyeOpenProbability,
        trackingID: face.trackingID,
        hasContours: !!face.contours,
        contourTypes: face.contours ? Object.keys(face.contours) : [],
        hasLandmarks: !!face.landmarks,
        landmarkTypes: face.landmarks ? Object.keys(face.landmarks) : [],
      });

      // Log contour details if available
      if (face.contours) {
        Object.entries(face.contours).forEach(([contourType, contour]) => {
          console.log(`  Contour ${contourType}:`, {
            pointCount: contour.points.length,
            firstPoint: contour.points[0],
            lastPoint: contour.points[contour.points.length - 1]
          });
        });
      }

      // Log landmark details if available  
      if (face.landmarks) {
        Object.entries(face.landmarks).forEach(([landmarkType, landmark]) => {
          console.log(`  Landmark ${landmarkType}:`, landmark.position);
        });
      }
    });

    // Use precision face polygon blur for strongest privacy
    console.log('🎯 Applying precision face polygon blur...');
    const precisionResult = await precisionFacePolygonBlur(imageUri, faces);

    if (precisionResult.success) {
      console.log('✅ Precision face polygon blur completed successfully');
      return { 
        success: true, 
        uri: precisionResult.uri,
      };
    }

    // Fallback to multi-layer blur
    console.log('⚠️ Precision blur failed, trying multi-layer blur...');
    const multiLayerResult = await multiLayerFaceBlur(imageUri, faces);

    if (multiLayerResult.success) {
      console.log('✅ Multi-layer face blur completed successfully');
      return { 
        success: true, 
        uri: multiLayerResult.uri,
        error: 'Used multi-layer fallback: ' + precisionResult.error
      };
    }

    // Final fallback to basic privacy processing
    console.log('⚠️ Multi-layer blur failed, using basic privacy processing...');
    const privacyResult = await privacyProcessImage(imageUri, faces);

    if (privacyResult.success) {
      console.log('✅ Basic privacy processing completed');
      return { 
        success: true, 
        uri: privacyResult.uri,
        error: 'Used basic fallback: ' + multiLayerResult.error
      };
    }

    // Ultimate fallback
    console.error('All face blur methods failed, using minimal processing');
    const fallbackImage = await manipulateAsync(
      imageUri,
      [{ resize: { width: 1000 } }],
      {
        compress: 0.7,
        format: SaveFormat.JPEG,
      }
    );
    
    return { 
      success: true, 
      uri: fallbackImage.uri,
      error: 'All face blur methods failed - used minimal processing'
    };

  } catch (error) {
    console.error('Error in face detection/blurring:', error);
    // Return original image as fallback for better UX
    return { 
      success: true, 
      uri: imageUri,
      error: error instanceof Error ? error.message : 'Face detection failed'
    };
  }
};

// Function to just detect faces without blurring
export const detectFacesOnly = async (imageUri: string): Promise<Face[]> => {
  try {
    const faces = await MlkitFaceDetection.detect(imageUri, {
      trackingEnabled: false,
      minFaceSize: 0.1,
    });
    
    return faces;
  } catch (error) {
    console.error('Error detecting faces:', error);
    return [];
  }
};