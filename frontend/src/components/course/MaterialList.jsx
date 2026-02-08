import React, { useState } from 'react'
import MaterialViewer from './MaterialViewer'
import Modal from '@/components/common/Modal'
import { Download, Play, FileText, ImageIcon } from 'lucide-react'

export default function MaterialList({ materials = [], showPreview = false }) {
  const [selected, setSelected] = useState(null)
  const [isOpen, setIsOpen] = useState(false)

  const open = (material) => {
    setSelected(material)
    setIsOpen(true)
  }

  const close = () => {
    setIsOpen(false)
    setSelected(null)
  }

  if (!materials || materials.length === 0) {
    return <p className="text-gray-500">No materials available yet for this course.</p>
  }

  return (
    <div className="space-y-3">
      {materials.map(mat => (
        <div key={mat._id} className="bg-white rounded-lg shadow p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              <div className="w-12 h-12 bg-gray-50 rounded-md flex items-center justify-center text-gray-400">
                {mat.type === 'video' ? <Play className="w-5 h-5" /> : mat.type === 'image' ? <ImageIcon className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold">{mat.title}</h4>
                  {mat.difficulty && (
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      mat.difficulty === 'basic' ? 'bg-green-100 text-green-800' :
                      mat.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {mat.difficulty.charAt(0).toUpperCase() + mat.difficulty.slice(1)}
                    </span>
                  )}
                  {mat.category && (
                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                      {mat.category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  )}
                </div>
                {mat.description && <p className="text-sm text-gray-500 mb-2">{mat.description}</p>}
                {mat.tags && mat.tags.length > 0 && (
                  <div className="mb-2 flex gap-2 flex-wrap">
                    {mat.tags.map((t, i) => (
                      <span key={i} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">{t}</span>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  {mat.fileUrl && (
                    <a href={mat.fileUrl} target="_blank" rel="noreferrer" className="text-sm text-primary-600 hover:text-primary-700">Open</a>
                  )}
                  {mat.fileUrl && (
                    <a href={mat.fileUrl} download className="text-sm text-gray-600 flex items-center gap-1"><Download className="w-4 h-4" /> Download</a>
                  )}
                </div>
              </div>
            </div>

            <div>
              <button onClick={() => open(mat)} className="bg-primary-600 text-white px-4 py-2 rounded-lg">
                {showPreview ? 'Preview' : 'View'}
              </button>
            </div>
          </div>
        </div>
      ))}

      <Modal isOpen={isOpen} onClose={close} title={selected?.title || 'Material'} size="lg">
        {selected && <MaterialViewer material={selected} showPreview={showPreview} />}
      </Modal>
    </div>
  )
}
