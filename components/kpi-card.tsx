import React from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

const KpiCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  variant = "default",
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ElementType;
  trend?: "up" | "down";
  trendValue?: string;
  variant?: "default" | "success" | "warning" | "destructive";
}) => {
  const valueStyle = {
    default:     "text-foreground",
    success:     "text-foreground",
    warning:     "text-foreground",
    destructive: "text-destructive",
  }[variant];

  return (
    <div className="border border-border p-5 hover:border-foreground/40 transition-colors duration-150">
      <div className="flex items-start justify-between mb-4">
        <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
          {title}
        </p>
        <Icon className="h-3 w-3 text-muted-foreground/40 shrink-0 mt-0.5" />
      </div>

      <p className={`text-xl sm:text-2xl lg:text-3xl font-bold font-display tabular-nums leading-none break-all ${valueStyle}`}>
        {value}
      </p>

      {subtitle && (
        <p className="text-[11px] text-muted-foreground mt-2">{subtitle}</p>
      )}

      {trend && trendValue && (
        <div className="flex items-center gap-1 mt-3 pt-3 border-t border-border">
          {trend === "up" ? (
            <ArrowUpRight className="h-3 w-3" />
          ) : (
            <ArrowDownRight className="h-3 w-3 text-destructive" />
          )}
          <span className={`text-xs font-bold font-display ${trend === "down" ? "text-destructive" : ""}`}>
            {trendValue}
          </span>
        </div>
      )}
    </div>
  );
};

export default KpiCard;
