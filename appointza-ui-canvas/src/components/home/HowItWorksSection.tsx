
import { Check, UserPlus, Clock, Share2, Calendar, MessageCircle, CheckCircle } from "lucide-react";
import { useFadeInOnScroll } from "@/hooks/useParallax";

interface StepProps {
  number: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  isLast?: boolean;
}

const Step = ({ number, title, description, icon, isLast = false }: StepProps) => {
  return (
    <div className="relative flex flex-col md:flex-row items-center md:items-start">
      {/* Step Number and Icon */}
      <div className="flex-shrink-0 w-16 h-16 bg-gradient-appointza rounded-full flex items-center justify-center text-white relative z-10">
        {icon}
      </div>
      
      {/* Connector Line */}
      {!isLast && (
        <div className="w-1 md:w-full h-16 md:h-1 bg-gray-200 absolute left-1/2 md:left-0 top-16 md:top-1/2 transform -translate-x-1/2 md:-translate-y-1/2 z-0 md:ml-16 md:mr-16"></div>
      )}
      
      {/* Content */}
      <div className="mt-4 md:mt-0 md:ml-6 text-center md:text-left">
        <div className="text-sm font-medium text-appointza-pink mb-1">Step {number}</div>
        <h3 className="text-xl font-semibold text-appointza-navy mb-2">{title}</h3>
        <p className="text-gray-600">{description}</p>
      </div>
    </div>
  );
};

const HowItWorksSection = () => {
  const fadeIn = useFadeInOnScroll(0.2);
  
  const steps = [
    {
      number: 1,
      title: "Sign up as an organization",
      description: "Create your organization account with business details. Set up multiple locations and add staff with role-based permissions.",
      icon: <UserPlus size={24} />
    },
    {
      number: 2,
      title: "Configure services, events & availability",
      description: "Define services and events with real-time slot availability. Set up business hours, pricing, and customize your booking page.",
      icon: <Clock size={24} />
    },
    {
      number: 3,
      title: "Share your customized webpage",
      description: "Get your unique, customized webpage showcasing your services or events. Share via email, social media, or embed on your website.",
      icon: <Share2 size={24} />
    },
    {
      number: 4,
      title: "Real-time booking with instant notifications",
      description: "Clients book available slots → You receive instant notification & WhatsApp → Confirm the booking → Client gets automatic WhatsApp confirmation. Track everything from your dashboard.",
      icon: <MessageCircle size={24} />
    }
  ];

  return (
    <section className="py-12 sm:py-16 md:py-20 px-3 sm:px-4 md:px-6 bg-gray-50">
      <div className="container mx-auto max-w-7xl px-3 sm:px-4 md:px-6">
        <div ref={fadeIn.ref} className={fadeIn.className}>
          <h2 className="section-title text-center">How Online Appointment Booking System with WhatsApp Integration Works</h2>
          <p className="section-subtitle text-center">
            Slot based service booking platform for businesses with real-time availability, automated booking confirmation system, and instant notifications. Get started in four simple steps.
          </p>
        </div>

        <div className="mt-16">
          <div className="hidden md:grid grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <Step 
                key={index} 
                {...step} 
                isLast={index === steps.length - 1}
              />
            ))}
          </div>

          <div className="md:hidden space-y-12">
            {steps.map((step, index) => (
              <Step 
                key={index} 
                {...step} 
                isLast={index === steps.length - 1}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
