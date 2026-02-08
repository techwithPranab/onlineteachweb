import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { Trash2, CheckCircle, Clock, Mail } from 'lucide-react'
import { adminService } from '@/services/apiServices'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import SEOHead from '@/components/SEO/SEOHead';
import ErrorMessage from '@/components/common/ErrorMessage'

export default function ContactMessages() {
  const queryClient = useQueryClient()
  const [filters, setFilters] = useState({ search: '', status: '' })

  const { data, isLoading, error } = useQuery(
    ['contactMessages', filters],
    () => adminService.getContactMessages(filters),
    { keepPreviousData: true }
  )

  const updateStatusMutation = useMutation(
    ({ id, update }) => adminService.updateContactMessageStatus(id, update),
    {
      onSuccess: () => queryClient.invalidateQueries('contactMessages')
    }
  )

  const deleteMutation = useMutation((id) => adminService.deleteContactMessage(id), {
    onSuccess: () => {
      queryClient.invalidateQueries('contactMessages')
      alert('Message deleted')
    },
    onError: () => alert('Failed to delete message')
  })

  const messages = data?.data || []

  if (isLoading) return <LoadingSpinner fullScreen />
  if (error) return <ErrorMessage message={error.message || 'Failed to load messages'} />

  return (
    <>

    <SEOHead title="Contact Messages - Admin" noIndex={true} noFollow={true} />

    <div className="max-w-7xl mx-auto">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Contact Messages</h1>
        <p className="text-sm text-gray-600">Manage messages sent by users through the Contact form</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            value={filters.search}
            onChange={(e) => setFilters((s) => ({ ...s, search: e.target.value }))}
            placeholder="Search by name, email, subject..."
            className="input-field"
          />

          <select
            value={filters.status}
            onChange={(e) => setFilters((s) => ({ ...s, status: e.target.value }))}
            className="input-field"
          >
            <option value="">All Status</option>
            <option value="open">Open</option>
            <option value="in-progress">In Progress</option>
            <option value="closed">Closed</option>
          </select>

          <div className="text-right">
            <button
              onClick={() => setFilters({ search: '', status: '' })}
              className="btn-outline"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {messages.map((msg) => (
          <div key={msg._id} className="bg-white rounded-lg shadow p-6 border border-gray-100">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold">{msg.subject || 'No Subject'}</h3>
                <p className="text-sm text-gray-600">{msg.name} • {msg.email} • <span className="text-xs text-gray-500">{new Date(msg.createdAt).toLocaleString()}</span></p>
              </div>

              <div className="flex items-center space-x-3">
                <span className={`px-3 py-1 rounded-full text-sm ${msg.status === 'open' ? 'bg-green-50 text-green-700' : msg.status === 'in-progress' ? 'bg-yellow-50 text-yellow-700' : 'bg-gray-50 text-gray-700'}`}>{msg.status}</span>
                <button
                  onClick={() => updateStatusMutation.mutate({ id: msg._id, update: { status: msg.status === 'open' ? 'in-progress' : 'closed' } })}
                  className="text-sm px-3 py-2 bg-primary-600 text-white rounded-lg"
                >
                  {msg.status === 'open' ? 'Start' : msg.status === 'in-progress' ? 'Close' : 'Reopen'}
                </button>
                <button
                  onClick={() => {
                    if (window.confirm('Delete this message?')) deleteMutation.mutate(msg._id)
                  }}
                  className="text-red-600 px-3 py-2 rounded-lg border border-red-100"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="mt-4 text-gray-700">
              <p className="whitespace-pre-line">{msg.message}</p>
            </div>
          </div>
        ))}

        {messages.length === 0 && (
          <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">No messages found</div>
        )}
      </div>
    </div>


    </>)
}
