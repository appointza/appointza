
import { Link } from "react-router-dom";
import { useFadeInOnScroll } from "@/hooks/useParallax";

const CtaSection = () => {
  const fadeIn = useFadeInOnScroll(0.2);
  const handleWhatsAppClick = () => {
    window.open('https://wa.me/919080539126?text=I%20am%20interested%20in%20Appointza%20services', '_blank');
  };

  return (
    <section className="py-12 sm:py-16 md:py-20 px-3 sm:px-4 md:px-6 relative bg-appointza-light overflow-hidden">
      {/* Background Gradient Elements */}
      <div className="absolute inset-0 opacity-50">
        <div className="absolute top-0 right-0 w-64 h-64 bg-appointza-orange opacity-10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-appointza-teal opacity-10 rounded-full blur-3xl"></div>
      </div>
      
      <div className="container mx-auto relative z-10 max-w-7xl px-3 sm:px-4 md:px-6">
        <div ref={fadeIn.ref} className={`max-w-3xl mx-auto text-center ${fadeIn.className}`}>
          <h2 className="section-title">Ready to streamline your scheduling?</h2>
          <p className="section-subtitle">
            Join Appointza today and focus more on what you do best.
          </p>
          
          <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 sm:gap-4 mt-8 sm:mt-10 px-4">
            <Link to="/register" className="appt-btn appt-btn-primary">
              Start for Free
            </Link>
            <Link to="/plans" className="appt-btn appt-btn-secondary">
              See Plans
            </Link>
            <button 
              onClick={handleWhatsAppClick}
              className="appt-btn bg-green-500 text-white hover:bg-green-600"
            >
              Contact on WhatsApp
            </button>
          </div>
          
          <div className="mt-12 flex flex-col md:flex-row justify-center items-center gap-6 text-sm text-gray-600">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2 text-appointza-teal" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>No credit card required</span>
            </div>
            
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2 text-appointza-teal" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>14-day free trial</span>
            </div>
            
          </div>
        </div>
      </div>
    </section>
  );
};

export default CtaSection;
