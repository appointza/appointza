import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

interface CTABlockProps {
  data: {
    title?: string;
    subtitle?: string;
    buttonText?: string;
    buttonLink?: string;
  };
  onPageLinkClick?: (pageId: string) => void;
  pages?: Record<string, { id: string; name: string }>;
}

const CTABlock = ({ data, onPageLinkClick }: CTABlockProps) => {
  const handleButtonClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const href = data.buttonLink || "#";
    if (href.startsWith("#page:") && onPageLinkClick) {
      e.preventDefault();
      const pageId = href.replace("#page:", "");
      onPageLinkClick(pageId);
    }
  };
  return (
    <section 
      className="py-24 px-8 relative overflow-hidden"
      style={{ background: "var(--gradient-primary)" }}
    >
      {/* Enhanced glow effect */}
      <div className="absolute inset-0 opacity-40" style={{ background: "var(--gradient-glow)" }} />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-3xl mx-auto text-center relative z-10"
      >
        <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
          {data.title || "Ready to Get Started?"}
        </h2>
        <p className="text-lg text-primary-foreground/80 mb-8">
          {data.subtitle || "Join thousands of satisfied customers today"}
        </p>
        <motion.a
          href={data.buttonLink || "#"}
          onClick={handleButtonClick}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="inline-flex items-center gap-2 bg-background text-foreground px-8 py-4 rounded-xl font-semibold text-lg shadow-xl hover:shadow-2xl transition-shadow cursor-pointer"
        >
          {data.buttonText || "Start Now"}
          <ArrowRight className="h-5 w-5" />
        </motion.a>
      </motion.div>
    </section>
  );
};

export default CTABlock;
