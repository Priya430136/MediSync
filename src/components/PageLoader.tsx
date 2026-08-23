import { Loader2 } from "lucide-react";

export const PageLoader = () => {
  return (
    <div 
      id="page-suspense-loader"
      className="min-h-[60vh] flex flex-col items-center justify-center p-6 space-y-4"
    >
      <div className="relative flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-2 border-primary/20 animate-ping absolute" />
        <div className="w-12 h-12 rounded-full border-2 border-primary/10 bg-background/80 backdrop-blur-sm flex items-center justify-center shadow-sm">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      </div>
      <div className="text-center space-y-1">
        <p className="text-sm font-medium text-foreground/80">Loading experience...</p>
        <p className="text-xs text-muted-foreground">MediSync RapidResQ</p>
      </div>
    </div>
  );
};
