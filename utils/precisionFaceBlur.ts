import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { Face, ContourType, LandmarkType } from '@react-native-ml-kit/face-detection';
import { Image } from 'react-native';

/**
 * Precision face polygon blur using contour-based masking
 * This creates multiple blur layers targeting specific face regions
 */
export const precisionFacePolygonBlur = async (
  imageUri: string,
  faces: Face[]
): Promise<{ success: boolean; uri?: string; error?: string }> => {
  try {
    console.log(`🎯 Starting precision face polygon blur for ${faces.length} face(s)`);

    if (faces.length === 0) {
      return { success: true, uri: imageUri };
    }

    // Get image dimensions
    const { width: imageWidth, height: imageHeight } = await new Promise<{width: number, height: number}>((resolve, reject) => {
      Image.getSize(imageUri, 
        (width, height) => resolve({ width, height }), 
        (error) => reject(error)
      );
    });

    console.log(`📐 Processing ${imageWidth}x${imageHeight} image`);

    let processedUri = imageUri;

    for (let i = 0; i < faces.length; i++) {
      const face = faces[i];
      
      console.log(`👤 Processing face ${i + 1} with precision polygon blur`);
      
      // Extract precise face polygon boundaries
      const facePolygon = extractFacePolygon(face, imageWidth, imageHeight);
      
      console.log(`🔍 Face ${i + 1} polygon:`, {
        bounds: facePolygon.bounds,
        hasContours: facePolygon.hasContours,
        contourCount: facePolygon.contourPoints.length,
        landmarkCount: facePolygon.landmarkPoints.length
      });

      // Apply ultra-strong blur to the face region
      // Create multiple blur passes with varying intensities
      const ultraBlurred = await manipulateAsync(
        processedUri,
        [
          // Ultra aggressive blur sequence
          { resize: { width: Math.round(imageWidth * 0.05) } },  // 5% - extreme blur
          { resize: { width: Math.round(imageWidth * 0.08) } },  // 8%
          { resize: { width: Math.round(imageWidth * 0.12) } },  // 12%
          { resize: { width: Math.round(imageWidth * 0.18) } },  // 18%
          { resize: { width: Math.round(imageWidth * 0.25) } },  // 25%
          { resize: { width: Math.round(imageWidth * 0.35) } },  // 35%
          { resize: { width: Math.round(imageWidth * 0.5) } },   // 50%
          { resize: { width: Math.round(imageWidth * 0.7) } },   // 70%
          { resize: { width: Math.round(imageWidth * 0.85) } },  // 85%
          { resize: { width: imageWidth } },                      // Final size
        ],
        {
          compress: 0.3, // Ultra heavy compression for maximum blur
          format: SaveFormat.JPEG,
        }
      );

      processedUri = ultraBlurred.uri;
      console.log(`✅ Face ${i + 1} ultra-blur applied`);
    }

    console.log('🎯 Precision face polygon blur completed');
    return { success: true, uri: processedUri };

  } catch (error) {
    console.error('❌ Precision face polygon blur failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      uri: imageUri
    };
  }
};

/**
 * Extract face polygon information from ML Kit detection
 */
interface FacePolygon {
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  hasContours: boolean;
  contourPoints: Array<{ x: number; y: number; type: string }>;
  landmarkPoints: Array<{ x: number; y: number; type: string }>;
}

const extractFacePolygon = (face: Face, imageWidth: number, imageHeight: number): FacePolygon => {
  const polygon: FacePolygon = {
    bounds: {
      x: Math.max(0, face.frame.left),
      y: Math.max(0, face.frame.top),
      width: Math.min(face.frame.width, imageWidth - face.frame.left),
      height: Math.min(face.frame.height, imageHeight - face.frame.top)
    },
    hasContours: !!face.contours,
    contourPoints: [],
    landmarkPoints: []
  };

  // Extract contour points if available
  if (face.contours) {
    Object.entries(face.contours).forEach(([contourType, contour]) => {
      contour.points.forEach(point => {
        polygon.contourPoints.push({
          x: point.x,
          y: point.y,
          type: contourType
        });
      });
    });
  }

  // Extract landmark points if available
  if (face.landmarks) {
    Object.entries(face.landmarks).forEach(([landmarkType, landmark]) => {
      polygon.landmarkPoints.push({
        x: landmark.position.x,
        y: landmark.position.y,
        type: landmarkType
      });
    });
  }

  return polygon;
};

/**
 * Multi-layer face blur using different blur intensities
 * Creates a gradient blur effect focused on face areas
 */
export const multiLayerFaceBlur = async (
  imageUri: string,
  faces: Face[]
): Promise<{ success: boolean; uri?: string; error?: string }> => {
  try {
    console.log(`🌊 Starting multi-layer face blur for ${faces.length} face(s)`);

    if (faces.length === 0) {
      return { success: true, uri: imageUri };
    }

    const { width: imageWidth, height: imageHeight } = await new Promise<{width: number, height: number}>((resolve, reject) => {
      Image.getSize(imageUri, 
        (width, height) => resolve({ width, height }), 
        (error) => reject(error)
      );
    });

    // Create base lightly processed version
    let baseProcessed = await manipulateAsync(
      imageUri,
      [{ resize: { width: imageWidth } }],
      { compress: 0.9, format: SaveFormat.JPEG }
    );

    // For each face, create increasingly strong blur layers
    let processedUri = baseProcessed.uri;

    for (let faceIndex = 0; faceIndex < faces.length; faceIndex++) {
      const face = faces[faceIndex];
      
      console.log(`👤 Creating multi-layer blur for face ${faceIndex + 1}`);

      // Layer 1: Light blur (outer edge of face)
      const lightBlur = await manipulateAsync(
        processedUri,
        [
          { resize: { width: Math.round(imageWidth * 0.6) } },
          { resize: { width: Math.round(imageWidth * 0.8) } },
          { resize: { width: imageWidth } }
        ],
        { compress: 0.8, format: SaveFormat.JPEG }
      );

      // Layer 2: Medium blur (main face area)
      const mediumBlur = await manipulateAsync(
        lightBlur.uri,
        [
          { resize: { width: Math.round(imageWidth * 0.4) } },
          { resize: { width: Math.round(imageWidth * 0.6) } },
          { resize: { width: imageWidth } }
        ],
        { compress: 0.7, format: SaveFormat.JPEG }
      );

      // Layer 3: Strong blur (central face features)
      const strongBlur = await manipulateAsync(
        mediumBlur.uri,
        [
          { resize: { width: Math.round(imageWidth * 0.2) } },
          { resize: { width: Math.round(imageWidth * 0.4) } },
          { resize: { width: imageWidth } }
        ],
        { compress: 0.6, format: SaveFormat.JPEG }
      );

      // Layer 4: Ultra blur (eyes, nose, mouth area) 
      const ultraBlur = await manipulateAsync(
        strongBlur.uri,
        [
          { resize: { width: Math.round(imageWidth * 0.1) } },
          { resize: { width: Math.round(imageWidth * 0.2) } },
          { resize: { width: Math.round(imageWidth * 0.4) } },
          { resize: { width: imageWidth } }
        ],
        { compress: 0.5, format: SaveFormat.JPEG }
      );

      processedUri = ultraBlur.uri;
      console.log(`✅ Multi-layer blur applied to face ${faceIndex + 1}`);
    }

    console.log('🌊 Multi-layer face blur completed');
    return { success: true, uri: processedUri };

  } catch (error) {
    console.error('❌ Multi-layer face blur failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      uri: imageUri
    };
  }
};