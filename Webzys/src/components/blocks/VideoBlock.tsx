import { motion } from "framer-motion";
import { Play, ExternalLink } from "lucide-react";
import { useState } from "react";

interface VideoBlockProps {
  data: {
    title?: string;
    videoUrl?: string;
    thumbnail?: string;
    description?: string;
    autoplay?: boolean;
  };
}

const VideoBlock = ({ data }: VideoBlockProps) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const getVideoId = (url: string) => {
    if (url.includes("youtube.com/watch")) {
      return url.split("v=")[1]?.split("&")[0];
    }
    if (url.includes("youtu.be/")) {
      return url.split("youtu.be/")[1]?.split("?")[0];
    }
    if (url.includes("vimeo.com/")) {
      return url.split("vimeo.com/")[1]?.split("?")[0];
    }
    return null;
  };

  const getEmbedUrl = (url: string) => {
    const videoId = getVideoId(url);
    if (url.includes("youtube") || url.includes("youtu.be")) {
      return `https://www.youtube.com/embed/${videoId}${data.autoplay ? "?autoplay=1" : ""}`;
    }
    if (url.includes("vimeo")) {
      return `https://player.vimeo.com/video/${videoId}${data.autoplay ? "?autoplay=1" : ""}`;
    }
    return url;
  };

  return (
    <section className="py-20 px-8 bg-gradient-to-br from-muted/30 via-background to-muted/30 relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        {data.title && (
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold text-center text-foreground mb-6"
          >
            {data.title}
          </motion.h2>
        )}

        {data.description && (
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center text-muted-foreground mb-8 max-w-2xl mx-auto"
          >
            {data.description}
          </motion.p>
        )}

        {data.videoUrl ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative aspect-video rounded-2xl overflow-hidden border-2 border-border shadow-2xl bg-muted"
          >
            {!isPlaying ? (
              <>
                {data.thumbnail && (
                  <img
                    src={data.thumbnail}
                    alt="Video thumbnail"
                    className="w-full h-full object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsPlaying(true)}
                    className="h-20 w-20 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-xl hover:shadow-2xl transition-shadow"
                  >
                    <Play className="h-10 w-10 ml-1" />
                  </motion.button>
                </div>
              </>
            ) : (
              <iframe
                src={getEmbedUrl(data.videoUrl)}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            )}
          </motion.div>
        ) : (
          <div className="aspect-video rounded-2xl border-2 border-dashed border-border bg-muted/50 flex items-center justify-center">
            <div className="text-center">
              <ExternalLink className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Add a video URL (YouTube or Vimeo)</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default VideoBlock;

