import { motion } from "framer-motion";
import { MapPin, Phone, Globe, Navigation } from "lucide-react";

interface LocationDetailsBlockProps {
  data: {
    locationName?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    pincode?: string;
    country?: string;
    mobile?: string;
    googleLocation?: string;
    latitude?: number;
    longitude?: number;
  };
}

const LocationDetailsBlock = ({ data }: LocationDetailsBlockProps) => {
  return (
    <section className="py-20 px-8 bg-gradient-to-b from-background via-secondary/20 to-background relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          {data.locationName && (
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-8 text-center">
              {data.locationName}
            </h2>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Address Section */}
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-2">Address</h3>
                  <div className="text-muted-foreground space-y-1">
                    {data.addressLine1 && <p>{data.addressLine1}</p>}
                    {data.addressLine2 && <p>{data.addressLine2}</p>}
                    <p>
                      {data.city && `${data.city}, `}
                      {data.state && `${data.state} `}
                      {data.pincode && `- ${data.pincode}`}
                    </p>
                    {data.country && <p>{data.country}</p>}
                  </div>
                </div>
              </div>

              {/* Contact */}
              {data.mobile && (
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Phone className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium text-foreground">{data.mobile}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Map Section */}
            <div className="space-y-4">
              {data.googleLocation && (
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                    <Globe className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground mb-2">Location</h3>
                    <a
                      href={data.googleLocation}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-2"
                    >
                      View on Google Maps
                      <Navigation className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              )}

              {(data.latitude && data.longitude) && (
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Navigation className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Coordinates</p>
                    <p className="font-medium text-foreground text-sm">
                      {data.latitude.toFixed(6)}, {data.longitude.toFixed(6)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default LocationDetailsBlock;

