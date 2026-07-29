
import { Helmet } from "react-helmet-async";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const Terms = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Terms of Service - Appointza</title>
      </Helmet>
      
      <Header />
      
      <main className="pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-3xl font-bold text-appointza-navy mb-2">Terms & Conditions for Appointza</h1>
            <p className="text-gray-600 mb-8">Effective Date: January 15, 2025 | Last Updated: January 15, 2025</p>
            
            <div className="space-y-8">
              <section>
                <p className="text-gray-700 leading-relaxed mb-6">
                  These Terms & Conditions ("Terms") govern your access to and use of the services offered by Appointza Technology (OPC) Private Limited ("Appointza", "we", "our", or "us"), including our website, mobile app, and related services ("Services"). By using our Services, you agree to comply with these Terms. If you do not agree, please do not use our Services.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-appointza-navy mb-4">1. Use of Services</h2>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  <li>You must be at least 18 years old (or the legal age in your region) to use our Services.</li>
                  <li>You agree to use our Services only for lawful purposes.</li>
                  <li>You are responsible for maintaining the confidentiality of your account credentials and all activities under your account.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-appointza-navy mb-4">2. User Responsibilities</h2>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  <li>Provide accurate and complete information while registering or booking.</li>
                  <li>Do not misuse, hack, or attempt unauthorized access to our platform.</li>
                  <li>Respect other users, service providers, and staff listed on Appointza.</li>
                  <li>You are solely responsible for your bookings, cancellations, and communications.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-appointza-navy mb-4">3. Appointments & Payments</h2>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  <li>Appointza provides a platform to book, manage, and track appointments between businesses and customers.</li>
                  <li>Payments (if applicable) are processed through third-party gateways. We are not responsible for payment failures, delays, or disputes with banks.</li>
                  <li>Cancellation, refund, and rescheduling policies are set by the respective business/service provider.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-appointza-navy mb-4">4. Service Provider Responsibility</h2>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  <li>Businesses listed on Appointza are independent entities.</li>
                  <li>Appointza is not liable for the quality, availability, or outcome of services provided by businesses.</li>
                  <li>Any disputes must be resolved directly between the customer and the business.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-appointza-navy mb-4">5. Intellectual Property</h2>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  <li>All content, design, software, trademarks, and logos on Appointza are the property of Appointza Technology (OPC) Private Limited.</li>
                  <li>You may not copy, modify, distribute, or exploit our content without written permission.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-appointza-navy mb-4">6. Limitation of Liability</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Appointza acts as a booking facilitator and is not responsible for:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  <li>Errors, delays, or cancellations by businesses or customers.</li>
                  <li>Loss, damage, or injury arising from services booked via the platform.</li>
                  <li>Technical issues, downtime, or data loss.</li>
                </ul>
                <p className="text-gray-700 leading-relaxed mt-4">
                  To the maximum extent permitted by law, our liability is limited to the amount you paid (if any) for using the Services.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-appointza-navy mb-4">7. Termination</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  We may suspend or terminate your account if you:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  <li>Violate these Terms.</li>
                  <li>Engage in fraudulent, abusive, or illegal activities.</li>
                </ul>
                <p className="text-gray-700 leading-relaxed mt-4">
                  You may stop using our Services anytime by deleting your account.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-appointza-navy mb-4">8. Changes to Terms</h2>
                <p className="text-gray-700 leading-relaxed">
                  We may update these Terms from time to time. Any changes will be posted here with a revised "Last Updated" date. Continued use of our Services means you accept the updated Terms.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-appointza-navy mb-4">9. Governing Law & Dispute Resolution</h2>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  <li>These Terms shall be governed by the laws of India.</li>
                  <li>Any disputes shall be resolved in the courts of Cuddalore, Tamil Nadu, India.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-appointza-navy mb-4">10. Contact Us</h2>
                <p className="text-gray-700 leading-relaxed">
                  For questions regarding these Terms, please contact:
                  <br /><br />
                  <strong>APPOINTZA TECHNOLOGY (OPC) PRIVATE LIMITED</strong><br />
                  83A/7, CUDDALORE MAIN ROAD OPP.TO AISWARIYA HOME NEEDS, 2ND FLOOR, PANRUTI, Panruti, Panruti,<br />
                  Cuddalore- 607106, Tamil Nadu<br /><br />
                  📧 Email: appointza@gmail.com<br />
                  📞 Phone: +91-9080539126
                </p>
              </section>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Terms;
