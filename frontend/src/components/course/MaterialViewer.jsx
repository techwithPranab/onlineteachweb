import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize from 'rehype-sanitize'
import githubSanitizeSchema from 'hast-util-sanitize/lib/github.json'
import 'katex/dist/katex.min.css'
import MathDiagram from '@/components/diagrams/MathDiagram'

const markdownSanitizeSchema = {
  ...githubSanitizeSchema,
  attributes: {
    ...githubSanitizeSchema.attributes,
    code: [
      ...(githubSanitizeSchema.attributes?.code || []),
      ['className', 'language-math', 'math-inline', 'math-display']
    ]
  }
}

const splitTableRow = (line) =>
  line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(cell => cell.trim())

const isTableSeparator = (line) => {
  const cells = splitTableRow(line)
  return cells.length > 0 && cells.every(cell => /^:?-{3,}:?$/.test(cell.replace(/\s/g, '')))
}

const splitMarkdownByHeading = (markdown, headingPattern) => {
  const lines = markdown.split('\n')
  const preface = []
  const sections = []
  let currentSection = null
  let inCodeFence = false

  lines.forEach(line => {
    if (line.trim().startsWith('```')) {
      inCodeFence = !inCodeFence
    }

    const sectionHeading = !inCodeFence ? line.match(headingPattern) : null

    if (sectionHeading) {
      if (currentSection) {
        sections.push({
          title: currentSection.title,
          body: currentSection.lines.join('\n')
        })
      }

      currentSection = {
        title: sectionHeading[1],
        lines: []
      }
      return
    }

    if (currentSection) {
      currentSection.lines.push(line)
    } else {
      preface.push(line)
    }
  })

  if (currentSection) {
    sections.push({
      title: currentSection.title,
      body: currentSection.lines.join('\n')
    })
  }

  return {
    preface: preface.join('\n'),
    sections: sections.filter(section => section.title || section.body.trim())
  }
}

const splitMarkdownSections = (markdown) => {
  const h2Sections = splitMarkdownByHeading(markdown, /^##\s+(.+?)\s*$/)

  if (h2Sections.sections.length > 0) {
    return h2Sections
  }

  return splitMarkdownByHeading(markdown, /^###\s+(.+?)\s*$/)
}

export default function MaterialViewer({ material, showPreview = false }) {
  if (!material) return null

  const { type, fileUrl, content, previewContent, title, difficulty, category } = material

  const renderMarkdown = (markdown, keyPrefix = 'markdown') => (
    <div key={keyPrefix} className="prose prose-sm sm:prose max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeRaw, [rehypeSanitize, markdownSanitizeSchema], rehypeKatex]}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  )

  const renderInlineMarkdown = (markdown) => (
    <ReactMarkdown
      remarkPlugins={[remarkMath]}
      rehypePlugins={[rehypeRaw, [rehypeSanitize, markdownSanitizeSchema], rehypeKatex]}
      components={{
        p: ({ children }) => <>{children}</>
      }}
    >
      {markdown}
    </ReactMarkdown>
  )

  const renderTable = (headers, rows, keyPrefix) => (
    <div key={keyPrefix} className="not-prose my-4 overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            {headers.map((header, index) => (
              <th key={index} className="px-3 py-2 text-left font-semibold text-gray-700">
                {renderInlineMarkdown(header)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="px-3 py-2 align-top text-gray-700">
                  {renderInlineMarkdown(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  const renderMarkdownWithTables = (markdown, keyPrefix = 'markdown-table') => {
    const blocks = []
    const lines = markdown.split('\n')
    let buffer = []
    let index = 0
    let blockIndex = 0

    const flushBuffer = () => {
      const chunk = buffer.join('\n')
      if (chunk.trim()) {
        blocks.push(renderMarkdown(chunk, `${keyPrefix}-${blockIndex}`))
        blockIndex += 1
      }
      buffer = []
    }

    while (index < lines.length) {
      const line = lines[index]
      const nextLine = lines[index + 1]
      const startsTable = line?.trim().startsWith('|') && nextLine && isTableSeparator(nextLine)

      if (startsTable) {
        flushBuffer()

        const headers = splitTableRow(line)
        const rows = []
        index += 2

        while (index < lines.length && lines[index].trim().startsWith('|')) {
          const row = splitTableRow(lines[index])
          if (row.length !== headers.length) break
          rows.push(row)
          index += 1
        }

        blocks.push(renderTable(headers, rows, `${keyPrefix}-table-${blockIndex}`))
        blockIndex += 1
        continue
      }

      buffer.push(line)
      index += 1
    }

    flushBuffer()
    return blocks
  }

  const renderMarkdownWithDiagrams = (markdown) => {
    const blocks = []
    const diagramFencePattern = /```math-diagram\s*\n([\s\S]*?)\n```/g
    let lastIndex = 0
    let match
    let blockIndex = 0

    while ((match = diagramFencePattern.exec(markdown)) !== null) {
      const before = markdown.slice(lastIndex, match.index)

      if (before.trim()) {
        blocks.push(...renderMarkdownWithTables(before, `markdown-${blockIndex}`))
      }

      try {
        const parsed = JSON.parse(match[1])
        const { size, ...diagram } = parsed
        blocks.push(
          <MathDiagram
            key={`diagram-${blockIndex}`}
            diagram={diagram}
            size={size || 240}
            className="my-4"
          />
        )
      } catch {
        blocks.push(...renderMarkdownWithTables(match[0], `markdown-diagram-fallback-${blockIndex}`))
      }

      lastIndex = diagramFencePattern.lastIndex
      blockIndex += 1
    }

    const after = markdown.slice(lastIndex)
    if (after.trim()) {
      blocks.push(...renderMarkdownWithTables(after, `markdown-${blockIndex}`))
    }

    return blocks
  }

  const renderCollapsibleMarkdown = (markdown) => {
    const { preface, sections } = splitMarkdownSections(markdown)

    if (sections.length === 0) {
      return renderMarkdownWithDiagrams(markdown)
    }

    return (
      <div className="space-y-3">
        {preface.trim() && (
          <div className="mb-2">
            {renderMarkdownWithDiagrams(preface)}
          </div>
        )}
        {sections.map((section, index) => (
          <details
            key={`${section.title}-${index}`}
            open={index === 0}
            className="group rounded-lg border border-gray-200 bg-white shadow-sm"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-semibold text-gray-900 marker:hidden">
              <span>{section.title}</span>
              <span className="text-xs font-medium text-blue-600 group-open:hidden">Open</span>
              <span className="hidden text-xs font-medium text-gray-500 group-open:inline">Close</span>
            </summary>
            <div className="border-t border-gray-100 px-4 py-4">
              {renderMarkdownWithDiagrams(section.body)}
            </div>
          </details>
        ))}
      </div>
    )
  }

  const renderContent = () => {
    // Show preview content if requested and available
    const contentToShow = showPreview && previewContent ? previewContent : content

    if (contentToShow) {
      return (
        <div className="space-y-4">
          {renderCollapsibleMarkdown(contentToShow)}
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
