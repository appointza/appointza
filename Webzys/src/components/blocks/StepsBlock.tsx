import { motion } from "framer-motion";
import { CheckCircle2, ArrowRight } from "lucide-react";

interface Step {
  title: string;
  description: string;
}

interface StepsBlockProps {
  data: {
    title?: string;
    subtitle?: string;
    steps?: Step[];
  };
}

const StepsBlock = ({ data }: StepsBlockProps) => {
  const steps = data.steps || [
    { title: "Step 1", description: "Description of the first step" },
    { title: "Step 2", description: "Description of the second step" },
    { title: "Step 3", description: "Description of the third step" },
  ];

  return (
    <section className="py-24 px-8 bg-gradient-to-b from-background via-muted/10 to-background relative overflow-hidden">
      {/* Decorative lines */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent" />
      </div>

      <div className="max-w-5xl mx-auto relative z-10">
        {data.title && (
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold text-center text-foreground mb-4"
          >
            {data.title}
          </motion.h2>
        )}

        {data.subtitle && (
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center text-muted-foreground mb-16 max-w-2xl mx-auto"
          >
            {data.subtitle}
          </motion.p>
        )}

        <div className="relative">
          {/* Connection line for desktop */}
          <div className="hidden md:block absolute top-12 left-0 right-0 h-0.5 bg-gradient-to-r from-primary/20 via-primary/50 to-primary/20" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="relative"
              >
                {/* Step number circle */}
                <div className="flex flex-col items-center">
                  <div className="relative z-10 h-24 w-24 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 border-4 border-background flex items-center justify-center mb-6 shadow-lg">
                    <CheckCircle2 className="h-10 w-10 text-primary" />
                    <span className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </span>
                  </div>

                  {/* Arrow for desktop (except last) */}
                  {index < steps.length - 1 && (
                    <div className="hidden md:block absolute top-12 left-full w-full">
                      <ArrowRight className="h-6 w-6 text-primary/50 mx-auto" />
                    </div>
                  )}

                  {/* Content */}
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-foreground mb-3">{step.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{step.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default StepsBlock;

