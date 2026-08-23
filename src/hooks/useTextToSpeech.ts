import { useState, useCallback, useRef, useEffect } from 'react';
import i18n from '@/i18n';

// Language code mapping for Indian accents
const languageVoiceMap: Record<string, { lang: string; fallback: string }> = {
  en: { lang: 'en-IN', fallback: 'en-US' },
  hi: { lang: 'hi-IN', fallback: 'hi-IN' },
  pa: { lang: 'pa-IN', fallback: 'hi-IN' },
  mr: { lang: 'mr-IN', fallback: 'hi-IN' },
  bn: { lang: 'bn-IN', fallback: 'hi-IN' },
  ta: { lang: 'ta-IN', fallback: 'hi-IN' },
};

export const useTextToSpeech = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  useEffect(() => {
    if (!isSupported) return;

    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      setAvailableVoices(voices);
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [isSupported]);

  const getVoiceForLanguage = useCallback((langCode: string): SpeechSynthesisVoice | null => {
    const mapping = languageVoiceMap[langCode] || languageVoiceMap.en;
    
    // Helper to check if voice is female (checking name for common female indicators)
    const isFemaleVoice = (voice: SpeechSynthesisVoice): boolean => {
      const name = voice.name.toLowerCase();
      return name.includes('female') || 
             name.includes('woman') || 
             name.includes('girl') ||
             name.includes('zira') ||  // Microsoft female voice
             name.includes('samantha') || // Apple female voice
             name.includes('victoria') ||
             name.includes('karen') ||
             name.includes('moira') ||
             name.includes('tessa') ||
             name.includes('veena') || // Google Indian female
             name.includes('lekha') || // Indian female
             name.includes('aditi') || // AWS Indian female
             name.includes('raveena'); // AWS Indian female
    };

    // Try to find Indian female voice first
    let voice = availableVoices.find(v => v.lang === mapping.lang && isFemaleVoice(v));
    
    // Try any Indian voice if no female found
    if (!voice) {
      voice = availableVoices.find(v => v.lang === mapping.lang);
    }
    
    // Fallback to any female voice with the language prefix
    if (!voice) {
      voice = availableVoices.find(v => v.lang.startsWith(langCode) && isFemaleVoice(v));
    }
    
    // Fallback to any voice with the language prefix
    if (!voice) {
      voice = availableVoices.find(v => v.lang.startsWith(langCode));
    }
    
    // Fallback to female voice in mapped fallback language
    if (!voice) {
      voice = availableVoices.find(v => v.lang === mapping.fallback && isFemaleVoice(v));
    }
    
    // Fallback to mapped fallback
    if (!voice) {
      voice = availableVoices.find(v => v.lang === mapping.fallback);
    }
    
    // Final fallback to any female voice
    if (!voice) {
      voice = availableVoices.find(v => isFemaleVoice(v));
    }
    
    // Final fallback to any available voice
    if (!voice && availableVoices.length > 0) {
      voice = availableVoices[0];
    }
    
    return voice || null;
  }, [availableVoices]);

  const speak = useCallback((text: string) => {
    if (!isSupported || !text.trim()) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;

    // Get current language from i18n
    const currentLang = i18n.language || 'en';
    const voice = getVoiceForLanguage(currentLang);

    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    } else {
      // Set language even without voice
      const mapping = languageVoiceMap[currentLang] || languageVoiceMap.en;
      utterance.lang = mapping.lang;
    }

    // Configure speech parameters for clarity
    utterance.rate = 0.9; // Slightly slower for better understanding
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, [isSupported, getVoiceForLanguage]);

  const stop = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, [isSupported]);

  const toggle = useCallback(() => {
    setIsEnabled(prev => !prev);
    if (isSpeaking) {
      stop();
    }
  }, [isSpeaking, stop]);

  return {
    speak,
    stop,
    toggle,
    isSpeaking,
    isEnabled,
    setIsEnabled,
    isSupported,
    currentLanguage: i18n.language || 'en',
  };
};
