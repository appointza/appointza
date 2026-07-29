import { motion } from "framer-motion";
import { ArrowRight, Play } from "lucide-react";

interface HeroBlockProps {
  data: {
    title?: string;
    subtitle?: string;
    buttonText?: string;
    buttonLink?: string;
    backgroundType?: string;
    image?: string;
    videoUrl?: string;
    secondaryButtonText?: string;
    secondaryButtonLink?: string;
  };
  variant?: string;
  onPageLinkClick?: (pageId: string) => void;
  pages?: Record<string, { id: string; name: string }>;
}

const HeroBlock = ({ data, variant = "hero", onPageLinkClick }: HeroBlockProps) => {
  const handleButtonClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith("#page:") && onPageLinkClick) {
      e.preventDefault();
      const pageId = href.replace("#page:", "");
      onPageLinkClick(pageId);
    }
  };

  // Hero 1: Centered with gradient (original)
  if (variant === "hero") {
    return (
      <section
        className="relative min-h-[70vh] flex flex-col items-center justify-center text-center px-8 py-20 overflow-hidden"
        style={{ background: "var(--gradient-primary)" }}
      >
        <div className="absolute inset-0 opacity-30" style={{ background: "var(--gradient-glow)" }} />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 max-w-4xl mx-auto"
        >
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-6 leading-tight">
            {data.title || "Your Headline Here"}
          </h1>
          <p className="text-lg md:text-xl text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
            {data.subtitle || "Add a compelling subtitle that explains your value proposition"}
          </p>
          <motion.a
            href={data.buttonLink || "#"}
            onClick={(e) => handleButtonClick(e, data.buttonLink || "#")}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center gap-2 bg-background text-foreground px-8 py-4 rounded-xl font-semibold text-lg shadow-xl hover:shadow-2xl transition-shadow cursor-pointer"
          >
            {data.buttonText || "Get Started"}
            <ArrowRight className="h-5 w-5" />
          </motion.a>
        </motion.div>
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background/10 to-transparent" />
      </section>
    );
  }

  // Hero 2: Split layout with image
  if (variant === "hero-2") {
    return (
      <section className="relative min-h-[80vh] flex items-center overflow-hidden bg-gradient-to-br from-primary/10 via-background to-primary/5">
        <div className="container mx-auto px-6 py-16">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
                {data.title || "Your Headline Here"}
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
                {data.subtitle || "Add a compelling subtitle that explains your value proposition"}
              </p>
              <div className="flex flex-wrap gap-4">
                <motion.a
                  href={data.buttonLink || "#"}
                  onClick={(e) => handleButtonClick(e, data.buttonLink || "#")}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
                >
                  {data.buttonText || "Get Started"}
                  <ArrowRight className="h-4 w-4" />
                </motion.a>
                {data.secondaryButtonText && (
                  <motion.a
                    href={data.secondaryButtonLink || "#"}
                    onClick={(e) => handleButtonClick(e, data.secondaryButtonLink || "#")}
                    whileHover={{ scale: 1.05 }}
                    className="inline-flex items-center gap-2 border-2 border-primary text-primary px-6 py-3 rounded-lg font-semibold hover:bg-primary/10 transition-colors cursor-pointer"
                  >
                    {data.secondaryButtonText}
                  </motion.a>
                )}
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              {data.image ? (
                <img
                  src={data.image}
                  alt={data.title || "Hero"}
                  className="w-full h-[500px] object-cover rounded-2xl shadow-2xl"
                />
              ) : (
                <div className="w-full h-[500px] bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl flex items-center justify-center">
                  <span className="text-muted-foreground">Add an image</span>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </section>
    );
  }

  // Hero 3: Minimal centered
  if (variant === "hero-3") {
    return (
      <section className="relative min-h-[60vh] flex flex-col items-center justify-center text-center px-8 py-20 bg-background">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto space-y-6"
        >
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground leading-tight">
            {data.title || "Your Headline Here"}
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
            {data.subtitle || "Add a compelling subtitle that explains your value proposition"}
          </p>
          <div className="pt-4">
            <motion.a
              href={data.buttonLink || "#"}
              onClick={(e) => handleButtonClick(e, data.buttonLink || "#")}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center gap-2 bg-foreground text-background px-8 py-4 rounded-lg font-semibold text-lg hover:opacity-90 transition-opacity cursor-pointer"
            >
              {data.buttonText || "Get Started"}
              <ArrowRight className="h-5 w-5" />
            </motion.a>
          </div>
        </motion.div>
      </section>
    );
  }

  // Hero 4: Full image background
  if (variant === "hero-4") {
    return (
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center text-center px-8 py-20 overflow-hidden">
        {data.image ? (
          <div className="absolute inset-0">
            <img
              src={data.image}
              alt={data.title || "Hero"}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/50" />
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/60" />
        )}
        
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 max-w-4xl mx-auto"
        >
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight drop-shadow-lg">
            {data.title || "Your Headline Here"}
          </h1>
          <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl mx-auto drop-shadow-md">
            {data.subtitle || "Add a compelling subtitle that explains your value proposition"}
          </p>
          <motion.a
            href={data.buttonLink || "#"}
            onClick={(e) => handleButtonClick(e, data.buttonLink || "#")}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center gap-2 bg-white text-foreground px-8 py-4 rounded-xl font-semibold text-lg shadow-xl hover:shadow-2xl transition-shadow cursor-pointer"
          >
            {data.buttonText || "Get Started"}
            <ArrowRight className="h-5 w-5" />
          </motion.a>
        </motion.div>
      </section>
    );
  }

  // Hero 5: Left aligned
  if (variant === "hero-5") {
    return (
      <section className="relative min-h-[70vh] flex items-center px-8 py-20 bg-gradient-to-r from-primary/10 via-background to-background">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight text-left">
                {data.title || "Your Headline Here"}
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed text-left max-w-xl">
                {data.subtitle || "Add a compelling subtitle that explains your value proposition"}
              </p>
              <div className="flex flex-wrap gap-4 pt-4">
                <motion.a
                  href={data.buttonLink || "#"}
                  onClick={(e) => handleButtonClick(e, data.buttonLink || "#")}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
                >
                  {data.buttonText || "Get Started"}
                  <ArrowRight className="h-4 w-4" />
                </motion.a>
                {data.secondaryButtonText && (
                  <motion.a
                    href={data.secondaryButtonLink || "#"}
                    onClick={(e) => handleButtonClick(e, data.secondaryButtonLink || "#")}
                    whileHover={{ scale: 1.05 }}
                    className="inline-flex items-center gap-2 border-2 border-primary text-primary px-6 py-3 rounded-lg font-semibold hover:bg-primary/10 transition-colors cursor-pointer"
                  >
                    {data.secondaryButtonText}
                  </motion.a>
                )}
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative h-[400px]"
            >
              {data.image ? (
                <img
                  src={data.image}
                  alt={data.title || "Hero"}
                  className="w-full h-full object-cover rounded-2xl shadow-2xl"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl flex items-center justify-center">
                  <span className="text-muted-foreground">Add an image</span>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </section>
    );
  }

  // Hero 6: Video background
  if (variant === "hero-6") {
    return (
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center text-center px-8 py-20 overflow-hidden">
        {data.videoUrl ? (
          <div className="absolute inset-0">
            <video
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
            >
              <source src={data.videoUrl} type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-black/40" />
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/60" />
        )}
        
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 max-w-4xl mx-auto"
        >
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight drop-shadow-lg">
            {data.title || "Your Headline Here"}
          </h1>
          <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl mx-auto drop-shadow-md">
            {data.subtitle || "Add a compelling subtitle that explains your value proposition"}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <motion.a
              href={data.buttonLink || "#"}
              onClick={(e) => handleButtonClick(e, data.buttonLink || "#")}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center gap-2 bg-white text-foreground px-8 py-4 rounded-xl font-semibold text-lg shadow-xl hover:shadow-2xl transition-shadow cursor-pointer"
            >
              {data.buttonText || "Get Started"}
              <ArrowRight className="h-5 w-5" />
            </motion.a>
            {data.secondaryButtonText && (
              <motion.a
                href={data.secondaryButtonLink || "#"}
                onClick={(e) => handleButtonClick(e, data.secondaryButtonLink || "#")}
                whileHover={{ scale: 1.05 }}
                className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white border-2 border-white/30 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white/20 transition-colors cursor-pointer"
              >
                <Play className="h-5 w-5" />
                {data.secondaryButtonText}
              </motion.a>
            )}
          </div>
        </motion.div>
      </section>
    );
  }

  // Default fallback
  return null;
};

export default HeroBlock;
