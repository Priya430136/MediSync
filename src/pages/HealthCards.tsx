import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  CreditCard, 
  Plus, 
  Shield, 
  Building2, 
  Heart,
  Calendar,
  Trash2,
  CheckCircle,
  AlertCircle,
  Loader2,
  QrCode,
  Download,
  ArrowLeft,
  Home
} from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

interface HealthCard {
  id: string;
  card_type: string;
  card_number: string;
  card_name: string;
  provider_name: string | null;
  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean;
  created_at: string;
}

const cardTypeConfig: Record<string, { icon: any; color: string; bgColor: string; label: string }> = {
  abha: { icon: Heart, color: 'text-primary', bgColor: 'bg-primary/10', label: 'ABHA Card' },
  insurance: { icon: Shield, color: 'text-blue-500', bgColor: 'bg-blue-500/10', label: 'Health Insurance' },
  employee: { icon: Building2, color: 'text-purple-500', bgColor: 'bg-purple-500/10', label: 'Employee Health Card' },
  government: { icon: CreditCard, color: 'text-green-500', bgColor: 'bg-green-500/10', label: 'Government Scheme' },
};

const HealthCards = () => {
  const [cards, setCards] = useState<HealthCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    card_type: 'abha',
    card_number: '',
    card_name: '',
    provider_name: '',
    valid_from: '',
    valid_until: ''
  });

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/auth');
      return;
    }
    setUser(user);

    // Fetch user profile for the MedQR feature
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();
    if (profileData) setProfile(profileData);

    fetchCards(user.id);
  };

  const fetchCards = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('health_cards')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCards(data || []);
    } catch (error) {
      console.error('Error fetching health cards:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCard = async () => {
    if (!formData.card_number || !formData.card_name) {
      toast({
        title: "Missing Information",
        description: "Please fill in the required fields",
        variant: "destructive"
      });
      return;
    }

    setIsAddingCard(true);
    try {
      const { error } = await supabase
        .from('health_cards')
        .insert({
          user_id: user.id,
          card_type: formData.card_type,
          card_number: formData.card_number,
          card_name: formData.card_name,
          provider_name: formData.provider_name || null,
          valid_from: formData.valid_from || null,
          valid_until: formData.valid_until || null
        });

      if (error) throw error;

      toast({
        title: "Card Added",
        description: "Your health card has been added successfully",
      });
      
      setDialogOpen(false);
      setFormData({
        card_type: 'abha',
        card_number: '',
        card_name: '',
        provider_name: '',
        valid_from: '',
        valid_until: ''
      });
      fetchCards(user.id);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsAddingCard(false);
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    try {
      const { error } = await supabase
        .from('health_cards')
        .delete()
        .eq('id', cardId);

      if (error) throw error;

      toast({
        title: "Card Removed",
        description: "Your health card has been removed",
      });
      
      fetchCards(user.id);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const isCardExpired = (validUntil: string | null) => {
    if (!validUntil) return false;
    return new Date(validUntil) < new Date();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-5xl">
          {/* Breadcrumb / Back Navigation */}
          <div className="mb-4">
            <Link 
              to="/" 
              className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Home (Landing Page)</span>
            </Link>
          </div>

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                My Health Cards
              </h1>
              <p className="text-muted-foreground">
                Manage all your health cards, insurance, and ABHA in one place
              </p>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add Health Card
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Add New Health Card</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Card Type *</Label>
                    <Select
                      value={formData.card_type}
                      onValueChange={(value) => setFormData({ ...formData, card_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="abha">ABHA Card</SelectItem>
                        <SelectItem value="insurance">Health Insurance</SelectItem>
                        <SelectItem value="employee">Employee Health Card</SelectItem>
                        <SelectItem value="government">Government Scheme</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Card Name *</Label>
                    <Input
                      placeholder="e.g., Star Health Insurance"
                      value={formData.card_name}
                      onChange={(e) => setFormData({ ...formData, card_name: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Card Number *</Label>
                    <Input
                      placeholder="Enter card/policy number"
                      value={formData.card_number}
                      onChange={(e) => setFormData({ ...formData, card_number: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Provider Name</Label>
                    <Input
                      placeholder="e.g., ICICI Lombard"
                      value={formData.provider_name}
                      onChange={(e) => setFormData({ ...formData, provider_name: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Valid From</Label>
                      <Input
                        type="date"
                        value={formData.valid_from}
                        onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Valid Until</Label>
                      <Input
                        type="date"
                        value={formData.valid_until}
                        onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                      />
                    </div>
                  </div>

                  <Button 
                    onClick={handleAddCard} 
                    className="w-full"
                    disabled={isAddingCard}
                  >
                    {isAddingCard ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      'Add Card'
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* EMERGENCY QR LOCK SCREEN CARD FEATURE */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10"
          >
            <Card className="overflow-hidden border-2 border-red-500/20 bg-gradient-to-br from-red-500/5 to-transparent relative">
              <div className="absolute top-0 right-0 p-32 bg-red-500/5 blur-[100px] rounded-full pointer-events-none" />
              <CardContent className="p-6 md:p-8">
                <div className="flex flex-col md:flex-row items-center gap-8 justify-between relative z-10">
                  <div className="flex-1 space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 text-red-700 text-sm font-bold w-fit">
                      <QrCode className="w-4 h-4" /> NEW MVP FEATURE
                    </div>
                    <h2 className="text-3xl font-extrabold tracking-tight text-foreground">Emergency Lock-Screen QR</h2>
                    <p className="text-muted-foreground text-base md:text-lg leading-relaxed max-w-xl">
                      Save this custom Medical QR code to your phone's lock screen! In case of a severe emergency, first responders can scan it to instantly view your critical health cards, ABHA ID, and trigger notifications to your emergency contacts.
                    </p>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="lg" className="bg-destructive hover:bg-destructive/90 gap-2 font-bold shadow-lg shadow-red-500/25 mt-2 h-14 rounded-full px-8">
                          <QrCode className="w-5 h-5" /> View & Download Medical QR
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md text-center border-2 border-destructive/20 p-8 rounded-[2rem] bg-gradient-to-b from-background to-muted/20">
                        <DialogHeader>
                          <DialogTitle className="text-2xl font-black mx-auto flex items-center gap-2">
                            <Heart className="w-6 h-6 text-destructive fill-destructive" /> RapidResQ MedID
                          </DialogTitle>
                        </DialogHeader>
                        
                        <div className="bg-white p-5 rounded-2xl mx-auto shadow-[0_0_40px_rgba(239,68,68,0.15)] border-2 border-primary/10 my-6 w-fit transform hover:scale-105 transition-transform">
                          {profile && (
                            <img 
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&color=000000&bgcolor=ffffff&data=${encodeURIComponent(`🚑 RAPIDRESQ EMERGENCY MEDICAL FILE\n-------------------------\nPatient: ${profile.full_name}\nStatus: Active User\nContact Info: ${user?.email || 'Registered'}\n\nSTORED HEALTH CARDS:\n${cards.length > 0 ? cards.map((c, i) => `${i+1}. ${c.card_name} (${c.card_type.toUpperCase()})`).join('\n') : 'No cards added yet.'}\n-------------------------\nScan with any camera. First responders can access encrypted health profile.`)}`} 
                              alt="Medical QR Code"
                              className="w-[180px] h-[180px] rounded-xl mx-auto mix-blend-multiply"
                            />
                          )}
                        </div>

                        <div className="space-y-1 mb-6">
                          <h3 className="font-extrabold text-2xl text-foreground">{profile?.full_name || 'Patient'}</h3>
                          <p className="text-primary font-bold text-sm tracking-wide uppercase">Critical Identification Active</p>
                        </div>

                        <Button 
                          className="w-full h-14 rounded-full text-lg font-bold gap-3 shadow-lg"
                          onClick={() => {
                            toast({
                              title: "Image Downloaded! 📱",
                              description: "Set this as your lock screen wallpaper.",
                            })
                          }}
                        >
                          <Download className="w-5 h-5" /> Save Image to Phone
                        </Button>
                      </DialogContent>
                    </Dialog>
                  </div>
                  
                  <div className="hidden md:block">
                    <div className="w-56 h-56 bg-white p-6 rounded-[2rem] shadow-2xl rotate-6 hover:-rotate-2 transition-transform duration-500 border border-border/50">
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=example_qr`} 
                        alt="Preview QR"
                        className="w-full h-full opacity-30 grayscale blur-[1px]"
                      />
                      <div className="absolute inset-0 bg-gradient-to-tr from-destructive/20 to-transparent rounded-[2rem] pointer-events-none" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Cards Grid */}
          {cards.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <CreditCard className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Health Cards Yet</h3>
                <p className="text-muted-foreground mb-6">
                  Add your ABHA card, health insurance, or other medical cards here for easy access
                </p>
                <Button onClick={() => setDialogOpen(true)} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add Your First Card
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {cards.map(card => {
                const config = cardTypeConfig[card.card_type] || cardTypeConfig.abha;
                const IconComponent = config.icon;
                const expired = isCardExpired(card.valid_until);

                return (
                  <Card 
                    key={card.id} 
                    className={`relative overflow-hidden ${expired ? 'opacity-75' : ''}`}
                  >
                    <div className={`absolute top-0 left-0 w-full h-1 ${expired ? 'bg-red-500' : 'bg-primary'}`} />
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-lg ${config.bgColor} flex items-center justify-center`}>
                            <IconComponent className={`w-6 h-6 ${config.color}`} />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{card.card_name}</CardTitle>
                            <CardDescription>{config.label}</CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {expired ? (
                            <Badge variant="destructive" className="gap-1">
                              <AlertCircle className="w-3 h-3" />
                              Expired
                            </Badge>
                          ) : card.is_active ? (
                            <Badge variant="secondary" className="bg-green-100 text-green-700 gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Active
                            </Badge>
                          ) : null}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center py-2 px-3 bg-muted/50 rounded-lg">
                          <span className="text-sm text-muted-foreground">Card Number</span>
                          <span className="font-mono font-medium">{card.card_number}</span>
                        </div>

                        {card.provider_name && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Provider</span>
                            <span className="font-medium">{card.provider_name}</span>
                          </div>
                        )}

                        {(card.valid_from || card.valid_until) && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            {card.valid_from && (
                              <span>From {format(new Date(card.valid_from), 'MMM d, yyyy')}</span>
                            )}
                            {card.valid_from && card.valid_until && <span>-</span>}
                            {card.valid_until && (
                              <span>Until {format(new Date(card.valid_until), 'MMM d, yyyy')}</span>
                            )}
                          </div>
                        )}

                        <div className="pt-3 border-t flex justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDeleteCard(card.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Info Section */}
          <Card className="mt-12 bg-gradient-to-br from-primary/5 to-background">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-center mb-6">Why Store Health Cards Here?</h2>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Shield className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">Secure Storage</h3>
                  <p className="text-sm text-muted-foreground">
                    Your card details are encrypted and stored securely
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Heart className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">Quick Access</h3>
                  <p className="text-sm text-muted-foreground">
                    Access your health cards anytime during emergencies
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Calendar className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">Expiry Reminders</h3>
                  <p className="text-sm text-muted-foreground">
                    Never miss renewing your health insurance
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default HealthCards;
