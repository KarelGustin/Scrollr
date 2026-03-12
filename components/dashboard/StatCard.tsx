interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  icon?: React.ReactNode;
}

export function StatCard({ title, value, change, icon }: StatCardProps) {
  const isPositive = change?.startsWith("+");
  const isNegative = change?.startsWith("-");

  return (
    <div className="bg-card rounded-xl p-5 border border-border">
      <div className="flex items-start justify-between">
        <p className="text-sm text-muted">{title}</p>
        {icon && <span className="text-muted">{icon}</span>}
      </div>
      <p className="mt-2 text-3xl font-display font-bold text-text">{value}</p>
      {change && (
        <p
          className={`mt-1 text-xs font-medium ${
            isPositive
              ? "text-green-400"
              : isNegative
              ? "text-destructive"
              : "text-muted"
          }`}
        >
          {change}
        </p>
      )}
    </div>
  );
}
