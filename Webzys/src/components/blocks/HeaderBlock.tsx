import { motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useState } from "react";

interface HeaderBlockProps {
  data: {
    logo?: string;
    logoText?: string;
    links?: { label: string; href: string }[];
    ctaText?: string;
    ctaLink?: string;
  };
  onPageLinkClick?: (pageId: string) => void;
  pages?: Record<string, { id: string; name: string }>;
}

const HeaderBlock = ({ data, onPageLinkClick, pages = {} }: HeaderBlockProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const links = data.links || [
    { label: "Home", href: "#" },
    { label: "About", href: "#" },
    { label: "Services", href: "#" },
    { label: "Contact", href: "#" },
  ];

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith("#page:") && onPageLinkClick) {
      e.preventDefault();
      const pageId = href.replace("#page:", "");
      onPageLinkClick(pageId);
    }
  };

  return (
    <section className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur-sm">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2"
          >
            {data.logo ? (
              <img src={data.logo} alt="Logo" className="h-8 w-auto" />
            ) : (
              <span className="text-xl font-bold text-foreground">
                {data.logoText || "Your Logo"}
              </span>
            )}
          </motion.div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {links.map((link, index) => (
              <motion.a
                key={index}
                href={link.href}
                onClick={(e) => handleLinkClick(e, link.href)}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </motion.a>
            ))}
            {data.ctaText && (
              <motion.a
                href={data.ctaLink || "#"}
                onClick={(e) => data.ctaLink && handleLinkClick(e, data.ctaLink)}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors cursor-pointer"
              >
                {data.ctaText}
              </motion.a>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <X className="h-5 w-5 text-foreground" />
            ) : (
              <Menu className="h-5 w-5 text-foreground" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden py-4 border-t border-border"
          >
            <div className="flex flex-col gap-4">
              {links.map((link, index) => (
                <a
                  key={index}
                  href={link.href}
                  onClick={(e) => handleLinkClick(e, link.href)}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link.label}
                </a>
              ))}
              {data.ctaText && (
                <a
                  href={data.ctaLink || "#"}
                  onClick={(e) => data.ctaLink && handleLinkClick(e, data.ctaLink)}
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium w-fit"
                >
                  {data.ctaText}
                </a>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default HeaderBlock;

