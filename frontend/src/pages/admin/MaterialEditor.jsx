import { useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import { ArrowLeft, Eye, FileText, GripVertical, Save, SplitSquareVertical } from 'lucide-react'
import SEOHead from '@/components/SEO/SEOHead'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import ErrorMessage from '@/components/common/ErrorMessage'
import MaterialViewer from '@/components/course/MaterialViewer'
import MathDiagram from '@/components/diagrams/MathDiagram'
import { DIAGRAM_CATALOG } from '@/components/diagrams/diagramCatalog'
import { adminService, materialService } from '@/services/apiServices'

const getId = (value) => {
  if (!value) return ''
  if (typeof value === 'string') return value
  if (value.$oid) return value.$oid
  if (value._id) return getId(value._id)
  return ''
}

const stringifyDiagram = (diagram) => {
  return [
    '```math-diagram',
    JSON.stringify({
      type: diagram.type,
      params: diagram.params || diagram.exampleParams || {},
      caption: diagram.caption || `${diagram.label || diagram.type} visual`,
      size: diagram.size || 280
    }, null, 2),
    '```',
    '',
    `This visual helps students read the ${diagram.label || diagram.type} model step by step.`
  ].join('\n')
}

const extractDiagramBlocks = (content = '') => {
  return [...content.matchAll(/```math-diagram\n([\s\S]*?)\n```/g)].map((match, index) => {
    try {
      const parsed = JSON.parse(match[1])
      return { index, ...parsed }
    } catch (error) {
      return { index, type: 'invalid', params: {}, caption: 'Invalid diagram JSON' }
    }
  })
}

export default function MaterialEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const textareaRef = useRef(null)
  const [activeTab, setActiveTab] = useState(searchParams.get('preview') ? 'preview' : 'editor')
  const [diagramSearch, setDiagramSearch] = useState('')
  const [selectedDiagramType, setSelectedDiagramType] = useState('')
  const [form, setForm] = useState(null)

  const { data, isLoading, error } = useQuery(
    ['adminMaterial', id],
    () => adminService.getAdminMaterialById(id),
    {
      onSuccess: (response) => {
        const material = response.material
        setForm({
          title: material.title || '',
          description: material.description || '',
          type: material.type || 'article',
          content: material.content || '',
          previewContent: material.previewContent || '',
          contentFormat: material.contentFormat || 'markdown',
          difficulty: material.difficulty || 'basic',
          category: material.category || 'lesson',
          order: material.order || 0,
          isFree: !!material.isFree,
          isActive: material.isActive !== false,
          tags: Array.isArray(material.tags) ? material.tags.join(', ') : ''
        })
      }
    }
  )

  const material = data?.material
  const course = material?.course
  const chapterOptions = course?.chapters || []
  const diagramBlocks = useMemo(() => extractDiagramBlocks(form?.content || ''), [form?.content])

  const relevantDiagrams = useMemo(() => {
    const query = diagramSearch.trim().toLowerCase()
    const grade = course?.grade
    return DIAGRAM_CATALOG
      .filter(diagram => !grade || diagram.grades?.includes(Number(grade)) || diagram.grades?.some(g => Number(g) === Number(grade)))
      .filter(diagram => {
        if (!query) return true
        const haystack = [
          diagram.type,
          diagram.label,
          diagram.description,
          ...(diagram.topics || [])
        ].join(' ').toLowerCase()
        return haystack.includes(query)
      })
  }, [course?.grade, diagramSearch])

  const selectedDiagram = useMemo(() => {
    return DIAGRAM_CATALOG.find(diagram => diagram.type === selectedDiagramType) || relevantDiagrams[0]
  }, [relevantDiagrams, selectedDiagramType])

  const updateMutation = useMutation(
    (payload) => materialService.updateMaterial(id, payload),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['adminMaterial', id])
        queryClient.invalidateQueries('adminMaterials')
        alert('Material updated successfully')
      }
    }
  )

  const setField = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const insertAtCursor = (text) => {
    const textarea = textareaRef.current
    if (!textarea) {
      setField('content', `${form.content || ''}\n\n${text}`)
      return
    }

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const before = form.content.slice(0, start)
    const after = form.content.slice(end)
    const separatorBefore = before.endsWith('\n\n') || before.length === 0 ? '' : '\n\n'
    const separatorAfter = after.startsWith('\n') ? '' : '\n\n'
    const nextContent = `${before}${separatorBefore}${text}${separatorAfter}${after}`
    setField('content', nextContent)

    requestAnimationFrame(() => {
      textarea.focus()
      const cursor = start + separatorBefore.length + text.length
      textarea.setSelectionRange(cursor, cursor)
    })
  }

  const handleDrop = (event) => {
    event.preventDefault()
    const diagramType = event.dataTransfer.getData('application/x-diagram-type')
    const diagram = DIAGRAM_CATALOG.find(item => item.type === diagramType)
    if (diagram) {
      insertAtCursor(stringifyDiagram(diagram))
    }
  }

  const handleSave = () => {
    if (!form.title.trim()) {
      alert('Title is required')
      return
    }

    updateMutation.mutate({
      title: form.title,
      description: form.description,
      type: form.type,
      content: form.content,
      previewContent: form.previewContent,
      contentFormat: form.contentFormat,
      difficulty: form.difficulty,
      category: form.category,
      order: Number(form.order) || 0,
      isFree: form.isFree,
      isActive: form.isActive,
      tags: form.tags.split(',').map(tag => tag.trim()).filter(Boolean)
    })
  }

  if (isLoading || !form) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error.message || 'Failed to load material'} />

  const previewMaterial = {
    ...material,
    ...form,
    tags: form.tags.split(',').map(tag => tag.trim()).filter(Boolean),
    course
  }

  return (
    <>
      <SEOHead title={`Edit Material - ${form.title}`} noIndex={true} noFollow={true} />

      <div className="p-4 space-y-5">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <Link to="/admin/materials" className="inline-flex items-center text-sm text-emerald-700 hover:text-emerald-800 mb-2">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Material Management
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Edit Material</h1>
            <p className="text-gray-600 mt-1">
              {course?.title || 'Course'} • Grade {course?.grade || '-'} • {course?.subject || '-'}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveTab(activeTab === 'preview' ? 'editor' : 'preview')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800"
            >
              {activeTab === 'preview' ? <SplitSquareVertical className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {activeTab === 'preview' ? 'Back to Editor' : 'Preview'}
            </button>
            <button
              onClick={handleSave}
              disabled={updateMutation.isLoading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {updateMutation.isLoading ? 'Saving...' : 'Save Material'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2 space-y-4">
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4">
              <h2 className="font-semibold text-gray-900 mb-4">Material Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input value={form.title} onChange={(event) => setField('title', event.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea value={form.description} onChange={(event) => setField('description', event.target.value)} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select value={form.type} onChange={(event) => setField('type', event.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    <option value="article">Article / Markdown</option>
                    <option value="pdf">PDF</option>
                    <option value="video">Video</option>
                    <option value="ppt">PPT</option>
                    <option value="document">Document</option>
                    <option value="image">Image</option>
                    <option value="link">Link</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Chapter helper</label>
                  <select onChange={(event) => event.target.value && insertAtCursor(`\\n## ${event.target.value}\\n\\n`)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" defaultValue="">
                    <option value="">Insert chapter heading...</option>
                    {chapterOptions.map(chapter => <option key={chapter.name} value={chapter.name}>{chapter.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Content Format</label>
                  <select value={form.contentFormat} onChange={(event) => setField('contentFormat', event.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    <option value="markdown">Markdown</option>
                    <option value="html">HTML</option>
                    <option value="plaintext">Plain Text</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                  <select value={form.difficulty} onChange={(event) => setField('difficulty', event.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    <option value="basic">Basic</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select value={form.category} onChange={(event) => setField('category', event.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    <option value="lesson">Lesson</option>
                    <option value="worked-example">Worked Example</option>
                    <option value="worksheet">Worksheet</option>
                    <option value="practice-quiz">Practice Quiz</option>
                    <option value="reference">Reference</option>
                    <option value="interactive">Interactive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
                  <input type="number" value={form.order} onChange={(event) => setField('order', event.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                  <input value={form.tags} onChange={(event) => setField('tags', event.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Grade 6, Mathematics, Fractions" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Preview Content</label>
                  <textarea value={form.previewContent} onChange={(event) => setField('previewContent', event.target.value)} rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Short preview shown before full access..." />
                </div>
                <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" checked={form.isFree} onChange={(event) => setField('isFree', event.target.checked)} />
                  Free material
                </label>
                <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" checked={form.isActive} onChange={(event) => setField('isActive', event.target.checked)} />
                  Active / visible
                </label>
              </div>
            </div>

            {activeTab === 'preview' ? (
              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Eye className="h-5 w-5 text-emerald-600" />
                  <h2 className="font-semibold text-gray-900">Live Preview</h2>
                </div>
                <MaterialViewer material={previewMaterial} />
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-3">
                  <div>
                    <h2 className="font-semibold text-gray-900">Markdown Content</h2>
                    <p className="text-sm text-gray-500">
                      Drop a diagram card into the editor, or click Insert Diagram. Use ## headings for collapsible sections.
                    </p>
                  </div>
                  <button
                    onClick={() => selectedDiagram && insertAtCursor(stringifyDiagram(selectedDiagram))}
                    className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm"
                  >
                    Insert Selected Diagram
                  </button>
                </div>
                <textarea
                  ref={textareaRef}
                  value={form.content}
                  onChange={(event) => setField('content', event.target.value)}
                  onDrop={handleDrop}
                  onDragOver={(event) => event.preventDefault()}
                  rows={28}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl font-mono text-sm leading-6 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            )}
          </div>

          <aside className="space-y-4">
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4">
              <div className="flex items-center gap-2 mb-3">
                <GripVertical className="h-5 w-5 text-indigo-600" />
                <h2 className="font-semibold text-gray-900">Diagram Toolbox</h2>
              </div>
              <input
                value={diagramSearch}
                onChange={(event) => setDiagramSearch(event.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3"
                placeholder="Search diagrams by topic..."
              />
              <select value={selectedDiagram?.type || ''} onChange={(event) => setSelectedDiagramType(event.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3">
                {relevantDiagrams.map(diagram => (
                  <option key={diagram.type} value={diagram.type}>{diagram.emoji} {diagram.label}</option>
                ))}
              </select>

              {selectedDiagram && (
                <div
                  draggable
                  onDragStart={(event) => event.dataTransfer.setData('application/x-diagram-type', selectedDiagram.type)}
                  className="border border-indigo-100 rounded-xl p-3 bg-indigo-50 cursor-grab active:cursor-grabbing"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-semibold text-indigo-950">{selectedDiagram.emoji} {selectedDiagram.label}</div>
                      <p className="text-sm text-indigo-800 mt-1">{selectedDiagram.description}</p>
                    </div>
                    <GripVertical className="h-4 w-4 text-indigo-500" />
                  </div>
                  <div className="mt-3 bg-white rounded-lg p-2">
                    <MathDiagram diagram={{ type: selectedDiagram.type, params: selectedDiagram.exampleParams, caption: selectedDiagram.label }} size={180} />
                  </div>
                  <button
                    onClick={() => insertAtCursor(stringifyDiagram(selectedDiagram))}
                    className="w-full mt-3 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm"
                  >
                    Insert Diagram
                  </button>
                </div>
              )}
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="h-5 w-5 text-emerald-600" />
                <h2 className="font-semibold text-gray-900">Current Diagrams</h2>
              </div>
              {diagramBlocks.length === 0 ? (
                <p className="text-sm text-gray-500">No diagram blocks found in this material yet.</p>
              ) : (
                <div className="space-y-2">
                  {diagramBlocks.map(block => (
                    <div key={`${block.type}-${block.index}`} className="rounded-lg border border-gray-200 p-3">
                      <div className="font-medium text-sm text-gray-900">{block.type}</div>
                      <div className="text-xs text-gray-500 line-clamp-2">{block.caption}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-900">
              <h3 className="font-semibold mb-2">Editor notes</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Use fenced <code>math-diagram</code> blocks only.</li>
                <li>Do not paste JSX or raw SVG into material content.</li>
                <li>Every diagram should have a caption and one short explanation line.</li>
                <li>Preview before saving large content changes.</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </>
  )
}
