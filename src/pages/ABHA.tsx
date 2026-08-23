import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, FileText, Cloud, Lock, CheckCircle, CreditCard, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const ABHA = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-6xl">
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

          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold text-foreground mb-4">
              ABHA <span className="text-primary">Health Card</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Your unique health identity for seamless healthcare access across India
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-16">
            <div>
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="text-2xl">What is ABHA?</CardTitle>
                  <CardDescription>
                    Ayushman Bharat Health Account - India's digital health ID
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">
                    ABHA is a unique 14-digit identification number that enables you to digitally access 
                    and share your health records across multiple systems and stakeholders.
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                      <span className="text-muted-foreground">
                        Free to create and use
                      </span>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                      <span className="text-muted-foreground">
                        Lifetime validity
                      </span>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                      <span className="text-muted-foreground">
                        Linked to your Aadhaar
                      </span>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                      <span className="text-muted-foreground">
                        Works across all ABDM-compliant facilities
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-6 text-center">
                    <Shield className="w-10 h-10 text-primary mx-auto mb-3" />
                    <h3 className="font-bold mb-2">Secure</h3>
                    <p className="text-sm text-muted-foreground">
                      Bank-grade encryption
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <Cloud className="w-10 h-10 text-primary mx-auto mb-3" />
                    <h3 className="font-bold mb-2">Cloud Storage</h3>
                    <p className="text-sm text-muted-foreground">
                      Access from anywhere
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <FileText className="w-10 h-10 text-primary mx-auto mb-3" />
                    <h3 className="font-bold mb-2">All Records</h3>
                    <p className="text-sm text-muted-foreground">
                      One place for everything
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <Lock className="w-10 h-10 text-primary mx-auto mb-3" />
                    <h3 className="font-bold mb-2">You Control</h3>
                    <p className="text-sm text-muted-foreground">
                      Share on your terms
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <CreditCard className="w-6 h-6 text-primary" />
                  Create Your ABHA
                </CardTitle>
                <CardDescription>
                  Quick and simple registration in 3 steps
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="aadhaar">Aadhaar Number</Label>
                    <Input 
                      id="aadhaar" 
                      placeholder="Enter your 12-digit Aadhaar number"
                      maxLength={12}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mobile">Mobile Number</Label>
                    <Input 
                      id="mobile" 
                      type="tel"
                      placeholder="Enter your mobile number"
                      maxLength={10}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address (Optional)</Label>
                    <Input 
                      id="email" 
                      type="email"
                      placeholder="Enter your email address"
                    />
                  </div>

                  <div className="flex items-start gap-2">
                    <input type="checkbox" id="consent" className="mt-1" />
                    <label htmlFor="consent" className="text-sm text-muted-foreground">
                      I consent to the creation of my ABHA number and linking it with my Aadhaar. 
                      I understand that my ABHA will be used to securely access my health records.
                    </label>
                  </div>

                  <Button className="w-full" size="lg">
                    Generate OTP
                  </Button>

                  <p className="text-xs text-center text-muted-foreground">
                    By creating an ABHA, you agree to the ABDM Terms of Service and Privacy Policy
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
            <div className="grid md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mx-auto mb-4">
                    1
                  </div>
                  <h3 className="font-bold mb-2">Create ABHA</h3>
                  <p className="text-sm text-muted-foreground">
                    Register using Aadhaar or mobile number
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mx-auto mb-4">
                    2
                  </div>
                  <h3 className="font-bold mb-2">Link Records</h3>
                  <p className="text-sm text-muted-foreground">
                    Connect with hospitals and labs
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mx-auto mb-4">
                    3
                  </div>
                  <h3 className="font-bold mb-2">Access Anywhere</h3>
                  <p className="text-sm text-muted-foreground">
                    View records on any device
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mx-auto mb-4">
                    4
                  </div>
                  <h3 className="font-bold mb-2">Share Securely</h3>
                  <p className="text-sm text-muted-foreground">
                    Control who sees your data
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          <Card className="bg-gradient-to-br from-primary/10 to-background border-primary/20">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-center mb-6">Benefits of ABHA</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-semibold mb-1">No Physical Documents</p>
                    <p className="text-sm text-muted-foreground">Access all records digitally</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-semibold mb-1">Quick Appointments</p>
                    <p className="text-sm text-muted-foreground">Faster registration at hospitals</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-semibold mb-1">Emergency Access</p>
                    <p className="text-sm text-muted-foreground">Critical info available instantly</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-semibold mb-1">Insurance Claims</p>
                    <p className="text-sm text-muted-foreground">Streamlined processing</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default ABHA;
