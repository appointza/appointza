import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

interface FacilitiesListBlockProps {
  data: {
    title?: string;
    facilities?: string[];
  };
}

const FacilitiesListBlock = ({ data }: FacilitiesListBlockProps) => {
  const facilities = data.facilities || [];

  return (
    <section className="py-20 px-8 bg-gradient-to-b from-background via-muted/10 to-background relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
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

        {facilities.length === 0 ? (
          <div className="text-center py-12 bg-muted/50 rounded-xl border-2 border-dashed border-border">
            <p className="text-muted-foreground">No facilities listed</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {facilities.map((facility, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-3 p-4 rounded-lg bg-card border border-border hover:border-primary/50 transition-all"
              >
                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                </div>
                <span className="text-foreground font-medium">{facility}</span>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default FacilitiesListBlock;

