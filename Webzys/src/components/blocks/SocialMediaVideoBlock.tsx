import { motion, AnimatePresence } from "framer-motion";
import { Instagram, Youtube, Play, X, ExternalLink } from "lucide-react";
import { useState } from "react";

interface VideoItem {
  id: string;
  platform: "instagram" | "youtube";
  videoUrl: string;
  thumbnail?: string;
  title?: string;
}

interface SocialMediaVideoBlockProps {
  data: {
    title?: string;
    subtitle?: string;
    videos?: VideoItem[];
    columns?: 2 | 3 | 4;
    layout?: "grid" | "masonry";
  };
}

const SocialMediaVideoBlock = ({ data }: SocialMediaVideoBlockProps) => {
  const [activeVideo, setActiveVideo] = useState<VideoItem | null>(null);
  const columns = data.columns || 3;
  const videos = data.videos || [];

  // Parse Instagram Reel URL to get embed
  const getInstagramEmbedUrl = (url: string): string | null => {
    const reelMatch = url.match(/instagram\.com\/(?:reel|p)\/([A-Za-z0-9_-]+)/);
    if (reelMatch) {
      return `https://www.instagram.com/reel/${reelMatch[1]}/embed`;
    }
    return null;
  };

  // Parse YouTube URL to get video ID and embed
  const getYouTubeVideoId = (url: string): string | null => {
    let videoId: string | null = null;

    if (url.includes("youtube.com/watch")) {
      videoId = url.split("v=")[1]?.split("&")[0] || null;
    } else if (url.includes("youtu.be/")) {
      videoId = url.split("youtu.be/")[1]?.split("?")[0] || null;
    } else if (url.includes("youtube.com/shorts/")) {
      videoId = url.split("youtube.com/shorts/")[1]?.split("?")[0] || null;
    } else if (url.includes("youtube.com/embed/")) {
      videoId = url.split("youtube.com/embed/")[1]?.split("?")[0] || null;
    }

    return videoId;
  };

  const getYouTubeEmbedUrl = (url: string): string | null => {
    const videoId = getYouTubeVideoId(url);
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    }
    return null;
  };

  const getYouTubeThumbnail = (url: string): string | null => {
    const videoId = getYouTubeVideoId(url);
    if (videoId) {
      return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    }
    return null;
  };

  // Get embed URL based on platform
  const getEmbedUrl = (video: VideoItem): string | null => {
    if (video.platform === "instagram") {
      return getInstagramEmbedUrl(video.videoUrl);
    } else {
      return getYouTubeEmbedUrl(video.videoUrl);
    }
  };

  // Get thumbnail for video
  const getThumbnail = (video: VideoItem): string => {
    if (video.thumbnail) return video.thumbnail;
    if (video.platform === "youtube") {
      return getYouTubeThumbnail(video.videoUrl) || "https://images.unsplash.com/photo-1611162616475-46b635cb6868?w=400&h=300&fit=crop";
    }
    // Default Instagram placeholder
    return "https://images.unsplash.com/photo-1611262588024-d12430b98920?w=400&h=500&fit=crop";
  };

  const getGridCols = () => {
    switch (columns) {
      case 2:
        return "grid-cols-1 sm:grid-cols-2";
      case 4:
        return "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4";
      case 3:
      default:
        return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
    }
  };

  const PlatformIcon = ({ platform }: { platform: "instagram" | "youtube" }) => {
    const Icon = platform === "instagram" ? Instagram : Youtube;
    const bgColor = platform === "instagram" ? "bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400" : "bg-red-600";
    return (
      <div className={`absolute top-3 left-3 z-10 p-1.5 rounded-lg ${bgColor} shadow-lg`}>
        <Icon className="h-4 w-4 text-white" />
      </div>
    );
  };

  return (
    <section className="py-20 px-8 bg-gradient-to-br from-muted/30 via-background to-muted/30 relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        {(data.title || data.subtitle) && (
          <div className="text-center mb-12">
            {data.title && (
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-3xl md:text-4xl font-bold text-foreground mb-4"
              >
                {data.title}
              </motion.h2>
            )}
            {data.subtitle && (
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-muted-foreground max-w-2xl mx-auto"
              >
                {data.subtitle}
              </motion.p>
            )}
          </div>
        )}

        {/* Video Grid */}
        {videos.length > 0 ? (
          <div className={`grid ${getGridCols()} gap-4 md:gap-6`}>
            {videos.map((video, index) => (
              <motion.div
                key={video.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group relative cursor-pointer"
                onClick={() => setActiveVideo(video)}
              >
                <div
                  className={`relative overflow-hidden rounded-2xl border-2 border-border bg-muted shadow-lg transition-all duration-300 group-hover:shadow-xl group-hover:border-primary/50 group-hover:scale-[1.02] ${
                    video.platform === "instagram" ? "aspect-[9/16]" : "aspect-video"
                  }`}
                >
                  {/* Platform badge */}
                  <PlatformIcon platform={video.platform} />

                  {/* Thumbnail */}
                  <img
                    src={getThumbnail(video)}
                    alt={video.title || "Video thumbnail"}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />

                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      className="h-16 w-16 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-2xl"
                    >
                      <Play className="h-8 w-8 text-foreground ml-1" fill="currentColor" />
                    </motion.div>
                  </div>

                  {/* Title overlay at bottom */}
                  {video.title && (
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                      <p className="text-white text-sm font-medium line-clamp-2">{video.title}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          /* Empty state */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"
          >
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`rounded-2xl border-2 border-dashed border-border bg-muted/50 flex items-center justify-center ${
                  i === 2 ? "aspect-[9/16]" : "aspect-video"
                }`}
              >
                <div className="text-center p-8">
                  <div className="flex justify-center gap-2 mb-4">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
                      <Instagram className="h-5 w-5 text-white" />
                    </div>
                    <div className="p-2 rounded-lg bg-red-600">
                      <Youtube className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <p className="text-muted-foreground text-sm">Add videos in editor</p>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Video Modal */}
      <AnimatePresence>
        {activeVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setActiveVideo(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`relative bg-background rounded-2xl overflow-hidden shadow-2xl ${
                activeVideo.platform === "instagram" ? "w-full max-w-sm" : "w-full max-w-4xl"
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={() => setActiveVideo(null)}
                className="absolute top-4 right-4 z-10 p-2 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-colors"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Video embed */}
              <div className={activeVideo.platform === "instagram" ? "aspect-[9/16]" : "aspect-video"}>
                <iframe
                  src={getEmbedUrl(activeVideo) || ""}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={activeVideo.title || "Video"}
                />
              </div>

              {/* Video info */}
              <div className="p-4 border-t border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    activeVideo.platform === "instagram" 
                      ? "bg-gradient-to-br from-purple-500 to-pink-500" 
                      : "bg-red-600"
                  }`}>
                    {activeVideo.platform === "instagram" ? (
                      <Instagram className="h-4 w-4 text-white" />
                    ) : (
                      <Youtube className="h-4 w-4 text-white" />
                    )}
                  </div>
                  <span className="text-sm font-medium">
                    {activeVideo.title || (activeVideo.platform === "instagram" ? "Instagram Reel" : "YouTube Video")}
                  </span>
                </div>
                <a
                  href={activeVideo.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open original
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default SocialMediaVideoBlock;
