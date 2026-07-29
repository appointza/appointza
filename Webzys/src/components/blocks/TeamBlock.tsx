import { motion } from "framer-motion";
import { Linkedin, Twitter, Mail } from "lucide-react";

interface TeamMember {
  name: string;
  role: string;
  bio?: string;
  avatar: string;
  social?: {
    linkedin?: string;
    twitter?: string;
    email?: string;
  };
}

interface TeamBlockProps {
  data: {
    title?: string;
    subtitle?: string;
    members?: TeamMember[];
  };
}

const TeamBlock = ({ data }: TeamBlockProps) => {
  const members = data.members || [
    {
      name: "John Doe",
      role: "CEO & Founder",
      bio: "Passionate about building great products",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face",
      social: {
        linkedin: "#",
        twitter: "#",
        email: "#",
      },
    },
    {
      name: "Jane Smith",
      role: "CTO",
      bio: "Tech enthusiast and problem solver",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&crop=face",
      social: {
        linkedin: "#",
        twitter: "#",
      },
    },
    {
      name: "Bob Johnson",
      role: "Design Lead",
      bio: "Creating beautiful user experiences",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face",
      social: {
        linkedin: "#",
        email: "#",
      },
    },
  ];

  return (
    <section className="py-24 px-8 bg-gradient-to-b from-background via-secondary/20 to-background relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {data.title && (
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold text-center text-foreground mb-4"
          >
            {data.title}
          </motion.h2>
        )}

        {data.subtitle && (
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center text-muted-foreground mb-16 max-w-2xl mx-auto"
          >
            {data.subtitle}
          </motion.p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {members.map((member, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-card rounded-2xl border border-border p-8 text-center hover:border-primary/50 hover:shadow-xl transition-all group"
            >
              {/* Avatar */}
              <div className="relative mb-6 inline-block">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <img
                  src={member.avatar}
                  alt={member.name}
                  className="relative h-32 w-32 rounded-full object-cover mx-auto border-4 border-background shadow-lg"
                />
              </div>

              {/* Info */}
              <h3 className="text-xl font-bold text-foreground mb-2">{member.name}</h3>
              <p className="text-primary font-medium mb-4">{member.role}</p>
              {member.bio && (
                <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                  {member.bio}
                </p>
              )}

              {/* Social Links */}
              {member.social && (
                <div className="flex items-center justify-center gap-3">
                  {member.social.linkedin && (
                    <motion.a
                      href={member.social.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center hover:bg-primary/10 transition-colors"
                    >
                      <Linkedin className="h-4 w-4 text-muted-foreground" />
                    </motion.a>
                  )}
                  {member.social.twitter && (
                    <motion.a
                      href={member.social.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center hover:bg-primary/10 transition-colors"
                    >
                      <Twitter className="h-4 w-4 text-muted-foreground" />
                    </motion.a>
                  )}
                  {member.social.email && (
                    <motion.a
                      href={`mailto:${member.social.email}`}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center hover:bg-primary/10 transition-colors"
                    >
                      <Mail className="h-4 w-4 text-muted-foreground" />
                    </motion.a>
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TeamBlock;

