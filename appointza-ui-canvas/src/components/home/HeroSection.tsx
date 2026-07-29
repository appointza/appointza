
import { Link } from 'react-router-dom';
import { CheckCircle2, MessageCircle, MapPin, BarChart3, Users, Globe, CreditCard } from 'lucide-react';
import { useParallax } from '@/hooks/useParallax';

const HeroSection = () => {
  // Parallax effects for background elements
  const parallax1 = useParallax({ speed: 0.3 });
  const parallax2 = useParallax({ speed: -0.2 });
  const parallax3 = useParallax({ speed: 0.4 });
  const heroImageParallax = useParallax({ speed: 0.15 });

  return (
    <section className="pt-20 sm:pt-24 md:pt-32 pb-12 sm:pb-16 md:pb-20 px-3 sm:px-4 md:px-6 relative overflow-hidden bg-gradient-to-b from-appointza-light via-white to-appointza-light">
      {/* Background Elements with Parallax */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          ref={parallax1.ref}
          style={parallax1.style}
          className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-appointza-orange opacity-10 blur-3xl"
        ></div>
        <div 
          ref={parallax2.ref}
          style={parallax2.style}
          className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-appointza-teal opacity-10 blur-3xl"
        ></div>
        <div 
          ref={parallax3.ref}
          style={parallax3.style}
          className="absolute top-1/3 left-1/4 w-64 h-64 rounded-full bg-appointza-pink opacity-10 blur-3xl"
        ></div>
      </div>
      
      <div className="container mx-auto relative z-10 max-w-7xl px-3 sm:px-4 md:px-6">
        <div className="max-w-5xl mx-auto">
          {/* Main Heading */}
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-appointza-navy mb-4 leading-tight">
              Slot-Based Booking Platform
              <span className="block mt-2 bg-gradient-appointza bg-clip-text text-transparent">
                for Services & Events
              </span>
            </h1>
          </div>
          
          {/* Description - SHORT & IMPACTFUL */}
          <div className="text-center mb-10">
            <p className="text-base sm:text-lg md:text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
              Manage bookings, staff, payments, and customers with WhatsApp notifications — all in one place.
            </p>
          </div>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-8">
            <Link 
              to="/register" 
              className="appt-btn appt-btn-primary text-base sm:text-lg px-8 py-4 min-w-[180px] text-center"
            >
              Get Started Free
            </Link>
            <Link 
              to="/demo" 
              className="appt-btn appt-btn-secondary text-base sm:text-lg px-8 py-4 min-w-[180px] text-center"
            >
              Book a Demo
            </Link>
          </div>
          
          {/* Trust Badge */}
          <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
            <CheckCircle2 className="w-5 h-5 text-appointza-teal flex-shrink-0" />
            <span>Secure, fast, and reliable appointment booking</span>
          </div>
        </div>
        
        {/* Hero Image with Parallax */}
        <div 
          ref={heroImageParallax.ref}
          style={heroImageParallax.style}
          className="mt-8 sm:mt-12 md:mt-16 max-w-4xl mx-auto relative px-2 sm:px-4"
        >
          <div className="bg-white rounded-xl shadow-xl overflow-hidden">
            <div className="aspect-[16/9] bg-gradient-to-r from-gray-50 to-gray-100 p-2 sm:p-4 flex items-center justify-center">
              <div className="relative w-full max-w-2xl">
                {/* Calendar Interface Mockup */}
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                  {/* Header */}
                  <div className="bg-appointza-navy text-white p-2 sm:p-4">
                    <div className="text-sm sm:text-base md:text-lg font-semibold">Appointza Dashboard</div>
                  </div>
                  
                  {/* Calendar Body */}
                  <div className="grid grid-cols-7 gap-0.5 sm:gap-1 p-1.5 sm:p-3 text-xs sm:text-sm">
                    {/* Days of Week */}
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                      <div key={day} className="p-1 sm:p-2 text-center font-medium text-gray-500 truncate">
                        {day}
                      </div>
                    ))}
                    
                    {/* Calendar Dates */}
                    {Array.from({ length: 35 }, (_, i) => {
                      const day = i - 3; // Start from previous month
                      const isCurrentMonth = day > 0 && day <= 30;
                      const isToday = day === 15;
                      const hasAppointment = [8, 12, 19, 22, 25].includes(day);
                      
                      return (
                        <div 
                          key={i} 
                          className={`p-1 sm:p-2 text-center rounded-md ${
                            isCurrentMonth 
                              ? isToday
                                ? 'bg-appointza-teal text-white font-semibold' 
                                : hasAppointment
                                  ? 'bg-blue-50 text-appointza-navy'
                                  : 'hover:bg-gray-50'
                              : 'text-gray-300'
                          }`}
                        >
                          <span className="text-xs sm:text-sm">
                            {isCurrentMonth ? day : day <= 0 ? 31 + day : day - 30}
                          </span>
                          {hasAppointment && (
                            <div className="w-1 h-1 bg-appointza-pink rounded-full mx-auto mt-0.5 sm:mt-1"></div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                {/* Appointment Cards - Hidden on very small screens, shown on sm+ */}
                <div className="hidden sm:block absolute -right-4 sm:-right-6 md:-right-10 -bottom-4 sm:-bottom-6 md:-bottom-10 bg-white rounded-lg shadow-lg p-2 sm:p-3 md:p-4 w-32 sm:w-40 md:w-48 border-l-4 border-appointza-pink">
                  <div className="text-xs sm:text-sm font-semibold">Today's Schedule</div>
                  <div className="text-xs text-gray-500 mt-1 sm:mt-2">3:00 PM - Hair Cut</div>
                  <div className="text-xs text-gray-500">5:15 PM - Consultation</div>
                </div>
                
                <div className="hidden sm:block absolute -left-4 sm:-left-6 md:-left-10 top-4 sm:top-6 md:top-10 bg-white rounded-lg shadow-lg p-2 sm:p-3 md:p-4 w-32 sm:w-40 md:w-48 border-l-4 border-appointza-teal">
                  <div className="text-xs sm:text-sm font-semibold">New Booking</div>
                  <div className="text-xs text-gray-500 mt-1 sm:mt-2">John Smith - Tomorrow</div>
                  <div className="text-xs text-gray-500">10:30 AM - Checkup</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
