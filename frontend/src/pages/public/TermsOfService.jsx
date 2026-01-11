export default function TermsOfService() {
  const lastUpdated = "January 15, 2024"

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-gray-800 to-gray-900 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-5xl font-bold mb-4">Terms of Service</h1>
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
              title="1. Acceptance of Terms"
              content={
                <>
                  <p>
                    Welcome to Online Teaching Platform. By accessing or using our platform, you agree to be bound by these Terms of Service ("Terms"). These Terms constitute a legally binding agreement between you and Online Teaching Platform ("we," "our," or "us").
                  </p>
                  <p className="mt-4">
                    If you do not agree to these Terms, you may not access or use our services. We reserve the right to modify these Terms at any time, and your continued use of the platform constitutes acceptance of any changes.
                  </p>
                </>
              }
            />

            <Section
              title="2. Eligibility"
              content={
                <>
                  <p>To use our platform, you must:</p>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>Be at least 13 years old (users 13-18 require parental consent)</li>
                    <li>Have the legal capacity to enter into binding contracts</li>
                    <li>Not be prohibited from using our services under applicable laws</li>
                    <li>Provide accurate and complete registration information</li>
                    <li>Maintain the security of your account credentials</li>
                  </ul>
                  <p className="mt-4">
                    Additional requirements apply for tutors, including proof of qualifications and teaching experience.
                  </p>
                </>
              }
            />

            <Section
              title="3. User Accounts"
              content={
                <>
                  <h4 className="font-semibold text-gray-900 mb-2">3.1 Account Registration</h4>
                  <p>You agree to:</p>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>Provide accurate, current, and complete information</li>
                    <li>Maintain and update your information</li>
                    <li>Keep your password secure and confidential</li>
                    <li>Notify us immediately of any unauthorized access</li>
                    <li>Be responsible for all activities under your account</li>
                  </ul>

                  <h4 className="font-semibold text-gray-900 mb-2 mt-6">3.2 Account Types</h4>
                  <p>We offer two types of accounts:</p>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li><strong>Student Accounts:</strong> Access courses, attend classes, and access materials</li>
                    <li><strong>Tutor Accounts:</strong> Create courses, teach classes, and earn revenue (subject to approval)</li>
                  </ul>

                  <h4 className="font-semibold text-gray-900 mb-2 mt-6">3.3 Account Termination</h4>
                  <p>We may suspend or terminate your account if you:</p>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>Violate these Terms</li>
                    <li>Engage in fraudulent or illegal activities</li>
                    <li>Provide false information</li>
                    <li>Fail to pay applicable fees</li>
                    <li>Abuse or harass other users</li>
                  </ul>
                </>
              }
            />

            <Section
              title="4. Subscriptions and Payments"
              content={
                <>
                  <h4 className="font-semibold text-gray-900 mb-2">4.1 Subscription Plans</h4>
                  <p>
                    Students must purchase a subscription to access courses. Plans are billed monthly and automatically renew unless cancelled.
                  </p>

                  <h4 className="font-semibold text-gray-900 mb-2 mt-4">4.2 Payment Terms</h4>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>Payments are processed through secure third-party processors</li>
                    <li>You authorize us to charge your payment method for recurring fees</li>
                    <li>Prices are subject to change with 30 days' notice</li>
                    <li>All fees are non-refundable except as required by law</li>
                  </ul>

                  <h4 className="font-semibold text-gray-900 mb-2 mt-4">4.3 Free Trial</h4>
                  <p>
                    New users may receive a free trial. If you don't cancel before the trial ends, you'll be charged for the selected plan.
                  </p>

                  <h4 className="font-semibold text-gray-900 mb-2 mt-4">4.4 Cancellation</h4>
                  <p>
                    You may cancel your subscription at any time. Access continues until the end of your billing period. No refunds for partial months.
                  </p>

                  <h4 className="font-semibold text-gray-900 mb-2 mt-4">4.5 Tutor Payments</h4>
                  <p>
                    Tutors earn 80% of course revenue. Payments are processed weekly with a minimum withdrawal of ₹50. We reserve the right to withhold payments for policy violations.
                  </p>
                </>
              }
            />

            <Section
              title="5. User Conduct"
              content={
                <>
                  <p>You agree NOT to:</p>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>Upload or share illegal, harmful, or offensive content</li>
                    <li>Impersonate others or misrepresent your identity</li>
                    <li>Harass, bully, or threaten other users</li>
                    <li>Violate intellectual property rights</li>
                    <li>Attempt to hack, disrupt, or compromise platform security</li>
                    <li>Use automated tools to scrape or copy content</li>
                    <li>Spam or send unsolicited communications</li>
                    <li>Share account credentials with others</li>
                    <li>Record classes without permission</li>
                    <li>Use the platform for commercial purposes outside approved tutor activities</li>
                  </ul>
                </>
              }
            />

            <Section
              title="6. Content and Intellectual Property"
              content={
                <>
                  <h4 className="font-semibold text-gray-900 mb-2">6.1 Our Content</h4>
                  <p>
                    All platform content (design, software, text, graphics, logos) is owned by us or our licensors and protected by copyright, trademark, and other laws. You may not copy, modify, or distribute our content without permission.
                  </p>

                  <h4 className="font-semibold text-gray-900 mb-2 mt-4">6.2 User Content</h4>
                  <p>
                    You retain ownership of content you create or upload. By posting content, you grant us a worldwide, non-exclusive, royalty-free license to use, display, and distribute your content on the platform.
                  </p>

                  <h4 className="font-semibold text-gray-900 mb-2 mt-4">6.3 Course Materials</h4>
                  <p>
                    Tutors retain copyright to their course materials. Students may access materials for personal educational use only and may not redistribute or resell them.
                  </p>

                  <h4 className="font-semibold text-gray-900 mb-2 mt-4">6.4 DMCA Policy</h4>
                  <p>
                    We respect intellectual property rights. If you believe your content has been infringed, contact us at <a href="mailto:dmca@onlineteaching.com" className="text-blue-600 hover:underline">dmca@onlineteaching.com</a> with required details.
                  </p>
                </>
              }
            />

            <Section
              title="7. Tutor-Specific Terms"
              content={
                <>
                  <h4 className="font-semibold text-gray-900 mb-2">7.1 Tutor Approval</h4>
                  <p>
                    All tutors must complete an application and approval process. We reserve the right to reject or revoke tutor status at our discretion.
                  </p>

                  <h4 className="font-semibold text-gray-900 mb-2 mt-4">7.2 Tutor Responsibilities</h4>
                  <p>Tutors agree to:</p>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>Provide accurate qualifications and credentials</li>
                    <li>Deliver quality education and maintain professionalism</li>
                    <li>Attend scheduled classes punctually</li>
                    <li>Respond to student inquiries in a timely manner</li>
                    <li>Create original or properly licensed course content</li>
                    <li>Comply with applicable education laws and regulations</li>
                  </ul>

                  <h4 className="font-semibold text-gray-900 mb-2 mt-4">7.3 Revenue Sharing</h4>
                  <p>
                    Tutors receive 80% of gross course revenue. We retain 20% as a platform fee. Revenue is calculated after refunds and chargebacks.
                  </p>

                  <h4 className="font-semibold text-gray-900 mb-2 mt-4">7.4 Independent Contractor</h4>
                  <p>
                    Tutors are independent contractors, not employees. You are responsible for your own taxes and insurance.
                  </p>
                </>
              }
            />

            <Section
              title="8. Privacy and Data Protection"
              content={
                <>
                  <p>
                    Your privacy is important to us. Our use of your personal information is governed by our <a href="/privacy-policy" className="text-blue-600 hover:underline">Privacy Policy</a>, which is incorporated into these Terms by reference.
                  </p>
                  <p className="mt-4">
                    You consent to our collection, use, and sharing of your information as described in the Privacy Policy.
                  </p>
                </>
              }
            />

            <Section
              title="9. Disclaimers and Limitations"
              content={
                <>
                  <h4 className="font-semibold text-gray-900 mb-2">9.1 Service "As Is"</h4>
                  <p>
                    Our platform is provided "as is" without warranties of any kind, express or implied. We do not guarantee uninterrupted, secure, or error-free service.
                  </p>

                  <h4 className="font-semibold text-gray-900 mb-2 mt-4">9.2 Educational Content</h4>
                  <p>
                    We do not guarantee educational outcomes or course quality. Tutors are solely responsible for their course content and teaching methods.
                  </p>

                  <h4 className="font-semibold text-gray-900 mb-2 mt-4">9.3 Third-Party Services</h4>
                  <p>
                    Our platform may integrate with third-party services. We are not responsible for third-party content, services, or policies.
                  </p>

                  <h4 className="font-semibold text-gray-900 mb-2 mt-4">9.4 Limitation of Liability</h4>
                  <p>
                    To the maximum extent permitted by law, we are not liable for any indirect, incidental, special, or consequential damages arising from your use of our services. Our total liability shall not exceed the amount you paid us in the past 12 months.
                  </p>
                </>
              }
            />

            <Section
              title="10. Indemnification"
              content={
                <>
                  <p>
                    You agree to indemnify and hold harmless Online Teaching Platform, its officers, directors, employees, and agents from any claims, damages, losses, or expenses (including legal fees) arising from:
                  </p>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>Your use of the platform</li>
                    <li>Your violation of these Terms</li>
                    <li>Your violation of any rights of others</li>
                    <li>Your content or conduct</li>
                  </ul>
                </>
              }
            />

            <Section
              title="11. Dispute Resolution"
              content={
                <>
                  <h4 className="font-semibold text-gray-900 mb-2">11.1 Informal Resolution</h4>
                  <p>
                    Before filing a claim, you agree to contact us at <a href="mailto:legal@onlineteaching.com" className="text-blue-600 hover:underline">legal@onlineteaching.com</a> to resolve the dispute informally.
                  </p>

                  <h4 className="font-semibold text-gray-900 mb-2 mt-4">11.2 Arbitration</h4>
                  <p>
                    Any disputes not resolved informally shall be settled by binding arbitration in accordance with the American Arbitration Association rules. You waive your right to a jury trial.
                  </p>

                  <h4 className="font-semibold text-gray-900 mb-2 mt-4">11.3 Class Action Waiver</h4>
                  <p>
                    You agree to resolve disputes individually and waive any right to participate in class action lawsuits.
                  </p>
                </>
              }
            />

            <Section
              title="12. General Provisions"
              content={
                <>
                  <h4 className="font-semibold text-gray-900 mb-2">12.1 Governing Law</h4>
                  <p>
                    These Terms are governed by the laws of the State of New York, USA, without regard to conflict of law principles.
                  </p>

                  <h4 className="font-semibold text-gray-900 mb-2 mt-4">12.2 Severability</h4>
                  <p>
                    If any provision is found invalid, the remaining provisions remain in full effect.
                  </p>

                  <h4 className="font-semibold text-gray-900 mb-2 mt-4">12.3 Entire Agreement</h4>
                  <p>
                    These Terms, together with our Privacy Policy, constitute the entire agreement between you and us.
                  </p>

                  <h4 className="font-semibold text-gray-900 mb-2 mt-4">12.4 Assignment</h4>
                  <p>
                    You may not assign these Terms without our consent. We may assign our rights without restriction.
                  </p>

                  <h4 className="font-semibold text-gray-900 mb-2 mt-4">12.5 No Waiver</h4>
                  <p>
                    Our failure to enforce any provision does not constitute a waiver of that provision.
                  </p>
                </>
              }
            />

            <Section
              title="13. Contact Information"
              content={
                <>
                  <p>
                    For questions about these Terms, please contact us:
                  </p>
                  <div className="mt-4 bg-gray-50 p-4 rounded-lg">
                    <p><strong>Email:</strong> <a href="mailto:legal@onlineteaching.com" className="text-blue-600 hover:underline">legal@onlineteaching.com</a></p>
                    <p className="mt-2"><strong>Address:</strong> 123 Education Street, New York, NY 10001, USA</p>
                    <p className="mt-2"><strong>Phone:</strong> +1 (555) 123-4567</p>
                  </div>
                </>
              }
            />

            {/* Acceptance */}
            <div className="border-t pt-8 mt-8">
              <p className="text-sm text-gray-600">
                By using our platform, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
              </p>
            </div>

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
