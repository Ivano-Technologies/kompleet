"use client";

import CountUp from "react-countup";

interface AnimatedCounterProps {
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  decimals?: number;
  className?: string;
  separator?: string;
}

/**
 * Animated number counter using react-countup. Use for KPIs and stats.
 */
export function AnimatedCounter({
  value,
  prefix = "",
  suffix = "",
  duration = 1.2,
  decimals = 0,
  className = "",
  separator = ",",
}: AnimatedCounterProps) {
  return (
    <span className={className}>
      <CountUp
        start={0}
        end={value}
        duration={duration}
        prefix={prefix}
        suffix={suffix}
        decimals={decimals}
        separator={separator}
      />
    </span>
  );
}
