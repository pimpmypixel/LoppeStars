# Lottie File Format Fix

## Issue
The ConnectivitySplash component was trying to load a `.lottie` file (dotLottie format), but `lottie-react-native` only supports JSON format.

## Error
```
Unable to resolve "../assets/lottiefiles/thumbsup.lottie" from "screens/ConnectivitySplash.tsx"
```

## Root Cause
- `.lottie` files are compressed ZIP archives (dotLottie format)
- `lottie-react-native` expects standard Lottie JSON files
- The `require()` statement couldn't resolve the `.lottie` extension

## Solution

### 1. Extract the JSON from dotLottie Archive
```bash
cd app/assets/lottiefiles
unzip -o thumbsup.lottie -d thumbsup_extracted
```

This extracts:
- `manifest.json` - Metadata about the animation
- `animations/*.json` - The actual Lottie animation data

### 2. Copy JSON Animation File
```bash
cp thumbsup_extracted/animations/*.json thumbsup.json
```

### 3. Update Component Import
Changed from:
```tsx
source={require('../assets/lottiefiles/thumbsup.lottie')}
```

To:
```tsx
source={require('../assets/lottiefiles/thumbsup.json')}
```

### 4. Clean Up
```bash
rm -rf thumbsup_extracted
```

## Files Modified
- `app/screens/ConnectivitySplash.tsx` - Updated Lottie source path
- `app/assets/lottiefiles/thumbsup.json` - Extracted JSON animation (new file)

## Result
✅ **Bundle successful** - "Android Bundled 4329ms index.ts (2628 modules)"

The Lottie animation now loads correctly using the standard JSON format.

## Technical Notes

### dotLottie vs. Standard Lottie
- **dotLottie (.lottie)**: Compressed format, supports multiple animations, smaller file size
- **Standard Lottie (.json)**: Uncompressed JSON, single animation, larger file size
- **lottie-react-native**: Only supports standard JSON format

### File Sizes
- `thumbsup.lottie`: 1.2 KB (compressed)
- `thumbsup.json`: 2.8 KB (uncompressed)
- Trade-off: ~1.6 KB increase for compatibility

### Alternative Solutions
If you need dotLottie support in the future:
1. Use `@lottiefiles/dotlottie-react` for web (doesn't work with React Native)
2. Use `@dotlottie/react-player` (web only)
3. Extract JSON at build time with a custom script
4. Stick with standard JSON format for React Native projects

## Future Recommendations
- Keep both `.lottie` and `.json` files in version control
- Document which format is used where (web vs. native)
- Consider build script to auto-extract if using many animations
- For React Native, prefer standard Lottie JSON format

## Testing
- [x] Bundle builds successfully
- [x] No resolution errors
- [x] Animation file size acceptable (2.8 KB)
- [ ] Animation plays correctly on success state
- [ ] Animation timing is correct (non-looping)
- [ ] Animation displays at correct size (120x120)
