import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            <span className="text-lg font-semibold">Back to Home</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/dashboard">
              <Button variant="ghost">Dashboard</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="container mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          <h1 className="text-4xl font-bold text-foreground mb-6">About Us</h1>
          <p className="text-lg text-muted-foreground leading-relaxed mb-8">
            This is an example About page. You can customize this content as needed.
          </p>
          
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">Our Mission</h2>
            <p className="text-muted-foreground">
              Add your mission statement here.
            </p>
          </div>

          <div className="mt-8">
            <Link to="/">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default About;

