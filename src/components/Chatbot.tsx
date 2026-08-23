import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Bot, User, LogIn, Mic, MicOff, Navigation, Ambulance, Phone, Newspaper, CalendarCheck, AlertTriangle, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";
import { VoiceWaveform } from "@/components/VoiceWaveform";
import { toast } from "sonner";

type Message = { role: "user" | "assistant"; content: string };

interface ChatAction {
  type: "navigate" | "dispatch_ambulance" | "call_emergency";
  payload: Record<string, string>;
}

interface ParsedResponse {
  message: string;
  action: ChatAction | null;
}

interface QuickAction {
  label: string;
  icon: React.ReactNode;
  message: string;
  variant?: "default" | "destructive" | "outline" | "secondary";
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL || 'https://placeholder-project.supabase.co'}/functions/v1/chat`;

export const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [pendingAction, setPendingAction] = useState<ChatAction | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  
  const {
    isListening,
    transcript,
    isSupported: isVoiceSupported,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition();

  const {
    speak,
    stop: stopSpeaking,
    isSpeaking,
    isEnabled: isTTSEnabled,
    setIsEnabled: setTTSEnabled,
    isSupported: isTTSSupported,
  } = useTextToSpeech();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (transcript && !isListening) {
      setInput(transcript);
      resetTranscript();
    }
  }, [transcript, isListening, resetTranscript]);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const parseAIResponse = (content: string): ParsedResponse => {
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          message: parsed.message || content,
          action: parsed.action || null,
        };
      }
    } catch (e) {
      console.log("Could not parse as JSON, treating as plain text");
    }
    return { message: content, action: null };
  };

  const executeAction = useCallback(async (action: ChatAction) => {
    switch (action.type) {
      case "navigate":
        const path = action.payload.path;
        if (path) {
          toast.success(`Navigating to ${path}...`);
          setTimeout(() => {
            navigate(path);
            setIsOpen(false);
          }, 500);
        }
        break;

      case "dispatch_ambulance":
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
            toast.error("Please sign in to request an ambulance");
            return;
          }

          // Get user's location
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 10000,
            });
          });

          const pickupLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };

          // Create emergency booking
          const { error } = await supabase.from("bookings").insert({
            user_id: session.user.id,
            pickup_location: pickupLocation,
            destination_location: pickupLocation,
            pickup_address: `Emergency: ${action.payload.emergency_type || "Medical emergency"}`,
            destination_address: action.payload.description || "Emergency dispatch",
            status: "pending",
          });

          if (error) throw error;

          toast.success("🚑 Ambulance dispatched! Help is on the way.", {
            duration: 5000,
          });

          // Navigate to SOS page
          setTimeout(() => {
            navigate("/sos");
            setIsOpen(false);
          }, 1000);
        } catch (error) {
          console.error("Error dispatching ambulance:", error);
          toast.error("Failed to dispatch ambulance. Please try the SOS button.");
        }
        break;

      case "call_emergency":
        const number = action.payload.number || "108";
        toast.info(`Emergency Number: ${number}`, {
          duration: 10000,
          description: "Tap to call or dial manually",
          action: {
            label: "Call Now",
            onClick: () => window.open(`tel:${number}`),
          },
        });
        break;
    }
  }, [navigate]);

  const streamChat = async (userMessages: Message[]) => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      throw new Error("Not authenticated");
    }

    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ messages: userMessages }),
    });

    if (!resp.ok || !resp.body) {
      if (resp.status === 401) {
        setIsAuthenticated(false);
        throw new Error("Please sign in to use the chat");
      }
      throw new Error("Failed to start stream");
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";
    let assistantContent = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") break;

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) {
            assistantContent += content;
            setMessages((prev) => {
              const last = prev[prev.length - 1];
              if (last?.role === "assistant") {
                return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantContent } : m));
              }
              return [...prev, { role: "assistant", content: assistantContent }];
            });
          }
        } catch {
          textBuffer = line + "\n" + textBuffer;
          break;
        }
      }
    }

    // Parse the final response for actions
    const parsedResponse = parseAIResponse(assistantContent);
    
    // Update the final message to show just the message part
    setMessages((prev) => {
      const newMessages = [...prev];
      if (newMessages.length > 0 && newMessages[newMessages.length - 1].role === "assistant") {
        newMessages[newMessages.length - 1].content = parsedResponse.message;
      }
      return newMessages;
    });

    // Speak the response if TTS is enabled
    if (isTTSEnabled && parsedResponse.message) {
      speak(parsedResponse.message);
    }

    // Execute action if present
    if (parsedResponse.action) {
      setPendingAction(parsedResponse.action);
      await executeAction(parsedResponse.action);
      setPendingAction(null);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      await streamChat([...messages, userMsg]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, I encountered an error. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
      toast.info("🎤 Listening... Speak now", { duration: 2000 });
    }
  };

  const handleTTSToggle = () => {
    if (isSpeaking) {
      stopSpeaking();
    }
    setTTSEnabled(!isTTSEnabled);
    toast.info(isTTSEnabled ? "🔇 Voice output disabled" : "🔊 Voice output enabled", { duration: 2000 });
  };

  const speakMessage = (content: string) => {
    if (isSpeaking) {
      stopSpeaking();
    } else {
      speak(content);
    }
  };

  const quickActions: QuickAction[] = [
    {
      label: "Emergency SOS",
      icon: <AlertTriangle className="h-3 w-3" />,
      message: "I need an ambulance immediately, this is an emergency!",
      variant: "destructive",
    },
    {
      label: "View News",
      icon: <Newspaper className="h-3 w-3" />,
      message: "Take me to the news and events page",
      variant: "outline",
    },
    {
      label: "My Bookings",
      icon: <CalendarCheck className="h-3 w-3" />,
      message: "Show me my booking history",
      variant: "outline",
    },
  ];

  const handleQuickAction = async (action: QuickAction) => {
    if (isLoading) return;
    
    const userMsg: Message = { role: "user", content: action.message };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      await streamChat([...messages, userMsg]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, I encountered an error. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const getActionIcon = (content: string) => {
    if (content.toLowerCase().includes("navigat")) return <Navigation className="h-3 w-3 mr-1" />;
    if (content.toLowerCase().includes("ambulance") || content.toLowerCase().includes("dispatch")) return <Ambulance className="h-3 w-3 mr-1" />;
    if (content.toLowerCase().includes("call") || content.toLowerCase().includes("108")) return <Phone className="h-3 w-3 mr-1" />;
    return null;
  };

  return (
    <>
      {/* Floating Button wrapper */}
      <div className="fixed bottom-6 right-6 z-[999]">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "h-16 w-16 rounded-full shadow-2xl flex items-center justify-center transition-all border-2",
            isOpen ? "bg-zinc-800 border-zinc-700" : "bg-gradient-to-br from-primary to-medical-blue-dark border-blue-400"
          )}
          style={{ boxShadow: isOpen ? "none" : "0 0 40px rgba(37, 99, 235, 0.4)" }}
        >
          {isOpen ? <X className="h-7 w-7 text-white" /> : <Bot className="h-7 w-7 text-white" />}
          
          {!isOpen && (
            <div className="absolute top-0 right-0 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-md">
              <div className="w-2 h-2 bg-primary rounded-full animate-ping" />
            </div>
          )}
        </motion.button>
      </div>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed bottom-28 right-6 z-[998] w-[90vw] sm:w-[400px] h-[600px] max-h-[80vh] rounded-[2rem] border border-border/50 bg-background/95 backdrop-blur-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-border/50 bg-gradient-to-r from-primary/10 to-transparent px-5 py-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary shadow-lg shadow-primary/30">
                <Bot className="h-6 w-6 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-foreground text-lg tracking-tight">Ambula Assistant</h3>
                <p className="text-xs text-muted-foreground font-medium">Fast Emergency Help</p>
              </div>
              <div className="flex items-center gap-2">
                {isTTSSupported && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full hover:bg-black/5 dark:hover:bg-white/10"
                    onClick={handleTTSToggle}
                    title={isTTSEnabled ? "Disable voice output" : "Enable voice output"}
                  >
                    {isTTSEnabled ? (
                      <Volume2 className={cn("h-4 w-4", isSpeaking && "text-primary animate-pulse")} />
                    ) : (
                      <VolumeX className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                )}
                {isVoiceSupported && (
                  <div className={cn(
                    "h-2 w-2 rounded-full",
                    isListening ? "bg-destructive animate-pulse" : "bg-trust-green"
                  )} />
                )}
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-5" ref={scrollRef}>
              {!isAuthenticated && (
                <div className="text-center text-muted-foreground text-sm py-12">
                  <LogIn className="h-16 w-16 mx-auto mb-4 opacity-30 text-primary" />
                  <p className="font-medium text-base mb-4">Please sign in to chat</p>
                  <Button 
                    onClick={() => navigate('/auth')} 
                    className="w-full rounded-full shadow-lg"
                  >
                    Sign In
                  </Button>
                </div>
              )}
              {isAuthenticated && messages.length === 0 && (
                <div className="text-center text-muted-foreground text-sm py-8">
                  <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Bot className="h-10 w-10 text-primary opacity-80" />
                  </div>
                  <p className="font-bold text-lg text-foreground mb-1">Hi! How can I help?</p>
                  <p className="text-sm mb-6">Select an action below or type a message.</p>
                  
                  {/* Quick Action Buttons */}
                  <div className="flex flex-col gap-3 justify-center mb-6">
                    {quickActions.map((action, index) => (
                      <Button
                        key={index}
                        variant={action.variant === "outline" ? "secondary" : action.variant}
                        size="default"
                        className={cn(
                          "w-full justify-start rounded-xl shadow-sm text-sm font-semibold gap-3 h-12",
                          action.variant === "destructive" && "animate-pulse ring-2 ring-destructive/50"
                        )}
                        onClick={() => handleQuickAction(action)}
                        disabled={isLoading}
                      >
                        <div className={cn("p-1.5 rounded-md", action.variant === "destructive" ? "bg-white/20" : "bg-primary/10")}>
                          {action.icon}
                        </div>
                        {action.label}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="space-y-6">
                {messages.map((msg, i) => (
                  <div key={i} className={cn("flex gap-3", msg.role === "user" ? "justify-end" : "justify-start")}>
                    {msg.role === "assistant" && (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 shadow-sm border border-primary/20">
                        <Bot className="h-5 w-5 text-primary" />
                      </div>
                    )}
                    <div
                      className={cn(
                        "max-w-[75%] rounded-2xl px-5 py-3 text-[15px] leading-relaxed shadow-sm",
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground rounded-tr-sm bg-gradient-to-br from-primary to-blue-600"
                          : "bg-muted border border-border/50 text-foreground rounded-tl-sm backdrop-blur-md"
                      )}
                    >
                      <div className="flex flex-col gap-1">
                        <div className="flex items-start gap-2">
                          {msg.role === "assistant" && getActionIcon(msg.content)}
                          <span className="break-words font-medium">{msg.content}</span>
                        </div>
                        {msg.role === "assistant" && isTTSSupported && (
                          <div className="flex justify-end mt-1 border-t border-border/20 pt-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-[11px] opacity-70 hover:opacity-100 rounded-full"
                              onClick={() => speakMessage(msg.content)}
                            >
                              <Volume2 className="h-3 w-3 mr-1.5" />
                              {isSpeaking ? "Stop" : "Listen"}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                    {msg.role === "user" && (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary shadow-sm border border-border/50">
                        <User className="h-5 w-5 text-secondary-foreground" />
                      </div>
                    )}
                  </div>
                ))}
                {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
                  <div className="flex gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 shadow-sm border border-primary/20">
                      <Bot className="h-5 w-5 text-primary" />
                    </div>
                    <div className="bg-muted rounded-2xl rounded-tl-sm px-5 py-4 border border-border/50 shadow-sm">
                      <div className="flex gap-1.5 items-center h-4">
                        <span className="h-2 w-2 rounded-full bg-foreground/40 animate-[bounce_1s_infinite]" style={{ animationDelay: "0ms" }} />
                        <span className="h-2 w-2 rounded-full bg-foreground/40 animate-[bounce_1s_infinite]" style={{ animationDelay: "150ms" }} />
                        <span className="h-2 w-2 rounded-full bg-foreground/40 animate-[bounce_1s_infinite]" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Voice Input Visualizer */}
            <AnimatePresence>
              {isListening && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-border/50 bg-destructive/5 px-5 py-4 backdrop-blur-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="relative shrink-0">
                      <div className="h-12 w-12 rounded-full bg-destructive/20 flex items-center justify-center shadow-inner">
                        <Mic className="h-6 w-6 text-destructive animate-pulse" />
                      </div>
                      <div className="absolute inset-0 rounded-full bg-destructive/20 animate-ping" />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <VoiceWaveform isActive={isListening} barCount={16} className="h-8 w-full" />
                      <p className="text-xs font-medium text-destructive mt-2 truncate">
                        {transcript || "Listening... Speak now"}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={stopListening}
                      className="shrink-0 rounded-full font-bold shadow-md"
                    >
                      Stop
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input Form */}
            <div className="p-4 bg-muted/30 border-t border-border/50 backdrop-blur-md">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex gap-2 relative"
              >
                {isVoiceSupported && !isListening && (
                  <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    onClick={handleVoiceToggle}
                    disabled={!isAuthenticated}
                    title="Start voice input"
                    className="shrink-0 h-12 w-12 rounded-full shadow-sm hover:bg-black/10 dark:hover:bg-white/10"
                  >
                    <Mic className="h-5 w-5" />
                  </Button>
                )}
                <Input
                  value={isListening ? transcript || input : input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={isListening ? "Listening..." : isAuthenticated ? "Type your message..." : "Sign in to chat"}
                  disabled={isLoading || !isAuthenticated || isListening}
                  className="flex-1 h-12 rounded-full border-border/50 bg-background/80 shadow-sm focus-visible:ring-primary/50 px-5 text-sm"
                />
                <Button 
                  type="submit" 
                  size="icon" 
                  disabled={isLoading || (!input.trim() && !transcript) || !isAuthenticated}
                  className="shrink-0 h-12 w-12 rounded-full shadow-md bg-primary hover:bg-primary/90"
                >
                  <Send className="h-5 w-5" />
                </Button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
