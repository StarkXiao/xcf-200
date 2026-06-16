import type { ReactNode } from 'react';

interface StatsCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  color?: string;
  bgColor?: string;
}

export default function StatsCard({ icon, label, value, color = 'text-white', bgColor = 'bg-white/5' }: StatsCardProps) {
  return (
    <div className={`p-4 rounded-xl ${bgColor} border border-white/10 transition-all hover:scale-[1.02]`}>
      <div className={`w-10 h-10 rounded-lg ${bgColor} flex items-center justify-center mb-3 ${color}`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-white mb-1">{value}</p>
      <p className="text-xs text-white/60">{label}</p>
    </div>
  );
}
