
import { 
  Stethoscope, 
  BookOpen, 
  Briefcase, 
  Scissors, 
  Calendar 
} from "lucide-react";
import { useParallax, useFadeInOnScroll } from "@/hooks/useParallax";

interface UseCaseCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  imageUrl?: string;
  imageAlt?: string;
  index?: number;
}

const UseCaseCard = ({ title, description, icon, color, imageUrl, imageAlt, index = 0 }: UseCaseCardProps) => {
  const imageParallax = useParallax({ speed: 0.12 + (index % 3) * 0.04 });
  const fadeIn = useFadeInOnScroll(0.2);

  return (
    <div 
      ref={fadeIn.ref}
      className={`overflow-hidden transition-all duration-300 hover:scale-105 ${fadeIn.className}`}
      style={{
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        transitionDelay: `${index * 150}ms`
      }}
    >
      {imageUrl && (
        <div ref={imageParallax.ref as React.RefObject<HTMLDivElement>} style={imageParallax.style}>
          <img 
            src={imageUrl} 
            alt={imageAlt || title}
            className="w-full"
            style={{
              height: '280px',
              objectFit: 'cover',
              display: 'block'
            }}
            loading="lazy"
            onError={(e) => {
              // Hide image if it fails to load
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
        </div>
      )}
      <div className="p-6 sm:p-8">
        {!imageUrl && (
          <div className="flex items-start mb-4">
            <div className="mr-4 p-3 rounded-full" style={{ backgroundColor: `${color}20` }}>
              <div style={{ color }}>{icon}</div>
            </div>
          </div>
        )}
        <h3 className="text-xl sm:text-2xl font-semibold text-appointza-navy mb-3">{title}</h3>
        <p className="text-gray-600 leading-relaxed">{description}</p>
      </div>
    </div>
  );
};

const UseCasesSection = () => {
  const useCases = [
    {
      title: "Beauty Salons & Parlours",
      description: "Book chairs and stylists in real-time. Customers see available slots for haircuts, styling, facials, and treatments. No more walk-ins waiting—every appointment is confirmed.",
      icon: <Scissors size={24} />,
      color: "#F04E98", // appointza-pink
      imageUrl: "https://images.pexels.com/photos/7750108/pexels-photo-7750108.jpeg",
      imageAlt: "Modern Beauty Salon Interior"
    },
    {
      title: "Spa & Wellness Centers",
      description: "Manage therapist schedules and treatment rooms. Book massages, facials, and wellness packages. Customers choose their preferred therapist and time slot.",
      icon: <Stethoscope size={24} />,
      color: "#1AAFCC", // appointza-teal
      imageUrl: "https://peacefulwarriorswellness.com/wp-content/uploads/2025/07/types_of_massage_therapy_7ut23.jpg",
      imageAlt: "Luxury Spa Massage Room"
    },
    {
      title: "Turf & Sports Facilities",
      description: "Customers book time slots for cricket, football, and other sports. Manage multiple grounds, track availability, and handle peak-hour demand efficiently.",
      icon: <Calendar size={24} />,
      color: "#2DD4BF", // teal
      imageUrl: "https://p2.piqsels.com/preview/98/977/312/cricket-field-sport-game.jpg",
      imageAlt: "Sports Turf Ground"
    },
    {
      title: "Tutors & Educators",
      description: "Students book classes and sessions. Manage multiple subjects, track attendance, and organize your teaching schedule across different time slots.",
      icon: <BookOpen size={24} />,
      color: "#FF8A50", // appointza-orange
      imageUrl: "https://images.pexels.com/photos/5905701/pexels-photo-5905701.jpeg",
      imageAlt: "Online Tutor Teaching Student"
    },
    {
      title: "Freelancers & Consultants",
      description: "Clients book consultation slots. Manage project discussions, client meetings, and consultations without double-booking or scheduling conflicts.",
      icon: <Briefcase size={24} />,
      color: "#8B5CF6", // purple
      imageUrl: "https://gostaffy.com/wp-content/uploads/2025/02/Virtual-Staffing.jpg",
      imageAlt: "Freelance Consultant in Professional Meeting"
    }
  ];

  return (
    <section className="py-12 sm:py-16 md:py-20 px-3 sm:px-4 md:px-6 bg-white">
      <div className="container mx-auto max-w-7xl px-3 sm:px-4 md:px-6">
        <h2 className="section-title text-center">Perfect for Every Service Business</h2>
        <p className="section-subtitle text-center">
          From beauty salons to sports facilities, Appointza adapts to your industry needs. 
          See how different businesses use our platform to streamline operations and grow.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mt-8 sm:mt-12">
          {useCases.map((useCase, index) => (
            <UseCaseCard key={index} {...useCase} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default UseCasesSection;
