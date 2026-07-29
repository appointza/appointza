import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImageCarouselBlockProps {
  data: {
    images?: { src: string; alt: string }[];
    autoPlay?: boolean;
  };
}

const ImageCarouselBlock = ({ data }: ImageCarouselBlockProps) => {
  const images = data.images || [];
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = useCallback(() => {
    if (images.length > 0) {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }
  }, [images.length]);

  const prevSlide = useCallback(() => {
    if (images.length > 0) {
      setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    }
  }, [images.length]);

  useEffect(() => {
    if (data.autoPlay && images.length > 1) {
      const interval = setInterval(nextSlide, 4000);
      return () => clearInterval(interval);
    }
  }, [data.autoPlay, images.length, nextSlide]);

  if (images.length === 0) {
    return (
      <section className="py-16 px-8 bg-gradient-to-br from-muted/50 via-muted/30 to-muted/50">
        <div className="max-w-4xl mx-auto bg-card/50 backdrop-blur-sm rounded-2xl h-64 flex items-center justify-center border-2 border-dashed border-border">
          <p className="text-muted-foreground">Add images to the carousel</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 px-8 bg-gradient-to-br from-muted/50 via-muted/30 to-muted/50 relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-primary/10 via-transparent to-primary/10 animate-pulse" />
      </div>
      
      <div className="max-w-4xl mx-auto relative z-10">
        <div className="relative overflow-hidden rounded-2xl shadow-2xl border-2 border-border/50 aspect-[16/9] bg-muted">
          <AnimatePresence mode="wait">
            <motion.img
              key={currentIndex}
              src={images[currentIndex].src}
              alt={images[currentIndex].alt || "Carousel image"}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.3 }}
              className="w-full h-full object-cover absolute inset-0"
            />
          </AnimatePresence>

          {/* Navigation Arrows */}
          {images.length > 1 && (
            <>
              <Button
                variant="secondary"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background"
                onClick={prevSlide}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background"
                onClick={nextSlide}
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </>
          )}

          {/* Dots Indicator */}
          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`h-2 rounded-full transition-all ${
                    index === currentIndex
                      ? "w-8 bg-white"
                      : "w-2 bg-white/50 hover:bg-white/70"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default ImageCarouselBlock;