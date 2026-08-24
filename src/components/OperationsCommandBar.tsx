import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Activity,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Radio,
  Siren,
  Sparkles,
  Zap,
  Building2,
  Droplet,
  Users,
  ShieldCheck
} from 'lucide-react';

export interface CommandBarState {
  happeningText: string;     // What is happening
  happeningMetrics?: { label: string; value: string | number; tone?: 'normal' | 'good' | 'warn' }[];
  attentionText: string;     // What needs attention
  attentionSeverity?: 'critical' | 'warning' | 'normal';
  nextActionText: string;    // What should I do next
  primaryActionLabel: string;
  onPrimaryAction: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
}

export const OperationsCommandBar: React.FC<CommandBarState> = ({
  happeningText,
  happeningMetrics = [],
  attentionText,
  attentionSeverity = 'warning',
  nextActionText,
  primaryActionLabel,
  onPrimaryAction,
  secondaryActionLabel,
  onSecondaryAction
}) => {
  return (
    <Card className="border border-border/80 bg-gradient-to-r from-card via-card to-muted/20 shadow-md rounded-2xl overflow-hidden mb-6">
      <div className="bg-primary/10 border-b border-primary/15 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[11px] font-black uppercase tracking-wider text-foreground">
            Operations Command & Action Center
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-background/80 text-[10px] font-semibold text-muted-foreground">
            <Radio className="w-3 h-3 text-emerald-500 mr-1 animate-pulse" /> Real-time Live Feed
          </Badge>
        </div>
      </div>

      <CardContent className="p-4 sm:p-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:divide-x md:divide-border/60">
          {/* STEP 1: What is happening */}
          <div className="space-y-2 md:pr-4">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-500/10 text-blue-600 font-bold text-xs flex items-center justify-center">
                1
              </span>
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                What is Happening
              </h4>
            </div>
            <p className="text-sm font-semibold text-foreground leading-snug">
              {happeningText}
            </p>
            {happeningMetrics.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {happeningMetrics.map((metric, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 text-[11px] font-medium bg-muted/60 px-2 py-0.5 rounded-lg border text-muted-foreground"
                  >
                    <strong className="text-foreground font-bold">{metric.value}</strong> {metric.label}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* STEP 2: What needs attention */}
          <div className="space-y-2 md:px-4">
            <div className="flex items-center gap-2">
              <span className={`w-5 h-5 rounded-full font-bold text-xs flex items-center justify-center ${
                attentionSeverity === 'critical'
                  ? 'bg-destructive/15 text-destructive animate-pulse'
                  : attentionSeverity === 'warning'
                  ? 'bg-amber-500/15 text-amber-600'
                  : 'bg-emerald-500/15 text-emerald-600'
              }`}>
                2
              </span>
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                What Needs Attention
              </h4>
            </div>
            <div className={`p-2.5 rounded-xl border text-xs font-medium ${
              attentionSeverity === 'critical'
                ? 'bg-destructive/10 border-destructive/30 text-destructive font-semibold'
                : attentionSeverity === 'warning'
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-300'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
            }`}>
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p className="leading-tight">{attentionText}</p>
              </div>
            </div>
          </div>

          {/* STEP 3: What should I do next */}
          <div className="space-y-2 md:pl-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-5 h-5 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center">
                  3
                </span>
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  What Should I Do Next
                </h4>
              </div>
              <p className="text-xs font-medium text-foreground/80 leading-snug">
                {nextActionText}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2">
              {secondaryActionLabel && onSecondaryAction && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs font-semibold rounded-xl flex-1"
                  onClick={onSecondaryAction}
                >
                  {secondaryActionLabel}
                </Button>
              )}
              <Button
                size="sm"
                className="h-8 text-xs font-bold rounded-xl flex-1 gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm shadow-primary/20"
                onClick={onPrimaryAction}
              >
                <Zap className="w-3.5 h-3.5" />
                {primaryActionLabel}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
