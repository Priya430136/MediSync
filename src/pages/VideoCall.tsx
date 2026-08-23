import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
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
  Home
} from 'lucide-react';

interface Doctor {
  id: string;
  name: string;
  specialization: string;
}

const VideoCall = () => {
  const { consultationId } = useParams();
  const [searchParams] = useSearchParams();
  const doctorId = searchParams.get('doctorId');
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

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const channelRef = useRef<any>(null);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);

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
      // Check user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }
      setUser(user);

      // Fetch doctor details
      if (doctorId) {
        const { data: doctorData } = await supabase
          .from('doctors')
          .select('id, name, specialization')
          .eq('id', doctorId)
          .maybeSingle();
        
        if (doctorData) setDoctor(doctorData);
      }

      // Get local media stream
      await startLocalStream();
      
      // Setup signaling channel
      await setupSignaling(user.id);
      
      setLoading(false);
      setCallStatus('waiting');

    } catch (error: any) {
      console.error('Error initializing call:', error);
      toast({
        title: "Camera/Microphone Error",
        description: "Please allow camera and microphone access to start the call",
        variant: "destructive"
      });
      setLoading(false);
    }
  };

  const startLocalStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing media devices:', error);
      throw error;
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
        console.log('Presence sync:', participants);
        
        if (participants.length > 1) {
          // Another participant joined, initiate connection
          initiateCall();
        }
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }: any) => {
        console.log('User joined:', key);
        if (key !== userId) {
          setRemoteConnected(true);
          initiateCall();
        }
      })
      .on('presence', { event: 'leave' }, ({ key }: any) => {
        console.log('User left:', key);
        if (key !== userId) {
          setRemoteConnected(false);
          setCallStatus('ended');
        }
      })
      .on('broadcast', { event: 'offer' }, async ({ payload }: any) => {
        console.log('Received offer');
        await handleOffer(payload);
      })
      .on('broadcast', { event: 'answer' }, async ({ payload }: any) => {
        console.log('Received answer');
        await handleAnswer(payload);
      })
      .on('broadcast', { event: 'ice-candidate' }, async ({ payload }: any) => {
        console.log('Received ICE candidate');
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
      console.log('Received remote track');
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
        setCallStatus('connected');
      }
    };

    pc.onconnectionstatechange = () => {
      console.log('Connection state:', pc.connectionState);
      if (pc.connectionState === 'connected') {
        setCallStatus('connected');
      } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        setCallStatus('ended');
      }
    };

    // Add local tracks
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
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  };

  const endCall = () => {
    cleanup();
    setCallStatus('ended');
    toast({
      title: "Call Ended",
      description: "Your video consultation has ended"
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
      supabase.removeChannel(channelRef.current);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" />
          <p className="text-lg">Setting up your video call...</p>
          <p className="text-sm text-gray-400 mt-2">Please allow camera and microphone access</p>
        </div>
      </div>
    );
  }

  if (callStatus === 'ended') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <PhoneOff className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Call Ended</h2>
            <p className="text-muted-foreground mb-2">
              Your video consultation with {doctor?.name || 'the doctor'} has ended.
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Duration: {formatDuration(callDuration)}
            </p>
            <div className="space-y-3">
              <Button onClick={() => navigate('/prescriptions')} className="w-full">
                View Prescriptions
              </Button>
              <Button variant="outline" onClick={() => navigate('/video-consultation')} className="w-full">
                Book Another Consultation
              </Button>
              <Link to="/" className="block">
                <Button variant="ghost" className="w-full text-xs">
                  <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Return to Home Page
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Remote Video (Full screen) */}
      <div className="absolute inset-0">
        {remoteConnected ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
            <div className="text-center text-white">
              <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                <Stethoscope className="w-12 h-12 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-2">{doctor?.name || 'Doctor'}</h2>
              <p className="text-gray-400 mb-4">{doctor?.specialization}</p>
              <div className="flex items-center justify-center gap-2 text-gray-400">
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Waiting for doctor to join...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Local Video (Picture-in-picture) */}
      <div className="absolute top-4 right-4 w-32 md:w-48 aspect-video rounded-xl overflow-hidden shadow-2xl border-2 border-white/20">
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        {!isVideoEnabled && (
          <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
            <VideoOff className="w-8 h-8 text-gray-500" />
          </div>
        )}
      </div>

      {/* Top Bar */}
      <div className="absolute top-4 left-4 flex items-center gap-3">
        <Badge 
          variant="secondary" 
          className={`${callStatus === 'connected' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'} backdrop-blur-sm`}
        >
          <div className={`w-2 h-2 rounded-full mr-2 ${callStatus === 'connected' ? 'bg-green-500 animate-pulse' : 'bg-yellow-500 animate-pulse'}`} />
          {callStatus === 'connected' ? 'Connected' : callStatus === 'waiting' ? 'Waiting' : 'Connecting'}
        </Badge>
        {callStatus === 'connected' && (
          <Badge variant="secondary" className="bg-white/10 text-white backdrop-blur-sm">
            <Clock className="w-3 h-3 mr-1" />
            {formatDuration(callDuration)}
          </Badge>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-6">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-center gap-4 bg-white/10 backdrop-blur-xl rounded-2xl p-4">
            <Button
              variant="ghost"
              size="lg"
              className={`rounded-full w-14 h-14 ${!isAudioEnabled ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-white/20 hover:bg-white/30 text-white'}`}
              onClick={toggleAudio}
            >
              {isAudioEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
            </Button>
            
            <Button
              variant="ghost"
              size="lg"
              className={`rounded-full w-14 h-14 ${!isVideoEnabled ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-white/20 hover:bg-white/30 text-white'}`}
              onClick={toggleVideo}
            >
              {isVideoEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
            </Button>

            <Button
              variant="destructive"
              size="lg"
              className="rounded-full w-16 h-16 bg-red-500 hover:bg-red-600"
              onClick={endCall}
            >
              <Phone className="w-7 h-7 rotate-[135deg]" />
            </Button>

            <Button
              variant="ghost"
              size="lg"
              className={`rounded-full w-14 h-14 relative ${isChatOpen ? 'bg-primary text-primary-foreground' : 'bg-white/20 hover:bg-white/30 text-white'}`}
              onClick={() => {
                setIsChatOpen(!isChatOpen);
                if (!isChatOpen) setUnreadMessages(0);
              }}
            >
              <MessageSquare className="w-6 h-6" />
              {unreadMessages > 0 && !isChatOpen && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {unreadMessages > 9 ? '9+' : unreadMessages}
                </span>
              )}
            </Button>

            <Button
              variant="ghost"
              size="lg"
              className="rounded-full w-14 h-14 bg-white/20 hover:bg-white/30 text-white"
              onClick={toggleFullscreen}
            >
              {isFullscreen ? <Minimize2 className="w-6 h-6" /> : <Maximize2 className="w-6 h-6" />}
            </Button>
          </div>
        </div>
      </div>

      {/* In-Call Chat */}
      {user && (
        <VideoCallChat
          roomId={consultationId || `call-${doctorId}-${user.id}`}
          userId={user.id}
          userName={user.user_metadata?.full_name || 'Patient'}
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
        />
      )}
    </div>
  );
};

export default VideoCall;