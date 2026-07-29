import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";

interface Stat {
  value: string;
  label: string;
  suffix?: string;
}

interface StatsBlockProps {
  data: {
    title?: string;
    stats?: Stat[];
  };
}

const AnimatedCounter = ({ value, suffix = "" }: { value: string; suffix?: string }) => {
  const numericValue = parseInt(value.replace(/\D/g, ""));
  const [displayValue, setDisplayValue] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (isInView && numericValue) {
      const duration = 2000;
      const steps = 60;
      const increment = numericValue / steps;
      let current = 0;

      const timer = setInterval(() => {
        current += increment;
        if (current >= numericValue) {
          setDisplayValue(numericValue);
          clearInterval(timer);
        } else {
          setDisplayValue(Math.floor(current));
        }
      }, duration / steps);

      return () => clearInterval(timer);
    }
  }, [isInView, numericValue]);

  return (
    <span ref={ref}>
      {isInView ? (numericValue ? displayValue : value) : "0"}
      {suffix}
    </span>
  );
};

const StatsBlock = ({ data }: StatsBlockProps) => {
  const stats = data.stats || [
    { value: "1000+", label: "Happy Customers" },
    { value: "50+", label: "Projects Completed" },
    { value: "99%", label: "Satisfaction Rate" },
    { value: "24/7", label: "Support Available" },
  ];

  return (
    <section className="py-24 px-8 bg-gradient-to-br from-primary/5 via-background to-primary/5 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {data.title && (
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold text-center text-foreground mb-16"
          >
            {data.title}
          </motion.h2>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => {
            const numericValue = stat.value.replace(/\D/g, "");
            const suffix = stat.value.replace(numericValue, "");
            
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary mb-2">
                  <AnimatedCounter value={stat.value} suffix={suffix} />
                </div>
                <p className="text-sm md:text-base text-muted-foreground font-medium">
                  {stat.label}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default StatsBlock;

