import { motion } from "framer-motion";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Star, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Review {
  rating?: number;
  comment: string;
  author: string;
  role?: string;
  avatar?: string;
}

interface ReviewsBlockProps {
  data: {
    title?: string;
    reviews?: Review[];
    autoPlay?: boolean;
  };
}

const ReviewsBlock = ({ data }: ReviewsBlockProps) => {
  const reviews = data.reviews || [
    { rating: 5, comment: "Excellent service!", author: "John Doe", role: "Customer" },
    { rating: 5, comment: "Highly recommended!", author: "Jane Smith", role: "Client" },
    { rating: 5, comment: "Amazing experience!", author: "Bob Johnson", role: "User" },
  ];
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextReview = () => {
    setCurrentIndex((prev) => (prev + 1) % reviews.length);
  };

  const prevReview = () => {
    setCurrentIndex((prev) => (prev - 1 + reviews.length) % reviews.length);
  };

  return (
    <section className="py-24 px-8 bg-gradient-to-b from-secondary/30 via-background to-secondary/30 relative overflow-hidden">
      {/* Decorative quote marks */}
      <div className="absolute top-10 left-10 text-primary/5 text-9xl font-serif leading-none">"</div>
      <div className="absolute bottom-10 right-10 text-primary/5 text-9xl font-serif leading-none rotate-180">"</div>

      <div className="max-w-4xl mx-auto relative z-10">
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

        <div className="relative">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="bg-card p-8 md:p-12 rounded-2xl border border-border shadow-xl"
          >
            {/* Rating Stars */}
            {reviews[currentIndex].rating && (
              <div className="flex gap-1 mb-6 justify-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${
                      i < (reviews[currentIndex].rating || 0)
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-muted-foreground"
                    }`}
                  />
                ))}
              </div>
            )}

            {/* Quote Icon */}
            <div className="flex justify-center mb-6">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Quote className="h-6 w-6 text-primary" />
              </div>
            </div>

            {/* Review Text */}
            <p className="text-xl md:text-2xl text-center text-foreground mb-8 italic leading-relaxed">
              "{reviews[currentIndex].comment}"
            </p>

            {/* Author Info */}
            <div className="flex items-center justify-center gap-4">
              {reviews[currentIndex].avatar && (
                <img
                  src={reviews[currentIndex].avatar}
                  alt={reviews[currentIndex].author}
                  className="h-14 w-14 rounded-full object-cover border-2 border-primary/20"
                />
              )}
              <div className="text-center">
                <p className="font-semibold text-foreground text-lg">
                  {reviews[currentIndex].author}
                </p>
                {reviews[currentIndex].role && (
                  <p className="text-muted-foreground text-sm">
                    {reviews[currentIndex].role}
                  </p>
                )}
              </div>
            </div>
          </motion.div>

          {/* Navigation */}
          {reviews.length > 1 && (
            <>
              <Button
                variant="secondary"
                size="icon"
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background shadow-lg"
                onClick={prevReview}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background shadow-lg"
                onClick={nextReview}
              >
                <ChevronRight className="h-5 w-5" />
              </Button>

              {/* Dots Indicator */}
              <div className="flex gap-2 justify-center mt-8">
                {reviews.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`h-2 rounded-full transition-all ${
                      index === currentIndex
                        ? "w-8 bg-primary"
                        : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
};

export default ReviewsBlock;

