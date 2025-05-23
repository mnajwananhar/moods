import { Star } from "lucide-react";

interface TestimonialCardProps {
  name: string;
  role: string;
  avatar: string;
  content: string;
  rating: number;
}

export default function TestimonialCard({
  name,
  role,
  avatar,
  content,
  rating,
}: TestimonialCardProps) {
  return (
    <div className="bg-white rounded-2xl p-8 shadow-sm border border-sage-100 hover:shadow-earth transition-all duration-300 hover:-translate-y-1">
      {/* Rating */}
      <div className="flex items-center gap-1 mb-6">
        {Array.from({ length: 5 }, (_, i) => (
          <Star
            key={i}
            className={`w-5 h-5 ${
              i < rating ? "text-orange-500 fill-current" : "text-gray-300"
            }`}
          />
        ))}
      </div>

      {/* Content */}
      <blockquote className="text-sage-800 leading-relaxed mb-8 italic">
        &ldquo;{content}&rdquo;
      </blockquote>

      {/* Author */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-gradient-to-r from-forest-500 to-forest-600 text-white rounded-full flex items-center justify-center font-semibold">
          {avatar}
        </div>
        <div>
          <div className="font-semibold text-forest-900">{name}</div>
          <div className="text-sage-600 text-sm">{role}</div>
        </div>
      </div>
    </div>
  );
}
