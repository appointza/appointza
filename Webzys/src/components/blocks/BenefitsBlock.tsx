import { motion } from "framer-motion";
import { Check } from "lucide-react";

interface Benefit {
  text: string;
}

interface BenefitsBlockProps {
  data: {
    title?: string;
    benefits?: Benefit[];
  };
}

const BenefitsBlock = ({ data }: BenefitsBlockProps) => {
  const benefits = data.benefits || [
    { text: "Benefit 1" },
    { text: "Benefit 2" },
    { text: "Benefit 3" },
  ];

  return (
    <section className="py-20 px-8 bg-gradient-to-b from-secondary/20 via-background to-secondary/20 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/4 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        {data.title && (
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold text-center text-foreground mb-12"
          >
            {data.title}
          </motion.h2>
        )}

        <div className="space-y-4">
          {benefits.map((benefit, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="flex items-start gap-4 p-6 rounded-xl bg-card border border-border hover:border-primary/50 hover:shadow-lg transition-all group"
            >
              <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors mt-0.5">
                <Check className="h-4 w-4 text-primary" />
              </div>
              <p className="text-lg text-foreground flex-1 pt-0.5">
                {benefit.text}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BenefitsBlock;

