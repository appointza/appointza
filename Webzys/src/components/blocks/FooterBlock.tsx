import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin } from "lucide-react";

interface FooterBlockProps {
  data: {
    companyName?: string;
    description?: string;
    links?: { label: string; href: string }[];
    textItems?: { text: string; href?: string }[];
    contact?: {
      email?: string;
      phone?: string;
      address?: string;
    };
    socialLinks?: {
      facebook?: string;
      twitter?: string;
      instagram?: string;
      linkedin?: string;
    };
    copyright?: string;
  };
  onPageLinkClick?: (pageId: string) => void;
  pages?: Record<string, { id: string; name: string }>;
}

const FooterBlock = ({ data, onPageLinkClick }: FooterBlockProps) => {
  // Support both textItems (new) and links (backward compatibility)
  const textItems = data.textItems || data.links?.map(link => ({ text: link.label, href: link.href })) || [
    { text: "About", href: "#" },
    { text: "Services", href: "#" },
    { text: "Contact", href: "#" },
    { text: "Privacy", href: "#" },
  ];

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith("#page:") && onPageLinkClick) {
      e.preventDefault();
      const pageId = href.replace("#page:", "");
      onPageLinkClick(pageId);
    }
  };

  const socialIcons = [
    { icon: Facebook, href: data.socialLinks?.facebook, label: "Facebook" },
    { icon: Twitter, href: data.socialLinks?.twitter, label: "Twitter" },
    { icon: Instagram, href: data.socialLinks?.instagram, label: "Instagram" },
    { icon: Linkedin, href: data.socialLinks?.linkedin, label: "LinkedIn" },
  ].filter((item) => item.href);

  return (
    <section className="py-16 px-8 bg-gradient-to-b from-background via-secondary/20 to-background border-t border-border relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Company Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h3 className="text-lg font-bold text-foreground mb-4">
              {data.companyName || "Your Company"}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {data.description || "Building amazing experiences for our customers."}
            </p>
            {socialIcons.length > 0 && (
              <div className="flex gap-3">
                {socialIcons.map((item, index) => {
                  const IconComponent = item.icon;
                  return (
                    <motion.a
                      key={index}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ scale: 1.1 }}
                      className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center hover:bg-primary/10 transition-colors"
                    >
                      <IconComponent className="h-4 w-4 text-muted-foreground" />
                    </motion.a>
                  );
                })}
              </div>
            )}
          </motion.div>

          {/* Quick Links / Text Items */}
          {textItems.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <h4 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wider">
                Quick Links
              </h4>
              <ul className="space-y-2">
                {textItems.map((item, index) => (
                  <li key={index}>
                    {item.href && item.href !== "#" ? (
                      <a
                        href={item.href}
                        onClick={(e) => handleLinkClick(e, item.href!)}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {item.text}
                      </a>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        {item.text}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </motion.div>
          )}

          {/* Contact Info */}
          {data.contact && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <h4 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wider">
                Contact
              </h4>
              <ul className="space-y-3">
                {data.contact.email && (
                  <li className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    {data.contact.email}
                  </li>
                )}
                {data.contact.phone && (
                  <li className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    {data.contact.phone}
                  </li>
                )}
                {data.contact.address && (
                  <li className="flex items-start gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    {data.contact.address}
                  </li>
                )}
              </ul>
            </motion.div>
          )}

          {/* Newsletter/Extra */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            <h4 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wider">
              Newsletter
            </h4>
            <p className="text-sm text-muted-foreground mb-4">
              Subscribe to get updates on new features and releases.
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Your email"
                className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
                Subscribe
              </button>
            </div>
          </motion.div>
        </div>

        {/* Copyright */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="pt-8 border-t border-border text-center"
        >
          <p className="text-sm text-muted-foreground">
            {data.copyright || `© ${new Date().getFullYear()} ${data.companyName || "Your Company"}. All rights reserved.`}
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default FooterBlock;

