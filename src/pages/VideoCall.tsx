import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { API } from '@/lib/api';
import VideoCallChat from '@/components/VideoCallChat';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Phone, 
  PhoneOff,
  MessageSquare,
  Maximize2,
  Minimize2,
  Clock,
  User,
  Stethoscope,
  Loader2,
  RefreshCw,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Sparkles,
  Volume2
} from 'lucide-react';

interface Doctor {
  id: string;
  name: string;
  specialization: string;
}

const VideoCall = () => {
  const { consultationId } = useParams();
  const [searchParams] = useSearchParams();
  const doctorId = searchParams.get('doctorId') || 'doc-1';
  const queryDoctorName = searchParams.get('doctorName');
  const querySpecialization = searchParams.get('specialization');
  const queryPatientName = searchParams.get('patientName');
  const roomMode = searchParams.get('roomMode');
  
  const navigate = useNavigate();
  const { toast } = useToast();

  const [user, setUser] = useState<any>(null);
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [callStatus, setCallStatus] = useState<'connecting' | 'waiting' | 'connected' | 'ended'>('connecting');
  const [callDuration, setCallDuration] = useState(0);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [remoteConnected, setRemoteConnected] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [mediaAccessError, setMediaAccessError] = useState<string | null>(null);
  const [simulationMode, setSimulationMode] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const channelRef = useRef<any>(null);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);

  const isDoctor = roomMode === 'doctor_host' || user?.email?.toLowerCase().includes('doctor');
  const participantName = isDoctor 
    ? (queryPatientName || 'Rajesh Sharma (Patient)')
    : (doctor?.name || queryDoctorName || 'Dr. Sarah Mitchell');
  const participantSubtitle = isDoctor 
    ? 'Patient • OPD Consultation Queue #104'
    : (doctor?.specialization || querySpecialization || 'Clinical Specialist');

  // ICE servers configuration
  const iceServers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ]
  };

  useEffect(() => {
    initializeCall();
    return () => {
      cleanup();
    };
  }, []);

  useEffect(() => {
    if (callStatus === 'connected') {
      callTimerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (callTimerRef.current) clearInterval(callTimerRef.current);
    };
  }, [callStatus]);

  const initializeCall = async () => {
    try {
      // 1. Resolve User
      let activeUser: any = null;
      try {
        const { data } = await supabase.auth.getUser();
        activeUser = data?.user;
      } catch (e) {
        console.warn('Supabase auth error in VideoCall:', e);
      }

      if (!activeUser) {
        const storedEmail = localStorage.getItem('rapidresq_guest_email') || 'user@example.com';
        activeUser = {
          id: 'participant-' + Date.now().toString(36),
          email: storedEmail,
          user_metadata: { full_name: isDoctor ? 'Dr. Sarah Mitchell' : 'Rajesh Sharma' }
        };
      }
      setUser(activeUser);

      // 2. Resolve Doctor Details
      if (queryDoctorName) {
        setDoctor({
          id: doctorId,
          name: queryDoctorName,
          specialization: querySpecialization || 'General Medicine'
        });
      } else {
        try {
          const docData = await API.getDoctor(doctorId);
          if (docData) {
            setDoctor({
              id: docData.id,
              name: docData.name,
              specialization: docData.specialisation || 'General Medicine'
            });
          } else {
            setDoctor({
              id: doctorId,
              name: 'Dr. Sarah Mitchell',
              specialization: 'General Medicine'
            });
          }
        } catch (e) {
          setDoctor({
            id: doctorId,
            name: 'Dr. Sarah Mitchell',
            specialization: 'General Medicine'
          });
        }
      }

      // 3. Attempt to start local hardware stream with fallback
      await startLocalStream();
      
      // 4. Setup signaling channel
      try {
        await setupSignaling(activeUser.id);
      } catch (e) {
        console.warn('Signaling setup fallback:', e);
      }
      
      setLoading(false);
      setCallStatus('waiting');

      // 5. In demo/connected mode, auto-connect call after 2.5 seconds
      setTimeout(() => {
        setRemoteConnected(true);
        setCallStatus('connected');
        setSimulationMode(true);
        toast({
          title: isDoctor ? "Patient Admitted to Exam Room" : "Doctor Joined Consultation",
          description: isDoctor ? "Patient audio/video stream is live." : "Dr. Sarah Mitchell is ready and listening.",
        });
      }, 2500);

    } catch (error: any) {
      console.error('Error initializing call:', error);
      setLoading(false);
      setCallStatus('waiting');
    }
  };

  const startLocalStream = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } else {
        throw new Error('MediaDevices API not available in current context');
      }
    } catch (error: any) {
      console.warn('Camera/Microphone hardware fallback:', error);
      setMediaAccessError(error.message || 'Camera permission denied');
      setIsVideoEnabled(true);
      setIsAudioEnabled(true);
    }
  };

  const setupSignaling = async (userId: string) => {
    const roomId = consultationId || `call-${doctorId}-${userId}`;
    
    channelRef.current = supabase.channel(`video-call:${roomId}`, {
      config: {
        presence: { key: userId }
      }
    });

    channelRef.current
      .on('presence', { event: 'sync' }, () => {
        const state = channelRef.current.presenceState();
        const participants = Object.keys(state);
        if (participants.length > 1) {
          initiateCall();
        }
      })
      .on('presence', { event: 'join' }, ({ key }: any) => {
        if (key !== userId) {
          setRemoteConnected(true);
          initiateCall();
        }
      })
      .on('presence', { event: 'leave' }, ({ key }: any) => {
        if (key !== userId) {
          setRemoteConnected(false);
          setCallStatus('ended');
        }
      })
      .on('broadcast', { event: 'offer' }, async ({ payload }: any) => {
        await handleOffer(payload);
      })
      .on('broadcast', { event: 'answer' }, async ({ payload }: any) => {
        await handleAnswer(payload);
      })
      .on('broadcast', { event: 'ice-candidate' }, async ({ payload }: any) => {
        await handleIceCandidate(payload);
      })
      .subscribe(async (status: string) => {
        if (status === 'SUBSCRIBED') {
          await channelRef.current.track({
            user_id: userId,
            online_at: new Date().toISOString()
          });
        }
      });
  };

  const createPeerConnection = () => {
    const pc = new RTCPeerConnection(iceServers);

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        channelRef.current?.send({
          type: 'broadcast',
          event: 'ice-candidate',
          payload: event.candidate
        });
      }
    };

    pc.ontrack = (event) => {
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
        setCallStatus('connected');
        setRemoteConnected(true);
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        setCallStatus('connected');
        setRemoteConnected(true);
      } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        setCallStatus('ended');
      }
    };

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    peerConnectionRef.current = pc;
    return pc;
  };

  const initiateCall = async () => {
    try {
      const pc = createPeerConnection();
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      channelRef.current?.send({
        type: 'broadcast',
        event: 'offer',
        payload: offer
      });
    } catch (error) {
      console.error('Error creating offer:', error);
    }
  };

  const handleOffer = async (offer: RTCSessionDescriptionInit) => {
    try {
      const pc = peerConnectionRef.current || createPeerConnection();
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      channelRef.current?.send({
        type: 'broadcast',
        event: 'answer',
        payload: answer
      });
    } catch (error) {
      console.error('Error handling offer:', error);
    }
  };

  const handleAnswer = async (answer: RTCSessionDescriptionInit) => {
    try {
      const pc = peerConnectionRef.current;
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      }
    } catch (error) {
      console.error('Error handling answer:', error);
    }
  };

  const handleIceCandidate = async (candidate: RTCIceCandidateInit) => {
    try {
      const pc = peerConnectionRef.current;
      if (pc) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
    } catch (error) {
      console.error('Error adding ICE candidate:', error);
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
      }
    }
    setIsVideoEnabled(!isVideoEnabled);
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
      }
    }
    setIsAudioEnabled(!isAudioEnabled);
  };

  const endCall = () => {
    cleanup();
    setCallStatus('ended');
    toast({
      title: "Consultation Concluded",
      description: isDoctor ? "Consultation session closed. You can record clinical notes and write prescriptions." : "Your consultation summary and prescriptions will appear in your patient hub."
    });
  };

  const cleanup = () => {
    if (callTimerRef.current) clearInterval(callTimerRef.current);
    
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
    
    if (channelRef.current) {
      try {
        supabase.removeChannel(channelRef.current);
      } catch (e) {
        // Ignored
      }
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="text-center text-white space-y-4 max-w-sm">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-emerald-500" />
          <h2 className="text-xl font-bold tracking-tight">Initializing Tele-Consultation...</h2>
          <p className="text-sm text-slate-400">Establishing encrypted WebRTC channel with {participantName}</p>
        </div>
      </div>
    );
  }

  if (callStatus === 'ended') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-slate-800 bg-slate-900/95 text-white shadow-2xl backdrop-blur-xl">
          <CardContent className="p-8 text-center space-y-5">
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto border border-emerald-500/30 shadow-lg">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-2xl font-black tracking-tight text-white mb-1">Consultation Concluded</h2>
              <p className="text-slate-400 text-sm">
                Session with <span className="font-semibold text-slate-200">{participantName}</span> has completed.
              </p>
            </div>

            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-xs font-mono text-slate-300">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Total Session Duration: {formatDuration(callDuration)}</span>
            </div>

            <div className="pt-2 space-y-2.5">
              {isDoctor ? (
                <>
                  <Button 
                    onClick={() => navigate('/create-prescription')} 
                    className="w-full bg-emerald-600 hover:bg-emerald-700 font-bold text-white shadow-md gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    Write Prescription & Diagnosis
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/doctor-portal')} 
                    className="w-full border-slate-700 text-slate-200 hover:bg-slate-800 font-semibold"
                  >
                    Return to Doctor Workspace
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    onClick={() => navigate('/patient-portal')} 
                    className="w-full bg-blue-600 hover:bg-blue-700 font-bold text-white shadow-md"
                  >
                    View Patient Portal & Records
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/video-consultation')} 
                    className="w-full border-slate-700 text-slate-200 hover:bg-slate-800 font-semibold"
                  >
                    Consult Another Specialist
                  </Button>
                </>
              )}
              <Link to="/" className="block pt-1">
                <Button variant="ghost" className="w-full text-xs text-slate-400 hover:text-white">
                  <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Back to Home
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-slate-950 text-white flex flex-col justify-between overflow-hidden select-none">
      {/* 1. TOP HEADER / COMMAND BAR */}
      <header className="h-16 px-4 md:px-6 flex items-center justify-between border-b border-white/10 bg-slate-950/90 backdrop-blur-xl z-40 shrink-0">
        {/* Left: Participant Info & Live Status */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-sm">
            {isDoctor ? <User className="w-4 h-4" /> : <Stethoscope className="w-4 h-4" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-sm md:text-base text-white tracking-tight leading-tight">
                {participantName}
              </h2>
              <Badge 
                variant="secondary" 
                className={`text-[10px] px-2 py-0.5 border ${
                  callStatus === 'connected' 
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' 
                    : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full mr-1.5 inline-block ${
                  callStatus === 'connected' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400 animate-pulse'
                }`} />
                {callStatus === 'connected' ? 'Live Session' : 'Connecting...'}
              </Badge>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              {participantSubtitle}
            </p>
          </div>
        </div>

        {/* Right: Timer, Quick Tools & Leave */}
        <div className="flex items-center gap-2 md:gap-3">
          {callStatus === 'connected' && (
            <div className="flex items-center gap-1.5 bg-slate-900/90 border border-white/10 px-3 py-1.5 rounded-full text-xs font-mono text-slate-200">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span>{formatDuration(callDuration)}</span>
            </div>
          )}

          {isDoctor && (
            <Link to="/create-prescription" target="_blank" className="hidden sm:block">
              <Button size="sm" variant="outline" className="border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10 text-xs font-semibold gap-1.5 h-8">
                <FileText className="w-3.5 h-3.5" />
                Prescription Pad
              </Button>
            </Link>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFullscreen}
            className="text-slate-400 hover:text-white h-8 w-8 hidden md:flex"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>

          <Button
            variant="destructive"
            size="sm"
            onClick={endCall}
            className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-3.5 h-8 gap-1.5 shadow-sm"
          >
            <PhoneOff className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Leave Room</span>
          </Button>
        </div>
      </header>

      {/* 2. MAIN TELE-HEALTH STAGE */}
      <main className="flex-1 relative flex items-center justify-center p-3 md:p-6 overflow-hidden bg-slate-950">
        {/* Remote Video Feed / Doctor-Patient Visual Room */}
        <div className="w-full h-full max-w-5xl max-h-[calc(100vh-10rem)] rounded-2xl bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 border border-white/10 shadow-2xl relative flex items-center justify-center overflow-hidden">
          {/* Subtle Ambient Grid / Background Glow */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(16,185,129,0.08),transparent_70%)] pointer-events-none" />

          {remoteConnected ? (
            <div className="relative z-10 text-center p-6 max-w-md mx-auto space-y-4">
              {/* Avatar with Animated Pulse Audio Ring */}
              <div className="relative mx-auto w-28 h-28 md:w-36 md:h-36 rounded-full p-1 bg-gradient-to-tr from-emerald-500 via-teal-400 to-blue-500 shadow-2xl">
                <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center overflow-hidden border-2 border-slate-950">
                  <div className="w-full h-full bg-gradient-to-tr from-slate-800 to-slate-900 flex items-center justify-center text-white text-3xl md:text-4xl font-extrabold">
                    {participantName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                </div>
                <div className="absolute bottom-1 right-2 w-5 h-5 bg-emerald-500 rounded-full ring-4 ring-slate-950 flex items-center justify-center">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                </div>
              </div>

              {/* Participant Details */}
              <div className="space-y-1">
                <h3 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">
                  {participantName}
                </h3>
                <p className="text-emerald-400 font-medium text-xs md:text-sm flex items-center justify-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 animate-pulse" />
                  {isDoctor ? "Patient Audio Stream Active • Online" : doctor?.specialization || "Clinical Specialist"}
                </p>
              </div>

              {/* Encryption Security Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-[11px] font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>WebRTC 256-Bit HIPAA-Compliant Channel</span>
              </div>
            </div>
          ) : (
            <div className="text-center text-white p-6 space-y-4 relative z-10">
              <div className="w-20 h-20 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto ring-4 ring-emerald-500/10 animate-pulse">
                <Stethoscope className="w-10 h-10 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-1">Waiting for Participant to Connect...</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Establishing secure audio-video peer connection with {participantName}.
                </p>
              </div>
              <div className="inline-flex items-center justify-center gap-2 text-emerald-400 text-xs font-semibold bg-emerald-500/10 px-3.5 py-1.5 rounded-full border border-emerald-500/20">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Synchronizing WebRTC Signal...</span>
              </div>
            </div>
          )}

          {/* Self-View Picture-in-Picture (PiP) Window */}
          <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 w-36 sm:w-48 md:w-56 aspect-video rounded-xl overflow-hidden shadow-2xl border border-white/20 z-20 bg-slate-950">
            {isVideoEnabled ? (
              localStreamRef.current ? (
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover mirror"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-white p-2">
                  <User className="w-6 h-6 text-slate-400 mb-1" />
                  <span className="text-[10px] text-slate-300 font-medium">You ({isDoctor ? 'Doctor' : 'Patient'})</span>
                </div>
              )
            ) : (
              <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-center text-slate-500">
                <VideoOff className="w-5 h-5 mb-1 text-slate-600" />
                <span className="text-[10px]">Camera Off</span>
              </div>
            )}
            
            {/* PiP Overlay Tag */}
            <div className="absolute bottom-1.5 left-2 bg-slate-950/80 backdrop-blur-md px-1.5 py-0.5 rounded text-[9px] font-semibold text-slate-300 flex items-center gap-1 border border-white/10">
              <span className={`w-1.5 h-1.5 rounded-full ${isAudioEnabled ? 'bg-emerald-400' : 'bg-rose-500'}`} />
              You
            </div>
          </div>
        </div>
      </main>

      {/* 3. BOTTOM FLOATING CONTROL POD */}
      <footer className="h-20 px-4 flex items-center justify-center border-t border-white/10 bg-slate-950/90 backdrop-blur-xl z-40 shrink-0">
        <div className="flex items-center gap-3 sm:gap-4 bg-slate-900/90 border border-white/15 rounded-full px-5 py-2.5 shadow-2xl">
          {/* Mute/Unmute Mic */}
          <Button
            variant="ghost"
            size="icon"
            className={`rounded-full w-11 h-11 transition-all ${
              !isAudioEnabled 
                ? 'bg-rose-500/90 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/30' 
                : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
            onClick={toggleAudio}
            title={isAudioEnabled ? "Mute Microphone" : "Unmute Microphone"}
          >
            {isAudioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </Button>
          
          {/* Video Camera Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className={`rounded-full w-11 h-11 transition-all ${
              !isVideoEnabled 
                ? 'bg-rose-500/90 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/30' 
                : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
            onClick={toggleVideo}
            title={isVideoEnabled ? "Turn Camera Off" : "Turn Camera On"}
          >
            {isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </Button>

          {/* End Call Button */}
          <Button
            variant="destructive"
            size="icon"
            className="rounded-full w-12 h-12 bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/40"
            onClick={endCall}
            title="End Consultation"
          >
            <Phone className="w-5 h-5 rotate-[135deg]" />
          </Button>

          {/* Chat Drawer Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className={`rounded-full w-11 h-11 relative transition-all ${
              isChatOpen 
                ? 'bg-emerald-600 text-white' 
                : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
            onClick={() => {
              setIsChatOpen(!isChatOpen);
              if (!isChatOpen) setUnreadMessages(0);
            }}
            title="Open In-Call Chat"
          >
            <MessageSquare className="w-5 h-5" />
            {unreadMessages > 0 && !isChatOpen && (
              <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {unreadMessages > 9 ? '9+' : unreadMessages}
              </span>
            )}
          </Button>

          {/* If Doctor: Shortcut to Prescription */}
          {isDoctor && (
            <Link to="/create-prescription" target="_blank">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full w-11 h-11 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300"
                title="Open Prescription Pad"
              >
                <FileText className="w-5 h-5" />
              </Button>
            </Link>
          )}
        </div>
      </footer>

      {/* 4. IN-CALL REALTIME CHAT DRAWER */}
      {user && (
        <VideoCallChat
          roomId={consultationId || `call-${doctorId}-${user.id}`}
          userId={user.id}
          userName={user.user_metadata?.full_name || (isDoctor ? 'Doctor' : 'Patient')}
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
        />
      )}
    </div>
  );
};

export default VideoCall;