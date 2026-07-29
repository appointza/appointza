import { motion } from "framer-motion";
import { Star, MessageSquare } from "lucide-react";

interface Review {
  id?: number;
  rating: number; // 1-5
  comment: string;
  createdAt?: string;
  serviceId?: number;
  eventId?: number;
}

interface ReviewsListBlockProps {
  data: {
    title?: string;
    reviews?: Review[];
  };
}

const ReviewsListBlock = ({ data }: ReviewsListBlockProps) => {
  const reviews = data.reviews || [];

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground"
        }`}
      />
    ));
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

        {reviews.length === 0 ? (
          <div className="text-center py-16 bg-muted/50 rounded-2xl border-2 border-dashed border-border">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No reviews yet</p>
          </div>
        ) : (
          <div className="space-y-6">
            {reviews.map((review, index) => (
              <motion.div
                key={review.id || index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-card p-6 rounded-xl border border-border hover:border-primary/50 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex gap-1">
                    {renderStars(review.rating)}
                  </div>
                  {review.createdAt && (
                    <span className="text-sm text-muted-foreground">
                      {formatDate(review.createdAt)}
                    </span>
                  )}
                </div>

                <p className="text-foreground leading-relaxed mb-4">
                  {review.comment}
                </p>

                {(review.serviceId || review.eventId) && (
                  <div className="text-xs text-muted-foreground">
                    {review.serviceId && `Service ID: ${review.serviceId}`}
                    {review.serviceId && review.eventId && " • "}
                    {review.eventId && `Event ID: ${review.eventId}`}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default ReviewsListBlock;

