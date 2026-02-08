import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize from 'rehype-sanitize'
import 'katex/dist/katex.min.css'

export default function MaterialViewer({ material, showPreview = false }) {
  if (!material) return null

  const { type, fileUrl, content, previewContent, contentFormat = 'markdown', title, difficulty, category } = material

  const renderContent = () => {
    // Show preview content if requested and available
    const contentToShow = showPreview && previewContent ? previewContent : content

    if (contentToShow) {
      return (
        <div className="prose prose-sm sm:prose max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkMath]}
            rehypePlugins={[rehypeKatex, rehypeRaw, rehypeSanitize]}
            components={{
              // Add any overrides for rendered elements if needed
            }}
          >
            {contentToShow}
          </ReactMarkdown>
          {showPreview && content && (
            <div className="mt-4 p-3 sm:p-4 bg-gray-50 rounded-lg border-l-4 border-primary-500">
              <p className="text-xs sm:text-sm text-gray-600">
                <strong>Full content available after enrollment.</strong> This preview shows only a portion of the material.
              </p>
            </div>
          )}
        </div>
      )
    }

    if (fileUrl) {
      if (type === 'video') {
        return (
          <video controls className="w-full rounded-md shadow-sm max-h-[400px] sm:max-h-[600px]">
            <source src={fileUrl} />
            Your browser does not support the video tag.
          </video>
        )
      }

      if (type === 'pdf' || (material.mimeType && material.mimeType.includes('pdf'))) {
        return (
          <iframe title={title || 'Material'} src={fileUrl} className="w-full h-[400px] sm:h-[500px] lg:min-h-[600px] rounded-md" />
        )
      }

      if (type === 'image' || (material.mimeType && material.mimeType.startsWith('image/'))) {
        return (
          <img src={fileUrl} alt={title} className="w-full rounded-md object-contain max-h-[400px] sm:max-h-[600px]" />
        )
      }

      // Fallback - show download link or embed if possible
      return (
        <div className="flex flex-col gap-3">
          <a href={fileUrl} target="_blank" rel="noreferrer" className="text-primary-600 hover:text-primary-700 text-sm sm:text-base">
            Open file in new tab
          </a>
          <a href={fileUrl} download className="inline-block bg-primary-600 text-white px-3 sm:px-4 py-2 rounded-md text-sm sm:text-base text-center">
            Download
          </a>
        </div>
      )
    }

    return <p>No content available for this material</p>
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {material.title && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <h3 className="text-base sm:text-lg font-semibold">{material.title}</h3>
          <div className="flex gap-2">
            {difficulty && (
              <span className={`px-2 py-1 text-xs rounded-full ${
                difficulty === 'basic' ? 'bg-green-100 text-green-800' :
                difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
              </span>
            )}
            {category && (
              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                {category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </span>
            )}
          </div>
        </div>
      )}
      {material.description && <p className="text-xs sm:text-sm text-gray-600">{material.description}</p>}
      <div className="overflow-x-auto">{renderContent()}</div>
    </div>
  )
}
