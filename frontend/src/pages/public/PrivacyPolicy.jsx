export default function PrivacyPolicy() {
  const lastUpdated = "January 15, 2024"

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-gray-800 to-gray-900 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-5xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-xl text-gray-300">
            Last Updated: {lastUpdated}
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm p-8 md:p-12 space-y-8">
            
            <Section
              title="1. Introduction"
              content={
                <>
                  <p>
                    Welcome to Online Teaching Platform ("we," "our," or "us"). We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our online teaching platform and services.
                  </p>
                  <p className="mt-4">
                    By accessing or using our platform, you agree to the terms of this Privacy Policy. If you do not agree with our practices, please do not use our services.
                  </p>
                </>
              }
            />

            <Section
              title="2. Information We Collect"
              content={
                <>
                  <h4 className="font-semibold text-gray-900 mb-2">2.1 Information You Provide</h4>
                  <p>We collect information that you voluntarily provide when you:</p>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>Create an account (name, email, password, profile photo)</li>
                    <li>Complete your profile (education, expertise, qualifications)</li>
                    <li>Enroll in courses or create courses as a tutor</li>
                    <li>Participate in live classes (video, audio, chat messages)</li>
                    <li>Upload course materials or assignments</li>
                    <li>Make payments or process transactions</li>
                    <li>Contact customer support</li>
                    <li>Participate in surveys or feedback forms</li>
                  </ul>

                  <h4 className="font-semibold text-gray-900 mb-2 mt-6">2.2 Automatically Collected Information</h4>
                  <p>When you use our platform, we automatically collect:</p>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>Device information (IP address, browser type, operating system)</li>
                    <li>Usage data (pages viewed, time spent, features used)</li>
                    <li>Cookies and similar tracking technologies</li>
                    <li>Log data (access times, error logs)</li>
                    <li>Location data (approximate location based on IP address)</li>
                  </ul>

                  <h4 className="font-semibold text-gray-900 mb-2 mt-6">2.3 Third-Party Information</h4>
                  <p>We may receive information about you from third parties such as:</p>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>Social media platforms (if you connect your account)</li>
                    <li>Payment processors</li>
                    <li>Analytics providers</li>
                    <li>Marketing partners</li>
                  </ul>
                </>
              }
            />

            <Section
              title="3. How We Use Your Information"
              content={
                <>
                  <p>We use your information for the following purposes:</p>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li><strong>Provide Services:</strong> Facilitate courses, live classes, and platform features</li>
                    <li><strong>Account Management:</strong> Create and manage your account</li>
                    <li><strong>Communication:</strong> Send notifications, updates, and support messages</li>
                    <li><strong>Payments:</strong> Process transactions and manage subscriptions</li>
                    <li><strong>Personalization:</strong> Recommend courses and customize your experience</li>
                    <li><strong>Analytics:</strong> Improve platform performance and user experience</li>
                    <li><strong>Security:</strong> Detect and prevent fraud, abuse, and security issues</li>
                    <li><strong>Legal Compliance:</strong> Comply with legal obligations and enforce our terms</li>
                    <li><strong>Marketing:</strong> Send promotional content (with your consent)</li>
                  </ul>
                </>
              }
            />

            <Section
              title="4. How We Share Your Information"
              content={
                <>
                  <p>We may share your information in the following circumstances:</p>
                  
                  <h4 className="font-semibold text-gray-900 mb-2 mt-4">4.1 With Other Users</h4>
                  <p>Your profile information, courses, and ratings may be visible to other users on the platform.</p>

                  <h4 className="font-semibold text-gray-900 mb-2 mt-4">4.2 Service Providers</h4>
                  <p>We share information with trusted third-party service providers who help us operate our platform:</p>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>Cloud hosting providers</li>
                    <li>Payment processors</li>
                    <li>Email service providers</li>
                    <li>Analytics services</li>
                    <li>Customer support tools</li>
                  </ul>

                  <h4 className="font-semibold text-gray-900 mb-2 mt-4">4.3 Legal Requirements</h4>
                  <p>We may disclose your information if required by law or in response to:</p>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>Legal processes (subpoenas, court orders)</li>
                    <li>Government requests</li>
                    <li>Protection of rights and safety</li>
                    <li>Fraud prevention and investigation</li>
                  </ul>

                  <h4 className="font-semibold text-gray-900 mb-2 mt-4">4.4 Business Transfers</h4>
                  <p>In the event of a merger, acquisition, or sale of assets, your information may be transferred to the new entity.</p>
                </>
              }
            />

            <Section
              title="5. Data Security"
              content={
                <>
                  <p>
                    We implement industry-standard security measures to protect your information:
                  </p>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>Encryption of data in transit (SSL/TLS)</li>
                    <li>Encryption of sensitive data at rest</li>
                    <li>Regular security audits and updates</li>
                    <li>Access controls and authentication</li>
                    <li>Employee training on data protection</li>
                    <li>Incident response procedures</li>
                  </ul>
                  <p className="mt-4">
                    However, no method of transmission over the internet is 100% secure. While we strive to protect your information, we cannot guarantee absolute security.
                  </p>
                </>
              }
            />

            <Section
              title="6. Your Rights and Choices"
              content={
                <>
                  <p>You have the following rights regarding your personal information:</p>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li><strong>Access:</strong> Request a copy of your personal data</li>
                    <li><strong>Correction:</strong> Update or correct inaccurate information</li>
                    <li><strong>Deletion:</strong> Request deletion of your account and data</li>
                    <li><strong>Portability:</strong> Request your data in a portable format</li>
                    <li><strong>Opt-Out:</strong> Unsubscribe from marketing communications</li>
                    <li><strong>Cookies:</strong> Manage cookie preferences in your browser</li>
                    <li><strong>Object:</strong> Object to certain processing activities</li>
                  </ul>
                  <p className="mt-4">
                    To exercise these rights, contact us at <a href="mailto:privacy@onlineteaching.com" className="text-blue-600 hover:underline">privacy@onlineteaching.com</a>
                  </p>
                </>
              }
            />

            <Section
              title="7. Cookies and Tracking Technologies"
              content={
                <>
                  <p>We use cookies and similar technologies to:</p>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>Keep you logged in</li>
                    <li>Remember your preferences</li>
                    <li>Analyze platform usage</li>
                    <li>Provide personalized content</li>
                    <li>Improve security</li>
                  </ul>
                  <p className="mt-4">
                    You can control cookies through your browser settings. Note that disabling cookies may affect platform functionality.
                  </p>
                </>
              }
            />

            <Section
              title="8. Children's Privacy"
              content={
                <>
                  <p>
                    Our platform is not intended for children under 13 years of age without parental consent. We do not knowingly collect personal information from children under 13.
                  </p>
                  <p className="mt-4">
                    For users aged 13-18, we require parental or guardian consent. Parents can manage their child's account and monitor their activity.
                  </p>
                  <p className="mt-4">
                    If you believe we have collected information from a child without proper consent, please contact us immediately.
                  </p>
                </>
              }
            />

            <Section
              title="9. International Data Transfers"
              content={
                <>
                  <p>
                    Your information may be transferred to and processed in countries other than your country of residence. These countries may have different data protection laws.
                  </p>
                  <p className="mt-4">
                    We ensure appropriate safeguards are in place for international transfers, including:
                  </p>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>Standard contractual clauses</li>
                    <li>Privacy Shield certification (where applicable)</li>
                    <li>Adequacy decisions</li>
                  </ul>
                </>
              }
            />

            <Section
              title="10. Data Retention"
              content={
                <>
                  <p>
                    We retain your information for as long as necessary to:
                  </p>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>Provide our services</li>
                    <li>Comply with legal obligations</li>
                    <li>Resolve disputes</li>
                    <li>Enforce our agreements</li>
                  </ul>
                  <p className="mt-4">
                    When your account is deleted, we will delete or anonymize your personal information within 90 days, except where retention is required by law.
                  </p>
                </>
              }
            />

            <Section
              title="11. Changes to This Policy"
              content={
                <>
                  <p>
                    We may update this Privacy Policy from time to time. We will notify you of material changes by:
                  </p>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>Email notification</li>
                    <li>Platform notification</li>
                    <li>Updating the "Last Updated" date</li>
                  </ul>
                  <p className="mt-4">
                    Your continued use of the platform after changes indicates acceptance of the updated policy.
                  </p>
                </>
              }
            />

            <Section
              title="12. Contact Us"
              content={
                <>
                  <p>
                    If you have questions or concerns about this Privacy Policy, please contact us:
                  </p>
                  <div className="mt-4 bg-gray-50 p-4 rounded-lg">
                    <p><strong>Email:</strong> <a href="mailto:privacy@onlineteaching.com" className="text-blue-600 hover:underline">privacy@onlineteaching.com</a></p>
                    <p className="mt-2"><strong>Address:</strong> 123 Education Street, New York, NY 10001, USA</p>
                    <p className="mt-2"><strong>Phone:</strong> +1 (555) 123-4567</p>
                  </div>
                </>
              }
            />

          </div>
        </div>
      </section>
    </div>
  )
}

function Section({ title, content }) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">{title}</h2>
      <div className="text-gray-600 space-y-4">
        {content}
      </div>
    </div>
  )
}
