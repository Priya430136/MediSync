import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertTriangle,
  Siren,
  ShieldAlert,
  Clock,
  MapPin,
  Sparkles,
  Phone,
  Navigation,
  CheckCircle2,
  ArrowRight,
  Activity,
  Ambulance,
  Building2,
  Zap
} from 'lucide-react';

export interface IncidentItem {
  id: string;
  title: string;              // What happened
  description?: string;
  severity: 'critical' | 'high' | 'medium' | 'low'; // Severity
  affectedSystem: string;     // Affected system (e.g., AMB-108, ICU Ward #2)
  status: 'pending' | 'dispatched' | 'active' | 'in-progress' | 'resolved'; // Current status
  recommendedAction: string;  // Recommended action (AI / Ops protocol)
  location?: string;
  callerPhone?: string;
  driverPhone?: string;
  timestamp: string;
  etaMinutes?: number;
  aiSuggested?: boolean;
}

interface IncidentCardProps {
  incident: IncidentItem;
  onPrimaryAction?: (incident: IncidentItem) => void;
  primaryActionLabel?: string;
  onSecondaryAction?: (incident: IncidentItem) => void;
  secondaryActionLabel?: string;
  onViewDetails?: (incident: IncidentItem) => void;
  compact?: boolean;
}

export const IncidentCard: React.FC<IncidentCardProps> = ({
  incident,
  onPrimaryAction,
  primaryActionLabel = 'Auto-Dispatch Nearest',
  onSecondaryAction,
  secondaryActionLabel = 'Call Responder',
  onViewDetails,
  compact = false,
}) => {
  const getSeverityBadge = (severity: IncidentItem['severity']) => {
    switch (severity) {
      case 'critical':
        return (
          <Badge variant="destructive" className="bg-destructive/15 text-destructive border-destructive/30 font-bold uppercase tracking-wider text-[10px] animate-pulse gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-ping" />
            Critical
          </Badge>
        );
      case 'high':
        return (
          <Badge variant="outline" className="bg-amber-500/15 text-amber-700 border-amber-500/30 font-bold uppercase tracking-wider text-[10px] gap-1">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            High
          </Badge>
        );
      case 'medium':
        return (
          <Badge variant="outline" className="bg-blue-500/15 text-blue-700 border-blue-500/30 font-bold uppercase tracking-wider text-[10px]">
            Medium
          </Badge>
        );
      case 'low':
      default:
        return (
          <Badge variant="outline" className="bg-muted text-muted-foreground font-semibold text-[10px]">
            Low
          </Badge>
        );
    }
  };

  const getStatusBadge = (status: IncidentItem['status']) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className="bg-amber-500/10 text-amber-700 border-amber-500/20 text-[11px] font-semibold">
            Action Required
          </Badge>
        );
      case 'dispatched':
      case 'active':
      case 'in-progress':
        return (
          <Badge variant="outline" className="bg-blue-500/10 text-blue-700 border-blue-500/20 text-[11px] font-semibold flex items-center gap-1">
            <Activity className="w-3 h-3 animate-pulse text-blue-600" />
            Unit En Route
          </Badge>
        );
      case 'resolved':
        return (
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 border-emerald-500/20 text-[11px] font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Resolved
          </Badge>
        );
    }
  };

  return (
    <Card className="border border-border/80 bg-card hover:border-primary/40 transition-all shadow-sm rounded-2xl overflow-hidden">
      {/* Top Status Accent Bar */}
      <div 
        className={`h-1.5 w-full ${
          incident.severity === 'critical' 
            ? 'bg-destructive' 
            : incident.severity === 'high' 
            ? 'bg-amber-500' 
            : incident.severity === 'medium' 
            ? 'bg-blue-500' 
            : 'bg-muted-foreground/30'
        }`} 
      />

      <CardContent className="p-4 sm:p-5 space-y-4">
        {/* Header: Title + Severity + Status */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold text-muted-foreground">{incident.id}</span>
              {getSeverityBadge(incident.severity)}
              {getStatusBadge(incident.status)}
            </div>

            {/* 1. What Happened */}
            <h4 className="text-base sm:text-lg font-bold text-foreground leading-tight pt-0.5">
              {incident.title}
            </h4>

            {incident.description && (
              <p className="text-xs text-muted-foreground line-clamp-2">
                {incident.description}
              </p>
            )}
          </div>

          {incident.etaMinutes !== undefined && (
            <div className="flex sm:flex-col items-center sm:items-end justify-between shrink-0 bg-muted/50 px-3 py-1.5 sm:p-2 rounded-xl border">
              <span className="text-[10px] uppercase font-bold text-muted-foreground">Est. Arrival</span>
              <span className="text-sm font-black text-foreground">{incident.etaMinutes} mins</span>
            </div>
          )}
        </div>

        {/* Structured 5-Point Incident Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 p-3 rounded-xl bg-muted/40 border border-border/60 text-xs">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
              1. What Happened
            </span>
            <span className="font-semibold text-foreground line-clamp-1">{incident.title}</span>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
              2. Affected System
            </span>
            <span className="font-semibold text-foreground flex items-center gap-1">
              <Ambulance className="w-3.5 h-3.5 text-primary shrink-0" />
              {incident.affectedSystem}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
              3. Location & Time
            </span>
            <span className="font-semibold text-foreground flex items-center gap-1 line-clamp-1">
              <MapPin className="w-3.5 h-3.5 text-destructive shrink-0" />
              {incident.location || 'Reported Location'}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
              4. Current Status
            </span>
            <span className="font-semibold text-foreground capitalize">
              {incident.status.replace('-', ' ')}
            </span>
          </div>
        </div>

        {/* 5. Recommended Action Callout (AI-Powered Guidance) */}
        <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 flex items-start gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
            <Zap className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-primary">
              <span>5. Recommended Immediate Action:</span>
              {incident.aiSuggested && (
                <Badge variant="outline" className="text-[9px] h-4 font-normal bg-background/80 text-primary border-primary/30">
                  <Sparkles className="w-2.5 h-2.5 mr-0.5" /> AI Triage Guidance
                </Badge>
              )}
            </div>
            <p className="text-xs text-foreground/90 font-medium mt-0.5">
              {incident.recommendedAction}
            </p>
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-border/50">
          <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>Logged: {new Date(incident.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {onSecondaryAction && (
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs font-semibold rounded-xl flex-1 sm:flex-initial"
                onClick={() => onSecondaryAction(incident)}
              >
                <Phone className="w-3.5 h-3.5 mr-1" />
                {secondaryActionLabel}
              </Button>
            )}

            {onViewDetails && (
              <Button
                size="sm"
                variant="ghost"
                className="h-8 text-xs font-semibold rounded-xl"
                onClick={() => onViewDetails(incident)}
              >
                Details
              </Button>
            )}

            {onPrimaryAction && (
              <Button
                size="sm"
                className={`h-8 text-xs font-bold rounded-xl flex-1 sm:flex-initial gap-1.5 ${
                  incident.severity === 'critical'
                    ? 'bg-destructive hover:bg-destructive/90 shadow-sm shadow-destructive/20 text-white'
                    : 'bg-primary hover:bg-primary/90 text-primary-foreground'
                }`}
                onClick={() => onPrimaryAction(incident)}
              >
                <Zap className="w-3.5 h-3.5" />
                {primaryActionLabel}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
