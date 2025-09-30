import React from 'react';
import { View, Alert } from 'react-native';
import { Button } from './ui/button';
import { Text } from './ui/text';
import { testFaceBlur } from '../utils/testFaceBlur';

/**
 * Simple component to test face blur functionality
 * Add this to any screen where you want to test face detection
 */
export const FaceBlurTester = () => {
  const handleTest = async () => {
    try {
      Alert.alert(
        'Face Blur Test',
        'This will take a photo and test the face detection and blurring functionality. Make sure to include faces in the photo for the best test results.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Start Test',
            onPress: async () => {
              console.log('🧪 Starting face blur test...');
              await testFaceBlur();
            },
          },
        ]
      );
    } catch (error) {
      console.error('Test error:', error);
      Alert.alert('Error', 'Failed to start face blur test');
    }
  };

  return (
    <View className="p-4 bg-blue-50 rounded-lg border border-blue-200" {...({} as any)}>
      <Text className="text-lg font-bold text-blue-800 mb-2">Face Blur Test</Text>
      <Text className="text-blue-600 mb-4 text-sm">
        Test the face detection and blurring functionality by taking a photo.
      </Text>
      <Button
        onPress={handleTest}
        className="bg-blue-600"
        {...({} as any)}
      >
        <Text className="text-white font-semibold">🧪 Test Face Blur</Text>
      </Button>
    </View>
  );
};

export default FaceBlurTester;