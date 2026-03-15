interface Stat {
  label: string;
  value: string;
}

export function DashboardStats({ stats }: { stats: Stat[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      {stats.map((stat) => (
        <div key={stat.label} className="bg-white border border-[#f0f0f0] rounded-xl p-4">
          <p className="text-xs text-[#999] mb-1">{stat.label}</p>
          <p className="text-xl font-bold text-[#1a1a1a]">{stat.value}</p>
        </div>
      ))}
    </div>
  );
}
