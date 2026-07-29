import { motion } from "framer-motion";
import { Calendar, DollarSign, Users, Clock } from "lucide-react";

interface Event {
  id?: number;
  eventName: string;
  eventDate?: string;
  fromDate?: string;
  toDate?: string;
  description?: string;
  entryAmount?: number;
  remainingSlot?: number;
  status?: string;
  imageIds?: number[];
}

interface EventsListBlockProps {
  data: {
    title?: string;
    events?: Event[];
  };
}

const EventsListBlock = ({ data }: EventsListBlockProps) => {
  const events = data.events || [];

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  };

  return (
    <section className="py-24 px-8 bg-gradient-to-b from-background via-primary/5 to-background relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
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

        {events.length === 0 ? (
          <div className="text-center py-16 bg-muted/50 rounded-2xl border-2 border-dashed border-border">
            <p className="text-muted-foreground">No events available</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {events.map((event, index) => (
              <motion.div
                key={event.id || index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-card rounded-xl border border-border overflow-hidden hover:border-primary/50 hover:shadow-xl transition-all"
              >
                {event.imageIds && event.imageIds.length > 0 && (
                  <div className="h-48 bg-muted overflow-hidden">
                    <img
                      src={`/api/images/${event.imageIds[0]}`}
                      alt={event.eventName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="p-6">
                  <h3 className="text-2xl font-bold text-foreground mb-4">
                    {event.eventName}
                  </h3>

                  <div className="space-y-3 mb-4">
                    {event.eventDate && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(event.eventDate)}</span>
                      </div>
                    )}

                    {(event.fromDate || event.toDate) && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>
                          {event.fromDate && formatDate(event.fromDate)}
                          {event.fromDate && event.toDate && " - "}
                          {event.toDate && formatDate(event.toDate)}
                        </span>
                      </div>
                    )}

                    {event.entryAmount !== undefined && (
                      <div className="flex items-center gap-2 text-primary">
                        <DollarSign className="h-4 w-4" />
                        <span className="font-semibold">₹{event.entryAmount}</span>
                      </div>
                    )}

                    {event.remainingSlot !== undefined && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>{event.remainingSlot} slots remaining</span>
                      </div>
                    )}
                  </div>

                  {event.description && (
                    <p className="text-muted-foreground mb-4 leading-relaxed">
                      {event.description}
                    </p>
                  )}

                  <div className="mt-4 flex items-center justify-between gap-4 flex-wrap">
                    {event.status && (
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        event.status === "Active" 
                          ? "bg-green-100 text-green-800" 
                          : "bg-gray-100 text-gray-800"
                      }`}>
                        {event.status}
                      </span>
                    )}
                    {event.id && (
                      <a
                        href={`/user/events/${event.id}/book`}
                        className="inline-flex items-center justify-center px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-all hover:-translate-y-0.5 hover:shadow-md"
                      >
                        Book Now
                      </a>
                    )}
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

export default EventsListBlock;

