import { useState } from "react";
import { motion } from "framer-motion";
import { Search, MapPin, X } from "lucide-react";

interface Props {
  onSearch: (company: string, location: string) => void;
  isLoading: boolean;
  onCancel: () => void;
}

export default function SearchForm({ onSearch, isLoading, onCancel }: Props) {
  const [company, setCompany] = useState("");
  const [location, setLocation] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (company.trim()) {
      onSearch(company.trim(), location.trim());
    }
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="relative"
    >
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Company name input */}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4b4b61]" />
          <input
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Company name"
            className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white text-[#1a1a2e] placeholder:text-[#66667a] border border-[#b8b8c8] shadow-sm font-body text-[15px] focus:outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-400/40 transition-all"
            disabled={isLoading}
          />
        </div>

        {/* Location input */}
        <div className="relative sm:w-64">
          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4b4b61]" />
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Location (optional)"
            className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white text-[#1a1a2e] placeholder:text-[#66667a] border border-[#b8b8c8] shadow-sm font-body text-[15px] focus:outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-400/40 transition-all"
            disabled={isLoading}
          />
        </div>

        {/* Action button */}
        {isLoading ? (
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3.5 bg-white text-[#1a1a2e] border border-[#b8b8c8] rounded-xl font-medium text-[15px] shadow-sm transition-all flex items-center gap-2 shrink-0"
          >
            <X className="w-4 h-4" />
            Cancel
          </button>
        ) : (
          <button
            type="submit"
            disabled={!company.trim()}
            className={`px-8 py-3.5 rounded-xl font-semibold text-[15px] transition-all duration-300 shrink-0 ${
              company.trim()
                ? "bg-[#b57a86] text-white border border-[#8f5966] shadow-md hover:bg-[#a06472]"
                : "bg-[#e5e7eb] text-[#66667a] border border-[#b8b8c8] cursor-not-allowed"
            }`}
          >
            Research
          </button>
        )}
      </div>
    </motion.form>
  );
}
