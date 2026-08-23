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
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      
      {/* High-Tech Hero Section */}
      <div className="pt-24 pb-12 relative overflow-hidden bg-gradient-to-b from-primary/10 via-background to-background">
        <div className="absolute top-0 right-[-10%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-[20%] left-[-10%] w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-[80px] pointer-events-none" />
        
        <div className="container mx-auto px-4 relative z-10 text-center space-y-4">
          <div className="text-left mb-2">
            <Link 
              to="/" 
              className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Home (Landing Page)</span>
            </Link>
          </div>
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary font-bold border border-primary/20 mb-2 shadow-inner"
          >
            <Sparkles className="w-4 h-4 fill-primary" /> AMBULA AI COMPUTE CORE
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-black tracking-tight flex items-center justify-center gap-3"
          >
            Smart <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">Triage</span> System
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-muted-foreground font-medium max-w-2xl mx-auto"
          >
            Describe what you're feeling. Our cutting-edge machine learning engine will instantly analyze your symptoms and recommend the safest clinical pathway.
          </motion.p>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-4xl relative z-20">
        <div className="grid md:grid-cols-2 gap-8">
          
          {/* Left: Input Form */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="border-border/50 shadow-2xl bg-card/60 backdrop-blur-xl h-full flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <Activity className="w-6 h-6 text-primary" /> Primary Symptoms
                </CardTitle>
                <CardDescription>Be as detailed as possible for the best clinical mapping.</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col space-y-4">
                <div className="flex flex-wrap gap-2 mb-2">
                  {COMMON_SYMPTOMS.map(sym => (
                    <Badge 
                      key={sym} 
                      variant="secondary" 
                      className="cursor-pointer hover:bg-primary hover:text-white transition-colors py-1 px-3"
                      onClick={() => addSymptom(sym)}
                    >
                      + {sym}
                    </Badge>
                  ))}
                </div>
                
                <Textarea 
                  placeholder="E.g., I've been having severe chest pains for the last 30 minutes and I feel dizzy..."
                  className="flex-1 min-h-[150px] resize-none rounded-xl text-base p-4 border-2 focus-visible:ring-primary/50"
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                />
                
                <Button 
                  size="lg" 
                  className="w-full h-14 rounded-xl font-bold text-lg gap-2 shadow-lg hover:shadow-primary/25 transition-all"
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || !symptoms.trim()}
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" /> Processing Neural Matrix...
                    </>
                  ) : (
                    <>
                      <Brain className="w-5 h-5" /> Analyze Severity
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Right: Results / Scanner state */}
          <div className="relative h-[400px] md:h-auto">
            {/* Empty State */}
            <AnimatePresence>
              {!isAnalyzing && !result && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute inset-0 border-2 border-dashed border-border/50 rounded-2xl flex flex-col items-center justify-center p-8 text-center bg-muted/20"
                >
                  <div className="w-24 h-24 mb-6 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 animate-[pulse_3s_ease-in-out_infinite]">
                    <ShieldCheck className="w-10 h-10 text-primary/40" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground/50">Awaiting Input Data</h3>
                  <p className="text-muted-foreground mt-2 text-sm">Please enter your symptoms to initialize the diagnostic sequence.</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Loading Scanner State */}
            <AnimatePresence>
              {isAnalyzing && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-background/50 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center border border-primary/20 shadow-[0_0_50px_rgba(37,99,235,0.15)] overflow-hidden"
                >
                  {/* Scanner line */}
                  <div className="absolute top-0 left-0 w-full h-1 bg-primary/50 shadow-[0_0_20px_rgba(37,99,235,1)] animate-[scan_2s_ease-in-out_infinite]" />
                  
                  <div className="relative w-32 h-32 mb-8 flex items-center justify-center">
                    <div className="absolute inset-0 border-[3px] border-t-primary border-r-primary/30 border-b-primary/10 border-l-primary/60 rounded-full animate-spin" style={{ animationDuration: '3s' }} />
                    <div className="absolute inset-2 border-[3px] border-t-blue-400 border-b-blue-400/20 border-l-transparent border-r-transparent rounded-full animate-spin ring-reverse" style={{ animationDuration: '2s', animationDirection: 'reverse' }} />
                    <Brain className="w-10 h-10 text-primary animate-pulse" />
                  </div>
                  
                  <div className="flex items-center gap-2 font-mono text-primary font-bold">
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
                  initial={{ opacity: 0, x: 30, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className="absolute inset-0"
                >
                  <Card className={`h-full border-2 overflow-hidden flex flex-col relative ${
                    result.severity === 'critical' ? 'border-red-500/50 shadow-[0_0_40px_rgba(239,68,68,0.2)] bg-gradient-to-b from-red-500/5 to-background' :
                    result.severity === 'warning' ? 'border-yellow-500/50 shadow-[0_0_40px_rgba(234,179,8,0.15)] bg-gradient-to-b from-yellow-500/5 to-background' :
                    'border-green-500/50 shadow-[0_0_40px_rgba(34,197,94,0.15)] bg-gradient-to-b from-green-500/5 to-background'
                  }`}>
                    {/* Animated background glow */}
                    <div className={`absolute top-0 right-0 p-32 blur-[80px] rounded-full pointer-events-none ${
                       result.severity === 'critical' ? 'bg-red-500/10' :
                       result.severity === 'warning' ? 'bg-yellow-500/10' :
                       'bg-green-500/10'
                    }`} />

                    <CardHeader className="relative z-10 pb-2">
                      <div className="flex justify-between items-start mb-4">
                        <Badge className={`px-3 py-1 text-sm font-bold uppercase tracking-widest ${
                          result.severity === 'critical' ? 'bg-red-500 text-white' :
                          result.severity === 'warning' ? 'bg-yellow-500 text-black' :
                          'bg-green-500 text-white'
                        }`}>
                          SEVERITY: {result.severity}
                        </Badge>
                        <div className={`font-black text-4xl ${
                          result.severity === 'critical' ? 'text-red-500' :
                          result.severity === 'warning' ? 'text-yellow-500' :
                          'text-green-500'
                        }`}>
                          {result.score}%
                        </div>
                      </div>
                      <CardTitle className="text-2xl font-bold flex items-center gap-2">
                        {result.severity === 'critical' && <AlertTriangle className="w-6 h-6 text-red-500 animate-pulse" />}
                        {result.severity === 'warning' && <Thermometer className="w-6 h-6 text-yellow-500" />}
                        {result.severity === 'low' && <HeartPulse className="w-6 h-6 text-green-500" />}
                        {result.title}
                      </CardTitle>
                    </CardHeader>
                    
                    <CardContent className="relative z-10 flex-1 flex flex-col justify-between pt-4">
                      <p className="text-lg text-foreground/80 leading-relaxed font-medium">
                        {result.description}
                      </p>

                      <div className="mt-8 space-y-4 bg-background/50 backdrop-blur-sm p-5 rounded-2xl border border-border/50">
                        <h4 className="font-bold text-sm tracking-widest text-muted-foreground uppercase">Recommended Next Step</h4>
                        <Button 
                          size="lg" 
                          className={`w-full h-14 text-lg font-bold shadow-lg gap-2 ${
                            result.severity === 'critical' ? 'bg-red-500 hover:bg-red-600 text-white' :
                            result.severity === 'warning' ? 'bg-yellow-500 hover:bg-yellow-600 text-black' :
                            'bg-green-600 hover:bg-green-700 text-white'
                          }`}
                          onClick={() => navigate(result.route)}
                        >
                          {result.severity === 'critical' && <Ambulance className="w-5 h-5" />}
                          {result.severity === 'warning' && <Video className="w-5 h-5" />}
                          {result.severity === 'low' && <Hospital className="w-5 h-5" />}
                          {result.action}
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
    </div>
  );
};

export default AITriage;
