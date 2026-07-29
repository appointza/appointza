// Template 2: Creative Two-Column - Modern Sidebar Layout
// Stylish design with photo, colored sidebar for contact/skills, main content area

import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Linkedin, Github, Globe, Award, GraduationCap, Briefcase, Star, Code, ExternalLink } from "lucide-react";

export interface ResumeTemplate2Data {
  profile: {
    fullName: string;
    title: string;
    photo?: string;
    email: string;
    phone: string;
    location: string;
    linkedin?: string;
    github?: string;
    website?: string;
  };
  summary: string;
  experience: Array<{
    id: number;
    company: string;
    position: string;
    startDate: string;
    endDate: string;
    current: boolean;
    achievements: string[];
  }>;
  education: Array<{
    id: number;
    institution: string;
    degree: string;
    field: string;
    year: string;
  }>;
  skills: Array<{ name: string; level: number }>;
  languages: Array<{ name: string; proficiency: string }>;
  interests?: string[];
}

interface FullResumeTemplate2Props {
  data: ResumeTemplate2Data;
  isEditing?: boolean;
  onFieldChange?: (path: string, value: any) => void;
}

const SkillBar = ({ name, level }: { name: string; level: number }) => (
  <div className="mb-3">
    <div className="flex justify-between text-sm mb-1">
      <span className="text-white font-medium">{name}</span>
      <span className="text-teal-200">{level * 20}%</span>
    </div>
    <div className="h-2 bg-teal-900/50 rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${level * 20}%` }}
        transition={{ duration: 0.8 }}
        className="h-full bg-gradient-to-r from-teal-400 to-emerald-400 rounded-full"
      />
    </div>
  </div>
);

const FullResumeTemplate2 = ({ data }: FullResumeTemplate2Props) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white min-h-screen font-sans flex"
    >
      {/* Left Sidebar - Colored */}
      <aside className="w-80 bg-gradient-to-b from-teal-700 via-teal-800 to-teal-900 text-white shrink-0">
        <div className="p-6 sticky top-0">
          {/* Profile Photo */}
          {data.profile.photo && (
            <div className="mb-6 flex justify-center">
              <div className="w-40 h-40 rounded-full border-4 border-teal-400 overflow-hidden shadow-xl">
                <img
                  src={data.profile.photo}
                  alt={data.profile.fullName}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}

          {/* Name & Title */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-1">{data.profile.fullName}</h1>
            <p className="text-teal-200 text-sm uppercase tracking-widest">{data.profile.title}</p>
          </div>

          {/* Contact Info */}
          <div className="mb-8">
            <h2 className="text-xs font-bold uppercase tracking-widest text-teal-300 mb-4 border-b border-teal-600 pb-2">
              Contact
            </h2>
            <div className="space-y-3 text-sm">
              <a href={`mailto:${data.profile.email}`} className="flex items-center gap-3 hover:text-teal-300 transition-colors">
                <Mail className="h-4 w-4 text-teal-400" />
                <span className="break-all">{data.profile.email}</span>
              </a>
              <a href={`tel:${data.profile.phone}`} className="flex items-center gap-3 hover:text-teal-300 transition-colors">
                <Phone className="h-4 w-4 text-teal-400" />
                <span>{data.profile.phone}</span>
              </a>
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-teal-400" />
                <span>{data.profile.location}</span>
              </div>
              {data.profile.linkedin && (
                <a href={data.profile.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 hover:text-teal-300 transition-colors">
                  <Linkedin className="h-4 w-4 text-teal-400" />
                  <span>LinkedIn Profile</span>
                </a>
              )}
              {data.profile.github && (
                <a href={data.profile.github} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 hover:text-teal-300 transition-colors">
                  <Github className="h-4 w-4 text-teal-400" />
                  <span>GitHub</span>
                </a>
              )}
              {data.profile.website && (
                <a href={data.profile.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 hover:text-teal-300 transition-colors">
                  <Globe className="h-4 w-4 text-teal-400" />
                  <span>Portfolio</span>
                </a>
              )}
            </div>
          </div>

          {/* Skills with Progress Bars */}
          <div className="mb-8">
            <h2 className="text-xs font-bold uppercase tracking-widest text-teal-300 mb-4 border-b border-teal-600 pb-2">
              <Star className="inline h-3 w-3 mr-1" />
              Skills
            </h2>
            {data.skills.map((skill) => (
              <SkillBar key={skill.name} name={skill.name} level={skill.level} />
            ))}
          </div>

          {/* Languages */}
          <div className="mb-8">
            <h2 className="text-xs font-bold uppercase tracking-widest text-teal-300 mb-4 border-b border-teal-600 pb-2">
              Languages
            </h2>
            <div className="space-y-2">
              {data.languages.map((lang) => (
                <div key={lang.name} className="flex justify-between text-sm">
                  <span>{lang.name}</span>
                  <span className="text-teal-300">{lang.proficiency}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Interests */}
          {data.interests && data.interests.length > 0 && (
            <div>
              <h2 className="text-xs font-bold uppercase tracking-widest text-teal-300 mb-4 border-b border-teal-600 pb-2">
                Interests
              </h2>
              <div className="flex flex-wrap gap-2">
                {data.interests.map((interest) => (
                  <span key={interest} className="px-2 py-1 bg-teal-900/50 text-teal-200 text-xs rounded">
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        {/* Summary */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-teal-800 mb-4 flex items-center gap-2">
            <div className="h-8 w-1 bg-teal-500 rounded-full" />
            Profile
          </h2>
          <p className="text-gray-600 leading-relaxed text-lg">
            {data.summary}
          </p>
        </section>

        {/* Experience */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-teal-800 mb-6 flex items-center gap-2">
            <div className="h-8 w-1 bg-teal-500 rounded-full" />
            <Briefcase className="h-6 w-6" />
            Work Experience
          </h2>
          <div className="space-y-6">
            {data.experience.map((exp, index) => (
              <motion.div
                key={exp.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative pl-6 border-l-2 border-teal-200"
              >
                <div className="absolute -left-2 top-0 w-4 h-4 bg-teal-500 rounded-full border-2 border-white" />
                <div className="mb-2">
                  <h3 className="text-xl font-bold text-gray-800">{exp.position}</h3>
                  <div className="flex items-center gap-2 text-teal-600">
                    <span className="font-medium">{exp.company}</span>
                    <span className="text-gray-400">|</span>
                    <span className="text-sm text-gray-500">
                      {exp.startDate} – {exp.current ? "Present" : exp.endDate}
                    </span>
                  </div>
                </div>
                <ul className="space-y-1.5">
                  {exp.achievements.map((achievement, i) => (
                    <li key={i} className="text-gray-600 flex items-start gap-2">
                      <span className="text-teal-500 mt-1.5">•</span>
                      <span>{achievement}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Education */}
        <section>
          <h2 className="text-2xl font-bold text-teal-800 mb-6 flex items-center gap-2">
            <div className="h-8 w-1 bg-teal-500 rounded-full" />
            <GraduationCap className="h-6 w-6" />
            Education
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.education.map((edu) => (
              <div key={edu.id} className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                <h3 className="font-bold text-gray-800">{edu.degree}</h3>
                <p className="text-teal-600 font-medium">{edu.field}</p>
                <p className="text-gray-600 text-sm">{edu.institution}</p>
                <p className="text-gray-400 text-sm mt-1">{edu.year}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </motion.div>
  );
};

export default FullResumeTemplate2;

// Sample data for Template 2
export const template2SampleData: ResumeTemplate2Data = {
  profile: {
    fullName: "Marcus Chen",
    title: "UX Designer & Product Strategist",
    photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face",
    email: "marcus.chen@design.io",
    phone: "+1 (415) 987-6543",
    location: "San Francisco, CA",
    linkedin: "https://linkedin.com/in/marcuschen",
    github: "https://github.com/marcuschen",
    website: "https://marcuschen.design",
  },
  summary: "Creative and user-focused UX Designer with 7+ years of experience crafting intuitive digital products. Passionate about bridging the gap between user needs and business goals. I've led design initiatives for products used by millions, from concept to launch, always advocating for accessible and inclusive design practices.",
  experience: [
    {
      id: 1,
      company: "Spotify",
      position: "Senior Product Designer",
      startDate: "Aug 2021",
      endDate: "",
      current: true,
      achievements: [
        "Lead designer for social features team, driving 40% increase in user engagement",
        "Established design system components used across 5 product teams",
        "Conducted 50+ user research sessions to inform product decisions",
        "Mentored 4 junior designers through career development program",
      ],
    },
    {
      id: 2,
      company: "Airbnb",
      position: "Product Designer",
      startDate: "Jun 2018",
      endDate: "Jul 2021",
      current: false,
      achievements: [
        "Redesigned booking flow resulting in 23% conversion improvement",
        "Created accessibility guidelines adopted across all product teams",
        "Led design for Superhost dashboard serving 500K+ hosts globally",
      ],
    },
    {
      id: 3,
      company: "IDEO",
      position: "Interaction Designer",
      startDate: "May 2016",
      endDate: "May 2018",
      current: false,
      achievements: [
        "Worked with Fortune 500 clients on human-centered design projects",
        "Won Red Dot Design Award for healthcare app innovation",
      ],
    },
  ],
  education: [
    {
      id: 1,
      institution: "Rhode Island School of Design",
      degree: "Master of Fine Arts",
      field: "Graphic Design",
      year: "2016",
    },
    {
      id: 2,
      institution: "University of Washington",
      degree: "Bachelor of Arts",
      field: "Visual Communication",
      year: "2014",
    },
  ],
  skills: [
    { name: "Figma", level: 5 },
    { name: "Design Systems", level: 5 },
    { name: "User Research", level: 5 },
    { name: "Prototyping", level: 4 },
    { name: "Motion Design", level: 4 },
    { name: "HTML/CSS", level: 3 },
  ],
  languages: [
    { name: "English", proficiency: "Native" },
    { name: "Cantonese", proficiency: "Native" },
    { name: "Mandarin", proficiency: "Fluent" },
  ],
  interests: ["Photography", "Rock Climbing", "Typography", "Ceramics", "Jazz"],
};
