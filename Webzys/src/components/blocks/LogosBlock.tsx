import { motion } from "framer-motion";

interface Logo {
  name: string;
  logo: string;
  url?: string;
}

interface LogosBlockProps {
  data: {
    title?: string;
    logos?: Logo[];
  };
}

const LogosBlock = ({ data }: LogosBlockProps) => {
  const logos = data.logos || [];

  return (
    <section className="py-16 px-8 bg-background border-y border-border/50 relative overflow-hidden">
      {/* Subtle pattern */}
      <div className="absolute inset-0 opacity-[0.01] bg-[linear-gradient(45deg,transparent_25%,rgba(0,0,0,.1)_50%,transparent_75%,rgba(0,0,0,.1)_75%),linear-gradient(45deg,transparent_25%,rgba(0,0,0,.1)_50%,transparent_75%,rgba(0,0,0,.1)_75%)] bg-[length:20px_20px]" />

      <div className="max-w-6xl mx-auto relative z-10">
        {data.title && (
          <motion.h3
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-xl md:text-2xl font-semibold text-center text-muted-foreground mb-12 uppercase tracking-wider"
          >
            {data.title}
          </motion.h3>
        )}

        {logos.length === 0 ? (
          <div className="text-center py-12 bg-muted/30 rounded-xl border-2 border-dashed border-border">
            <p className="text-muted-foreground">Add client logos</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-8 items-center">
            {logos.map((logo, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-center p-4 grayscale hover:grayscale-0 transition-all duration-300 group"
              >
                {logo.url ? (
                  <a
                    href={logo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full h-16 flex items-center justify-center"
                  >
                    <img
                      src={logo.logo}
                      alt={logo.name}
                      className="max-h-12 max-w-full object-contain opacity-60 group-hover:opacity-100 transition-opacity"
                    />
                  </a>
                ) : (
                  <div className="w-full h-16 flex items-center justify-center">
                    <img
                      src={logo.logo}
                      alt={logo.name}
                      className="max-h-12 max-w-full object-contain opacity-60 group-hover:opacity-100 transition-opacity"
                    />
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

export default LogosBlock;

