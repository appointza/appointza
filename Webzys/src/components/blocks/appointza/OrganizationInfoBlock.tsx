import { motion } from "framer-motion";
import { Building2, Mail, Phone, MapPin } from "lucide-react";

interface OrganizationInfoBlockProps {
  data: {
    organizationName?: string;
    organizationTagline?: string;
    organizationLogo?: string;
    organizationNotes?: string;
    organizationEmail?: string;
    organizationGstNumber?: string;
  };
}

const OrganizationInfoBlock = ({ data }: OrganizationInfoBlockProps) => {
  return (
    <section className="py-24 px-8 bg-gradient-to-b from-primary/5 via-background to-primary/5 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          {/* Logo */}
          {data.organizationLogo && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="mb-8"
            >
              <img
                src={data.organizationLogo}
                alt={data.organizationName || "Organization Logo"}
                className="h-24 w-auto mx-auto"
              />
            </motion.div>
          )}

          {/* Organization Name */}
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            {data.organizationName || "Organization Name"}
          </h1>

          {/* Tagline */}
          {data.organizationTagline && (
            <p className="text-xl text-primary font-medium mb-8">
              {data.organizationTagline}
            </p>
          )}

          {/* Notes/Description */}
          {data.organizationNotes && (
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
              {data.organizationNotes}
            </p>
          )}

          {/* Additional Info */}
          <div className="flex flex-wrap items-center justify-center gap-6 mt-8">
            {data.organizationEmail && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-5 w-5" />
                <span>{data.organizationEmail}</span>
              </div>
            )}
            {data.organizationGstNumber && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Building2 className="h-5 w-5" />
                <span>GST: {data.organizationGstNumber}</span>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default OrganizationInfoBlock;

