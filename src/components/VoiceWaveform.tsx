import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface VoiceWaveformProps {
  isActive: boolean;
  className?: string;
  barCount?: number;
}

export const VoiceWaveform = ({ isActive, className, barCount = 5 }: VoiceWaveformProps) => {
  const [audioLevels, setAudioLevels] = useState<number[]>(Array(barCount).fill(0.2));
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!isActive) {
      // Reset to idle state
      setAudioLevels(Array(barCount).fill(0.2));
      
      // Cleanup
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      return;
    }

    const startAudioAnalysis = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        
        const audioContext = new AudioContext();
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        
        analyser.fftSize = 32;
        analyser.smoothingTimeConstant = 0.5;
        source.connect(analyser);
        analyserRef.current = analyser;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const updateLevels = () => {
          if (!analyserRef.current || !isActive) return;
          
          analyserRef.current.getByteFrequencyData(dataArray);
          
          // Calculate average levels for each bar
          const levels: number[] = [];
          const step = Math.floor(dataArray.length / barCount);
          
          for (let i = 0; i < barCount; i++) {
            const startIdx = i * step;
            const endIdx = Math.min(startIdx + step, dataArray.length);
            let sum = 0;
            
            for (let j = startIdx; j < endIdx; j++) {
              sum += dataArray[j];
            }
            
            const avg = sum / (endIdx - startIdx);
            // Normalize to 0.2-1 range for visual appeal
            const normalized = 0.2 + (avg / 255) * 0.8;
            levels.push(normalized);
          }
          
          setAudioLevels(levels);
          animationRef.current = requestAnimationFrame(updateLevels);
        };

        updateLevels();
      } catch (error) {
        console.error('Failed to access microphone for visualization:', error);
        // Fallback to animated simulation
        simulateWaveform();
      }
    };

    const simulateWaveform = () => {
      const animate = () => {
        if (!isActive) return;
        
        const levels = Array(barCount).fill(0).map(() => 
          0.3 + Math.random() * 0.7
        );
        setAudioLevels(levels);
        animationRef.current = requestAnimationFrame(() => {
          setTimeout(animate, 100);
        });
      };
      animate();
    };

    startAudioAnalysis();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [isActive, barCount]);

  return (
    <div className={cn("flex items-center justify-center gap-1 h-8", className)}>
      {audioLevels.map((level, index) => (
        <div
          key={index}
          className={cn(
            "w-1 rounded-full transition-all duration-75",
            isActive ? "bg-destructive" : "bg-muted-foreground/30"
          )}
          style={{
            height: `${level * 100}%`,
            minHeight: '4px',
            maxHeight: '100%',
            animationDelay: `${index * 50}ms`,
          }}
        />
      ))}
    </div>
  );
};
