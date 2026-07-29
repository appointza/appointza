import { motion } from "framer-motion";

interface SectionBlockProps {
  data: {
    title?: string;
    content?: string;
    backgroundImage?: string;
    backgroundColor?: string;
    backgroundOverlay?: boolean;
    overlayOpacity?: number;
    textAlign?: "left" | "center" | "right";
    padding?: "small" | "medium" | "large";
    buttonText?: string;
    buttonLink?: string;
    secondaryButtonText?: string;
    secondaryButtonLink?: string;
  };
  onPageLinkClick?: (pageId: string) => void;
  pages?: Record<string, { id: string; name: string }>;
}

const SectionBlock = ({ data, onPageLinkClick }: SectionBlockProps) => {
  const handleButtonClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith("#page:") && onPageLinkClick) {
      e.preventDefault();
      const pageId = href.replace("#page:", "");
      onPageLinkClick(pageId);
    }
  };

  const paddingClasses = {
    small: "py-12 px-6",
    medium: "py-20 px-8",
    large: "py-32 px-8",
  };

  const textAlignClasses = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  };

  const padding = paddingClasses[data.padding || "medium"];
  const textAlign = textAlignClasses[data.textAlign || "center"];
  const overlayOpacity = data.overlayOpacity !== undefined ? data.overlayOpacity : 0.5;

  const backgroundStyle: React.CSSProperties = {};
  if (data.backgroundImage) {
    backgroundStyle.backgroundImage = `url(${data.backgroundImage})`;
    backgroundStyle.backgroundSize = "cover";
    backgroundStyle.backgroundPosition = "center";
    backgroundStyle.backgroundRepeat = "no-repeat";
  } else if (data.backgroundColor) {
    backgroundStyle.backgroundColor = data.backgroundColor;
  }

  return (
    <section
      className={`relative ${padding} overflow-hidden`}
      style={backgroundStyle}
    >
      {/* Background Overlay */}
      {data.backgroundImage && data.backgroundOverlay && (
        <div
          className="absolute inset-0"
          style={{ backgroundColor: `rgba(0, 0, 0, ${overlayOpacity})` }}
        />
      )}

      {/* Content */}
      <div className={`relative z-10 max-w-6xl mx-auto ${textAlign}`}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="space-y-6"
        >
          {data.title && (
            <h2
              className={`text-3xl md:text-4xl lg:text-5xl font-bold ${
                data.backgroundImage && data.backgroundOverlay
                  ? "text-white"
                  : "text-foreground"
              }`}
            >
              {data.title}
            </h2>
          )}

          {data.content && (
            <div
              className={`text-lg md:text-xl leading-relaxed max-w-3xl ${
                textAlign === "center" ? "mx-auto" : ""
              } ${
                data.backgroundImage && data.backgroundOverlay
                  ? "text-white/90"
                  : "text-muted-foreground"
              }`}
              dangerouslySetInnerHTML={{ __html: data.content }}
            />
          )}

          {(data.buttonText || data.secondaryButtonText) && (
            <div className={`flex flex-wrap gap-4 ${textAlign === "center" ? "justify-center" : textAlign === "right" ? "justify-end" : "justify-start"}`}>
              {data.buttonText && (
                <motion.a
                  href={data.buttonLink || "#"}
                  onClick={(e) => handleButtonClick(e, data.buttonLink || "#")}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
                >
                  {data.buttonText}
                </motion.a>
              )}
              {data.secondaryButtonText && (
                <motion.a
                  href={data.secondaryButtonLink || "#"}
                  onClick={(e) => handleButtonClick(e, data.secondaryButtonLink || "#")}
                  whileHover={{ scale: 1.05 }}
                  className={`inline-flex items-center gap-2 border-2 px-6 py-3 rounded-lg font-semibold transition-colors cursor-pointer ${
                    data.backgroundImage && data.backgroundOverlay
                      ? "border-white text-white hover:bg-white/10"
                      : "border-primary text-primary hover:bg-primary/10"
                  }`}
                >
                  {data.secondaryButtonText}
                </motion.a>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
};

export default SectionBlock;

