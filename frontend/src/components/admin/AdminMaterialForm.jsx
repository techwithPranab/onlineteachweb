import React, { useState, useEffect } from 'react'
import Modal from '@/components/common/Modal'
import { materialService } from '@/services/apiServices'
import { useMutation, useQueryClient } from 'react-query'

export default function AdminMaterialForm({ isOpen, onClose, courseId, initialData = null }) {
  const queryClient = useQueryClient()
  const isEdit = !!initialData

  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'article',
    isFree: false,
    content: '',
    contentFormat: 'markdown',
    previewContent: '',
    difficulty: 'basic',
    category: 'lesson',
    file: null,
    tags: '' // comma separated
  })

  useEffect(() => {
    if (initialData) {
      setForm({
        title: initialData.title || '',
        description: initialData.description || '',
        type: initialData.type || 'article',
        isFree: !!initialData.isFree,
        content: initialData.content || '',
        contentFormat: initialData.contentFormat || 'markdown',
        previewContent: initialData.previewContent || '',
        difficulty: initialData.difficulty || 'basic',
        category: initialData.category || 'lesson',
        file: null,
        tags: Array.isArray(initialData.tags) ? initialData.tags.join(', ') : (initialData.tags || '')
      })
    } else {
      setForm({
        title: '',
        description: '',
        type: 'article',
        isFree: false,
        content: '',
        contentFormat: 'markdown',
        previewContent: '',
        difficulty: 'basic',
        category: 'lesson',
        file: null,
        tags: ''
      })
    }
  }, [initialData, isOpen])

  const uploadMutation = useMutation(
    (formData) => materialService.uploadMaterial(formData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['course', courseId])
        onClose()
      }
    }
  )

  const updateMutation = useMutation(
    ({ id, data }) => materialService.updateMaterial(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['course', courseId])
        onClose()
      }
    }
  )

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    if (type === 'checkbox') {
      setForm(prev => ({ ...prev, [name]: checked }))
    } else if (name === 'file') {
      setForm(prev => ({ ...prev, file: e.target.files[0] }))
    } else {
      setForm(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const { title, description, type, isFree, content, contentFormat, previewContent, difficulty, category, file } = form

    if (!title) {
      alert('Title is required')
      return
    }

    // If file is present or type is file based, use FormData
    if (file) {
      const fd = new FormData()
      fd.append('courseId', courseId)
      fd.append('title', title)
      fd.append('description', description)
      fd.append('type', type)
      fd.append('accessLevel', isFree ? 'free' : 'paid')
      fd.append('content', content)
      fd.append('contentFormat', contentFormat)
      fd.append('previewContent', previewContent)
      fd.append('difficulty', difficulty)
      fd.append('category', category)
      fd.append('file', file)
      if (form.tags) fd.append('tags', JSON.stringify(form.tags.split(',').map(t => t.trim()).filter(Boolean)))
      uploadMutation.mutate(fd)
      return
    }

    // Otherwise send JSON (article/content or link)
    const payload = {
      courseId,
      title,
      description,
      type,
      accessLevel: isFree ? 'free' : 'paid',
      content,
      contentFormat,
      previewContent,
      difficulty,
      category,
      tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : []
    }

    if (isEdit) {
      updateMutation.mutate({ id: initialData._id, data: payload })
    } else {
      uploadMutation.mutate(payload)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit Material' : 'Add Material'}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-sm text-gray-700">Title</label>
          <input name="title" value={form.title} onChange={handleChange} className="w-full px-3 py-2 border rounded-md" required />
        </div>

        <div>
          <label className="block text-sm text-gray-700">Description</label>
          <input name="description" value={form.description} onChange={handleChange} className="w-full px-3 py-2 border rounded-md" />
        </div>

        <div>
          <label className="block text-sm text-gray-700">Type</label>
          <select name="type" value={form.type} onChange={handleChange} className="w-full px-3 py-2 border rounded-md">
            <option value="article">Article / Markdown</option>
            <option value="pdf">PDF</option>
            <option value="video">Video</option>
            <option value="image">Image</option>
            <option value="link">Link</option>
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-700">Content (Markdown with LaTeX allowed)</label>
          <textarea name="content" value={form.content} onChange={handleChange} rows={8} className="w-full px-3 py-2 border rounded-md" />
          <small className="text-gray-500">You can use $...$ for inline math and $$...$$ for display math</small>
        </div>

        <div>
          <label className="block text-sm text-gray-700">Preview Content (shown to non-enrolled users)</label>
          <textarea name="previewContent" value={form.previewContent} onChange={handleChange} rows={4} className="w-full px-3 py-2 border rounded-md" placeholder="Optional preview content..." />
          <small className="text-gray-500">Leave empty to use full content as preview</small>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-700">Difficulty Level</label>
            <select name="difficulty" value={form.difficulty} onChange={handleChange} className="w-full px-3 py-2 border rounded-md">
              <option value="basic">Basic</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-700">Category</label>
            <select name="category" value={form.category} onChange={handleChange} className="w-full px-3 py-2 border rounded-md">
              <option value="lesson">Lesson</option>
              <option value="worked-example">Worked Example</option>
              <option value="worksheet">Worksheet</option>
              <option value="practice-quiz">Practice Quiz</option>
              <option value="reference">Reference</option>
              <option value="interactive">Interactive</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-700">Or upload a file</label>
          <input type="file" name="file" onChange={handleChange} />
        </div>

        <div>
          <label className="block text-sm text-gray-700">Tags (comma separated, e.g., CBSE, ICSE)</label>
          <input name="tags" value={form.tags} onChange={handleChange} className="w-full px-3 py-2 border rounded-md" placeholder="CBSE, ICSE" />
        </div>

        <div className="flex items-center gap-4">
          <label className="inline-flex items-center">
            <input type="checkbox" name="isFree" checked={form.isFree} onChange={handleChange} className="mr-2" />
            Is Free
          </label>
        </div>

        <div className="flex gap-3">
          <button type="submit" className="bg-primary-600 text-white px-4 py-2 rounded-md">{isEdit ? 'Save Changes' : 'Upload'}</button>
          <button type="button" onClick={onClose} className="bg-gray-200 px-4 py-2 rounded-md">Cancel</button>
        </div>
      </form>
    </Modal>
  )
}
