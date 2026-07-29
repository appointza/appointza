import { motion } from "framer-motion";

interface TextBlockProps {
  data: {
    content?: string;
  };
}

const TextBlock = ({ data }: TextBlockProps) => {
  return (
    <section className="py-16 px-8 bg-background border-y border-border/50">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-3xl mx-auto prose prose-lg prose-headings:text-foreground prose-p:text-foreground/90"
      >
        <div className="text-foreground leading-relaxed text-lg whitespace-pre-wrap">
          {data.content || "Add your text content here. You can format it as needed."}
        </div>
      </motion.div>
    </section>
  );
};

export default TextBlock;
