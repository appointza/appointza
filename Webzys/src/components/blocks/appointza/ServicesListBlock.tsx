import { motion } from "framer-motion";
import { Clock, DollarSign, FileText } from "lucide-react";

interface Service {
  id?: number;
  serviceName: string;
  prize?: number;
  timeTaken?: number;
  notes?: string;
  imageId?: number;
}

interface ServicesListBlockProps {
  data: {
    title?: string;
    services?: Service[];
  };
}

const ServicesListBlock = ({ data }: ServicesListBlockProps) => {
  const services = data.services || [];

  return (
    <section className="py-24 px-8 bg-gradient-to-b from-background via-muted/10 to-background relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
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

        {services.length === 0 ? (
          <div className="text-center py-16 bg-muted/50 rounded-2xl border-2 border-dashed border-border">
            <p className="text-muted-foreground">No services available</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, index) => (
              <motion.div
                key={service.id || index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-card p-6 rounded-xl border border-border hover:border-primary/50 hover:shadow-lg transition-all"
              >
                {service.imageId && (
                  <div className="h-48 rounded-lg bg-muted mb-4 overflow-hidden">
                    <img
                      src={`/api/images/${service.imageId}`}
                      alt={service.serviceName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <h3 className="text-xl font-bold text-foreground mb-3">
                  {service.serviceName}
                </h3>

                <div className="space-y-2 mb-4">
                  {service.prize !== undefined && (
                    <div className="flex items-center gap-2 text-primary">
                      <DollarSign className="h-4 w-4" />
                      <span className="font-semibold">₹{service.prize}</span>
                    </div>
                  )}

                  {service.timeTaken && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{service.timeTaken} minutes</span>
                    </div>
                  )}
                </div>

                {service.notes && (
                  <div className="flex items-start gap-2 text-muted-foreground mb-4">
                    <FileText className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <p className="text-sm leading-relaxed">{service.notes}</p>
                  </div>
                )}
                <a
                  href="/book-appointment"
                  className="inline-flex items-center justify-center w-full px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-all hover:-translate-y-0.5 hover:shadow-md mt-4"
                >
                  Book Appointment
                </a>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default ServicesListBlock;

