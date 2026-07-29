
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { 
  Calendar, 
  MessageCircle, 
  CreditCard, 
  MapPin, 
  Users, 
  Globe, 
  BarChart3, 
  Shield, 
  Zap,
  Building2
} from "lucide-react";
import { useParallax, useFadeInOnScroll } from "@/hooks/useParallax";

interface ValuePropCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
  bgColor: string;
  iconColor: string;
  imageUrl?: string;
  imageAlt?: string;
  index: number;
}

const ValuePropCard = ({ title, description, icon, gradient, bgColor, iconColor, imageUrl, imageAlt, index }: ValuePropCardProps) => {
  const imageParallax = useParallax({ speed: 0.08 + (index % 4) * 0.03 });
  const fadeIn = useFadeInOnScroll(0.15);

  return (
    <div
      ref={fadeIn.ref}
      className={`bg-white border-none shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group hover:-translate-y-1 text-center ${fadeIn.className}`}
      style={{
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
              className="w-full h-auto rounded-xl"
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
          <div className={`hidden justify-center p-3 rounded-full ${bgColor} ${iconColor} mx-auto mt-4`}>
            {icon}
          </div>
        </div>
      ) : (
        <div className={`flex justify-center mb-4 p-3 rounded-full ${bgColor} ${iconColor} mx-auto`}>
          {icon}
        </div>
      )}
      <h3 className="text-lg font-bold text-appointza-navy text-center mb-3 leading-tight">
        {title}
      </h3>
      <p className="text-sm text-gray-600 text-center leading-relaxed">
        {description}
      </p>
    </div>
  );
};

const ValuePropositionSection = () => {
  const reasons = [
    {
      title: "Reduce No-Shows",
      description: "Automated reminders and instant confirmations keep customers engaged. See up to 40% reduction in missed appointments.",
      icon: <Calendar size={28} />,
      gradient: "from-appointza-teal to-appointza-softGreen",
      bgColor: "bg-appointza-softGreen",
      iconColor: "text-appointza-teal",
      imageUrl: "https://cdn.prod.website-files.com/61f8bc0bcfbb27562c575b9a/677d215c8b310dc973d5aba5_calendar%20schedule.png",
      imageAlt: "Calendar schedule with reminders to reduce no-shows"
    },
    {
      title: "Save Admin Time",
      description: "Automate booking confirmations, reminders, and follow-ups. Free up hours every week to focus on growing your business.",
      icon: <Zap size={28} />,
      gradient: "from-appointza-orange to-appointza-pink",
      bgColor: "bg-appointza-softPeach",
      iconColor: "text-appointza-orange",
      imageUrl: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=1200",
      imageAlt: "Business professional enjoying time saved through automation"
    },
    {
      title: "Faster Confirmations",
      description: "Customers get instant WhatsApp confirmations. No more phone tag or waiting for email replies. Bookings happen in seconds.",
      icon: <MessageCircle size={28} />,
      gradient: "from-appointza-pink to-appointza-purple",
      bgColor: "bg-appointza-softPurple",
      iconColor: "text-appointza-pink",
      imageUrl: "https://doublemyleads.com/wp-content/uploads/2025/08/f1807356-83a1-4ccd-a5ce-1ec9eb734c59-1024x559.jpg",
      imageAlt: "Instant WhatsApp booking confirmation on smartphone"
    },
    {
      title: "Better Customer Experience",
      description: "24/7 online booking, instant availability, and seamless payments. Give customers the modern experience they expect.",
      icon: <Users size={28} />,
      gradient: "from-appointza-teal to-appointza-softGreen",
      bgColor: "bg-appointza-softGreen",
      iconColor: "text-appointza-teal",
      imageUrl: "https://www.peakoutsourcing.com/wp-content/uploads/2025/08/The-Role-of-Automation-in-Creating-Seamless-Retail-Experiences-Image-raw.webp",
      imageAlt: "Seamless modern customer experience with automation"
    },
    {
      title: "Grow Your Revenue",
      description: "Fill empty slots automatically, upsell services, and track what's working. Make data-driven decisions to increase earnings.",
      icon: <BarChart3 size={28} />,
      gradient: "from-appointza-orange to-appointza-pink",
      bgColor: "bg-appointza-softPeach",
      iconColor: "text-appointza-orange",
      imageUrl: "/growurrevenue.jpg",
      imageAlt: "Upward trending revenue growth analytics chart on screen"
    },
    {
      title: "Scale Without Limits",
      description: "Add locations, staff, and services without complexity. The platform grows with you from startup to enterprise.",
      icon: <Building2 size={28} />,
      gradient: "from-appointza-pink to-appointza-purple",
      bgColor: "bg-appointza-softPurple",
      iconColor: "text-appointza-pink",
      imageUrl: "https://cdn.prod.website-files.com/67eea14f36cd176da24ccd2e/681272ca34766875681efee6_49e8cd359d47defd5c35b308cb890e6e7d3c250b.jpeg",
      imageAlt: "Business scaling with growth and expansion"
    },
    {
      title: "Secure & Reliable",
      description: "Bank-level security for payments and data. 99.9% uptime guarantee ensures your business never misses a booking.",
      icon: <Shield size={28} />,
      gradient: "from-appointza-teal to-appointza-softGreen",
      bgColor: "bg-appointza-softGreen",
      iconColor: "text-appointza-teal",
      imageUrl: "https://sharevault.com/wp-content/uploads/2025/04/document-protectionprivate-equity.svg",
      imageAlt: "Secure shield for data protection and reliability"
    },
    {
      title: "Easy Setup",
      description: "Get started in minutes, not weeks. No technical skills needed. Our team helps you launch and grow successfully.",
      icon: <Globe size={28} />,
      gradient: "from-appointza-orange to-appointza-pink",
      bgColor: "bg-appointza-softPeach",
      iconColor: "text-appointza-orange",
      imageUrl: "https://aventigroup.com/wp-content/uploads/2024/06/3.jpg",
      imageAlt: "Easy and fast setup process illustration"
    }
  ];

  return (
    <section className="py-12 sm:py-16 md:py-20 px-3 sm:px-4 md:px-6" style={{ background: '#fff' }}>
      <div className="container mx-auto max-w-7xl px-3 sm:px-4 md:px-6">
        <div className="text-center mb-8 sm:mb-12 md:mb-16">
          <h2 className="section-title">Why Choose Appointza?</h2>
          <p className="section-subtitle max-w-3xl mx-auto">
            See the real benefits that help your business grow faster and serve customers better.
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 md:gap-10">
          {reasons.map((reason, index) => (
            <ValuePropCard
              key={index}
              {...reason}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ValuePropositionSection;
