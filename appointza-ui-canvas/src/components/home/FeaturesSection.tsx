
import { Calendar, Users, Smartphone, Clock, Bell, Tag, MapPin, Shield, BarChart3, MessageCircle, CreditCard, Globe, TrendingUp } from "lucide-react";
import { useParallax, useFadeInOnScroll } from "@/hooks/useParallax";

interface FeatureCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  imageUrl?: string;
  imageAlt?: string;
  index?: number;
}

const FeatureCard = ({ title, description, icon, imageUrl, imageAlt, index = 0 }: FeatureCardProps) => {
  const imageParallax = useParallax({ speed: 0.1 + (index % 3) * 0.05 });
  const fadeIn = useFadeInOnScroll(0.2);

  return (
    <div 
      ref={fadeIn.ref}
      className={`flex flex-col items-center text-center transition-all duration-300 hover:scale-105 ${fadeIn.className}`}
      style={{
        background: 'white',
        borderRadius: '16px',
        padding: '2rem 1.5rem',
        boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
        transitionDelay: `${index * 100}ms`
      }}
    >
      {imageUrl ? (
        <div className="w-full mb-6 overflow-hidden rounded-xl">
          <div ref={imageParallax.ref} style={imageParallax.style}>
            <img 
              src={imageUrl} 
              alt={imageAlt || title}
              className="w-full h-auto rounded-xl shadow-lg"
              style={{ 
                borderRadius: '12px',
                boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                maxHeight: '220px',
                objectFit: 'cover',
                width: '100%'
              }}
              loading="lazy"
              onError={(e) => {
                // Fallback to icon if image fails to load
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const iconContainer = target.nextElementSibling as HTMLElement;
                if (iconContainer) {
                  iconContainer.style.display = 'flex';
                }
              }}
            />
          </div>
          <div className="w-14 h-14 bg-gradient-appointza rounded-lg flex items-center justify-center mx-auto mt-4 text-white hidden">
            {icon}
          </div>
        </div>
      ) : (
        <div className="w-14 h-14 bg-gradient-appointza rounded-lg flex items-center justify-center mb-4 text-white">
          {icon}
        </div>
      )}
      <h3 className="text-xl font-semibold text-appointza-navy mb-3">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </div>
  );
};

const FeaturesSection = () => {
  const features = [
    {
      title: "Real-Time Availability",
      description: "See live slot availability across all locations. Customers book instantly with zero conflicts or double-bookings.",
      icon: <Clock size={28} />,
      imageUrl: "https://cdn.prod.website-files.com/61f8bc0bcfbb27562c575b9a/677d215c8b310dc973d5aba5_calendar%20schedule.png",
      imageAlt: "Real-time calendar availability dashboard for bookings"
    },
    {
      title: "Automated Workflows",
      description: "Set up automated confirmations, reminders, and follow-ups. Reduce manual work and never miss a booking.",
      icon: <Bell size={28} />,
      imageUrl: "https://surgebythrive.com/wp-content/uploads/2025/06/service-page-hero-img-18.webp",
      imageAlt: "Automated workflows for booking reminders and notifications"
    },
    {
      title: "Client Management",
      description: "Maintain complete client profiles with booking history, preferences, and communication logs in one place.",
      icon: <Users size={28} />,
      imageUrl: "https://www.newmanwebsolutions.com/wp-content/uploads/elementor/thumbs/reputation-management-crm-qt3sr3pibl7segesa0covoe4ynt1jaef8czvc317jk.png",
      imageAlt: "Client profile management dashboard with history and preferences"
    },
    {
      title: "Revenue Insights",
      description: "Track earnings by service, location, staff member, or time period. Identify trends and optimize pricing strategies.",
      icon: <TrendingUp size={28} />,
      imageUrl: "https://www.accountingdepartment.com/hs-fs/hubfs/jirav-dashboard.jpg?width=800&name=jirav-dashboard.jpg",
      imageAlt: "Revenue analytics dashboard with graphs and insights"
    },
    {
      title: "Staff Scheduling",
      description: "Assign staff to specific services, manage shifts, and track performance. Handle leave requests and availability easily.",
      icon: <Calendar size={28} />,
      imageUrl: "https://parakeeto.com/wp-content/uploads/2023/04/harvest-team-report-1024x660.png",
      imageAlt: "Staff scheduling and shift management calendar"
    },
    {
      title: "Mobile Access",
      description: "Manage bookings on-the-go with our mobile-responsive dashboard. Access everything from your smartphone or tablet.",
      icon: <Smartphone size={28} />,
      imageUrl: "https://cdn.prod.website-files.com/61f8bc0bcfbb27562c575b9a/677de3e240f603ccabcc6366_MOBILE1.png",
      imageAlt: "Mobile dashboard access on smartphone for booking management"
    },
    {
      title: "Custom Branding",
      description: "White-label your booking page with your logo, colors, and domain. Create a seamless brand experience for customers.",
      icon: <Globe size={28} />,
      imageUrl: "https://cdn.prod.website-files.com/65d8cefc4f46c79b3df8c51b/66cb373291ed2056bc3b05bf_WHITE%20LABEL_Optimised.webp",
      imageAlt: "Custom branded white-label booking page with logo and colors"
    },
    {
      title: "Payment Integration",
      description: "Accept payments online with secure gateway integration. Track transactions and manage refunds effortlessly.",
      icon: <CreditCard size={28} />,
      imageUrl: "https://nationwidepaymentsystems.com/wp-content/uploads/2025/05/payment-links-6.png",
      imageAlt: "Secure payment integration gateway for online bookings"
    },
    {
      title: "Reporting & Exports",
      description: "Generate detailed reports on bookings, revenue, and performance. Export data for accounting and analysis.",
      icon: <BarChart3 size={28} />,
      imageUrl: "https://parakeeto.com/wp-content/uploads/2023/09/image-8-1024x564.png",
      imageAlt: "Detailed reporting dashboard with exportable data and charts"
    }
  ];

  return (
    <section className="py-12 sm:py-16 md:py-20 px-3 sm:px-4 md:px-6" style={{ background: '#f8f9fa' }}>
      <div className="container mx-auto max-w-7xl px-3 sm:px-4 md:px-6">
        <h2 className="section-title text-center mb-8 sm:mb-12 md:mb-16">Powerful Features</h2>
        <p className="section-subtitle text-center mb-8 sm:mb-12">
          Everything you need to streamline operations, manage your team, and grow your business—all from one platform.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 md:gap-10">
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
