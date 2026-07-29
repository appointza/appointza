import { motion } from "framer-motion";
import { Zap, Shield, Heart, Star, Check, Sparkles } from "lucide-react";

interface Feature {
  icon?: string;
  title: string;
  description: string;
}

interface FeaturesBlockProps {
  data: {
    title?: string;
    features?: Feature[];
  };
}

const iconMap: Record<string, React.ComponentType<any>> = {
  Zap,
  Shield,
  Heart,
  Star,
  Check,
  Sparkles,
};

const FeaturesBlock = ({ data }: FeaturesBlockProps) => {
  const features = data.features || [
    { icon: "Zap", title: "Feature 1", description: "Description here" },
    { icon: "Shield", title: "Feature 2", description: "Description here" },
    { icon: "Heart", title: "Feature 3", description: "Description here" },
  ];

  return (
    <section className="py-20 px-8 bg-gradient-to-b from-background via-secondary/20 to-background relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 opacity-40">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>
      
      <div className="max-w-6xl mx-auto relative z-10">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl md:text-4xl font-bold text-center text-foreground mb-16"
        >
          {data.title || "Why Choose Us"}
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const IconComponent = iconMap[feature.icon || "Zap"] || Zap;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-card p-8 rounded-2xl border border-border hover:border-primary/50 hover:shadow-lg transition-all group"
              >
                <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                  <IconComponent className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturesBlock;
