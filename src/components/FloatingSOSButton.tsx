import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Phone, X, Ambulance, MapPin, PhoneCall, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const FloatingSOSButton = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isExpanded, setIsExpanded] = useState(false);

  // Don't show on auth, sos, or driver pages
  if (['/sos', '/driver', '/auth'].includes(location.pathname)) {
    return null;
  }

  const handleSOSClick = () => {
    if (isExpanded) {
      navigate('/sos');
    } else {
      setIsExpanded(true);
    }
  };

  const handleCall108 = () => {
    window.open('tel:108');
  };

  const handleClose = () => {
    setIsExpanded(false);
  };

  return (
    <>
      {/* Backdrop when expanded */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[998]"
            onClick={handleClose}
          />
        )}
      </AnimatePresence>

      {/* Floating Button Container */}
      <div className="fixed bottom-6 left-6 z-[999] flex flex-col items-start gap-4">
        {/* Expanded Menu */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="flex flex-col gap-3 origin-bottom-left"
            >
              {/* Call 108 */}
              <Button
                className="h-12 px-5 rounded-full bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/25 gap-2 transition-all hover:scale-105"
                onClick={handleCall108}
              >
                <PhoneCall className="w-5 h-5 text-white" />
                <span className="font-semibold text-white">Call 108</span>
              </Button>

              {/* Book Ambulance */}
              <Button
                className="h-12 px-5 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/25 gap-2 transition-all hover:scale-105"
                onClick={() => navigate('/sos')}
              >
                <Ambulance className="w-5 h-5 text-white" />
                <span className="font-semibold text-white">Book Ambulance</span>
              </Button>

              {/* Share Location */}
              <Button
                className="h-12 px-5 rounded-full bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-500/25 gap-2 transition-all hover:scale-105"
                onClick={() => {
                  if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition((position) => {
                      const { latitude, longitude } = position.coords;
                      const url = `https://www.google.com/maps?q=${latitude},${longitude}`;
                      if (navigator.share) {
                        navigator.share({
                          title: 'Emergency Location',
                          text: 'I need help! Here is my exact location:',
                          url,
                        });
                      } else {
                        window.open(url, '_blank');
                      }
                    });
                  }
                  handleClose();
                }}
              >
                <MapPin className="w-5 h-5 text-white" />
                <span className="font-semibold text-white">Share Location</span>
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main SOS Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSOSClick}
          className="relative group flex items-center justify-center"
        >
          {isExpanded ? (
            <motion.div 
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              className="w-14 h-14 rounded-full bg-zinc-800 shadow-lg flex items-center justify-center border border-zinc-700"
            >
              <X className="w-6 h-6 text-white" />
            </motion.div>
          ) : (
            <>
              {/* Soft outer pulse (less irritating) */}
              <div className="absolute -inset-1 rounded-full bg-destructive/15 animate-ping" style={{ animationDuration: '3s' }} />
              
              <div className="relative w-14 h-14 rounded-full bg-destructive flex items-center justify-center shadow-lg shadow-destructive/40 border border-red-500">
                <span className="text-white font-bold tracking-tight">SOS</span>
              </div>
            </>
          )}
        </motion.button>
      </div>
    </>
  );
};

export default FloatingSOSButton;
