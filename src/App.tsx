import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import FloatingSOSButton from "./components/FloatingSOSButton";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { NotificationWrapper } from "./components/NotificationWrapper";
import { PageLoader } from "./components/PageLoader";

// Lazy-loaded pages for optimal performance and minimal initial bundle size
const Index = lazy(() => import("./pages/Index"));
const SOS = lazy(() => import("./pages/SOS"));
const Auth = lazy(() => import("./pages/Auth"));
const Profile = lazy(() => import("./pages/Profile"));
const BookingHistory = lazy(() => import("./pages/BookingHistory"));
const OperatorDashboard = lazy(() => import("./pages/OperatorDashboard"));
const DriverApp = lazy(() => import("./pages/DriverApp"));
const HospitalDashboard = lazy(() => import("./pages/HospitalDashboard"));
const Products = lazy(() => import("./pages/Products"));
const AboutUs = lazy(() => import("./pages/AboutUs"));
const ForDoctors = lazy(() => import("./pages/ForDoctors"));
const OurClients = lazy(() => import("./pages/OurClients"));
const ABHA = lazy(() => import("./pages/ABHA"));
const Careers = lazy(() => import("./pages/Careers"));
const News = lazy(() => import("./pages/News"));
const VideoConsultation = lazy(() => import("./pages/VideoConsultation"));
const VideoCall = lazy(() => import("./pages/VideoCall"));
const HealthCards = lazy(() => import("./pages/HealthCards"));
const Prescriptions = lazy(() => import("./pages/Prescriptions"));
const CreatePrescription = lazy(() => import("./pages/CreatePrescription"));
const MyMedicines = lazy(() => import("./pages/MyMedicines"));
const NotFound = lazy(() => import("./pages/NotFound"));
const BloodDonors = lazy(() => import("./pages/BloodDonors"));
const AITriage = lazy(() => import("./pages/AITriage"));
const BookAppointment = lazy(() => import("./pages/BookAppointment"));
const PatientPortal = lazy(() => import("./pages/PatientPortal"));
const DoctorPortal = lazy(() => import("./pages/DoctorPortal"));
const AdminPortal = lazy(() => import("./pages/AdminPortal"));
const SystemDesignDocs = lazy(() => import("./pages/SystemDesignDocs"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <NotificationWrapper>
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/products" element={<Products />} />
              <Route path="/about" element={<AboutUs />} />
              <Route path="/doctors" element={<ForDoctors />} />
              <Route path="/clients" element={<OurClients />} />
              <Route path="/news" element={<News />} />
              <Route path="/careers" element={<Careers />} />
              <Route path="/blood-donors" element={<BloodDonors />} />
              <Route path="/triage" element={<AITriage />} />

              {/* Doctor Appointment Booking & Clinical Portals */}
              <Route path="/book" element={<BookAppointment />} />
              <Route path="/patient-portal" element={<PatientPortal />} />
              <Route path="/doctor-portal" element={<DoctorPortal />} />
              <Route path="/admin" element={<AdminPortal />} />
              <Route path="/docs" element={<SystemDesignDocs />} />

              {/* User Protected Routes */}
              <Route path="/sos" element={<ProtectedRoute><SOS /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/bookings" element={<ProtectedRoute><BookingHistory /></ProtectedRoute>} />
              <Route path="/abha" element={<ProtectedRoute><ABHA /></ProtectedRoute>} />
              <Route path="/video-consultation" element={<ProtectedRoute><VideoConsultation /></ProtectedRoute>} />
              <Route path="/video-call/:consultationId" element={<ProtectedRoute><VideoCall /></ProtectedRoute>} />
              <Route path="/video-call" element={<ProtectedRoute><VideoCall /></ProtectedRoute>} />
              <Route path="/health-cards" element={<ProtectedRoute><HealthCards /></ProtectedRoute>} />
              <Route path="/prescriptions" element={<ProtectedRoute><Prescriptions /></ProtectedRoute>} />
              <Route path="/my-medicines" element={<ProtectedRoute><MyMedicines /></ProtectedRoute>} />

              {/* Role Protected Routes */}
              <Route 
                path="/operator" 
                element={<ProtectedRoute allowedRoles={['operator', 'admin']}><OperatorDashboard /></ProtectedRoute>} 
              />
              <Route 
                path="/operator-dashboard" 
                element={<ProtectedRoute allowedRoles={['operator', 'admin']}><OperatorDashboard /></ProtectedRoute>} 
              />
              <Route 
                path="/driver" 
                element={<ProtectedRoute allowedRoles={['driver', 'admin']}><DriverApp /></ProtectedRoute>} 
              />
              <Route 
                path="/hospital" 
                element={<ProtectedRoute allowedRoles={['hospital', 'admin']}><HospitalDashboard /></ProtectedRoute>} 
              />
              <Route 
                path="/create-prescription" 
                element={<ProtectedRoute allowedRoles={['doctor', 'admin']}><CreatePrescription /></ProtectedRoute>} 
              />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
          <FloatingSOSButton />
        </BrowserRouter>
      </NotificationWrapper>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
