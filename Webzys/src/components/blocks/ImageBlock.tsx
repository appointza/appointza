import { motion } from "framer-motion";

interface ImageBlockProps {
  data: {
    src?: string;
    alt?: string;
  };
}

const ImageBlock = ({ data }: ImageBlockProps) => {
  return (
    <section className="py-16 px-8 bg-muted/30 relative overflow-hidden">
      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 opacity-[0.02] bg-[linear-gradient(45deg,transparent_25%,rgba(0,0,0,.1)_50%,transparent_75%,rgba(0,0,0,.1)_75%),linear-gradient(45deg,transparent_25%,rgba(0,0,0,.1)_50%,transparent_75%,rgba(0,0,0,.1)_75%)] bg-[length:20px_20px]" />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        className="max-w-4xl mx-auto relative z-10"
      >
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 rounded-3xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <img
            src={data.src || "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=400&fit=crop"}
            alt={data.alt || "Image"}
            className="relative w-full h-auto rounded-2xl shadow-2xl border border-border/50"
          />
        </div>
      </motion.div>
    </section>
  );
};

export default ImageBlock;
