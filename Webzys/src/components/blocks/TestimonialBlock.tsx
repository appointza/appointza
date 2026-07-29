import { motion } from "framer-motion";
import { Quote } from "lucide-react";

interface TestimonialBlockProps {
  data: {
    quote?: string;
    author?: string;
    role?: string;
    avatar?: string;
  };
}

const TestimonialBlock = ({ data }: TestimonialBlockProps) => {
  return (
    <section className="py-24 px-8 bg-gradient-to-b from-secondary/40 via-secondary/20 to-secondary/40 relative overflow-hidden">
      {/* Decorative quote marks */}
      <div className="absolute top-10 left-10 text-primary/5 text-9xl font-serif leading-none">"</div>
      <div className="absolute bottom-10 right-10 text-primary/5 text-9xl font-serif leading-none rotate-180">"</div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-3xl mx-auto text-center relative z-10"
      >
        <motion.div 
          initial={{ scale: 0 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true }}
          className="h-16 w-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mx-auto mb-8 shadow-lg border border-primary/20"
        >
          <Quote className="h-7 w-7 text-primary" />
        </motion.div>

        <blockquote className="text-2xl md:text-3xl font-medium text-foreground mb-10 leading-relaxed italic">
          "{data.quote || "This product changed my life. Highly recommended!"}"
        </blockquote>

        <div className="flex items-center justify-center gap-4">
          {data.avatar && (
            <motion.img
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              src={data.avatar}
              alt={data.author}
              className="h-16 w-16 rounded-full object-cover border-2 border-primary/20 shadow-lg"
            />
          )}
          <div className="text-left">
            <p className="font-semibold text-foreground text-lg">
              {data.author || "John Doe"}
            </p>
            <p className="text-muted-foreground">
              {data.role || "CEO, Company"}
            </p>
          </div>
        </div>
      </motion.div>
    </section>
  );
};

export default TestimonialBlock;
