// Complete Resume Template Data with different layouts and sample data
export type FullResumeTemplate = "template1" | "template2" | "template3";

export interface ResumeTemplateConfig {
  id: FullResumeTemplate;
  name: string;
  description: string;
  layout: "single-column" | "two-column" | "sidebar";
  blockOrder: string[];
  styles: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    background: string;
    cardStyle: string;
    headerStyle: string;
    fontStyle: string;
  };
}

// Template configurations with different layouts
export const resumeTemplateConfigs: Record<FullResumeTemplate, ResumeTemplateConfig> = {
  template1: {
    id: "template1",
    name: "Executive Classic",
    description: "Traditional single-column layout for corporate professionals",
    layout: "single-column",
    blockOrder: ["profile", "summary", "experience", "education", "skills", "certifications", "languages", "contact"],
    styles: {
      primaryColor: "slate-800",
      secondaryColor: "slate-600",
      accentColor: "blue-600",
      background: "bg-white",
      cardStyle: "border border-slate-200 shadow-sm rounded-md",
      headerStyle: "border-b-2 border-slate-800",
      fontStyle: "font-serif",
    },
  },
  template2: {
    id: "template2",
    name: "Creative Modern",
    description: "Two-column layout with vibrant gradients for creative roles",
    layout: "two-column",
    blockOrder: ["profile", "skills", "experience", "projects", "education", "certifications", "languages", "contact"],
    styles: {
      primaryColor: "violet-900",
      secondaryColor: "violet-600",
      accentColor: "fuchsia-500",
      background: "bg-gradient-to-br from-violet-50 via-white to-fuchsia-50",
      cardStyle: "bg-white/90 backdrop-blur-sm rounded-xl shadow-lg",
      headerStyle: "bg-gradient-to-r from-violet-500 to-fuchsia-500 bg-clip-text text-transparent",
      fontStyle: "font-sans",
    },
  },
  template3: {
    id: "template3",
    name: "Tech Minimalist",
    description: "Clean sidebar layout focused on skills and projects",
    layout: "sidebar",
    blockOrder: ["profile", "summary", "projects", "experience", "skills", "education", "certifications", "contact"],
    styles: {
      primaryColor: "emerald-800",
      secondaryColor: "emerald-600",
      accentColor: "teal-500",
      background: "bg-neutral-50",
      cardStyle: "border-l-4 border-emerald-500 pl-4 bg-white",
      headerStyle: "border-b border-emerald-200",
      fontStyle: "font-mono",
    },
  },
};

// Template 1: Executive Classic - Corporate Professional
export const template1Data = {
  profile: {
    template: "classic" as const,
    fullName: "Alexandra Richardson",
    title: "Chief Technology Officer",
    photo: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop&crop=face",
    email: "alexandra.richardson@email.com",
    phone: "+1 (555) 234-5678",
    location: "New York, NY",
    linkedin: "https://linkedin.com/in/arichardson",
    github: "",
    website: "https://alexandra-richardson.com",
  },
  summary: {
    template: "classic" as const,
    title: "Executive Summary",
    summary: "Visionary technology executive with 15+ years of experience driving digital transformation across Fortune 500 companies. Proven track record of building high-performing engineering teams, implementing enterprise-scale solutions, and aligning technology strategy with business objectives. Expertise in cloud architecture, AI/ML initiatives, and agile methodologies. Led initiatives resulting in $50M+ cost savings and 200% revenue growth.",
  },
  experience: {
    template: "classic" as const,
    title: "Professional Experience",
    experiences: [
      {
        id: 1,
        company: "GlobalTech Industries",
        position: "Chief Technology Officer",
        location: "New York, NY",
        startDate: "Jan 2020",
        endDate: "",
        current: true,
        description: "Leading technology strategy and digital innovation for a $2B enterprise with 3,000+ employees across 15 countries.",
        achievements: [
          "Architected cloud migration saving $12M annually in infrastructure costs",
          "Built and mentored engineering team from 50 to 200+ engineers",
          "Implemented AI-driven analytics platform increasing revenue by 45%",
          "Established security frameworks achieving SOC2 and ISO 27001 compliance",
        ],
      },
      {
        id: 2,
        company: "Nexus Solutions Inc.",
        position: "VP of Engineering",
        location: "Boston, MA",
        startDate: "Mar 2016",
        endDate: "Dec 2019",
        current: false,
        description: "Directed engineering operations for SaaS platform serving 500+ enterprise clients.",
        achievements: [
          "Scaled platform to handle 10M+ daily transactions with 99.99% uptime",
          "Reduced deployment cycle from weeks to hours with CI/CD implementation",
          "Led acquisition integration of 3 technology companies",
        ],
      },
      {
        id: 3,
        company: "TechStart Ventures",
        position: "Senior Engineering Manager",
        location: "San Francisco, CA",
        startDate: "Jun 2012",
        endDate: "Feb 2016",
        current: false,
        description: "Managed cross-functional engineering teams for B2B software products.",
        achievements: [
          "Launched 5 successful products generating $30M in ARR",
          "Pioneered microservices architecture reducing system downtime by 80%",
        ],
      },
    ],
  },
  education: {
    template: "classic" as const,
    title: "Education",
    education: [
      {
        id: 1,
        institution: "Massachusetts Institute of Technology",
        degree: "Master of Business Administration",
        field: "Technology Management",
        location: "Cambridge, MA",
        startDate: "2014",
        endDate: "2016",
        gpa: "3.9",
        achievements: ["Sloan Fellow", "Technology Innovation Award"],
      },
      {
        id: 2,
        institution: "Stanford University",
        degree: "Bachelor of Science",
        field: "Computer Science",
        location: "Stanford, CA",
        startDate: "2004",
        endDate: "2008",
        gpa: "3.85",
        achievements: ["Summa Cum Laude", "Dean's List all semesters"],
      },
    ],
  },
  skills: {
    template: "classic" as const,
    title: "Core Competencies",
    displayType: "tags" as const,
    skills: [
      { name: "Strategic Technology Leadership", level: 5, category: "Leadership" },
      { name: "Digital Transformation", level: 5, category: "Leadership" },
      { name: "Team Building & Mentorship", level: 5, category: "Leadership" },
      { name: "Cloud Architecture (AWS/Azure/GCP)", level: 5, category: "Technical" },
      { name: "Enterprise Security & Compliance", level: 5, category: "Technical" },
      { name: "AI/ML Strategy", level: 4, category: "Technical" },
      { name: "Agile & DevOps", level: 5, category: "Methodology" },
      { name: "Budget Management ($50M+)", level: 5, category: "Business" },
      { name: "Vendor & Stakeholder Relations", level: 5, category: "Business" },
    ],
  },
  certifications: {
    template: "classic" as const,
    title: "Certifications & Awards",
    certifications: [
      { id: 1, name: "AWS Solutions Architect Professional", issuer: "Amazon Web Services", date: "2023", credentialUrl: "" },
      { id: 2, name: "Google Cloud Professional Architect", issuer: "Google Cloud", date: "2022", credentialUrl: "" },
      { id: 3, name: "CIO of the Year - Technology Innovation", issuer: "Tech Leadership Awards", date: "2021", credentialUrl: "" },
      { id: 4, name: "PMP - Project Management Professional", issuer: "PMI", date: "2015", credentialUrl: "" },
    ],
  },
  languages: {
    template: "classic" as const,
    title: "Languages",
    languages: [
      { name: "English", proficiency: "Native" },
      { name: "French", proficiency: "Fluent" },
      { name: "Mandarin", proficiency: "Conversational" },
    ],
  },
  contact: {
    template: "classic" as const,
    title: "Contact Information",
    email: "alexandra.richardson@email.com",
    phone: "+1 (555) 234-5678",
    location: "New York, NY",
    linkedin: "https://linkedin.com/in/arichardson",
    github: "",
    website: "https://alexandra-richardson.com",
    message: "Open to executive advisory roles and board positions. Let's discuss how I can help drive your technology vision.",
  },
};

// Template 2: Creative Modern - Designer/Creative Professional
export const template2Data = {
  profile: {
    template: "modern" as const,
    fullName: "Marcus Chen",
    title: "Senior Product Designer & UX Lead",
    photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face",
    email: "marcus.chen@design.io",
    phone: "+1 (415) 987-6543",
    location: "San Francisco, CA",
    linkedin: "https://linkedin.com/in/marcuschen",
    github: "https://github.com/marcuschen",
    website: "https://marcuschen.design",
  },
  summary: {
    template: "modern" as const,
    title: "About Me",
    summary: "Award-winning product designer with 8+ years crafting intuitive digital experiences for startups and Fortune 100 companies. I blend user research, visual design, and prototyping to create products people love. My work has touched 50M+ users globally, and I'm passionate about accessible design and building design systems that scale.",
  },
  experience: {
    template: "modern" as const,
    title: "Design Journey",
    experiences: [
      {
        id: 1,
        company: "Spotify",
        position: "Senior Product Designer",
        location: "San Francisco, CA",
        startDate: "Aug 2021",
        endDate: "",
        current: true,
        description: "Leading design for Spotify's social features and collaborative playlists, impacting 400M+ monthly active users.",
        achievements: [
          "Redesigned Blend feature increasing engagement by 65%",
          "Built and maintained design system used by 50+ designers",
          "Mentored 4 junior designers through career growth program",
          "Won internal Hackathon with AI-powered playlist concept",
        ],
      },
      {
        id: 2,
        company: "Airbnb",
        position: "Product Designer",
        location: "San Francisco, CA",
        startDate: "Jun 2018",
        endDate: "Jul 2021",
        current: false,
        description: "Designed core booking experiences and host tools for the world's largest travel platform.",
        achievements: [
          "Led redesign of mobile booking flow - 23% conversion increase",
          "Created accessibility guidelines adopted company-wide",
          "Shipped Superhost dashboard used by 500K+ hosts globally",
        ],
      },
      {
        id: 3,
        company: "IDEO",
        position: "Interaction Designer",
        location: "Palo Alto, CA",
        startDate: "May 2016",
        endDate: "May 2018",
        current: false,
        description: "Worked with clients across healthcare, finance, and retail on human-centered design projects.",
        achievements: [
          "Designed patient portal for Kaiser Permanente (12M users)",
          "Won Red Dot Design Award for banking app concept",
        ],
      },
    ],
  },
  education: {
    template: "modern" as const,
    title: "Education",
    education: [
      {
        id: 1,
        institution: "Rhode Island School of Design",
        degree: "Master of Fine Arts",
        field: "Graphic Design",
        location: "Providence, RI",
        startDate: "2014",
        endDate: "2016",
        gpa: "",
        achievements: ["Thesis: Designing for Emotional Connection", "Teaching Assistant - Typography"],
      },
      {
        id: 2,
        institution: "University of Washington",
        degree: "Bachelor of Arts",
        field: "Visual Communication Design",
        location: "Seattle, WA",
        startDate: "2010",
        endDate: "2014",
        gpa: "3.8",
        achievements: ["Design Club President", "Study Abroad - Copenhagen"],
      },
    ],
  },
  skills: {
    template: "modern" as const,
    title: "Skills & Tools",
    displayType: "grid" as const,
    skills: [
      { name: "Figma", level: 5, category: "Design Tools" },
      { name: "Sketch", level: 5, category: "Design Tools" },
      { name: "Adobe Creative Suite", level: 5, category: "Design Tools" },
      { name: "Framer", level: 4, category: "Prototyping" },
      { name: "Principle", level: 4, category: "Prototyping" },
      { name: "After Effects", level: 4, category: "Motion" },
      { name: "User Research", level: 5, category: "UX" },
      { name: "Design Systems", level: 5, category: "UX" },
      { name: "A/B Testing", level: 4, category: "UX" },
      { name: "React Basics", level: 3, category: "Development" },
      { name: "HTML/CSS", level: 4, category: "Development" },
      { name: "Accessibility (WCAG)", level: 5, category: "Standards" },
    ],
  },
  projects: {
    template: "modern" as const,
    title: "Featured Work",
    projects: [
      {
        id: 1,
        name: "Harmony - Music Collaboration App",
        description: "Social music creation platform connecting artists worldwide. Featured in Apple App Store.",
        technologies: ["Figma", "Framer", "React Native"],
        liveUrl: "https://harmony.app",
        githubUrl: "",
      },
      {
        id: 2,
        name: "MindfulSpace Design System",
        description: "Comprehensive design system with 200+ components for mental health startup.",
        technologies: ["Figma", "Storybook", "Design Tokens"],
        liveUrl: "https://design.mindfulspace.io",
        githubUrl: "",
      },
      {
        id: 3,
        name: "EcoTrack - Sustainability Dashboard",
        description: "Personal carbon footprint tracker with gamification elements. 100K+ downloads.",
        technologies: ["Sketch", "Principle", "Data Visualization"],
        liveUrl: "",
        githubUrl: "",
      },
    ],
  },
  certifications: {
    template: "modern" as const,
    title: "Recognition",
    certifications: [
      { id: 1, name: "Apple Design Award Finalist", issuer: "Apple", date: "2023", credentialUrl: "" },
      { id: 2, name: "Red Dot Design Award", issuer: "Red Dot", date: "2022", credentialUrl: "" },
      { id: 3, name: "Google UX Certificate", issuer: "Google", date: "2020", credentialUrl: "" },
      { id: 4, name: "Nielsen Norman Group UX Certification", issuer: "NN/g", date: "2019", credentialUrl: "" },
    ],
  },
  languages: {
    template: "modern" as const,
    title: "Languages",
    languages: [
      { name: "English", proficiency: "Native" },
      { name: "Cantonese", proficiency: "Native" },
      { name: "Mandarin", proficiency: "Fluent" },
      { name: "Japanese", proficiency: "Basic" },
    ],
  },
  contact: {
    template: "modern" as const,
    title: "Let's Create Together",
    email: "marcus.chen@design.io",
    phone: "+1 (415) 987-6543",
    location: "San Francisco, CA",
    linkedin: "https://linkedin.com/in/marcuschen",
    github: "https://github.com/marcuschen",
    website: "https://marcuschen.design",
    message: "Always excited about projects that push creative boundaries. Whether it's a startup MVP or enterprise redesign, let's chat!",
  },
};

// Template 3: Tech Minimalist - Software Engineer/Developer
export const template3Data = {
  profile: {
    template: "minimal" as const,
    fullName: "Sarah Nakamura",
    title: "Full-Stack Engineer & Open Source Contributor",
    photo: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop&crop=face",
    email: "sarah@nakamura.dev",
    phone: "+1 (206) 555-0192",
    location: "Seattle, WA (Remote)",
    linkedin: "https://linkedin.com/in/sarahnakamura",
    github: "https://github.com/sarahnakamura",
    website: "https://nakamura.dev",
  },
  summary: {
    template: "minimal" as const,
    title: "Profile",
    summary: "Full-stack engineer specializing in TypeScript, React, and distributed systems. 6+ years building scalable web applications and developer tools. Active open source maintainer with 10K+ GitHub stars. I believe in writing clean, tested code and sharing knowledge with the community through technical writing and conference talks.",
  },
  experience: {
    template: "minimal" as const,
    title: "Work Experience",
    experiences: [
      {
        id: 1,
        company: "Vercel",
        position: "Senior Software Engineer",
        location: "Remote",
        startDate: "Mar 2022",
        endDate: "",
        current: true,
        description: "Working on Next.js core framework and developer experience tooling.",
        achievements: [
          "Implemented Server Components hydration improving initial load by 40%",
          "Built CLI tooling used by 2M+ developers monthly",
          "Authored 15+ technical blog posts with 500K+ total views",
          "Reviewed 200+ community PRs and mentored 3 interns",
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
        description: "Built payment infrastructure handling billions in transactions annually.",
        achievements: [
          "Designed real-time fraud detection system (99.7% accuracy)",
          "Reduced API latency by 35% through caching optimizations",
          "Open sourced internal testing library (5K+ GitHub stars)",
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
        description: "Developed TypeScript tooling and VS Code extensions.",
        achievements: [
          "Contributed to TypeScript compiler (15+ merged PRs)",
          "Built VS Code extension with 1M+ installs",
        ],
      },
    ],
  },
  education: {
    template: "minimal" as const,
    title: "Education",
    education: [
      {
        id: 1,
        institution: "University of Washington",
        degree: "Bachelor of Science",
        field: "Computer Science",
        location: "Seattle, WA",
        startDate: "2013",
        endDate: "2017",
        gpa: "3.92",
        achievements: ["Magna Cum Laude", "Undergraduate Research Award"],
      },
    ],
  },
  skills: {
    template: "minimal" as const,
    title: "Technical Skills",
    displayType: "bars" as const,
    skills: [
      { name: "TypeScript", level: 5, category: "Languages" },
      { name: "JavaScript", level: 5, category: "Languages" },
      { name: "Python", level: 4, category: "Languages" },
      { name: "Go", level: 3, category: "Languages" },
      { name: "Rust", level: 3, category: "Languages" },
      { name: "React/Next.js", level: 5, category: "Frontend" },
      { name: "Vue.js", level: 4, category: "Frontend" },
      { name: "Tailwind CSS", level: 5, category: "Frontend" },
      { name: "Node.js", level: 5, category: "Backend" },
      { name: "PostgreSQL", level: 5, category: "Backend" },
      { name: "Redis", level: 4, category: "Backend" },
      { name: "GraphQL", level: 4, category: "Backend" },
      { name: "AWS/Vercel", level: 5, category: "Infrastructure" },
      { name: "Docker/K8s", level: 4, category: "Infrastructure" },
      { name: "CI/CD", level: 5, category: "Infrastructure" },
    ],
  },
  projects: {
    template: "minimal" as const,
    title: "Open Source & Projects",
    projects: [
      {
        id: 1,
        name: "react-query-devtools",
        description: "Developer tools for debugging React Query applications. Official maintainer.",
        technologies: ["React", "TypeScript", "Zustand"],
        liveUrl: "",
        githubUrl: "https://github.com/tanstack/query",
      },
      {
        id: 2,
        name: "fastify-prisma",
        description: "High-performance Prisma integration for Fastify. 3K+ GitHub stars.",
        technologies: ["TypeScript", "Prisma", "Fastify"],
        liveUrl: "https://npmjs.com/package/fastify-prisma",
        githubUrl: "https://github.com/sarahnakamura/fastify-prisma",
      },
      {
        id: 3,
        name: "CodeCraft",
        description: "VS Code extension for AI-assisted code refactoring. 50K+ installs.",
        technologies: ["TypeScript", "VS Code API", "OpenAI"],
        liveUrl: "https://marketplace.visualstudio.com",
        githubUrl: "https://github.com/sarahnakamura/codecraft",
      },
      {
        id: 4,
        name: "nakamura.dev",
        description: "Personal blog built with Astro. Technical writing on web development.",
        technologies: ["Astro", "MDX", "Tailwind"],
        liveUrl: "https://nakamura.dev",
        githubUrl: "https://github.com/sarahnakamura/blog",
      },
    ],
  },
  certifications: {
    template: "minimal" as const,
    title: "Certifications & Speaking",
    certifications: [
      { id: 1, name: "React Summit 2023 - Speaker", issuer: "GitNation", date: "2023", credentialUrl: "https://reactsummit.com" },
      { id: 2, name: "AWS Certified Developer - Associate", issuer: "Amazon Web Services", date: "2022", credentialUrl: "" },
      { id: 3, name: "TypeScript Deep Dive Workshop - Instructor", issuer: "Frontend Masters", date: "2022", credentialUrl: "" },
      { id: 4, name: "GraphQL Foundation Certification", issuer: "Linux Foundation", date: "2021", credentialUrl: "" },
    ],
  },
  languages: {
    template: "minimal" as const,
    title: "Languages",
    languages: [
      { name: "English", proficiency: "Native" },
      { name: "Japanese", proficiency: "Fluent" },
    ],
  },
  contact: {
    template: "minimal" as const,
    title: "Get in Touch",
    email: "sarah@nakamura.dev",
    phone: "",
    location: "Seattle, WA (Remote-first)",
    linkedin: "https://linkedin.com/in/sarahnakamura",
    github: "https://github.com/sarahnakamura",
    website: "https://nakamura.dev",
    message: "Open to interesting technical challenges, open source collaborations, and speaking opportunities. DMs are open!",
  },
};

// Helper function to get template data by ID
export const getResumeTemplateData = (templateId: FullResumeTemplate) => {
  switch (templateId) {
    case "template1":
      return template1Data;
    case "template2":
      return template2Data;
    case "template3":
      return template3Data;
    default:
      return template1Data;
  }
};

// Helper to get all template options for UI
export const getTemplateOptions = () => [
  {
    id: "template1" as FullResumeTemplate,
    name: "Executive Classic",
    description: "Traditional single-column layout for corporate professionals",
    preview: "Corporate / Executive / Traditional",
  },
  {
    id: "template2" as FullResumeTemplate,
    name: "Creative Modern",
    description: "Vibrant two-column layout for designers and creatives",
    preview: "Designer / Creative / Marketing",
  },
  {
    id: "template3" as FullResumeTemplate,
    name: "Tech Minimalist",
    description: "Clean layout with focus on skills and projects",
    preview: "Developer / Engineer / Technical",
  },
];
