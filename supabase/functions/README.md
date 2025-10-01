# Supabase Edge Functions

This directory contains Supabase Edge Functions for server-side processing.

## Functions

### process-image

Handles face detection and blurring for GDPR compliance.

**Endpoint:** `POST /functions/v1/process-image`

**Request Body:**
```json
{
  "image": "base64-encoded-image-data"
}
```

**Response:**
```json
{
  "success": true,
  "processedImageUrl": "data:image/jpeg;base64,...",
  "message": "Image processed successfully"
}
```

**Features:**
- Face detection using advanced ML algorithms
- Selective blurring of face regions only
- GDPR compliant privacy protection
- High-performance image processing

## Development

### Local Development
```bash
# Start Supabase locally
supabase start

# Serve functions locally
supabase functions serve
```

### Deploy Functions
```bash
# Deploy all functions
supabase functions deploy

# Deploy specific function
supabase functions deploy process-image
```

## Implementation Notes

The `process-image` function uses server-side image processing libraries to:
1. Decode base64 image data
2. Detect faces using computer vision
3. Apply gaussian blur only to face regions
4. Return processed image

This approach provides:
- Better performance than client-side processing
- More reliable face detection
- Reduced app bundle size
- Enhanced privacy compliance