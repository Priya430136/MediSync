import { 
  Home, 
  User, 
  Calendar, 
  FileText, 
  Pill, 
  CreditCard, 
  Video, 
  Siren, 
  Building2, 
  Droplet, 
  Brain, 
  Stethoscope, 
  ShieldCheck, 
  BookOpen, 
  Clock, 
  PlusCircle, 
  Activity,
  Settings
} from "lucide-react";

export type PortalType = 'patient' | 'doctor' | 'hospital' | 'landing';

export interface NavLinkItem {
  to: string;
  label: string;
  icon: any;
  badge?: string;
  description?: string;
}

// 1. Patient Portal Accessible Services & Links
export const PATIENT_NAV_ITEMS: NavLinkItem[] = [
  { to: "/patient-portal", label: "My Care Hub", icon: User, description: "Overview of care, upcoming visits & health score" },
  { to: "/book", label: "Book Specialist", icon: Calendar, description: "Schedule appointment with verified physicians" },
  { to: "/bookings", label: "My Appointments", icon: Clock, description: "Consultation history & upcoming visit passes" },
  { to: "/prescriptions", label: "Prescriptions", icon: FileText, description: "Doctor signed digital e-prescriptions & Rx files" },
  { to: "/my-medicines", label: "Medicines & Doses", icon: Pill, description: "Daily dose reminder alarms and intake tracker" },
  { to: "/health-cards", label: "ABHA Health Card", icon: CreditCard, description: "Ayushman Bharat digital health ID & QR" },
  { to: "/video-consultation", label: "Tele-Consult", icon: Video, description: "Join live encrypted video call with doctor" },
  { to: "/triage", label: "AI Symptom Triage", icon: Brain, description: "Instant clinical severity check & guidance" },
  { to: "/profile", label: "My Profile & Account", icon: Settings, description: "Personal details, emergency contacts & calendar sync" },
];

// 2. Doctor Portal Accessible Services & Links
export const DOCTOR_NAV_ITEMS: NavLinkItem[] = [
  { to: "/doctor-portal", label: "Doctor Workspace", icon: Stethoscope, description: "Live patient queue, calendar & clinical charts" },
  { to: "/create-prescription", label: "Write Prescription", icon: PlusCircle, description: "Generate structured e-prescription with drug database" },
  { to: "/prescriptions", label: "Prescription Records", icon: FileText, description: "View & verify clinical patient prescriptions" },
  { to: "/doctors", label: "Physicians Network", icon: Activity, description: "Directory of clinical specialists & leave schedules" },
  { to: "/video-consultation", label: "Tele-Health Rooms", icon: Video, description: "Doctor consultation rooms & live tele-triage" },
  { to: "/blood-donors", label: "Blood Bank Reserves", icon: Droplet, description: "Check unit availability across blood groups" },
  { to: "/profile", label: "Clinical Profile & Sync", icon: Settings, description: "Physician credentials, Google Calendar & shifts" },
];

// 3. Hospital ER & Administration Accessible Services & Links
export const HOSPITAL_NAV_ITEMS: NavLinkItem[] = [
  { to: "/hospital", label: "Hospital ER & ICU", icon: Building2, description: "Department bed occupancy, admissions & bay status" },
  { to: "/admin", label: "Hospital Admin Matrix", icon: ShieldCheck, description: "System audit logs, RBAC roles & facility metrics" },
  { to: "/blood-donors", label: "Blood Bank Inventory", icon: Droplet, description: "Manage blood units, request emergency donors" },
  { to: "/doctor-portal", label: "Specialist Coverage", icon: Stethoscope, description: "Physicians on clinical shift & ER coverage" },
  { to: "/profile", label: "Hospital Profile", icon: Settings, description: "Facility credentials, ER notification channels" },
];

// User Profile dedicated sub-links (used when opening profile directly)
export const PROFILE_NAV_ITEMS: NavLinkItem[] = [
  { to: "/profile", label: "Profile & Account", icon: Settings, description: "Personal details, emergency contacts & calendar sync" },
  { to: "/patient-portal", label: "Patient Hub", icon: User, description: "Active medical care & upcoming bookings" },
  { to: "/bookings", label: "My Appointments", icon: Clock, description: "Doctor appointments & consultations" },
  { to: "/prescriptions", label: "My Prescriptions", icon: FileText, description: "Digital Rx prescriptions & records" },
  { to: "/my-medicines", label: "My Medicines", icon: Pill, description: "Dosage reminders & tracker" },
  { to: "/health-cards", label: "ABHA Health Card", icon: CreditCard, description: "Digital Ayushman Bharat Health Account" },
];

// General Landing / Public Services
export const GENERAL_NAV_ITEMS: NavLinkItem[] = [
  { to: "/", label: "Home", icon: Home },
  { to: "/sos", label: "Emergency SOS", icon: Siren, badge: "108" },
  { to: "/book", label: "Book Doctor", icon: Calendar },
  { to: "/triage", label: "AI Symptom Checker", icon: Brain },
  { to: "/blood-donors", label: "Blood Donors", icon: Droplet },
  { to: "/about", label: "About", icon: Activity },
  { to: "/docs", label: "Docs", icon: BookOpen },
];

export function getPortalNavConfig(pathname: string, userRole?: string | null): {
  portal: PortalType;
  portalName: string;
  portalIcon: any;
  themeColor: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  homeLink: string;
  items: NavLinkItem[];
} {
  const path = pathname.toLowerCase();
  const role = (userRole || '').toLowerCase();

  // 1. Profile Page: Uses role-aware left-side navigation portal!
  if (path.startsWith('/profile')) {
    if (role === 'doctor') {
      return {
        portal: 'doctor',
        portalName: 'Doctor Clinical Profile',
        portalIcon: Stethoscope,
        themeColor: 'emerald',
        badgeBg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
        badgeText: 'text-emerald-700 dark:text-emerald-300',
        badgeBorder: 'border-emerald-300 dark:border-emerald-700/50',
        homeLink: '/doctor-portal',
        items: DOCTOR_NAV_ITEMS,
      };
    }
    if (role === 'hospital' || role === 'admin') {
      return {
        portal: 'hospital',
        portalName: 'Hospital Admin Profile',
        portalIcon: Building2,
        themeColor: 'rose',
        badgeBg: 'bg-rose-500/10 dark:bg-rose-500/20',
        badgeText: 'text-rose-700 dark:text-rose-300',
        badgeBorder: 'border-rose-300 dark:border-rose-700/50',
        homeLink: '/hospital',
        items: HOSPITAL_NAV_ITEMS,
      };
    }
    // Default User / Patient Profile Portal (Left Sidebar)
    return {
      portal: 'patient',
      portalName: 'User Profile & Account',
      portalIcon: User,
      themeColor: 'blue',
      badgeBg: 'bg-blue-500/10 dark:bg-blue-500/20',
      badgeText: 'text-blue-700 dark:text-blue-300',
      badgeBorder: 'border-blue-300 dark:border-blue-700/50',
      homeLink: '/patient-portal',
      items: PROFILE_NAV_ITEMS,
    };
  }

  // 2. Doctor Portal Routes
  if (
    path.startsWith('/doctor-portal') || 
    path.startsWith('/create-prescription') || 
    path === '/doctors' ||
    (role === 'doctor' && (
      path.startsWith('/prescriptions') || 
      path.startsWith('/video-consultation') || 
      path.startsWith('/video-call') ||
      path.startsWith('/blood-donors')
    ))
  ) {
    return {
      portal: 'doctor',
      portalName: 'Doctor Workspace',
      portalIcon: Stethoscope,
      themeColor: 'emerald',
      badgeBg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
      badgeText: 'text-emerald-700 dark:text-emerald-300',
      badgeBorder: 'border-emerald-300 dark:border-emerald-700/50',
      homeLink: '/doctor-portal',
      items: DOCTOR_NAV_ITEMS,
    };
  }

  // 3. Hospital ER & Admin Routes
  if (
    path.startsWith('/hospital') || 
    path.startsWith('/hospital-dashboard') || 
    path.startsWith('/admin') ||
    (role === 'hospital' && path.startsWith('/blood-donors')) ||
    (role === 'admin' && path.startsWith('/docs'))
  ) {
    return {
      portal: 'hospital',
      portalName: 'Hospital ER & Admin',
      portalIcon: Building2,
      themeColor: 'rose',
      badgeBg: 'bg-rose-500/10 dark:bg-rose-500/20',
      badgeText: 'text-rose-700 dark:text-rose-300',
      badgeBorder: 'border-rose-300 dark:border-rose-700/50',
      homeLink: '/hospital',
      items: HOSPITAL_NAV_ITEMS,
    };
  }

  // 4. Patient Portal routes
  if (
    path.startsWith('/patient-portal') ||
    path.startsWith('/book') ||
    path.startsWith('/bookings') ||
    path.startsWith('/prescriptions') ||
    path.startsWith('/my-medicines') ||
    path.startsWith('/health-cards') ||
    path.startsWith('/abha') ||
    path.startsWith('/video-consultation') ||
    path.startsWith('/triage')
  ) {
    return {
      portal: 'patient',
      portalName: 'Patient Portal',
      portalIcon: User,
      themeColor: 'blue',
      badgeBg: 'bg-blue-500/10 dark:bg-blue-500/20',
      badgeText: 'text-blue-700 dark:text-blue-300',
      badgeBorder: 'border-blue-300 dark:border-blue-700/50',
      homeLink: '/patient-portal',
      items: PATIENT_NAV_ITEMS,
    };
  }

  // 5. Default Landing Context
  return {
    portal: 'landing',
    portalName: 'Platform Overview',
    portalIcon: Activity,
    themeColor: 'primary',
    badgeBg: 'bg-primary/10',
    badgeText: 'text-primary',
    badgeBorder: 'border-primary/20',
    homeLink: '/',
    items: GENERAL_NAV_ITEMS,
  };
}
