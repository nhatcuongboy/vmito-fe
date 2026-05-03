'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { X, Image as ImageIcon, Video, MapPin } from 'lucide-react';
import { toaster } from '@/components/ui/toaster';
import { postsService } from '@/lib/api/posts.service';
import LocationAutocomplete from '@/components/common/LocationAutocomplete';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated?: () => void;
}

export function CreatePostModal({
  isOpen,
  onClose,
  onPostCreated,
}: CreatePostModalProps) {
  const t = useTranslations();
  const [content, setContent] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [location, setLocation] = useState<{
    name: string;
    lat: number;
    lng: number;
    address?: string;
  } | null>(null);
  const [images, setImages] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files).slice(0, 10);
      setImages((prev) => [...prev, ...files].slice(0, 10));
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      toaster.create({
        title: 'Error',
        description: 'Please enter some content',
        type: 'error',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const post = await postsService.createPost({
        content,
        videoUrl: videoUrl || undefined,
        location: location || undefined,
      });

      if (images.length > 0) {
        await postsService.uploadImages(post.id, images);
      }

      toaster.create({
        title: 'Success',
        description: 'Post created successfully',
        type: 'success',
      });

      setContent('');
      setVideoUrl('');
      setLocation(null);
      setImages([]);
      onPostCreated?.();
      onClose();
    } catch (error) {
      toaster.create({
        title: 'Error',
        description: 'Failed to create post',
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">Create Post</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind?"
            className="w-full p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={4}
          />

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium">
              <Video size={16} />
              Video URL (YouTube/Vimeo)
            </label>
            <input
              type="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium">
              <MapPin size={16} />
              Location
            </label>
            <LocationAutocomplete
              onSelect={(place) => {
                setLocation({
                  name: place.name,
                  lat: place.lat,
                  lng: place.lng,
                  address: place.address,
                });
              }}
              placeholder="Search for a location..."
            />
            {location && (
              <div className="text-sm text-gray-600 flex items-center justify-between">
                <span>{location.name}</span>
                <button
                  onClick={() => setLocation(null)}
                  className="text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium">
              <ImageIcon size={16} />
              Images (max 10)
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageSelect}
              className="w-full"
            />
            {images.length > 0 && (
              <div className="grid grid-cols-5 gap-2">
                {images.map((file, index) => (
                  <div key={index} className="relative">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Preview ${index}`}
                      className="w-full h-20 object-cover rounded"
                    />
                    <button
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 p-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-lg hover:bg-gray-100"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !content.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            {isSubmitting ? 'Posting...' : 'Post'}
          </button>
        </div>
      </div>
    </div>
  );
}
