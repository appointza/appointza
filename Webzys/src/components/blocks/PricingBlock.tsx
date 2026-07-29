import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Feature {
  text: string;
  included: boolean;
}

interface Plan {
  name: string;
  price: string;
  period?: string;
  description?: string;
  features: Feature[];
  ctaText?: string;
  popular?: boolean;
}

interface PricingBlockProps {
  data: {
    title?: string;
    subtitle?: string;
    plans?: Plan[];
  };
}

const PricingBlock = ({ data }: PricingBlockProps) => {
  const plans = data.plans || [
    {
      name: "Starter",
      price: "$9",
      period: "/month",
      description: "Perfect for getting started",
      features: [
        { text: "Feature 1", included: true },
        { text: "Feature 2", included: true },
        { text: "Feature 3", included: false },
      ],
      ctaText: "Get Started",
    },
    {
      name: "Pro",
      price: "$29",
      period: "/month",
      description: "For growing businesses",
      features: [
        { text: "Feature 1", included: true },
        { text: "Feature 2", included: true },
        { text: "Feature 3", included: true },
      ],
      ctaText: "Get Started",
      popular: true,
    },
    {
      name: "Enterprise",
      price: "$99",
      period: "/month",
      description: "For large organizations",
      features: [
        { text: "Feature 1", included: true },
        { text: "Feature 2", included: true },
        { text: "Feature 3", included: true },
      ],
      ctaText: "Contact Sales",
    },
  ];

  return (
    <section className="py-24 px-8 bg-gradient-to-b from-background via-muted/10 to-background relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`relative bg-card rounded-2xl border-2 p-8 ${
                plan.popular
                  ? "border-primary shadow-2xl scale-105"
                  : "border-border hover:border-primary/50"
              } transition-all`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-foreground mb-2">{plan.name}</h3>
                {plan.description && (
                  <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>
                )}
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-5xl font-bold text-foreground">{plan.price}</span>
                  {plan.period && (
                    <span className="text-muted-foreground">{plan.period}</span>
                  )}
                </div>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start gap-3">
                    {feature.included ? (
                      <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="h-3 w-3 text-primary" />
                      </div>
                    ) : (
                      <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                        <X className="h-3 w-3 text-muted-foreground" />
                      </div>
                    )}
                    <span
                      className={`text-sm ${
                        feature.included ? "text-foreground" : "text-muted-foreground line-through"
                      }`}
                    >
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>

              <Button
                variant={plan.popular ? "gradient" : "outline"}
                className="w-full"
                size="lg"
              >
                {plan.ctaText || "Get Started"}
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingBlock;

