import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  AlertTriangle,
  Shield,
  Loader2
} from 'lucide-react';

// Keywords that trigger SOS
const SOS_KEYWORDS = [
  'help', 'help me', 'emergency', 'ambulance', 'call ambulance',
  'sos', 'danger', 'accident', 'heart attack', 'can\'t breathe',
  'call 108', 'need help', 'save me', 'urgent', 'bachao', 'madad',
  'doctor', 'hospital', 'dying', 'bleeding', 'unconscious'
];

// Confirmation keywords
const CONFIRM_KEYWORDS = ['yes', 'confirm', 'send', 'dispatch', 'please', 'haan', 'ji'];
const CANCEL_KEYWORDS = ['no', 'cancel', 'stop', 'wait', 'nahi', 'ruko'];

interface VoiceSOSTriggerProps {
  onTriggerSOS: () => void;
  isEmergencyActive: boolean;
  disabled?: boolean;
}

const VoiceSOSTrigger = ({ onTriggerSOS, isEmergencyActive, disabled }: VoiceSOSTriggerProps) => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [detectedKeyword, setDetectedKeyword] = useState<string | null>(null);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);
  
  const recognitionRef = useRef<any>(null);
  const confirmationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const restartTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check for browser support
  useEffect(() => {
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognitionAPI);
    
    if (SpeechRecognitionAPI) {
      recognitionRef.current = new SpeechRecognitionAPI();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-IN';
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (confirmationTimeoutRef.current) {
        clearTimeout(confirmationTimeoutRef.current);
      }
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
      }
    };
  }, []);

  const scheduleRestart = useCallback(() => {
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
    }
    restartTimeoutRef.current = setTimeout(() => {
      if (isEnabled && recognitionRef.current && !isEmergencyActive) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          console.log('Recognition already started');
        }
      }
    }, 500);
  }, [isEnabled, isEmergencyActive]);

  const handleConfirmSOS = useCallback(() => {
    if (confirmationTimeoutRef.current) {
      clearTimeout(confirmationTimeoutRef.current);
    }
    
    setAwaitingConfirmation(false);
    setDetectedKeyword(null);

    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(
        'Emergency confirmed! Dispatching ambulance to your location. Stay calm, help is on the way.'
      );
      utterance.rate = 1;
      speechSynthesis.speak(utterance);
    }

    toast.success('🚑 Voice SOS confirmed! Dispatching ambulance...');
    onTriggerSOS();
  }, [onTriggerSOS]);

  const handleCancelSOS = useCallback(() => {
    if (confirmationTimeoutRef.current) {
      clearTimeout(confirmationTimeoutRef.current);
    }
    
    setAwaitingConfirmation(false);
    setDetectedKeyword(null);
    setTranscript('');

    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance('Emergency request cancelled.');
      utterance.rate = 1;
      speechSynthesis.speak(utterance);
    }

    toast.info('Voice SOS cancelled.');
  }, []);

  const triggerConfirmation = useCallback((keyword: string) => {
    setAwaitingConfirmation(true);
    
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(
        `Emergency keyword detected: ${keyword}. Say "yes" to confirm sending an ambulance, or "no" to cancel.`
      );
      utterance.rate = 1.1;
      utterance.pitch = 1;
      speechSynthesis.speak(utterance);
    }

    toast.warning(
      `🚨 Emergency keyword detected: "${keyword}"! Say "YES" to confirm or "NO" to cancel.`,
      { duration: 10000 }
    );

    confirmationTimeoutRef.current = setTimeout(() => {
      handleCancelSOS();
      toast.info('Voice SOS cancelled due to no confirmation.');
    }, 15000);
  }, [handleCancelSOS]);

  // Setup recognition handlers
  useEffect(() => {
    if (!recognitionRef.current) return;

    recognitionRef.current.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      const currentTranscript = (finalTranscript || interimTranscript).toLowerCase().trim();
      setTranscript(currentTranscript);

      if (awaitingConfirmation) {
        const isConfirmed = CONFIRM_KEYWORDS.some(kw => currentTranscript.includes(kw));
        const isCancelled = CANCEL_KEYWORDS.some(kw => currentTranscript.includes(kw));

        if (isConfirmed && finalTranscript) {
          handleConfirmSOS();
        } else if (isCancelled && finalTranscript) {
          handleCancelSOS();
        }
      } else {
        const matchedKeyword = SOS_KEYWORDS.find(kw => currentTranscript.includes(kw));
        if (matchedKeyword && finalTranscript) {
          setDetectedKeyword(matchedKeyword);
          triggerConfirmation(matchedKeyword);
        }
      }
    };

    recognitionRef.current.onerror = (event: any) => {
      console.error('Voice recognition error:', event.error);
      
      if (event.error === 'not-allowed') {
        toast.error('Microphone access denied. Please enable it in your browser settings.');
        setIsEnabled(false);
      } else if (event.error !== 'no-speech' && event.error !== 'aborted') {
        scheduleRestart();
      }
      
      setIsListening(false);
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
      if (isEnabled && !isEmergencyActive) {
        scheduleRestart();
      }
    };

    recognitionRef.current.onstart = () => {
      setIsListening(true);
    };
  }, [isEnabled, awaitingConfirmation, isEmergencyActive, handleConfirmSOS, handleCancelSOS, triggerConfirmation, scheduleRestart]);

  const toggleVoiceSOS = useCallback((enabled: boolean) => {
    setIsEnabled(enabled);
    
    if (enabled) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
          toast.success('Voice SOS activated! Say "Help", "Emergency", or "SOS" to trigger.');
        } catch (e) {
          console.error('Failed to start recognition:', e);
        }
      }
    } else {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      setIsListening(false);
      setAwaitingConfirmation(false);
      setTranscript('');
    }
  }, []);

  if (!isSupported) {
    return (
      <Card className="border-muted">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 text-muted-foreground">
            <MicOff className="w-5 h-5" />
            <span className="text-sm">Voice activation not supported in this browser</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`transition-all ${
      awaitingConfirmation 
        ? 'border-destructive bg-destructive/5 animate-pulse' 
        : isListening 
          ? 'border-primary bg-primary/5' 
          : 'border-border'
    }`}>
      <CardContent className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              isListening ? 'bg-primary text-primary-foreground' : 'bg-muted'
            }`}>
              {isListening ? (
                <Mic className="w-5 h-5 animate-pulse" />
              ) : (
                <MicOff className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
            <div>
              <p className="font-semibold">Voice-Activated SOS</p>
              <p className="text-xs text-muted-foreground">
                {isListening ? 'Listening for emergency keywords...' : 'Enable hands-free emergency trigger'}
              </p>
            </div>
          </div>
          <Switch
            checked={isEnabled}
            onCheckedChange={toggleVoiceSOS}
            disabled={disabled || isEmergencyActive}
          />
        </div>

        {/* Status & Transcript */}
        {isEnabled && (
          <>
            <div className="flex items-center gap-2 text-sm">
              {isListening ? (
                <>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-green-600">Active</span>
                  </div>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-muted-foreground">
                    Say "Help", "Emergency", "SOS", or "Call ambulance"
                  </span>
                </>
              ) : (
                <div className="flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span className="text-muted-foreground">Reconnecting...</span>
                </div>
              )}
            </div>

            {/* Transcript Display */}
            {transcript && (
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <Volume2 className="w-3 h-3" />
                  Heard:
                </p>
                <p className="text-sm font-medium">"{transcript}"</p>
              </div>
            )}

            {/* Confirmation Dialog */}
            {awaitingConfirmation && (
              <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="w-5 h-5 animate-bounce" />
                  <span className="font-bold">Emergency Keyword Detected!</span>
                </div>
                <p className="text-sm">
                  Keyword: <Badge variant="destructive">{detectedKeyword}</Badge>
                </p>
                <p className="text-sm font-medium">
                  Say <span className="text-green-600 font-bold">"YES"</span> to dispatch ambulance, 
                  or <span className="text-red-600 font-bold">"NO"</span> to cancel.
                </p>
                <div className="flex gap-2 mt-3">
                  <Button 
                    size="sm" 
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={handleConfirmSOS}
                  >
                    Confirm SOS
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="flex-1"
                    onClick={handleCancelSOS}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Keywords List */}
            {!awaitingConfirmation && (
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  Recognized trigger words:
                </p>
                <div className="flex flex-wrap gap-1">
                  {['Help', 'Emergency', 'SOS', 'Ambulance', 'Accident'].map((word) => (
                    <Badge key={word} variant="secondary" className="text-xs">
                      {word}
                    </Badge>
                  ))}
                  <Badge variant="outline" className="text-xs">+more</Badge>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default VoiceSOSTrigger;
