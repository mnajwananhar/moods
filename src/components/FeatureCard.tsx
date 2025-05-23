interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: "forest" | "orange" | "sage" | "beige";
}

const colorClasses = {
  forest: {
    bg: "from-forest-500 to-forest-600",
    hover: "group-hover:from-forest-600 group-hover:to-forest-700",
  },
  orange: {
    bg: "from-orange-500 to-orange-600",
    hover: "group-hover:from-orange-600 group-hover:to-orange-700",
  },
  sage: {
    bg: "from-sage-500 to-sage-600",
    hover: "group-hover:from-sage-600 group-hover:to-sage-700",
  },
  beige: {
    bg: "from-beige-500 to-beige-600",
    hover: "group-hover:from-beige-600 group-hover:to-beige-700",
  },
};

export default function FeatureCard({
  icon,
  title,
  description,
  color,
}: FeatureCardProps) {
  const colors = colorClasses[color];

  return (
    <div className="group bg-white rounded-2xl p-8 shadow-sm border border-sage-100 hover:shadow-earth transition-all duration-300 hover:-translate-y-2">
      <div
        className={`w-16 h-16 bg-gradient-to-r ${colors.bg} ${colors.hover} text-white rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-all duration-300`}
      >
        {icon}
      </div>

      <h3 className="text-xl font-bold text-forest-900 mb-4 group-hover:text-forest-700 transition-colors">
        {title}
      </h3>

      <p className="text-sage-700 leading-relaxed group-hover:text-sage-600 transition-colors">
        {description}
      </p>
    </div>
  );
}
