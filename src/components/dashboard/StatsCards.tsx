'use client';

interface StatCard {
  label: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: string;
}

interface StatsCardsProps {
  stats: StatCard[];
}

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <div
          key={index}
          className="bg-light-surface dark:bg-dark-surface rounded-lg border border-light-border dark:border-dark-border p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-3xl">{stat.icon}</span>
            {stat.change && (
              <span
                className={`text-sm font-medium ${
                  stat.changeType === 'positive'
                    ? 'text-green-600'
                    : stat.changeType === 'negative'
                    ? 'text-red-600'
                    : 'text-light-text-secondary dark:text-dark-text-secondary'
                }`}
              >
                {stat.change}
              </span>
            )}
          </div>
          <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-1">{stat.label}</p>
          <p className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary">{stat.value}</p>
        </div>
      ))}
    </div>
  );
}
