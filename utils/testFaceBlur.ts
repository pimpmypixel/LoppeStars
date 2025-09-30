import { Platform, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { detectAndBlurFaces, detectFacesOnly } from './faceDetection';

interface TestResult {
  success: boolean;
  originalUri?: string;
  processedUri?: string;
  facesDetected?: number;
  error?: string;
  processingTime?: number;
}

/**
 * Test utility for face detection and blurring
 * This will take a photo and test the face blur functionality
 */
export const testFaceBlur = async (): Promise<TestResult> => {
  try {
    console.log('🧪 Starting face blur test...');

    // Request camera permissions
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Camera permission is required for testing');
    }

    // Take a photo for testing
    console.log('📸 Taking test photo...');
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (result.canceled || !result.assets[0]) {
      throw new Error('Photo capture was canceled');
    }

    const originalUri = result.assets[0].uri;
    console.log('✅ Photo taken:', originalUri);

    // First, just detect faces without processing
    console.log('🔍 Detecting faces with polygon data...');
    const faces = await detectFacesOnly(originalUri);
    console.log(`👥 Detected ${faces.length} face(s) with polygon data`);

    // Log detailed face polygon details
    faces.forEach((face, index) => {
      console.log(`Face ${index + 1} polygon data:`, {
        frame: face.frame,
        smilingProbability: face.smilingProbability,
        leftEyeOpenProbability: face.leftEyeOpenProbability,
        rightEyeOpenProbability: face.rightEyeOpenProbability,
        trackingID: face.trackingID,
        hasContours: !!face.contours,
        contourTypes: face.contours ? Object.keys(face.contours) : [],
        contourPointCount: face.contours ? 
          Object.values(face.contours).reduce((total, contour) => total + contour.points.length, 0) : 0,
        hasLandmarks: !!face.landmarks,
        landmarkTypes: face.landmarks ? Object.keys(face.landmarks) : [],
      });

      // Log specific contour details for face polygon
      if (face.contours) {
        Object.entries(face.contours).forEach(([contourType, contour]) => {
          console.log(`  🔍 ${contourType} contour: ${contour.points.length} points`);
          if (contour.points.length > 0) {
            console.log(`    First point: (${contour.points[0].x}, ${contour.points[0].y})`);
            console.log(`    Last point: (${contour.points[contour.points.length - 1].x}, ${contour.points[contour.points.length - 1].y})`);
          }
        });
      }
    });

    // Now test the blur functionality
    console.log('🔄 Processing image with face blur...');
    const startTime = Date.now();
    
    const blurResult = await detectAndBlurFaces(originalUri);
    
    const processingTime = Date.now() - startTime;
    console.log(`⏱️  Processing completed in ${processingTime}ms`);

    if (!blurResult.success) {
      throw new Error(blurResult.error || 'Face blur processing failed');
    }

    // Save processed image to device for inspection
    let savedProcessedUri: string | undefined;
    if (blurResult.uri && Platform.OS !== 'web') {
      const fileName = `face_blur_test_${Date.now()}.jpg`;
      // Just use the processed URI directly
      savedProcessedUri = blurResult.uri;
      console.log('💾 Using processed image URI:', savedProcessedUri);
    }

    const testResult: TestResult = {
      success: true,
      originalUri,
      processedUri: savedProcessedUri || blurResult.uri,
      facesDetected: faces.length,
      processingTime,
    };

    console.log('✅ Face blur test completed successfully!');
    console.log('📊 Test Results:', testResult);

    // Calculate polygon statistics
    const polygonStats = faces.reduce((stats, face) => {
      if (face.contours) stats.contoursDetected += Object.keys(face.contours).length;
      if (face.landmarks) stats.landmarksDetected += Object.keys(face.landmarks).length;
      return stats;
    }, { contoursDetected: 0, landmarksDetected: 0 });

    // Show results to user
    Alert.alert(
      'Face Polygon Blur Test Results',
      `✅ Test completed successfully!\n\n` +
      `👥 Faces detected: ${faces.length}\n` +
      `🔍 Contours detected: ${polygonStats.contoursDetected}\n` +
      `📍 Landmarks detected: ${polygonStats.landmarksDetected}\n` +
      `⏱️ Processing time: ${processingTime}ms\n` +
      `📸 Original: ${originalUri.substring(originalUri.lastIndexOf('/') + 1)}\n` +
      `🎯 Processed: ${savedProcessedUri?.substring(savedProcessedUri.lastIndexOf('/') + 1) || 'temp file'}\n\n` +
      `${faces.length > 0 ? 'Strong polygon blur applied to face areas' : 'No faces detected - original returned'}`
    );

    return testResult;

  } catch (error) {
    console.error('❌ Face blur test failed:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    Alert.alert(
      'Face Blur Test Failed',
      `❌ Test failed with error:\n${errorMessage}`
    );

    return {
      success: false,
      error: errorMessage,
    };
  }
};

/**
 * Test face detection with a provided image URI
 */
export const testFaceBlurWithImage = async (imageUri: string): Promise<TestResult> => {
  try {
    console.log('🧪 Testing face blur with provided image:', imageUri);

    // First detect faces
    const faces = await detectFacesOnly(imageUri);
    console.log(`👥 Detected ${faces.length} face(s)`);

    // Process with blur
    const startTime = Date.now();
    const blurResult = await detectAndBlurFaces(imageUri);
    const processingTime = Date.now() - startTime;

    if (!blurResult.success) {
      throw new Error(blurResult.error || 'Face blur processing failed');
    }

    const testResult: TestResult = {
      success: true,
      originalUri: imageUri,
      processedUri: blurResult.uri,
      facesDetected: faces.length,
      processingTime,
    };

    console.log('✅ Face blur test with image completed!');
    return testResult;

  } catch (error) {
    console.error('❌ Face blur test with image failed:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return {
      success: false,
      error: errorMessage,
    };
  }
};

/**
 * Utility to get readable file info
 */
export const getImageInfo = async (uri: string) => {
  try {
    const info = await FileSystem.getInfoAsync(uri);
    return {
      exists: info.exists,
      uri: info.uri,
      isDirectory: info.isDirectory,
      // size and modificationTime are only available if exists is true
      ...(info.exists && !info.isDirectory && 'size' in info ? { 
        size: (info as any).size,
        modificationTime: (info as any).modificationTime 
      } : {})
    };
  } catch (error) {
    console.error('Error getting image info:', error);
    return null;
  }
};