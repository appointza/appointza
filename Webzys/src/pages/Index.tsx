import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Zap, Layout, Download, Palette, Layers, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import webzysLogo from "@/assets/webzys-logo.png";

const Index = () => {
  const features = [
    {
      icon: Layout,
      title: "Visual Builder",
      description: "Drag and drop blocks to build pages without any coding required",
    },
    {
      icon: Palette,
      title: "50+ Blocks",
      description: "Hero sections, features, testimonials, forms, and much more",
    },
    {
      icon: Download,
      title: "Export to HTML",
      description: "Download your pages as standalone HTML files that work anywhere",
    },
    {
      icon: Layers,
      title: "Media Library",
      description: "Upload and manage images across all your websites",
    },
    {
      icon: Zap,
      title: "Real-time Preview",
      description: "See changes instantly as you edit your pages",
    },
    {
      icon: Globe,
      title: "Multiple Websites",
      description: "Create and manage unlimited websites from one dashboard",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={webzysLogo} alt="Webzys" className="h-8 w-auto" />
            <span className="text-xl font-bold text-foreground">Webzys</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login">
              <Button variant="gradient">Login</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0" style={{ background: "var(--gradient-hero)" }} />
        <div className="absolute inset-0" style={{ background: "var(--gradient-glow)" }} />

        <div className="relative container mx-auto px-6 py-24 md:py-32 lg:py-40">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto text-center"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 mb-8"
            >
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">Build websites visually</span>
            </motion.div>

            <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold text-primary-foreground mb-6 leading-tight">
              Create stunning websites
              <br />
              <span className="gradient-text">without code</span>
            </h1>

            <p className="text-lg md:text-xl text-primary-foreground/70 mb-10 max-w-2xl mx-auto">
              Design and build professional websites using modular blocks. Preview in real-time and export as standalone HTML files.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/login">
                <Button variant="hero" size="xl">
                  Login to Get Started
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Decorative preview blocks */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="mt-16 max-w-5xl mx-auto"
          >
            <div className="relative">
              <div className="absolute -inset-4 rounded-3xl opacity-50" style={{ background: "var(--gradient-glow)" }} />
              <div className="relative grid grid-cols-4 gap-4 p-6 rounded-2xl bg-card/10 backdrop-blur-sm border border-primary-foreground/10">
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + i * 0.05 }}
                    className={`rounded-xl bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/20 ${
                      i === 0 ? "col-span-4 h-32" : i < 5 ? "h-24" : "h-20"
                    }`}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6 bg-secondary/30">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Everything you need to build
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Powerful features to help you create professional websites quickly and easily
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-card p-8 rounded-2xl border border-border hover:border-primary/50 hover:shadow-lg transition-all group"
              >
                <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6" style={{ background: "var(--gradient-primary)" }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="container mx-auto text-center"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            Ready to build your website?
          </h2>
          <p className="text-lg text-primary-foreground/80 mb-8 max-w-xl mx-auto">
            Join thousands of creators who trust Webzys to build stunning websites
          </p>
          <Link to="/login">
            <Button
              size="xl"
              className="bg-background text-foreground hover:bg-background/90 shadow-xl"
            >
              Login to Get Started
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-12 px-6">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src={webzysLogo} alt="Webzys" className="h-6 w-auto" />
            <span className="font-semibold text-foreground">Webzys</span>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              About
            </Link>
            <p className="text-sm text-muted-foreground">
              © 2024 Webzys. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
