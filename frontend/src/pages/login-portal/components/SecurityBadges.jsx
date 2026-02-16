import { motion } from 'framer-motion';
import Icon from '../../../components/AppIcon';

const SecurityBadges = () => {
  const certifications = [
    { label: "HIPAA Compliant", icon: "ShieldCheck", color: "text-emerald-300", glow: "bg-emerald-500/20" },
    { label: "ISO 27001", icon: "Award", color: "text-amber-300", glow: "bg-amber-500/20" },
    { label: "Certifié HDS", icon: "Database", color: "text-blue-300", glow: "bg-blue-500/20" },
    { label: "Conforme RGPD", icon: "Globe", color: "text-indigo-300", glow: "bg-indigo-500/20" }
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {certifications.map((cert, index) => (
        <motion.div 
          key={index} 
          whileHover={{ scale: 1.02, backgroundColor: "rgba(255, 255, 255, 0.15)" }}
          whileTap={{ scale: 0.98 }}
          className="group flex items-center gap-3 p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 transition-all duration-300 cursor-default"
        >
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-white/10 border border-white/5 shadow-inner">
            {/* Glow Effect */}
            <div className={`absolute inset-0 rounded-xl blur-md ${cert.glow}`} />
            <Icon name={cert.icon} size={18} className={`relative z-10 ${cert.color} drop-shadow-sm`} />
          </div>
          
          <div className="flex flex-col">
            <span className="text-xs font-bold text-white tracking-wide group-hover:text-white/90">
              {cert.label}
            </span>
            <span className="text-[10px] text-white/60 font-medium group-hover:text-white/80 flex items-center gap-1">
              <Icon name="Check" size={10} /> Vérifié
            </span>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default SecurityBadges;