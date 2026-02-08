import { useState, useEffect } from 'react'
import { Mail, Phone, MapPin, Clock, Send, CheckCircle } from 'lucide-react'
import { contactService } from '@/services/apiServices'
import SEOHead from '../../components/SEO/SEOHead'
import Breadcrumb from '../../components/common/Breadcrumb'

export default function ContactUs() {
  const seoData = {
    title: 'Contact Us - MeritAI Support | Get Help & Send Inquiries',
    description: 'Contact MeritAI support team for assistance with online learning, course inquiries, technical support, or general questions. We\'re here to help students and tutors.',
    keywords: 'contact MeritAI, customer support, help desk, student support, tutor support, online learning help, technical support, course inquiries',
    ogType: 'website',
    canonical: '/contact'
  };

  const breadcrumbItems = [
    { label: 'Home', path: '/' },
    { label: 'Contact Us', path: '/contact' }
  ];

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    category: 'general',
    message: ''
  })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [contactInfo, setContactInfo] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0)

    // Fetch contact information from backend model
    let mounted = true
    ;(async () => {
      try {
        const res = await contactService.getContactInfo()
        if (mounted) setContactInfo(res.data || res)
      } catch (err) {
        console.error('Failed to load contact info', err)
      }
    })()
    return () => { mounted = false }
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Submit to backend
      const res = await contactService.submitMessage(formData)
      if (res && res.success) {
        setSubmitted(true)

        // Reset form after 3 seconds
        setTimeout(() => {
          setSubmitted(false)
          setFormData({
            name: '',
            email: '',
            subject: '',
            category: 'general',
            message: ''
          })
        }, 3000)
      } else {
        setError(res.message || 'Failed to submit message')
      }
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.message || err.message || 'Failed to submit message')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <SEOHead {...seoData} />
      
      <div className="min-h-screen bg-gray-50">
        <Breadcrumb items={breadcrumbItems} />
        
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-teal-500 to-teal-700 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold mb-4">Get in Touch</h1>
              <p className="text-xl text-teal-100">
                We'd love to hear from you. Send us a message and we'll respond as soon as possible.
              </p>
            </div>
          </div>
        </section>

      {/* Contact Info & Form */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Contact Information */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Contact Information</h2>

                <div className="space-y-4">
                  <ContactInfoItem
                    icon={<Mail className="h-6 w-6 text-primary-600" />}
                    title="Email"
                    value={contactInfo?.email || 'support@meritai.in'}
                    subtitle={contactInfo ? `Response time: ${contactInfo.responseTimes?.email || '24 hours'}` : 'We typically respond in 24 hours'}
                  />

                  <ContactInfoItem
                    icon={<Phone className="h-6 w-6 text-primary-600" />}
                    title="Phone"
                    value={contactInfo?.phone || '+1 (555) 123-4567'}
                    subtitle={contactInfo?.businessHours || 'Mon-Fri, 9am-6pm EST'}
                  />

                  <ContactInfoItem
                    icon={<MapPin className="h-6 w-6 text-primary-600" />}
                    title="Address"
                    value={contactInfo?.address || '123 Education Street, New York, NY 10001, USA'}
                    subtitle=""
                  />

                  <ContactInfoItem
                    icon={<Clock className="h-6 w-6 text-primary-600" />}
                    title="Business Hours"
                    value={contactInfo?.businessHours || 'Monday - Friday'}
                    subtitle={contactInfo ? contactInfo.businessHours : '9:00 AM - 6:00 PM EST'}
                  />
                </div>
              </div>

              {/* Quick Response Times */}
              <div className="bg-primary-50 rounded-lg p-6">
                <h3 className="font-bold text-gray-900 mb-3">Response Times</h3>
                <div className="space-y-2 text-sm text-gray-700">
                  <div className="flex justify-between">
                    <span>Email Support:</span>
                    <span className="font-semibold">{contactInfo?.responseTimes?.email || '24 hours'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Phone Support:</span>
                    <span className="font-semibold">{contactInfo?.responseTimes?.phone || 'Immediate'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm p-8 border border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Send us a Message</h2>

                {submitted ? (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="h-12 w-12 text-green-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Message Sent!</h3>
                    <p className="text-gray-600">
                      Thank you for contacting us. We'll get back to you soon.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                      <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-600">{error}</p>
                      </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Your Name *
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="John Doe"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="john@example.com"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Category *
                      </label>
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="general">General Inquiry</option>
                        <option value="technical">Technical Support</option>
                        <option value="billing">Billing & Payments</option>
                        <option value="courses">Course Related</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Subject *
                      </label>
                      <input
                        type="text"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="How can we help you?"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Message *
                      </label>
                      <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        required
                        rows={6}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        placeholder="Please provide as much detail as possible..."
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-primary-600 text-white px-6 py-4 rounded-lg font-semibold hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Sending...</span>
                        </>
                      ) : (
                        <>
                          <Send className="h-5 w-5" />
                          <span>Send Message</span>
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
    </>
  )
}

function ContactInfoItem({ icon, title, value, subtitle }) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex-shrink-0 mt-1">{icon}</div>
      <div>
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <p className="text-gray-700">{value}</p>
        <p className="text-sm text-gray-500">{subtitle}</p>
      </div>
    </div>
  )
}
