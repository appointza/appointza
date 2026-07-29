import { motion } from "framer-motion";
import { Clock, Calendar } from "lucide-react";

interface ServiceTiming {
  id?: number;
  dayOfWeek: number; // 1=Monday, 7=Sunday
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
}

interface ServiceTimingsBlockProps {
  data: {
    title?: string;
    timings?: ServiceTiming[];
  };
}

const dayNames = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const ServiceTimingsBlock = ({ data }: ServiceTimingsBlockProps) => {
  const timings = data.timings || [];

  // Group timings by day
  const groupedTimings = timings.reduce((acc, timing) => {
    const dayName = dayNames[timing.dayOfWeek] || `Day ${timing.dayOfWeek}`;
    if (!acc[dayName]) {
      acc[dayName] = [];
    }
    acc[dayName].push(timing);
    return acc;
  }, {} as Record<string, ServiceTiming[]>);

  return (
    <section className="py-20 px-8 bg-gradient-to-b from-secondary/20 via-background to-secondary/20 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
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

        {timings.length === 0 ? (
          <div className="text-center py-12 bg-muted/50 rounded-xl border-2 border-dashed border-border">
            <p className="text-muted-foreground">No service timings available</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedTimings).map(([dayName, dayTimings], index) => (
              <motion.div
                key={dayName}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-card p-6 rounded-xl border border-border hover:border-primary/50 transition-all"
              >
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">{dayName}</h3>
                  </div>
                  <div className="flex items-center gap-4 flex-wrap">
                    {dayTimings.map((timing, timingIndex) => (
                      <div key={timingIndex} className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span className="font-medium">
                          {timing.startTime} - {timing.endTime}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default ServiceTimingsBlock;

