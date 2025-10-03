// Mock react-native to avoid Flow imports in index.js
jest.mock('react-native', () => ({
	View: 'View',
	Text: 'Text',
	Image: 'Image',
	Platform: { OS: 'ios', select: () => null },
	StyleSheet: { create: () => ({}) },
	NativeModules: {},
}));
import 'react-native-reanimated/lib/reanimated2/jestUtils';
import '@testing-library/jest-native/extend-expect';