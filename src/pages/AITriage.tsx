import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Activity, Brain, AlertTriangle, ShieldCheck, Thermometer, HeartPulse, Sparkles, Send, Loader2, Ambulance, Video, Hospital, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";

const COMMON_SYMPTOMS = [
  "Chest Pain", "Shortness of Breath", "Fever", "Severe Headache", 
  "Dizziness", "Persistent Cough", "Severe Bleeding", "Stomach Pain"
];

// Mock AI logic based on keywords for MVP demo
const analyzeSymptoms = (text: string) => {
  const lowercase = text.toLowerCase();
  
  if (lowercase.includes("chest") || lowercase.includes("heart") || lowercase.includes("breath") || lowercase.includes("bleed") || lowercase.includes("unconscious")) {
    return {
      severity: "critical",
      score: 95,
      title: "Critical Emergency Detected",
      description: "Based on your symptoms, this could be a life-threatening emergency. Do not wait.",
      action: "Book Ambulance Immediately",
      route: "/sos"
    };
  }
  
  if (lowercase.includes("fever") || lowercase.includes("headache") || lowercase.includes("stomach") || lowercase.includes("pain") || lowercase.includes("vomit")) {
    return {
      severity: "warning",
      score: 65,
      title: "Urgent Medical Attention Advised",
      description: "Your symptoms require medical evaluation, but do not immediately appear life-threatening.",
      action: "Book Instant Video Consult",
      route: "/video-consultation"
    };
  }
  
  return {
    severity: "low",
    score: 20,
    title: "Mild Symptoms",
    description: "Your symptoms appear to be mild. However, monitor them closely and consult a professional if they worsen.",
    action: "View Local Clinics",
    route: "/hospital"
  };
};

const AITriage = () => {
  const [symptoms, setSymptoms] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<ReturnType<typeof analyzeSymptoms> | null>(null);
  const navigate = useNavigate();

  const handleAnalyze = () => {
    if (!symptoms.trim()) return;
    setIsAnalyzing(true);
    setResult(null);
    
    // Simulate AI processing time
    setTimeout(() => {
      setResult(analyzeSymptoms(symptoms));
      setIsAnalyzing(false);
    }, 2500);
  };

  const addSymptom = (sym: string) => {
    setSymptoms(prev => prev ? `${prev}, ${sym}` : sym);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="portal-content pt-6 lg:pt-8 pb-20 px-4">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Breadcrumbs */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Link 
                to="/patient-portal" 
                className="inline-flex items-center gap-1.5 font-medium hover:text-primary transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Patient Portal</span>
              </Link>
              <span>/</span>
              <span className="font-semibold text-foreground">AI Symptom Triage</span>
            </div>

            <Link 
              to="/" 
              className="text-xs font-semibold text-muted-foreground hover:text-primary transition-colors"
            >
              Back to Home
            </Link>
          </div>

          {/* High-Tech Hero Header Banner */}
          <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-blue-500/5 p-6 md:p-8 text-center space-y-3 shadow-xs">
            <div className="absolute top-0 right-0 w-80 h-80 bg-primary/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-60 h-60 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
            
            <div className="relative z-10 space-y-2">
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-primary/10 text-primary font-bold text-xs border border-primary/25 shadow-2xs"
              >
                <Sparkles className="w-3.5 h-3.5 fill-primary" /> MEDISYNC AI CLINICAL TRIAGE ENGINE
              </motion.div>
              <motion.h1 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-3xl md:text-5xl font-black tracking-tight flex items-center justify-center gap-2"
              >
                Smart <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-500">Triage</span> Assessment
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-sm md:text-base text-muted-foreground font-medium max-w-2xl mx-auto"
              >
                Enter what you are experiencing. The neural analysis matrix assesses clinical indicators in seconds and guides you to the fastest care route.
              </motion.p>
            </div>
          </div>

          {/* Interactive Form & Analysis Grid */}
          <div className="grid md:grid-cols-2 gap-6 relative z-10">
            {/* Left: Input Form */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 }}
            >
              <Card className="border-border shadow-md bg-card/80 backdrop-blur-xl h-full flex flex-col">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-xl font-bold">
                    <Activity className="w-5 h-5 text-primary" /> Describe Symptoms
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Select quick common indicators below or describe in your own words.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col space-y-4">
                  <div className="flex flex-wrap gap-1.5 mb-1">
                    {COMMON_SYMPTOMS.map(sym => (
                      <Badge 
                        key={sym} 
                        variant="secondary" 
                        className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors py-1 px-2.5 text-xs font-semibold"
                        onClick={() => addSymptom(sym)}
                      >
                        + {sym}
                      </Badge>
                    ))}
                  </div>
                  
                  <Textarea 
                    placeholder="E.g., I've been having sudden chest tightness for the last 20 minutes, nausea and mild shortness of breath..."
                    className="flex-1 min-h-[140px] resize-none rounded-xl text-sm p-3.5 border focus-visible:ring-primary"
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                  />
                  
                  <Button 
                    size="lg" 
                    className="w-full h-12 rounded-xl font-bold text-base gap-2 shadow-md hover:shadow-primary/20 transition-all"
                    onClick={handleAnalyze}
                    disabled={isAnalyzing || !symptoms.trim()}
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Analyzing Neural Matrix...
                      </>
                    ) : (
                      <>
                        <Brain className="w-4 h-4" /> Run Severity Analysis
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Right: Results / Scanner state */}
            <div className="relative min-h-[380px] md:min-h-[auto] flex">
              {/* Empty State */}
              <AnimatePresence>
                {!isAnalyzing && !result && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="w-full h-full border-2 border-dashed border-border/80 rounded-2xl flex flex-col items-center justify-center p-8 text-center bg-muted/20"
                  >
                    <div className="w-16 h-16 mb-4 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 animate-pulse">
                      <ShieldCheck className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground">Awaiting Symptom Input</h3>
                    <p className="text-muted-foreground mt-1.5 text-xs max-w-xs">
                      Type your current health symptoms on the left to activate the AI clinical severity engine.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Loading Scanner State */}
              <AnimatePresence>
                {isAnalyzing && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-background/90 backdrop-blur-md rounded-2xl flex flex-col items-center justify-center border border-primary/30 shadow-lg overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-full h-1 bg-primary shadow-[0_0_15px_rgba(239,68,68,0.8)] animate-[scan_2s_ease-in-out_infinite]" />
                    
                    <div className="relative w-24 h-24 mb-6 flex items-center justify-center">
                      <div className="absolute inset-0 border-[3px] border-t-primary border-r-primary/30 border-b-transparent border-l-primary/60 rounded-full animate-spin" style={{ animationDuration: '2s' }} />
                      <div className="absolute inset-2 border-[2px] border-t-blue-400 border-b-transparent rounded-full animate-spin" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }} />
                      <Brain className="w-8 h-8 text-primary animate-pulse" />
                    </div>
                    
                    <div className="flex items-center gap-2 font-mono text-primary font-bold text-xs">
                      <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
                      ANALYZING BIOMETRIC MARKERS...
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Result State */}
              <AnimatePresence>
                {result && !isAnalyzing && (
                  <motion.div 
                    initial={{ opacity: 0, x: 20, scale: 0.98 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    className="w-full h-full"
                  >
                    <Card className={`h-full border-2 overflow-hidden flex flex-col relative ${
                      result.severity === 'critical' ? 'border-destructive/60 bg-gradient-to-b from-destructive/10 to-background shadow-lg' :
                      result.severity === 'warning' ? 'border-amber-500/60 bg-gradient-to-b from-amber-500/10 to-background shadow-lg' :
                      'border-emerald-500/60 bg-gradient-to-b from-emerald-500/10 to-background shadow-lg'
                    }`}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start mb-3">
                          <Badge className={`px-2.5 py-0.5 text-xs font-black uppercase tracking-wider ${
                            result.severity === 'critical' ? 'bg-destructive text-destructive-foreground' :
                            result.severity === 'warning' ? 'bg-amber-500 text-black' :
                            'bg-emerald-600 text-white'
                          }`}>
                            SEVERITY: {result.severity}
                          </Badge>
                          <div className={`font-black text-3xl ${
                            result.severity === 'critical' ? 'text-destructive' :
                            result.severity === 'warning' ? 'text-amber-600 dark:text-amber-400' :
                            'text-emerald-600 dark:text-emerald-400'
                          }`}>
                            {result.score}%
                          </div>
                        </div>
                        <CardTitle className="text-xl font-bold flex items-center gap-2">
                          {result.severity === 'critical' && <AlertTriangle className="w-5 h-5 text-destructive animate-pulse" />}
                          {result.severity === 'warning' && <Thermometer className="w-5 h-5 text-amber-500" />}
                          {result.severity === 'low' && <HeartPulse className="w-5 h-5 text-emerald-500" />}
                          {result.title}
                        </CardTitle>
                      </CardHeader>
                      
                      <CardContent className="flex-1 flex flex-col justify-between pt-2 space-y-4">
                        <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                          {result.description}
                        </p>

                        <div className="space-y-3 bg-background/70 backdrop-blur-sm p-4 rounded-xl border border-border">
                          <h4 className="font-extrabold text-[11px] tracking-wider text-muted-foreground uppercase">
                            Recommended Action
                          </h4>
                          <Button 
                            size="lg" 
                            className={`w-full h-12 text-sm font-bold shadow-md gap-2 ${
                              result.severity === 'critical' ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground' :
                              result.severity === 'warning' ? 'bg-amber-500 hover:bg-amber-600 text-black' :
                              'bg-emerald-600 hover:bg-emerald-700 text-white'
                            }`}
                            onClick={() => navigate(result.route)}
                          >
                            {result.severity === 'critical' && <Ambulance className="w-4 h-4" />}
                            {result.severity === 'warning' && <Video className="w-4 h-4" />}
                            {result.severity === 'low' && <Hospital className="w-4 h-4" />}
                            <span>{result.action}</span>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AITriage;
