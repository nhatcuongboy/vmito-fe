# Session Cover Photo Feature - Frontend Implementation

## Overview

This document describes the frontend implementation of the session cover photo feature, which allows hosts to upload and manage cover photos for their badminton sessions.

## Implementation Summary

### 1. Type Definitions

**File**: `src/lib/api/types.ts`

Added to `ISession` interface:

```typescript
coverPhoto?: string;
coverPhotoPublicId?: string;
```

### 2. API Service Methods

**File**: `src/lib/api/session.service.ts`

Added two new methods:

- `uploadCoverPhoto(sessionId: string, file: File): Promise<ISession>`
- `deleteCoverPhoto(sessionId: string): Promise<ISession>`

### 3. CoverPhotoUpload Component

**File**: `src/components/session/CoverPhotoUpload.tsx`

A reusable component for uploading and managing cover photos with:

- Image preview
- Drag-and-drop support (via file input)
- File validation (type and size)
- Upload progress indicator
- Remove photo functionality
- Responsive design

**Props**:

```typescript
interface CoverPhotoUploadProps {
  currentPhotoUrl?: string;
  onPhotoSelect: (file: File) => void;
  onPhotoRemove: () => void;
  isUploading?: boolean;
  disabled?: boolean;
}
```

### 4. SessionForm Integration

**File**: `src/components/session/SessionForm.tsx`

**Changes**:

- Imported `CoverPhotoUpload` component
- Added state management for cover photo:
  ```typescript
  const [coverPhotoFile, setCoverPhotoFile] = useState<File | null>(null);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [coverPhotoUrl, setCoverPhotoUrl] = useState<string | undefined>(
    initialData?.coverPhoto
  );
  ```
- Integrated upload component in edit mode only (after description field)
- Handles upload and delete operations with toast notifications

**Note**: Cover photo upload is only available in **edit mode**, not during session creation. This is because:

1. The session must exist first to have an ID for the upload endpoint
2. Hosts can add cover photo after creating the session

### 5. Display in Session Cards

**File**: `src/components/session/BaseSessionCard.tsx`

Updated the cover image section to use session's cover photo if available:

```typescript
<Image
  src={session.coverPhoto || "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&h=400&fit=crop"}
  alt={session.name}
  w="100%"
  h="100%"
  objectFit="cover"
/>
```

Falls back to default badminton court image if no cover photo is set.

### 6. Display in Session Detail Pages

**File**: `src/components/session/SessionOverviewTab.tsx`

Added cover photo display at the top of the overview tab:

```typescript
{session.coverPhoto && (
  <Box mb={8} borderRadius="xl" overflow="hidden" boxShadow="md">
    <Image
      src={session.coverPhoto}
      alt={session.name}
      w="100%"
      h={{ base: '200px', md: '300px' }}
      objectFit="cover"
    />
  </Box>
)}
```

## User Flow

### For Session Hosts

#### Uploading a Cover Photo

1. Create a new session (cover photo not available yet)
2. Navigate to the session's Settings tab
3. Scroll to the "Cover Photo" section
4. Click the upload area or "Change" button
5. Select an image file (max 5MB, jpg/png/gif/webp)
6. Image is automatically uploaded to Cloudinary
7. Success toast notification appears
8. Cover photo is immediately visible in the form

#### Removing a Cover Photo

1. Go to session Settings tab
2. Click the "X" button on the cover photo
3. Confirm removal
4. Photo is deleted from Cloudinary
5. Success toast notification appears

#### Viewing Cover Photos

- **Session Cards**: Cover photo appears as the card header image
- **Session Detail**: Cover photo appears at the top of the Overview tab
- **Fallback**: Default badminton court image if no cover photo

## Technical Details

### Image Specifications

- **Recommended size**: 1200x630px
- **Max file size**: 5MB
- **Supported formats**: jpg, jpeg, png, gif, webp
- **Optimization**: Handled by Cloudinary (auto quality, auto format)

### API Endpoints Used

- `POST /sessions/:id/cover-photo` - Upload cover photo
- `DELETE /sessions/:id/cover-photo` - Remove cover photo

### State Management

- Local component state for upload progress
- Immediate UI update after successful upload/delete
- Toast notifications for user feedback

### Error Handling

- File type validation (client-side)
- File size validation (client-side)
- Upload failure toast notifications
- Delete failure toast notifications

## Components Affected

1. ✅ `src/lib/api/types.ts` - Type definitions
2. ✅ `src/lib/api/session.service.ts` - API methods
3. ✅ `src/components/session/CoverPhotoUpload.tsx` - Upload component (NEW)
4. ✅ `src/components/session/SessionForm.tsx` - Form integration
5. ✅ `src/components/session/BaseSessionCard.tsx` - Card display
6. ✅ `src/components/session/SessionOverviewTab.tsx` - Detail page display

## Future Enhancements

Potential improvements:

1. Add cover photo upload during session creation (would require two-step process)
2. Image cropping tool before upload
3. Multiple image gallery support
4. Cover photo templates/presets
5. Drag-and-drop file upload
6. Progress bar for upload
7. Image filters/effects

## Testing Checklist

- [ ] Upload cover photo in edit mode
- [ ] Remove cover photo
- [ ] View cover photo in session card
- [ ] View cover photo in session detail page
- [ ] Verify fallback image when no cover photo
- [ ] Test file size validation (>5MB)
- [ ] Test file type validation (non-image)
- [ ] Test on mobile devices
- [ ] Test with slow network connection
- [ ] Verify Cloudinary cleanup on delete

## Notes

- Cover photo upload is **only available in edit mode**, not during session creation
- Images are stored in Cloudinary under `badminton/session-covers/` folder
- Old cover photos are automatically deleted when uploading a new one
- Cover photos are displayed with `objectFit="cover"` to maintain aspect ratio
