import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { 
  Send, 
  Paperclip, 
  X, 
  Link as LinkIcon, 
  FileText, 
  Image as ImageIcon,
  Download,
  ExternalLink
} from 'lucide-react';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  type: 'text' | 'link' | 'file';
  fileUrl?: string;
  fileName?: string;
  timestamp: Date;
}

interface VideoCallChatProps {
  roomId: string;
  userId: string;
  userName: string;
  isOpen: boolean;
  onClose: () => void;
}

const VideoCallChat = ({ roomId, userId, userName, isOpen, onClose }: VideoCallChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Setup chat channel
    channelRef.current = supabase.channel(`chat:${roomId}`);
    
    channelRef.current
      .on('broadcast', { event: 'message' }, ({ payload }: any) => {
        const message: Message = {
          ...payload,
          timestamp: new Date(payload.timestamp)
        };
        setMessages(prev => [...prev, message]);
      })
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [roomId, isOpen]);

  useEffect(() => {
    // Auto-scroll to bottom on new messages
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = (content: string, type: 'text' | 'link' | 'file' = 'text', fileUrl?: string, fileName?: string) => {
    if (!content.trim() && type === 'text') return;

    const message: Message = {
      id: crypto.randomUUID(),
      senderId: userId,
      senderName: userName,
      content,
      type,
      fileUrl,
      fileName,
      timestamp: new Date()
    };

    // Add to local state
    setMessages(prev => [...prev, message]);

    // Broadcast to others
    channelRef.current?.send({
      type: 'broadcast',
      event: 'message',
      payload: {
        ...message,
        timestamp: message.timestamp.toISOString()
      }
    });

    setNewMessage('');
  };

  const handleSend = () => {
    const content = newMessage.trim();
    if (!content) return;

    // Check if it's a URL
    const urlPattern = /^(https?:\/\/[^\s]+)$/i;
    if (urlPattern.test(content)) {
      sendMessage(content, 'link');
    } else {
      sendMessage(content, 'text');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${roomId}/${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('prescriptions')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('prescriptions')
        .getPublicUrl(fileName);

      sendMessage(file.name, 'file', publicUrl, file.name);
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) {
      return <ImageIcon className="w-4 h-4" />;
    }
    return <FileText className="w-4 h-4" />;
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-80 md:w-96 bg-slate-900/95 text-white backdrop-blur-2xl border-l border-white/10 shadow-2xl flex flex-col z-50 animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/10 bg-slate-950/60">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-sm text-white">Consultation Chat</h3>
          {messages.length > 0 && (
            <Badge variant="secondary" className="text-[10px] bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
              {messages.length}
            </Badge>
          )}
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 text-slate-400 hover:text-white hover:bg-white/10 rounded-full" 
          onClick={onClose}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-3">
          {messages.length === 0 ? (
            <div className="text-center text-slate-400 text-xs py-12 space-y-1">
              <p className="font-medium text-slate-300">No in-session messages</p>
              <p className="text-[11px] text-slate-500">Send clinical notes, symptoms, links, or test reports.</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.senderId === userId ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-1.5 mb-1 px-1">
                  <span className="text-[10px] font-semibold text-slate-400">
                    {msg.senderId === userId ? 'You' : msg.senderName}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {formatTime(msg.timestamp)}
                  </span>
                </div>
                <div
                  className={`max-w-[88%] rounded-2xl px-3.5 py-2 text-xs ${
                    msg.senderId === userId
                      ? 'bg-emerald-600 text-white rounded-br-none shadow-md'
                      : 'bg-slate-800 text-slate-100 border border-white/10 rounded-bl-none shadow-sm'
                  }`}
                >
                  {msg.type === 'text' && (
                    <p className="whitespace-pre-wrap break-words leading-relaxed">{msg.content}</p>
                  )}
                  {msg.type === 'link' && (
                    <a
                      href={msg.content}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-emerald-200 underline font-medium"
                    >
                      <LinkIcon className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">{msg.content}</span>
                      <ExternalLink className="w-3 h-3 flex-shrink-0" />
                    </a>
                  )}
                  {msg.type === 'file' && (
                    <a
                      href={msg.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 hover:opacity-90 transition-opacity"
                    >
                      <div className="p-1.5 rounded-lg bg-black/20">
                        {getFileIcon(msg.fileName || '')}
                      </div>
                      <span className="truncate flex-1 font-medium">{msg.fileName}</span>
                      <Download className="w-3.5 h-3.5 flex-shrink-0" />
                    </a>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-3 border-t border-white/10 bg-slate-950/60">
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            accept="image/*,.pdf,.doc,.docx,.txt"
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl shrink-0"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            title="Attach Lab Report or Image"
          >
            <Paperclip className={`w-4 h-4 ${isUploading ? 'animate-pulse text-emerald-400' : ''}`} />
          </Button>
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type message or paste link..."
            className="flex-1 bg-slate-950/70 border-white/10 text-white placeholder:text-slate-500 text-xs h-9 focus-visible:ring-emerald-500 rounded-xl"
            disabled={isUploading}
          />
          <Button
            size="icon"
            className="h-9 w-9 shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
            onClick={handleSend}
            disabled={!newMessage.trim() || isUploading}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-[10px] text-slate-500 mt-2 text-center">
          Encrypted peer exchange • Files up to 10MB
        </p>
      </div>
    </div>
  );
};

export default VideoCallChat;
