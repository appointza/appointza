// Template 3: Tech Minimal - Clean Developer/Engineer Layout
// Monospace fonts, code-inspired design, project-focused with GitHub links

import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Linkedin, Github, Globe, ExternalLink, Terminal, Code2, Server, Folder, GraduationCap, Award } from "lucide-react";

export interface ResumeTemplate3Data {
  profile: {
    fullName: string;
    title: string;
    email: string;
    phone?: string;
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
    location: string;
    startDate: string;
    endDate: string;
    current: boolean;
    techStack: string[];
    achievements: string[];
  }>;
  projects: Array<{
    id: number;
    name: string;
    description: string;
    technologies: string[];
    liveUrl?: string;
    githubUrl?: string;
    stars?: number;
  }>;
  skills: {
    languages: string[];
    frameworks: string[];
    tools: string[];
    databases: string[];
  };
  education: Array<{
    id: number;
    institution: string;
    degree: string;
    field: string;
    year: string;
  }>;
  certifications?: Array<{
    id: number;
    name: string;
    issuer: string;
  }>;
}

interface FullResumeTemplate3Props {
  data: ResumeTemplate3Data;
  isEditing?: boolean;
  onFieldChange?: (path: string, value: any) => void;
}

const TechBadge = ({ children }: { children: React.ReactNode }) => (
  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-mono rounded border border-emerald-200">
    {children}
  </span>
);

const SectionHeader = ({ icon: Icon, children }: { icon: React.ComponentType<any>; children: React.ReactNode }) => (
  <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b-2 border-emerald-500 flex items-center gap-2 font-mono">
    <Icon className="h-5 w-5 text-emerald-600" />
    <span className="text-emerald-600">&gt;</span> {children}
  </h2>
);

const FullResumeTemplate3 = ({ data }: FullResumeTemplate3Props) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-gray-50 min-h-screen font-sans"
    >
      {/* Header */}
      <header className="bg-gray-900 text-white px-8 py-10">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-emerald-400 font-mono text-sm mb-2">
                <Terminal className="h-4 w-4" />
                <span>$ whoami</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-1 font-mono">{data.profile.fullName}</h1>
              <p className="text-emerald-400 text-lg font-mono">{data.profile.title}</p>
            </div>
            <div className="flex flex-wrap gap-3 text-sm font-mono">
              {data.profile.github && (
                <a href={data.profile.github} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded transition-colors">
                  <Github className="h-4 w-4" />
                  <span>GitHub</span>
                </a>
              )}
              {data.profile.linkedin && (
                <a href={data.profile.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded transition-colors">
                  <Linkedin className="h-4 w-4" />
                  <span>LinkedIn</span>
                </a>
              )}
              {data.profile.website && (
                <a href={data.profile.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded transition-colors">
                  <Globe className="h-4 w-4" />
                  <span>Website</span>
                </a>
              )}
            </div>
          </div>
          
          {/* Contact Row */}
          <div className="flex flex-wrap gap-4 mt-6 text-gray-400 text-sm font-mono">
            <span className="flex items-center gap-1.5">
              <Mail className="h-4 w-4" />
              {data.profile.email}
            </span>
            {data.profile.phone && (
              <span className="flex items-center gap-1.5">
                <Phone className="h-4 w-4" />
                {data.profile.phone}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4" />
              {data.profile.location}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-8 py-8">
        {/* Summary */}
        <section className="mb-8 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 text-gray-500 font-mono text-sm mb-2">
            <Code2 className="h-4 w-4" />
            <span>// About</span>
          </div>
          <p className="text-gray-700 leading-relaxed">
            {data.summary}
          </p>
        </section>

        {/* Skills Grid */}
        <section className="mb-8">
          <SectionHeader icon={Server}>Technical Skills</SectionHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-white rounded-lg border border-gray-200">
              <h3 className="font-mono text-sm text-emerald-600 mb-2">Languages</h3>
              <div className="flex flex-wrap gap-1.5">
                {data.skills.languages.map((lang) => (
                  <TechBadge key={lang}>{lang}</TechBadge>
                ))}
              </div>
            </div>
            <div className="p-4 bg-white rounded-lg border border-gray-200">
              <h3 className="font-mono text-sm text-emerald-600 mb-2">Frameworks</h3>
              <div className="flex flex-wrap gap-1.5">
                {data.skills.frameworks.map((fw) => (
                  <TechBadge key={fw}>{fw}</TechBadge>
                ))}
              </div>
            </div>
            <div className="p-4 bg-white rounded-lg border border-gray-200">
              <h3 className="font-mono text-sm text-emerald-600 mb-2">Tools & Platforms</h3>
              <div className="flex flex-wrap gap-1.5">
                {data.skills.tools.map((tool) => (
                  <TechBadge key={tool}>{tool}</TechBadge>
                ))}
              </div>
            </div>
            <div className="p-4 bg-white rounded-lg border border-gray-200">
              <h3 className="font-mono text-sm text-emerald-600 mb-2">Databases</h3>
              <div className="flex flex-wrap gap-1.5">
                {data.skills.databases.map((db) => (
                  <TechBadge key={db}>{db}</TechBadge>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Projects */}
        <section className="mb-8">
          <SectionHeader icon={Folder}>Featured Projects</SectionHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.projects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 bg-white rounded-lg border border-gray-200 hover:border-emerald-300 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-gray-900 font-mono">{project.name}</h3>
                  <div className="flex gap-2">
                    {project.githubUrl && (
                      <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-gray-900">
                        <Github className="h-4 w-4" />
                      </a>
                    )}
                    {project.liveUrl && (
                      <a href={project.liveUrl} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-emerald-600">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </div>
                <p className="text-gray-600 text-sm mb-3">{project.description}</p>
                <div className="flex flex-wrap gap-1">
                  {project.technologies.map((tech) => (
                    <span key={tech} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs font-mono rounded">
                      {tech}
                    </span>
                  ))}
                </div>
                {project.stars && (
                  <div className="mt-2 text-xs text-gray-500 font-mono flex items-center gap-1">
                    <span>★</span> {project.stars.toLocaleString()} stars
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </section>

        {/* Experience */}
        <section className="mb-8">
          <SectionHeader icon={Terminal}>Experience</SectionHeader>
          <div className="space-y-6">
            {data.experience.map((exp, index) => (
              <motion.div
                key={exp.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 bg-white rounded-lg border-l-4 border-emerald-500 shadow-sm"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2">
                  <div>
                    <h3 className="font-bold text-gray-900">{exp.position}</h3>
                    <p className="text-emerald-600 font-medium">{exp.company} <span className="text-gray-400">•</span> <span className="text-gray-500">{exp.location}</span></p>
                  </div>
                  <span className="text-sm text-gray-500 font-mono mt-1 md:mt-0">
                    {exp.startDate} – {exp.current ? "Present" : exp.endDate}
                  </span>
                </div>
                
                {/* Tech Stack */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {exp.techStack.map((tech) => (
                    <TechBadge key={tech}>{tech}</TechBadge>
                  ))}
                </div>
                
                <ul className="space-y-1 text-sm text-gray-600">
                  {exp.achievements.map((achievement, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-emerald-500 font-mono mt-0.5">→</span>
                      <span>{achievement}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Education & Certifications */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <section>
            <SectionHeader icon={GraduationCap}>Education</SectionHeader>
            <div className="space-y-3">
              {data.education.map((edu) => (
                <div key={edu.id} className="p-3 bg-white rounded-lg border border-gray-200">
                  <h3 className="font-bold text-gray-900">{edu.degree}</h3>
                  <p className="text-emerald-600">{edu.field}</p>
                  <p className="text-sm text-gray-500">{edu.institution} • {edu.year}</p>
                </div>
              ))}
            </div>
          </section>

          {data.certifications && data.certifications.length > 0 && (
            <section>
              <SectionHeader icon={Award}>Certifications</SectionHeader>
              <div className="space-y-2">
                {data.certifications.map((cert) => (
                  <div key={cert.id} className="flex items-center gap-2 p-2 bg-white rounded border border-gray-200">
                    <Award className="h-4 w-4 text-emerald-600 shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{cert.name}</p>
                      <p className="text-xs text-gray-500">{cert.issuer}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </motion.div>
  );
};

export default FullResumeTemplate3;

// Sample data for Template 3
export const template3SampleData: ResumeTemplate3Data = {
  profile: {
    fullName: "Sarah Nakamura",
    title: "Senior Full-Stack Engineer",
    email: "sarah@nakamura.dev",
    phone: "+1 (206) 555-0192",
    location: "Seattle, WA (Remote)",
    linkedin: "https://linkedin.com/in/sarahnakamura",
    github: "https://github.com/sarahnakamura",
    website: "https://nakamura.dev",
  },
  summary: "Full-stack engineer with 6+ years building scalable web applications and developer tools. Core contributor to open-source projects with 10K+ GitHub stars. Passionate about TypeScript, React, and creating exceptional developer experiences. I believe in writing clean, tested code and sharing knowledge through technical writing and conference talks.",
  experience: [
    {
      id: 1,
      company: "Vercel",
      position: "Senior Software Engineer",
      location: "Remote",
      startDate: "Mar 2022",
      endDate: "",
      current: true,
      techStack: ["TypeScript", "Next.js", "React", "Node.js", "Turborepo"],
      achievements: [
        "Implemented Server Components hydration improving initial load by 40%",
        "Built CLI tooling used by 2M+ developers monthly",
        "Authored 15+ technical blog posts with 500K+ combined views",
        "Reviewed 200+ community PRs and mentored 3 engineering interns",
      ],
    },
    {
      id: 2,
      company: "Stripe",
      position: "Software Engineer",
      location: "Seattle, WA",
      startDate: "Jul 2019",
      endDate: "Feb 2022",
      current: false,
      techStack: ["Python", "Ruby", "PostgreSQL", "Redis", "AWS"],
      achievements: [
        "Designed real-time fraud detection system with 99.7% accuracy",
        "Reduced API latency by 35% through caching optimizations",
        "Open-sourced internal testing library (5K+ GitHub stars)",
      ],
    },
    {
      id: 3,
      company: "Microsoft",
      position: "Software Development Engineer",
      location: "Redmond, WA",
      startDate: "Aug 2017",
      endDate: "Jun 2019",
      current: false,
      techStack: ["TypeScript", "C#", "VS Code API", ".NET"],
      achievements: [
        "Contributed to TypeScript compiler (15+ merged PRs)",
        "Built VS Code extension with 1M+ installs",
      ],
    },
  ],
  projects: [
    {
      id: 1,
      name: "fastify-prisma",
      description: "High-performance Prisma integration for Fastify framework with automatic connection pooling.",
      technologies: ["TypeScript", "Prisma", "Fastify"],
      githubUrl: "https://github.com/sarahnakamura/fastify-prisma",
      liveUrl: "https://npmjs.com/package/fastify-prisma",
      stars: 3200,
    },
    {
      id: 2,
      name: "react-query-devtools",
      description: "Developer tools for debugging React Query applications. Official maintainer.",
      technologies: ["React", "TypeScript", "Zustand"],
      githubUrl: "https://github.com/tanstack/query",
      stars: 38000,
    },
    {
      id: 3,
      name: "CodeCraft",
      description: "VS Code extension for AI-assisted code refactoring with 50K+ installs.",
      technologies: ["TypeScript", "VS Code API", "OpenAI"],
      githubUrl: "https://github.com/sarahnakamura/codecraft",
      liveUrl: "https://marketplace.visualstudio.com",
    },
    {
      id: 4,
      name: "nakamura.dev",
      description: "Personal blog on web development, built with Astro and MDX.",
      technologies: ["Astro", "MDX", "Tailwind CSS"],
      githubUrl: "https://github.com/sarahnakamura/blog",
      liveUrl: "https://nakamura.dev",
    },
  ],
  skills: {
    languages: ["TypeScript", "JavaScript", "Python", "Go", "Rust", "SQL"],
    frameworks: ["React", "Next.js", "Vue.js", "Node.js", "Fastify", "Express"],
    tools: ["Git", "Docker", "Kubernetes", "Vercel", "AWS", "CI/CD", "Turborepo"],
    databases: ["PostgreSQL", "Redis", "MongoDB", "Prisma", "Drizzle"],
  },
  education: [
    {
      id: 1,
      institution: "University of Washington",
      degree: "B.S. Computer Science",
      field: "Magna Cum Laude",
      year: "2017",
    },
  ],
  certifications: [
    { id: 1, name: "AWS Certified Developer - Associate", issuer: "Amazon Web Services" },
    { id: 2, name: "React Summit 2023 Speaker", issuer: "GitNation" },
    { id: 3, name: "GraphQL Foundation Certification", issuer: "Linux Foundation" },
  ],
};
