import { useState, useRef, useCallback } from 'react';
import { Upload, X, Image as ImageIcon, Loader2, AlertCircle, ZoomIn } from 'lucide-react';

/**
 * Question Image Upload Component
 * Handles image upload for quiz questions
 */
export default function QuestionImageUpload({
  value = null,
  onChange,
  maxSize = 5 * 1024 * 1024, // 5MB
  acceptedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  label = 'Question Image',
  placeholder = 'Drag and drop an image or click to upload'
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const [preview, setPreview] = useState(value);
  const [showLightbox, setShowLightbox] = useState(false);
  const fileInputRef = useRef(null);

  const validateFile = useCallback((file) => {
    if (!file) return 'No file selected';
    
    if (!acceptedTypes.includes(file.type)) {
      return `Invalid file type. Accepted: ${acceptedTypes.map(t => t.split('/')[1]).join(', ')}`;
    }
    
    if (file.size > maxSize) {
      return `File too large. Maximum size: ${Math.round(maxSize / 1024 / 1024)}MB`;
    }
    
    return null;
  }, [acceptedTypes, maxSize]);

  const processFile = useCallback(async (file) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setIsUploading(true);

    try {
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);

      // Create FormData for upload
      const formData = new FormData();
      formData.append('image', file);

      // Upload to server
      const token = localStorage.getItem('token');
      const response = await fetch('/api/uploads/question-image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      
      // Call onChange with the uploaded image URL
      onChange({
        url: data.url,
        filename: data.filename,
        originalName: file.name,
        size: file.size,
        type: file.type
      });

    } catch (err) {
      setError('Failed to upload image. Please try again.');
      setPreview(null);
      console.error('Upload error:', err);
    } finally {
      setIsUploading(false);
    }
  }, [validateFile, onChange]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      processFile(file);
    }
  }, [processFile]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileSelect = useCallback((e) => {
    const file = e.target.files[0];
    if (file) {
      processFile(file);
    }
  }, [processFile]);

  const handleRemove = useCallback(() => {
    if (preview && preview.startsWith('blob:')) {
      URL.revokeObjectURL(preview);
    }
    setPreview(null);
    setError(null);
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [preview, onChange]);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div className="question-image-upload">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <ImageIcon className="w-4 h-4 inline-block mr-1" />
          {label}
        </label>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes.join(',')}
        onChange={handleFileSelect}
        className="hidden"
      />

      {!preview ? (
        // Upload area
        <div
          onClick={handleClick}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`
            relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
            transition-colors duration-200
            ${isDragging 
              ? 'border-primary-500 bg-primary-50' 
              : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
            }
            ${isUploading ? 'pointer-events-none opacity-60' : ''}
          `}
        >
          {isUploading ? (
            <div className="flex flex-col items-center">
              <Loader2 className="w-10 h-10 text-primary-600 animate-spin mb-2" />
              <p className="text-sm text-gray-600">Uploading...</p>
            </div>
          ) : (
            <>
              <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 mb-1">{placeholder}</p>
              <p className="text-xs text-gray-400">
                {acceptedTypes.map(t => t.split('/')[1].toUpperCase()).join(', ')} 
                • Max {Math.round(maxSize / 1024 / 1024)}MB
              </p>
            </>
          )}
        </div>
      ) : (
        // Preview
        <div className="relative border border-gray-200 rounded-lg overflow-hidden">
          <img
            src={typeof preview === 'string' ? preview : preview.url}
            alt="Question image"
            className="w-full h-48 object-contain bg-gray-50"
          />
          
          <div className="absolute top-2 right-2 flex gap-2">
            <button
              type="button"
              onClick={() => setShowLightbox(true)}
              className="p-1.5 bg-white/90 hover:bg-white rounded-full shadow-sm"
              title="View full size"
            >
              <ZoomIn className="w-4 h-4 text-gray-600" />
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="p-1.5 bg-red-100/90 hover:bg-red-100 rounded-full shadow-sm"
              title="Remove image"
            >
              <X className="w-4 h-4 text-red-600" />
            </button>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="mt-2 flex items-center gap-2 text-sm text-red-600">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Lightbox */}
      {showLightbox && preview && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setShowLightbox(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={typeof preview === 'string' ? preview : preview.url}
              alt="Question image full size"
              className="max-w-full max-h-[90vh] object-contain"
            />
            <button
              onClick={() => setShowLightbox(false)}
              className="absolute -top-10 right-0 p-2 text-white hover:text-gray-300"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Display question image in quiz view
 */
export function QuestionImage({ image, className = '' }) {
  const [showLightbox, setShowLightbox] = useState(false);

  if (!image) return null;

  const imageUrl = typeof image === 'string' ? image : image.url;

  return (
    <>
      <div 
        className={`relative cursor-zoom-in ${className}`}
        onClick={() => setShowLightbox(true)}
      >
        <img
          src={imageUrl}
          alt="Question illustration"
          className="max-w-full h-auto rounded-lg border border-gray-200"
        />
        <div className="absolute bottom-2 right-2 p-1 bg-black/50 rounded text-white text-xs flex items-center gap-1">
          <ZoomIn className="w-3 h-3" />
          Click to enlarge
        </div>
      </div>

      {/* Lightbox */}
      {showLightbox && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setShowLightbox(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={imageUrl}
              alt="Question illustration full size"
              className="max-w-full max-h-[90vh] object-contain"
            />
            <button
              onClick={() => setShowLightbox(false)}
              className="absolute -top-10 right-0 p-2 text-white hover:text-gray-300"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
