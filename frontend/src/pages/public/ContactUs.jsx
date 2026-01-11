import { useState } from 'react'
import { Mail, Phone, MapPin, Clock, Send, CheckCircle } from 'lucide-react'

export default function ContactUs() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    category: 'general',
    message: ''
  })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    setLoading(false)
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
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl font-bold mb-4">Get in Touch</h1>
            <p className="text-xl text-blue-100">
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
                    icon={<Mail className="h-6 w-6 text-blue-600" />}
                    title="Email"
                    value="support@onlineteaching.com"
                    subtitle="We'll respond within 24 hours"
                  />
                  
                  <ContactInfoItem
                    icon={<Phone className="h-6 w-6 text-green-600" />}
                    title="Phone"
                    value="+1 (555) 123-4567"
                    subtitle="Mon-Fri, 9am-6pm EST"
                  />
                  
                  <ContactInfoItem
                    icon={<MapPin className="h-6 w-6 text-red-600" />}
                    title="Address"
                    value="123 Education Street"
                    subtitle="New York, NY 10001, USA"
                  />
                  
                  <ContactInfoItem
                    icon={<Clock className="h-6 w-6 text-purple-600" />}
                    title="Business Hours"
                    value="Monday - Friday"
                    subtitle="9:00 AM - 6:00 PM EST"
                  />
                </div>
              </div>

              {/* Quick Response Times */}
              <div className="bg-blue-50 rounded-lg p-6">
                <h3 className="font-bold text-gray-900 mb-3">Response Times</h3>
                <div className="space-y-2 text-sm text-gray-700">
                  <div className="flex justify-between">
                    <span>Email Support:</span>
                    <span className="font-semibold">24 hours</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Phone Support:</span>
                    <span className="font-semibold">Immediate</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Live Chat:</span>
                    <span className="font-semibold">5 minutes</span>
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
                        <option value="tutor">Tutor Application</option>
                        <option value="partnership">Partnership</option>
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
                      className="w-full bg-blue-600 text-white px-6 py-4 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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

      {/* Alternative Contact Methods */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Other Ways to Reach Us</h2>
            <p className="text-xl text-gray-600">Choose the method that works best for you</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <AlternativeContact
              title="Live Chat"
              description="Chat with our support team in real-time"
              availability="Available 24/7"
              buttonText="Start Chat"
              buttonColor="bg-green-600 hover:bg-green-700"
            />
            <AlternativeContact
              title="Help Center"
              description="Browse our comprehensive knowledge base"
              availability="Always available"
              buttonText="Visit Help Center"
              buttonColor="bg-blue-600 hover:bg-blue-700"
              link="/help-center"
            />
            <AlternativeContact
              title="FAQs"
              description="Quick answers to common questions"
              availability="Instant answers"
              buttonText="View FAQs"
              buttonColor="bg-purple-600 hover:bg-purple-700"
              link="/faqs"
            />
          </div>
        </div>
      </section>

      {/* Map Section (Placeholder) */}
      <section className="py-16 bg-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gray-300 rounded-lg h-96 flex items-center justify-center">
            <div className="text-center">
              <MapPin className="h-16 w-16 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">Map integration coming soon</p>
            </div>
          </div>
        </div>
      </section>
    </div>
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

function AlternativeContact({ title, description, availability, buttonText, buttonColor, link }) {
  return (
    <div className="bg-gray-50 rounded-lg p-8 text-center border border-gray-200">
      <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
      <p className="text-gray-600 mb-2">{description}</p>
      <p className="text-sm text-gray-500 mb-6">{availability}</p>
      {link ? (
        <a
          href={link}
          className={`${buttonColor} text-white px-6 py-3 rounded-lg font-semibold transition inline-block`}
        >
          {buttonText}
        </a>
      ) : (
        <button
          onClick={() => alert('Feature coming soon!')}
          className={`${buttonColor} text-white px-6 py-3 rounded-lg font-semibold transition`}
        >
          {buttonText}
        </button>
      )}
    </div>
  )
}
