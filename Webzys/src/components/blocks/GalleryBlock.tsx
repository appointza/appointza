import { motion } from "framer-motion";
import { useState } from "react";
import { X } from "lucide-react";

interface GalleryBlockProps {
  data: {
    title?: string;
    images?: { src: string; alt: string }[];
    columns?: number;
  };
}

const GalleryBlock = ({ data }: GalleryBlockProps) => {
  const [selectedImage, setSelectedImage] = useState<{ src: string; alt: string } | null>(null);
  const images = data.images || [];
  const columns = data.columns || 3;

  const gridCols = {
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
  }[columns] || "grid-cols-1 md:grid-cols-2 lg:grid-cols-3";

  return (
    <section className="py-20 px-8 bg-gradient-to-b from-background via-muted/20 to-background relative overflow-hidden">
      {/* Pattern overlay */}
      <div className="absolute inset-0 opacity-[0.02] bg-[linear-gradient(45deg,transparent_25%,rgba(0,0,0,.1)_50%,transparent_75%,rgba(0,0,0,.1)_75%),linear-gradient(45deg,transparent_25%,rgba(0,0,0,.1)_50%,transparent_75%,rgba(0,0,0,.1)_75%)] bg-[length:20px_20px]" />
      
      <div className="max-w-7xl mx-auto relative z-10">
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

        {images.length === 0 ? (
          <div className="text-center py-16 bg-muted/50 rounded-2xl border-2 border-dashed border-border">
            <p className="text-muted-foreground">Add images to the gallery</p>
          </div>
        ) : (
          <div className={`grid ${gridCols} gap-4`}>
            {images.map((image, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-muted cursor-pointer"
                onClick={() => setSelectedImage(image)}
              >
                <img
                  src={image.src}
                  alt={image.alt || `Gallery image ${index + 1}`}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {selectedImage && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
            onClick={() => setSelectedImage(null)}
          >
            <X className="h-6 w-6" />
          </button>
          <motion.img
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            src={selectedImage.src}
            alt={selectedImage.alt}
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </motion.div>
      )}
    </section>
  );
};

export default GalleryBlock;

