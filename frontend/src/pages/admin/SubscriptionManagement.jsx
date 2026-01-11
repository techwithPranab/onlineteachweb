import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useState } from 'react'
import { CreditCard, Plus, Edit3, Trash2, Users, Star, DollarSign } from 'lucide-react'
import { subscriptionService } from '@/services/apiServices'
import { useAuthStore } from '@/store/authStore'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import ErrorMessage from '@/components/common/ErrorMessage'

export default function SubscriptionManagement() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingPlan, setEditingPlan] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    interval: 'month',
    features: [],
    maxCourses: '',
    maxLiveSessions: '',
    priority: 1,
    isActive: true
  })

  // Redirect if not admin
  if (user?.role !== 'admin') {
    return <ErrorMessage message="Access denied. Admin role required." />
  }

  // Fetch subscription plans
  const { data: plansData, isLoading, error } = useQuery(
    'subscriptionPlans',
    () => subscriptionService.getPlans()
  )

  // Fetch subscription statistics
  const { data: statsData } = useQuery(
    'subscriptionStats',
    () => subscriptionService.getStats()
  )

  const plans = plansData?.data || []
  const stats = statsData?.data || {}

  // Create plan mutation
  const createPlanMutation = useMutation(
    (planData) => subscriptionService.createPlan(planData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('subscriptionPlans')
        setShowCreateModal(false)
        resetForm()
      }
    }
  )

  // Update plan mutation
  const updatePlanMutation = useMutation(
    ({ id, data }) => subscriptionService.updatePlan(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('subscriptionPlans')
        setEditingPlan(null)
        resetForm()
      }
    }
  )

  // Delete plan mutation
  const deletePlanMutation = useMutation(
    (planId) => subscriptionService.deletePlan(planId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('subscriptionPlans')
      }
    }
  )

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      interval: 'month',
      features: [],
      maxCourses: '',
      maxLiveSessions: '',
      priority: 1,
      isActive: true
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const planData = {
      ...formData,
      price: parseFloat(formData.price),
      maxCourses: formData.maxCourses === '' ? -1 : parseInt(formData.maxCourses),
      maxLiveSessions: formData.maxLiveSessions === '' ? -1 : parseInt(formData.maxLiveSessions),
      features: formData.features.filter(f => f.trim() !== '')
    }

    if (editingPlan) {
      await updatePlanMutation.mutateAsync({ id: editingPlan._id, data: planData })
    } else {
      await createPlanMutation.mutateAsync(planData)
    }
  }

  const handleEdit = (plan) => {
    setEditingPlan(plan)
    setFormData({
      name: plan.name,
      description: plan.description,
      price: plan.price.toString(),
      interval: plan.interval,
      features: [...plan.features],
      maxCourses: plan.maxCourses === -1 ? '' : plan.maxCourses.toString(),
      maxLiveSessions: plan.maxLiveSessions === -1 ? '' : plan.maxLiveSessions.toString(),
      priority: plan.priority,
      isActive: plan.isActive
    })
    setShowCreateModal(true)
  }

  const handleDelete = async (planId) => {
    if (confirm('Are you sure you want to delete this subscription plan?')) {
      await deletePlanMutation.mutateAsync(planId)
    }
  }

  const addFeature = () => {
    setFormData({ ...formData, features: [...formData.features, ''] })
  }

  const updateFeature = (index, value) => {
    const newFeatures = [...formData.features]
    newFeatures[index] = value
    setFormData({ ...formData, features: newFeatures })
  }

  const removeFeature = (index) => {
    const newFeatures = formData.features.filter((_, i) => i !== index)
    setFormData({ ...formData, features: newFeatures })
  }

  if (isLoading) return <LoadingSpinner fullScreen />
  if (error) return <ErrorMessage message={error.message || 'Failed to load subscription plans'} />

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subscription Management</h1>
          <p className="text-gray-600">Create and manage subscription plans for your platform</p>
        </div>
        <button
          onClick={() => {
            resetForm()
            setEditingPlan(null)
            setShowCreateModal(true)
          }}
          className="px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center mt-3 sm:mt-0"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Plan
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Subscribers</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalSubscribers || 0}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-blue-600 text-sm font-medium">+{stats.subscriberGrowth || 0}%</span>
            <span className="text-gray-500 text-sm ml-2">vs last month</span>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
              <p className="text-2xl font-bold text-gray-900">₹{(stats.monthlyRevenue || 0).toLocaleString()}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-green-600 text-sm font-medium">+{stats.revenueGrowth || 0}%</span>
            <span className="text-gray-500 text-sm ml-2">vs last month</span>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Plans</p>
              <p className="text-2xl font-bold text-gray-900">{plans.filter(p => p.isActive).length}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <CreditCard className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg. Rating</p>
              <p className="text-2xl font-bold text-gray-900">{stats.averageRating || 0}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Star className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {plans.map((plan) => (
          <div key={plan._id} className={`card relative ${plan.priority === 2 ? 'ring-2 ring-primary-500' : ''}`}>
            {plan.priority === 2 && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-primary-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                  Most Popular
                </span>
              </div>
            )}
            
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
              <p className="text-gray-600 mt-2">{plan.description}</p>
              
              <div className="mt-4">
                <span className="text-3xl font-bold text-gray-900">₹{plan.price}</span>
                <span className="text-gray-600">/{plan.interval}</span>
              </div>
              
              <div className="mt-6 space-y-3">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-center text-sm text-gray-600">
                    <div className="h-1.5 w-1.5 bg-primary-500 rounded-full mr-3"></div>
                    {feature}
                  </div>
                ))}
              </div>
              
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Max Courses:</span>
                  <span>{plan.maxCourses === -1 ? 'Unlimited' : plan.maxCourses}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600 mb-4">
                  <span>Live Sessions:</span>
                  <span>{plan.maxLiveSessions === -1 ? 'Unlimited' : plan.maxLiveSessions}</span>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(plan)}
                    className="flex-1 btn-secondary"
                  >
                    <Edit3 className="h-4 w-4 mr-1" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(plan._id)}
                    className="flex-1 btn-danger"
                    disabled={deletePlanMutation.isLoading}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </button>
                </div>
              </div>
              
              <div className="mt-3">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  plan.isActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {plan.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit Plan Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-2/3 shadow-lg rounded-lg bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {editingPlan ? 'Edit Plan' : 'Create New Plan'}
              </h3>
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setEditingPlan(null)
                  resetForm()
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Plan Name
                  </label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    className="input-field"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  rows={3}
                  className="input-field"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Billing Interval
                  </label>
                  <select
                    className="input-field"
                    value={formData.interval}
                    onChange={(e) => setFormData({ ...formData, interval: e.target.value })}
                  >
                    <option value="month">Monthly</option>
                    <option value="year">Yearly</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Courses (empty = unlimited)
                  </label>
                  <input
                    type="number"
                    className="input-field"
                    value={formData.maxCourses}
                    onChange={(e) => setFormData({ ...formData, maxCourses: e.target.value })}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Live Sessions (empty = unlimited)
                  </label>
                  <input
                    type="number"
                    className="input-field"
                    value={formData.maxLiveSessions}
                    onChange={(e) => setFormData({ ...formData, maxLiveSessions: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority (1-5)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    className="input-field"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    className="input-field"
                    value={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'true' })}
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Features
                </label>
                {formData.features.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-2 mb-2">
                    <input
                      type="text"
                      className="input-field flex-1"
                      value={feature}
                      onChange={(e) => updateFeature(index, e.target.value)}
                      placeholder="Enter feature"
                    />
                    <button
                      type="button"
                      onClick={() => removeFeature(index)}
                      className="btn-danger"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addFeature}
                  className="btn-secondary"
                >
                  Add Feature
                </button>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false)
                    setEditingPlan(null)
                    resetForm()
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createPlanMutation.isLoading || updatePlanMutation.isLoading}
                  className="btn-primary"
                >
                  {createPlanMutation.isLoading || updatePlanMutation.isLoading 
                    ? 'Saving...' 
                    : editingPlan ? 'Update Plan' : 'Create Plan'
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
