import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { Upload, File, Video, FileText, Image, X, Check, Edit, Trash2, Download, Eye, Filter } from 'lucide-react'
import { materialService, courseService } from '@/services/apiServices'
import { useAuthStore } from '@/store/authStore'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import ErrorMessage from '@/components/common/ErrorMessage'
import Modal from '@/components/common/Modal'
import ConfirmDialog from '@/components/common/ConfirmDialog'

export default function UploadMaterials() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const fileInputRef = useRef(null)

  const [selectedCourse, setSelectedCourse] = useState('')
  const [selectedType, setSelectedType] = useState('')
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedMaterial, setSelectedMaterial] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  
  const [uploadData, setUploadData] = useState({
    file: null,
    title: '',
    description: '',
    courseId: '',
    type: 'document',
    accessLevel: 'enrolled',
  })

  // Fetch tutor's courses
  const { data: coursesData } = useQuery(
    ['tutorCourses', user?._id],
    () => courseService.getCourses({ tutorId: user._id })
  )

  // Fetch materials
  const { data: materialsData, isLoading, error, refetch } = useQuery(
    ['tutorMaterials', selectedCourse, selectedType],
    () => materialService.getMaterials({
      tutorId: user._id,
      courseId: selectedCourse || undefined,
      type: selectedType || undefined,
    })
  )

  // Upload material mutation
  const uploadMutation = useMutation(
    (formData) => materialService.uploadMaterial(formData, (progress) => {
      setUploadProgress(progress)
    }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('tutorMaterials')
        setShowUploadModal(false)
        resetUploadForm()
        setUploadProgress(0)
      },
    }
  )

  // Update material mutation
  const updateMutation = useMutation(
    ({ id, data }) => materialService.updateMaterial(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('tutorMaterials')
        setShowEditModal(false)
        setSelectedMaterial(null)
      },
    }
  )

  // Delete material mutation
  const deleteMutation = useMutation(
    (id) => materialService.deleteMaterial(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('tutorMaterials')
        setShowDeleteDialog(false)
        setSelectedMaterial(null)
      },
    }
  )

  const courses = coursesData?.data || []
  const materials = materialsData?.data || []

  const resetUploadForm = () => {
    setUploadData({
      file: null,
      title: '',
      description: '',
      courseId: '',
      type: 'document',
      accessLevel: 'enrolled',
    })
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Auto-detect type based on file extension
      const extension = file.name.split('.').pop().toLowerCase()
      let type = 'document'
      if (['mp4', 'avi', 'mov', 'wmv'].includes(extension)) type = 'video'
      else if (['jpg', 'jpeg', 'png', 'gif'].includes(extension)) type = 'image'
      else if (['pdf'].includes(extension)) type = 'pdf'
      else if (['ppt', 'pptx'].includes(extension)) type = 'presentation'
      
      setUploadData({
        ...uploadData,
        file,
        type,
        title: uploadData.title || file.name.replace(/\.[^/.]+$/, ''),
      })
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    const file = e.dataTransfer.files[0]
    if (file) {
      const fakeEvent = { target: { files: [file] } }
      handleFileSelect(fakeEvent)
    }
  }

  const handleUpload = (e) => {
    e.preventDefault()
    if (!uploadData.file) return

    const formData = new FormData()
    formData.append('file', uploadData.file)
    formData.append('title', uploadData.title)
    formData.append('description', uploadData.description)
    formData.append('courseId', uploadData.courseId)
    formData.append('type', uploadData.type)
    formData.append('accessLevel', uploadData.accessLevel)

    uploadMutation.mutate(formData)
  }

  const handleEditClick = (material) => {
    setSelectedMaterial(material)
    setShowEditModal(true)
  }

  const handleUpdateMaterial = (e) => {
    e.preventDefault()
    updateMutation.mutate({
      id: selectedMaterial._id,
      data: {
        title: selectedMaterial.title,
        description: selectedMaterial.description,
        accessLevel: selectedMaterial.accessLevel,
      },
    })
  }

  const handleDeleteClick = (material) => {
    setSelectedMaterial(material)
    setShowDeleteDialog(true)
  }

  const confirmDelete = () => {
    deleteMutation.mutate(selectedMaterial._id)
  }

  const getFileIcon = (type) => {
    switch (type) {
      case 'video': return <Video className="w-6 h-6" />
      case 'pdf': return <FileText className="w-6 h-6" />
      case 'image': return <Image className="w-6 h-6" />
      default: return <File className="w-6 h-6" />
    }
  }

  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A'
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  if (isLoading) return <LoadingSpinner fullScreen />
  if (error) return <ErrorMessage message={error.message || 'Failed to load materials'} onRetry={refetch} />

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Upload Materials</h1>
        <p className="text-gray-600">Share course materials with your students</p>
      </div>

      {/* Filters & Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="input-field"
            >
              <option value="">All Courses</option>
              {courses.map((course) => (
                <option key={course._id} value={course._id}>
                  {course.title}
                </option>
              ))}
            </select>

            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="input-field"
            >
              <option value="">All Types</option>
              <option value="document">Documents</option>
              <option value="video">Videos</option>
              <option value="pdf">PDFs</option>
              <option value="presentation">Presentations</option>
              <option value="image">Images</option>
            </select>
          </div>

          <button
            onClick={() => setShowUploadModal(true)}
            className="btn-primary flex items-center gap-2 w-full md:w-auto"
          >
            <Upload className="w-4 h-4" />
            Upload Material
          </button>
        </div>
      </div>

      {/* Materials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {materials.length > 0 ? (
          materials.map((material) => (
            <div key={material._id} className="card hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-primary-100 text-primary-600 rounded-lg">
                    {getFileIcon(material.type)}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEditClick(material)}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(material)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                  {material.title}
                </h3>
                
                <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                  {material.description}
                </p>

                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center justify-between">
                    <span>Course:</span>
                    <span className="font-medium">{material.course?.title || 'N/A'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Type:</span>
                    <span className="font-medium capitalize">{material.type}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Size:</span>
                    <span className="font-medium">{formatFileSize(material.fileSize)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Access:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      material.accessLevel === 'free' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {material.accessLevel === 'free' ? 'Free' : 'Enrolled Only'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Uploaded:</span>
                    <span className="font-medium">
                      {new Date(material.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <a
                    href={material.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full px-4 py-2 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    View Material
                  </a>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full">
            <div className="card">
              <div className="p-12 text-center">
                <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No materials uploaded</h3>
                <p className="text-gray-600 mb-6">Upload your first material to share with students</p>
                <button onClick={() => setShowUploadModal(true)} className="btn-primary">
                  <Upload className="w-4 h-4 inline mr-2" />
                  Upload Material
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => {
          setShowUploadModal(false)
          resetUploadForm()
          setUploadProgress(0)
        }}
        title="Upload New Material"
        size="lg"
      >
        <form onSubmit={handleUpload} className="space-y-4">
          {/* File Upload Area */}
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-primary-500 hover:bg-primary-50/50 transition-colors"
          >
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              className="hidden"
              accept=".pdf,.doc,.docx,.ppt,.pptx,.mp4,.avi,.mov,.jpg,.jpeg,.png"
            />
            
            {uploadData.file ? (
              <div className="flex items-center justify-center gap-3">
                <Check className="w-8 h-8 text-green-500" />
                <div className="text-left">
                  <p className="font-medium text-gray-900">{uploadData.file.name}</p>
                  <p className="text-sm text-gray-500">
                    {formatFileSize(uploadData.file.size)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setUploadData({ ...uploadData, file: null })
                  }}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-700 font-medium mb-2">
                  Drop your file here, or click to browse
                </p>
                <p className="text-sm text-gray-500">
                  Supports: PDF, DOC, PPT, MP4, Images (Max 100MB)
                </p>
              </>
            )}
          </div>

          {/* Upload Progress */}
          {uploadProgress > 0 && uploadProgress < 100 && (
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Uploading...</span>
                <span className="font-medium text-gray-900">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
            <input
              type="text"
              value={uploadData.title}
              onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })}
              required
              className="input-field w-full"
              placeholder="e.g., Chapter 1 - Introduction"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              value={uploadData.description}
              onChange={(e) => setUploadData({ ...uploadData, description: e.target.value })}
              rows={3}
              className="input-field w-full"
              placeholder="Describe what this material covers..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Course *</label>
              <select
                value={uploadData.courseId}
                onChange={(e) => setUploadData({ ...uploadData, courseId: e.target.value })}
                required
                className="input-field w-full"
              >
                <option value="">Select Course</option>
                {courses.map((course) => (
                  <option key={course._id} value={course._id}>
                    {course.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Material Type</label>
              <select
                value={uploadData.type}
                onChange={(e) => setUploadData({ ...uploadData, type: e.target.value })}
                className="input-field w-full"
              >
                <option value="document">Document</option>
                <option value="video">Video</option>
                <option value="pdf">PDF</option>
                <option value="presentation">Presentation</option>
                <option value="image">Image</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Access Level</label>
            <select
              value={uploadData.accessLevel}
              onChange={(e) => setUploadData({ ...uploadData, accessLevel: e.target.value })}
              className="input-field w-full"
            >
              <option value="enrolled">Enrolled Students Only</option>
              <option value="free">Free Access</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setShowUploadModal(false)
                resetUploadForm()
                setUploadProgress(0)
              }}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!uploadData.file || uploadMutation.isLoading}
              className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploadMutation.isLoading ? (
                <><LoadingSpinner size="sm" /> Uploading...</>
              ) : (
                'Upload Material'
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setSelectedMaterial(null)
        }}
        title="Edit Material"
      >
        <form onSubmit={handleUpdateMaterial} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
            <input
              type="text"
              value={selectedMaterial?.title || ''}
              onChange={(e) => setSelectedMaterial({ ...selectedMaterial, title: e.target.value })}
              required
              className="input-field w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              value={selectedMaterial?.description || ''}
              onChange={(e) => setSelectedMaterial({ ...selectedMaterial, description: e.target.value })}
              rows={3}
              className="input-field w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Access Level</label>
            <select
              value={selectedMaterial?.accessLevel || 'enrolled'}
              onChange={(e) => setSelectedMaterial({ ...selectedMaterial, accessLevel: e.target.value })}
              className="input-field w-full"
            >
              <option value="enrolled">Enrolled Students Only</option>
              <option value="free">Free Access</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setShowEditModal(false)
                setSelectedMaterial(null)
              }}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateMutation.isLoading}
              className="flex-1 btn-primary"
            >
              {updateMutation.isLoading ? (
                <><LoadingSpinner size="sm" /> Updating...</>
              ) : (
                'Update Material'
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={confirmDelete}
        title="Delete Material"
        message={`Are you sure you want to delete "${selectedMaterial?.title}"? This action cannot be undone and students will lose access to this material.`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  )
}
