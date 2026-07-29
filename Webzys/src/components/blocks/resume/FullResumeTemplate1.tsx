// Template 1: Classic Professional - Single Column Traditional Layout
// Clean, ATS-friendly layout with clear sections and conservative styling

import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Linkedin, Globe, Github, Award, GraduationCap, Briefcase, Star } from "lucide-react";

export interface ResumeTemplate1Data {
  profile: {
    fullName: string;
    title: string;
    email: string;
    phone: string;
    location: string;
    linkedin?: string;
    website?: string;
  };
  summary: string;
  experience: Array<{
    id: number;
    company: string;
    position: string;
    location: string;
    startDate: string;
    endDate: string;
    current: boolean;
    description: string;
    achievements: string[];
  }>;
  education: Array<{
    id: number;
    institution: string;
    degree: string;
    field: string;
    location: string;
    startDate: string;
    endDate: string;
    gpa?: string;
  }>;
  skills: Array<{ name: string; category?: string }>;
  certifications?: Array<{
    id: number;
    name: string;
    issuer: string;
    date: string;
  }>;
}

interface FullResumeTemplate1Props {
  data: ResumeTemplate1Data;
  isEditing?: boolean;
  onFieldChange?: (path: string, value: any) => void;
}

const EditableText = ({ 
  value, 
  path, 
  isEditing, 
  onFieldChange, 
  className = "",
  as: Component = "span" as any,
  placeholder = "Click to edit"
}: { 
  value: string; 
  path: string; 
  isEditing?: boolean; 
  onFieldChange?: (path: string, value: any) => void;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
  placeholder?: string;
}) => {
  if (!isEditing) {
    return <Component className={className}>{value || placeholder}</Component>;
  }
  
  return (
    <Component
      contentEditable
      suppressContentEditableWarning
      onBlur={(e: any) => onFieldChange?.(path, e.target.innerText)}
      className={`${className} outline-none border-b border-dashed border-blue-300 hover:border-blue-500 focus:border-blue-500 cursor-text`}
    >
      {value || placeholder}
    </Component>
  );
};

const FullResumeTemplate1 = ({ data, isEditing, onFieldChange }: FullResumeTemplate1Props) => {
  const sectionClass = "mb-6";
  const headerClass = "text-lg font-bold text-slate-800 border-b-2 border-slate-800 pb-1 mb-4 uppercase tracking-wide";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white min-h-screen font-serif"
    >
      {/* Header / Profile Section */}
      <header className="bg-slate-50 border-b-4 border-slate-800 px-8 py-8">
        <div className="max-w-3xl mx-auto text-center">
          <EditableText
            value={data.profile.fullName}
            path="profile.fullName"
            isEditing={isEditing}
            onFieldChange={onFieldChange}
            as="h1"
            className="text-4xl font-bold text-slate-900 mb-2 tracking-tight"
            placeholder="Your Full Name"
          />
          <EditableText
            value={data.profile.title}
            path="profile.title"
            isEditing={isEditing}
            onFieldChange={onFieldChange}
            as="p"
            className="text-xl text-slate-600 font-medium mb-4"
            placeholder="Professional Title"
          />
          
          {/* Contact Info Row */}
          <div className="flex flex-wrap justify-center gap-4 text-sm text-slate-600">
            {data.profile.email && (
              <span className="flex items-center gap-1.5">
                <Mail className="h-4 w-4" />
                <EditableText
                  value={data.profile.email}
                  path="profile.email"
                  isEditing={isEditing}
                  onFieldChange={onFieldChange}
                  placeholder="email@example.com"
                />
              </span>
            )}
            {data.profile.phone && (
              <span className="flex items-center gap-1.5">
                <Phone className="h-4 w-4" />
                <EditableText
                  value={data.profile.phone}
                  path="profile.phone"
                  isEditing={isEditing}
                  onFieldChange={onFieldChange}
                  placeholder="+1 234 567 8900"
                />
              </span>
            )}
            {data.profile.location && (
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                <EditableText
                  value={data.profile.location}
                  path="profile.location"
                  isEditing={isEditing}
                  onFieldChange={onFieldChange}
                  placeholder="City, Country"
                />
              </span>
            )}
            {data.profile.linkedin && (
              <a href={data.profile.linkedin} className="flex items-center gap-1.5 hover:text-blue-600">
                <Linkedin className="h-4 w-4" />
                LinkedIn
              </a>
            )}
            {data.profile.website && (
              <a href={data.profile.website} className="flex items-center gap-1.5 hover:text-blue-600">
                <Globe className="h-4 w-4" />
                Portfolio
              </a>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-8 py-8">
        {/* Professional Summary */}
        <section className={sectionClass}>
          <h2 className={headerClass}>Professional Summary</h2>
          <EditableText
            value={data.summary}
            path="summary"
            isEditing={isEditing}
            onFieldChange={onFieldChange}
            as="p"
            className="text-slate-700 leading-relaxed"
            placeholder="Write a compelling professional summary that highlights your experience, skills, and career goals..."
          />
        </section>

        {/* Work Experience */}
        <section className={sectionClass}>
          <h2 className={headerClass}>
            <Briefcase className="inline h-5 w-5 mr-2" />
            Professional Experience
          </h2>
          <div className="space-y-6">
            {data.experience.map((exp, index) => (
              <motion.div
                key={exp.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">{exp.position}</h3>
                    <p className="text-slate-600 font-medium">{exp.company} • {exp.location}</p>
                  </div>
                  <span className="text-sm text-slate-500 whitespace-nowrap">
                    {exp.startDate} – {exp.current ? "Present" : exp.endDate}
                  </span>
                </div>
                <p className="text-sm text-slate-600 mb-2">{exp.description}</p>
                {exp.achievements.length > 0 && (
                  <ul className="list-disc list-inside text-sm text-slate-600 space-y-1 ml-2">
                    {exp.achievements.map((achievement, i) => (
                      <li key={i}>{achievement}</li>
                    ))}
                  </ul>
                )}
              </motion.div>
            ))}
          </div>
        </section>

        {/* Education */}
        <section className={sectionClass}>
          <h2 className={headerClass}>
            <GraduationCap className="inline h-5 w-5 mr-2" />
            Education
          </h2>
          <div className="space-y-4">
            {data.education.map((edu, index) => (
              <motion.div
                key={edu.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-slate-800">{edu.degree} in {edu.field}</h3>
                    <p className="text-slate-600">{edu.institution} • {edu.location}</p>
                  </div>
                  <span className="text-sm text-slate-500">{edu.startDate} – {edu.endDate}</span>
                </div>
                {edu.gpa && <p className="text-sm text-slate-500 mt-1">GPA: {edu.gpa}</p>}
              </motion.div>
            ))}
          </div>
        </section>

        {/* Skills */}
        <section className={sectionClass}>
          <h2 className={headerClass}>
            <Star className="inline h-5 w-5 mr-2" />
            Core Competencies
          </h2>
          <div className="flex flex-wrap gap-2">
            {data.skills.map((skill, index) => (
              <motion.span
                key={skill.name}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.03 }}
                className="px-3 py-1.5 bg-slate-100 text-slate-700 text-sm rounded border border-slate-200"
              >
                {skill.name}
              </motion.span>
            ))}
          </div>
        </section>

        {/* Certifications */}
        {data.certifications && data.certifications.length > 0 && (
          <section className={sectionClass}>
            <h2 className={headerClass}>
              <Award className="inline h-5 w-5 mr-2" />
              Certifications & Awards
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {data.certifications.map((cert) => (
                <div key={cert.id} className="flex items-start gap-2">
                  <Award className="h-4 w-4 text-slate-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-slate-800">{cert.name}</p>
                    <p className="text-sm text-slate-500">{cert.issuer} • {cert.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </motion.div>
  );
};

export default FullResumeTemplate1;

// Sample data for Template 1
export const template1SampleData: ResumeTemplate1Data = {
  profile: {
    fullName: "Alexandra Richardson",
    title: "Senior Marketing Director",
    email: "alexandra.richardson@email.com",
    phone: "+1 (555) 234-5678",
    location: "New York, NY",
    linkedin: "https://linkedin.com/in/arichardson",
    website: "https://alexandra-richardson.com",
  },
  summary: "Results-driven marketing executive with 12+ years of experience leading global marketing strategies for Fortune 500 companies. Proven track record of driving 40% revenue growth through data-driven campaigns, brand development, and cross-functional team leadership. Expert in digital transformation, customer acquisition, and building high-performing teams.",
  experience: [
    {
      id: 1,
      company: "GlobalTech Industries",
      position: "Vice President of Marketing",
      location: "New York, NY",
      startDate: "Jan 2020",
      endDate: "",
      current: true,
      description: "Leading global marketing strategy for $2B enterprise technology company with presence in 15 countries.",
      achievements: [
        "Increased brand awareness by 65% through integrated digital marketing campaigns",
        "Generated $45M in qualified pipeline through demand generation initiatives",
        "Built and managed team of 35 marketing professionals across 4 global offices",
        "Launched successful product rebrand resulting in 28% increase in market share",
      ],
    },
    {
      id: 2,
      company: "InnovateCorp Solutions",
      position: "Director of Digital Marketing",
      location: "Boston, MA",
      startDate: "Mar 2016",
      endDate: "Dec 2019",
      current: false,
      description: "Directed all digital marketing initiatives for B2B SaaS platform serving enterprise clients.",
      achievements: [
        "Scaled marketing-sourced revenue from $5M to $18M annually",
        "Reduced customer acquisition cost by 42% through marketing automation",
        "Established content marketing program generating 500K+ monthly visitors",
      ],
    },
    {
      id: 3,
      company: "MediaMax Agency",
      position: "Senior Marketing Manager",
      location: "Chicago, IL",
      startDate: "Jun 2012",
      endDate: "Feb 2016",
      current: false,
      description: "Managed marketing campaigns for portfolio of 20+ enterprise clients.",
      achievements: [
        "Delivered 150+ successful campaigns with average ROI of 340%",
        "Won 3 industry awards for campaign creativity and effectiveness",
      ],
    },
  ],
  education: [
    {
      id: 1,
      institution: "Northwestern University",
      degree: "Master of Business Administration",
      field: "Marketing & Strategy",
      location: "Evanston, IL",
      startDate: "2010",
      endDate: "2012",
      gpa: "3.9",
    },
    {
      id: 2,
      institution: "University of Michigan",
      degree: "Bachelor of Arts",
      field: "Communications",
      location: "Ann Arbor, MI",
      startDate: "2004",
      endDate: "2008",
      gpa: "3.7",
    },
  ],
  skills: [
    { name: "Strategic Marketing Planning", category: "Strategy" },
    { name: "Brand Development", category: "Strategy" },
    { name: "Digital Marketing", category: "Digital" },
    { name: "Marketing Automation", category: "Digital" },
    { name: "Content Strategy", category: "Content" },
    { name: "SEO/SEM", category: "Digital" },
    { name: "Team Leadership", category: "Leadership" },
    { name: "Budget Management ($10M+)", category: "Operations" },
    { name: "Data Analytics", category: "Analytics" },
    { name: "CRM Platforms", category: "Technology" },
    { name: "Public Speaking", category: "Communication" },
    { name: "Stakeholder Management", category: "Leadership" },
  ],
  certifications: [
    { id: 1, name: "Google Analytics Certification", issuer: "Google", date: "2023" },
    { id: 2, name: "HubSpot Marketing Software Certification", issuer: "HubSpot", date: "2023" },
    { id: 3, name: "Marketing Leadership Excellence Award", issuer: "AMA", date: "2022" },
    { id: 4, name: "Certified Digital Marketing Professional", issuer: "DMI", date: "2021" },
  ],
};
