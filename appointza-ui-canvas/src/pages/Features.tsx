
import { Helmet } from "react-helmet-async";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { 
  Calendar, 
  Clock, 
  Users, 
  Smartphone,
  Bell,
  BarChart3,
  Shield,
  CreditCard,
  Zap,
  CheckCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}

const FeatureCard = ({ icon, title, description, color }: FeatureCardProps) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-lg border-t-4 hover:shadow-xl transition-shadow" style={{ borderColor: color }}>
      <div className="flex items-center mb-4">
        <div className="p-3 rounded-full mr-4" style={{ backgroundColor: `${color}20` }}>
          <div style={{ color }}>{icon}</div>
        </div>
        <h3 className="text-xl font-semibold text-appointza-navy">{title}</h3>
      </div>
      <p className="text-gray-600">{description}</p>
    </div>
  );
};

const Features = () => {
  const features = [
    {
      icon: <Calendar size={24} />,
      title: "Smart Scheduling",
      description: "Intelligent appointment booking that prevents conflicts and optimizes your calendar automatically.",
      color: "#1AAFCC"
    },
    {
      icon: <Clock size={24} />,
      title: "Real-time Availability",
      description: "Live calendar sync ensures customers always see accurate time slots and can book instantly.",
      color: "#FF8A50"
    },
    {
      icon: <Bell size={24} />,
      title: "Automated Reminders",
      description: "Reduce no-shows with smart SMS and email reminders sent automatically to your clients.",
      color: "#F04E98"
    },
    {
      icon: <Smartphone size={24} />,
      title: "Mobile Optimized",
      description: "Perfect experience on any device - your customers can book from anywhere, anytime.",
      color: "#8B5CF6"
    },
    {
      icon: <Users size={24} />,
      title: "Staff Management",
      description: "Manage multiple staff members, their schedules, and assign specific services to each team member.",
      color: "#2DD4BF"
    },
    {
      icon: <BarChart3 size={24} />,
      title: "Analytics & Reports",
      description: "Track your business performance with detailed insights on bookings, revenue, and customer trends.",
      color: "#10B981"
    },
    {
      icon: <Shield size={24} />,
      title: "Secure & Reliable",
      description: "Enterprise-grade security ensures your data and your customers' information is always protected.",
      color: "#6366F1"
    },
    {
      icon: <CreditCard size={24} />,
      title: "Payment Integration",
      description: "Accept payments online with secure payment processing and automated invoicing.",
      color: "#EC4899"
    },
    {
      icon: <Zap size={24} />,
      title: "Quick Setup",
      description: "Get started in minutes with our intuitive setup process and pre-built templates.",
      color: "#F59E0B"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Features - Appointza</title>
      </Helmet>
      
      <Header />
      
      <main className="pt-24 pb-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-3xl md:text-4xl font-bold text-appointza-navy mb-4">
              Powerful Features for Modern Businesses
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to streamline your appointment booking and grow your business.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {features.map((feature, index) => (
              <FeatureCard key={index} {...feature} />
            ))}
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-appointza-navy mb-4">
              Ready to Transform Your Business?
            </h2>
            <p className="text-lg text-gray-600 mb-6">
              Affordable pricing with transparent fees. No setup fees, no hidden costs.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button asChild size="lg" className="bg-appointza-teal hover:bg-appointza-teal/90">
                <Link to="/register">Get Started Free</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/demo">Request Demo</Link>
              </Button>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Features;
