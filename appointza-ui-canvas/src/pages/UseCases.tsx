
import { Helmet } from "react-helmet-async";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { 
  Stethoscope, 
  BookOpen, 
  Briefcase, 
  Scissors, 
  Calendar,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface UseCaseDetailProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  benefits: string[];
}

const UseCaseDetail = ({ title, description, icon, color, benefits }: UseCaseDetailProps) => {
  return (
    <div className="mb-16 p-6 rounded-lg bg-white shadow-lg border-t-4" style={{ borderColor: color }}>
      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-1/3">
          <div className="flex items-center mb-4">
            <div className="p-4 rounded-full mr-4" style={{ backgroundColor: `${color}20` }}>
              <div style={{ color }}>{icon}</div>
            </div>
            <h3 className="text-2xl font-bold text-appointza-navy">{title}</h3>
          </div>
          <p className="text-gray-600 mb-6">{description}</p>
          <Button asChild className="w-full md:w-auto" style={{ backgroundColor: color }}>
            <Link to="/register">Get Started</Link>
          </Button>
        </div>
        
        <div className="md:w-2/3">
          <h4 className="text-lg font-semibold mb-4 text-appointza-navy">Key Benefits</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-start">
                <div className="mt-1 mr-2" style={{ color }}>
                  <Check size={18} />
                </div>
                <p className="text-gray-700">{benefit}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const UseCases = () => {
  const useCaseDetails = [
    {
      title: "Clinics & Hospitals",
      description: "Streamline patient scheduling, reduce no-shows, and manage medical appointments efficiently.",
      icon: <Stethoscope size={28} />,
      color: "#1AAFCC", // appointza-teal
      benefits: [
        "Reduce patient wait times and streamline check-in",
        "Send automated appointment reminders to decrease no-shows",
        "Track patient history and appointment patterns",
        "Organize doctor schedules and optimize clinic capacity",
        "Integrate with existing hospital management systems",
        "Generate detailed reports on patient flow and clinic performance"
      ]
    },
    {
      title: "Tutors & Educators",
      description: "Schedule classes, manage student appointments, and organize your teaching calendar.",
      icon: <BookOpen size={28} />,
      color: "#FF8A50", // appointza-orange
      benefits: [
        "Create recurring lessons and class schedules",
        "Allow students to book available time slots 24/7",
        "Send lesson reminders to increase attendance",
        "Manage multiple subjects and student groups",
        "Track student attendance and lesson history",
        "Create customized pricing for different class types"
      ]
    },
    {
      title: "Freelancers & Consultants",
      description: "Organize client meetings, consultations, and project discussions without scheduling conflicts.",
      icon: <Briefcase size={28} />,
      color: "#F04E98", // appointza-pink
      benefits: [
        "Set custom availability around your flexible schedule",
        "Create buffer time between appointments",
        "Send professional booking confirmations and reminders",
        "Collect pre-meeting information from clients",
        "Integrate with your video conferencing tools",
        "Accept prepayments for consultation services"
      ]
    },
    {
      title: "Salons & Wellness Centers",
      description: "Manage beauty treatments, spa appointments, and staff schedules in one unified system.",
      icon: <Scissors size={28} />,
      color: "#8B5CF6", // purple
      benefits: [
        "Create service-specific appointment durations",
        "Assign bookings to specific staff members",
        "Send automatic appointment reminders to clients",
        "Allow clients to select their preferred stylists",
        "Track client history and service preferences",
        "Manage multiple treatment rooms and resources"
      ]
    },
    {
      title: "Event Planners & More",
      description: "Coordinate event consultations, venue visits, and client meetings for seamless planning.",
      icon: <Calendar size={28} />,
      color: "#2DD4BF", // teal
      benefits: [
        "Schedule venue tours and client consultations",
        "Block out time for event setup and breakdown",
        "Coordinate with vendors and service providers",
        "Send automated meeting reminders to clients",
        "Track event timelines and important milestones",
        "Manage multiple events simultaneously"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Use Cases - Appointza</title>
      </Helmet>
      
      <Header />
      
      <main className="pt-24 pb-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-3xl md:text-4xl font-bold text-appointza-navy mb-4">
              Appointza for Every Industry
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our scheduling platform adapts to diverse industries with specialized appointment booking needs.
              See how Appointza can transform your business.
            </p>
          </div>
          
          <div className="space-y-8">
            {useCaseDetails.map((useCase, index) => (
              <UseCaseDetail key={index} {...useCase} />
            ))}
          </div>
          
          <div className="mt-16 text-center">
            <h2 className="text-2xl font-bold text-appointza-navy mb-4">Ready to streamline your appointment booking?</h2>
            <p className="text-lg text-gray-600 mb-8">
              Affordable pricing with transparent fees. No hidden costs.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button asChild size="lg" className="bg-appointza-teal hover:bg-appointza-teal/90">
                <Link to="/register">Create Account</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/plans">View Pricing</Link>
              </Button>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default UseCases;
