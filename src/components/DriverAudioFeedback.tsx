import React, { useState, useEffect } from 'react';
import { driverTTS, DriverTTSConfig, playDispatchChime } from '@/lib/driverAudioTTS';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  Volume2,
  VolumeX,
  Radio,
  Settings2,
  Play,
  Square,
  Sparkles,
  CheckCircle2,
  BellRing,
  Headphones,
  Sliders,
  Volume1,
} from 'lucide-react';
import { toast } from 'sonner';

interface DriverAudioFeedbackProps {
  compact?: boolean;
}

export const DriverAudioFeedback: React.FC<DriverAudioFeedbackProps> = ({ compact = false }) => {
  const [ttsState, setTtsState] = useState(driverTTS.getStatus());
  const [configOpen, setConfigOpen] = useState(false);
  const [testText, setTestText] = useState('New trip assigned. Pickup at Green Park Avenue, 2.5 kilometers away.');

  useEffect(() => {
    const unsubscribe = driverTTS.subscribe(() => {
      setTtsState(driverTTS.getStatus());
    });
    return unsubscribe;
  }, []);

  const handleToggleMute = () => {
    driverTTS.unlockAudio();
    const newEnabled = !ttsState.config.enabled;
    driverTTS.saveConfig({ enabled: newEnabled });
    if (newEnabled) {
      driverTTS.speak('Voice assistance enabled. You will hear real-time dispatch updates.', {
        priority: 'high',
        toneType: 'confirm',
        force: true,
      });
      toast.success('Driver voice feedback unmuted');
    } else {
      driverTTS.stop();
      toast.info('Driver voice feedback muted');
    }
  };

  const handleTestSpeech = (phrase: string, tone: 'alert' | 'confirm' | 'complete' = 'alert') => {
    driverTTS.unlockAudio();
    driverTTS.speak(phrase, {
      priority: 'high',
      toneType: tone,
      force: true,
    });
  };

  const samplePhrases = [
    {
      label: 'New Trip Assigned',
      text: 'New emergency dispatch assigned. Pickup at Sector 14 Metro Station. Estimated arrival: 6 minutes.',
      tone: 'alert' as const,
    },
    {
      label: 'Trip Accepted',
      text: 'Trip accepted. Starting navigation to pickup location.',
      tone: 'confirm' as const,
    },
    {
      label: 'Arrival Confirmed',
      text: 'Arrival confirmed. You have reached the patient pickup point.',
      tone: 'confirm' as const,
    },
    {
      label: 'En Route Hospital',
      text: 'Patient safely boarded. En route to City General Emergency Wing.',
      tone: 'confirm' as const,
    },
    {
      label: 'Trip Completed',
      text: 'Arrival at hospital confirmed. Trip completed. Ambulance marked available for dispatch.',
      tone: 'complete' as const,
    },
  ];

  return (
    <>
      {/* Live Speaking / Audio Status Pill */}
      <div className="flex items-center gap-2">
        {ttsState.isSpeaking && (
          <div className="flex items-center gap-2 bg-primary/20 border border-primary/40 px-3 py-1.5 rounded-full text-xs animate-pulse text-white shadow-sm">
            <Radio className="w-3.5 h-3.5 text-primary animate-spin" />
            <span className="font-semibold text-primary-foreground truncate max-w-[200px] sm:max-w-[320px]">
              {ttsState.currentText}
            </span>
            <button
              onClick={() => driverTTS.stop()}
              className="text-white/60 hover:text-white ml-1 p-0.5"
              title="Stop speech"
            >
              <Square className="w-3 h-3 fill-current" />
            </button>
          </div>
        )}

        {/* Quick Voice Toggle Button */}
        <Button
          variant={ttsState.config.enabled ? 'default' : 'outline'}
          size="sm"
          onClick={handleToggleMute}
          className={`h-8 px-2.5 text-xs font-semibold flex items-center gap-1.5 transition-all ${
            ttsState.config.enabled
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow'
              : 'border-white/20 text-white/70 hover:bg-white/10'
          }`}
          title={ttsState.config.enabled ? 'Voice Guidance Active (Click to mute)' : 'Voice Guidance Muted (Click to enable)'}
        >
          {ttsState.config.enabled ? (
            <>
              <Volume2 className="w-4 h-4 text-emerald-200 animate-pulse" />
              <span>Voice ON</span>
            </>
          ) : (
            <>
              <VolumeX className="w-4 h-4 text-red-400" />
              <span>Voice Muted</span>
            </>
          )}
        </Button>

        {/* Voice Settings Trigger */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            driverTTS.unlockAudio();
            setConfigOpen(true);
          }}
          className="h-8 w-8 p-0 text-white/70 hover:text-white hover:bg-white/10"
          title="Voice Announcement Settings"
        >
          <Settings2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Voice Settings & Audio Test Modal */}
      <Dialog open={configOpen} onOpenChange={setConfigOpen}>
        <DialogContent className="max-w-md bg-slate-900 text-white border-white/20 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Headphones className="w-5 h-5 text-emerald-400" /> Driver Voice & Spoken Status Settings
            </DialogTitle>
            <DialogDescription className="text-xs text-white/70">
              Hands-free Text-to-Speech audio cues announce new assignments, arrivals, and patient status updates automatically so drivers keep their eyes on the road.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2 text-xs">
            {/* Master Toggle */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
              <div className="space-y-0.5">
                <span className="font-semibold text-sm block">Spoken Audio Updates</span>
                <span className="text-white/60 text-[11px] block">
                  Automatically read aloud all dispatch and trip status updates
                </span>
              </div>
              <Switch
                checked={ttsState.config.enabled}
                onCheckedChange={(val) => {
                  driverTTS.saveConfig({ enabled: val });
                  if (val) {
                    driverTTS.speak('Voice updates active.', { toneType: 'confirm', force: true });
                  }
                }}
              />
            </div>

            {/* Chime Toggle */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
              <div className="space-y-0.5">
                <span className="font-semibold block">Dispatcher Radio Chime</span>
                <span className="text-white/60 text-[11px] block">
                  Play short 2-tone audio chime before reading notifications
                </span>
              </div>
              <Switch
                checked={ttsState.config.chimeEnabled}
                onCheckedChange={(val) => {
                  driverTTS.saveConfig({ chimeEnabled: val });
                  if (val) playDispatchChime('alert');
                }}
              />
            </div>

            {/* Volume & Speech Rate */}
            <div className="space-y-3 p-3 rounded-lg bg-white/5 border border-white/10">
              <div className="space-y-1.5">
                <div className="flex justify-between font-semibold">
                  <span className="flex items-center gap-1">
                    <Volume1 className="w-3.5 h-3.5 text-white/70" /> Voice Volume
                  </span>
                  <span className="font-mono text-emerald-400">{Math.round(ttsState.config.volume * 100)}%</span>
                </div>
                <Slider
                  min={0.1}
                  max={1.0}
                  step={0.05}
                  value={[ttsState.config.volume]}
                  onValueChange={([val]) => driverTTS.saveConfig({ volume: val })}
                  className="py-1"
                />
              </div>

              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between font-semibold">
                  <span className="flex items-center gap-1">
                    <Sliders className="w-3.5 h-3.5 text-white/70" /> Speech Speed
                  </span>
                  <span className="font-mono text-emerald-400">{ttsState.config.rate}x</span>
                </div>
                <Slider
                  min={0.7}
                  max={1.5}
                  step={0.05}
                  value={[ttsState.config.rate]}
                  onValueChange={([val]) => driverTTS.saveConfig({ rate: val })}
                  className="py-1"
                />
              </div>

              {/* Voice Selector */}
              {ttsState.voices.length > 0 && (
                <div className="space-y-1 pt-2">
                  <label className="font-semibold block text-[11px] text-white/70">Selected Voice</label>
                  <select
                    value={ttsState.config.voiceURI || ''}
                    onChange={(e) => driverTTS.saveConfig({ voiceURI: e.target.value || null })}
                    className="w-full h-8 rounded border border-white/20 bg-slate-800 text-white px-2 text-xs"
                  >
                    <option value="">Default System Voice</option>
                    {ttsState.voices.map((v) => (
                      <option key={v.voiceURI} value={v.voiceURI}>
                        {v.name} ({v.lang})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Quick Test Station */}
            <div className="space-y-2">
              <span className="font-bold text-white/90 uppercase tracking-wider text-[10px] block">
                Quick Test Spoken Dispatch Scenarios
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {samplePhrases.map((phrase) => (
                  <Button
                    key={phrase.label}
                    size="sm"
                    variant="outline"
                    onClick={() => handleTestSpeech(phrase.text, phrase.tone)}
                    className="h-8 text-xs justify-start border-white/20 text-white/90 hover:bg-white/10 hover:text-white px-2.5 truncate"
                  >
                    <Play className="w-3 h-3 text-emerald-400 mr-1.5 flex-shrink-0" />
                    <span className="truncate">{phrase.label}</span>
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                variant="default"
                size="sm"
                onClick={() => setConfigOpen(false)}
                className="bg-emerald-600 hover:bg-emerald-700 font-semibold text-xs"
              >
                Done
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
