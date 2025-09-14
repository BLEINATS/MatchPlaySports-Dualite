import { Switch, Route, useLocation, Redirect } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { Layout } from "@/components/layout/Layout";
import Dashboard from "@/pages/Dashboard";

import UserTypeSelection from "@/pages/UserTypeSelection";
import ClientRegistration from "@/pages/ClientRegistration";
import RegisterRentalPlayer from "@/pages/RegisterRentalPlayer";
import RegisterTeacher from "@/pages/RegisterTeacher";
import Courts from "@/pages/Courts";
import BookingsProtected from "@/pages/BookingsProtected";
import NewReservation from "@/pages/NewReservation";
import EditReservation from "@/pages/EditReservation";
import Users from "@/pages/Users";
import WhatsAppAdmin from "@/pages/WhatsAppAdmin";
import Payments from "@/pages/Payments";
import CorporateIntegrations from "@/pages/CorporateIntegrations";
import FinancialReports from "@/pages/FinancialReports";
import TeacherDashboard from "@/pages/teacher/TeacherDashboard";
import AvailabilityManagement from "@/pages/teacher/AvailabilityManagement";
import ClassManagement from "@/pages/teacher/ClassManagement";
import StudentManagement from "@/pages/teacher/StudentManagement";
import CommissionEarnings from "@/pages/teacher/CommissionEarnings";
import ClientDashboard from "@/pages/client/ClientDashboard";
import CourtReservation from "@/pages/client/CourtReservation";
import CourtCalendar from "@/pages/client/CourtCalendar";
import BookingProcess from "@/pages/client/BookingProcess";
import TeachersList from "@/pages/client/TeachersList";
import RentalPlayer from "@/pages/client/RentalPlayer";
import ClientPayments from "@/pages/client/Payments";
import LoyaltyProgram from "@/pages/client/LoyaltyProgram";
import Community from "@/pages/client/Community";
import CourtsPage from "@/pages/client/CourtsPage";
import CourtProfilePage from "@/pages/client/CourtProfilePage";
import RentalPlayerDashboard from "@/pages/rental-player/RentalPlayerDashboard";
import RentalPlayerAvailability from "@/pages/rental-player/AvailabilityManagement";
import RequestsManagement from "@/pages/rental-player/RequestsManagement";
import GameHistory from "@/pages/rental-player/GameHistory";
import EarningsPayments from "@/pages/rental-player/EarningsPayments";
import GamificationDashboard from "@/pages/gamification/GamificationDashboard";
import GamificationLeaderboard from "@/pages/gamification/GamificationLeaderboard";
import GamificationRewards from "@/pages/gamification/GamificationRewards";
import GamificationBadges from "@/pages/gamification/GamificationBadges";
import NotificationsPage from "@/pages/NotificationsPage";
import SuperAdminDashboard from "@/pages/SuperAdminDashboard";
import BrandCustomization from "@/pages/BrandCustomization";
import PartnersManagement from "@/pages/PartnersManagement";
import MultiTenantAuth from "@/pages/MultiTenantAuth";
import Auth from "@/pages/Auth";
import RegisterAdmin from "@/pages/RegisterAdmin";
import AdminDashboard from "@/pages/AdminDashboard";
import AdminCourts from "@/pages/AdminCourts";
import NotFound from "@/pages/NotFound";
import AdminPricing from "@/pages/AdminPricing";
import AdminEvents from "@/pages/AdminEvents";
import EventFormPage from "@/pages/EventFormPage";
import CreateEvent from "@/pages/CreateEvent";
import CourtAvailability from "@/pages/CourtAvailability";
import ClientsManagement from "@/pages/ClientsManagement";
import NewClient from "@/pages/NewClient";
import EditClient from "@/pages/EditClient";
import ClientDetails from "@/pages/ClientDetails";
import LoyaltyConfig from "@/pages/admin/LoyaltyConfig";
import ProfessorsManagement from "@/pages/admin/ProfessorsManagement";
import { ProfessorProfile } from "@/pages/admin/ProfessorProfile";
import PlayersForHire from "@/pages/admin/PlayersForHire";
import PlayersForHireNew from "@/pages/admin/PlayersForHireNew";
import PlayersForHireView from "@/pages/admin/PlayersForHireView";
import PlayersForHireEdit from "@/pages/admin/PlayersForHireEdit";
import { PlayerForHireProfile } from "@/pages/admin/PlayerForHireProfile";
import TenantProfile from "@/pages/admin/TenantProfile";
import TenantProfileSimple from "@/pages/admin/TenantProfileSimple";
import TenantConfig from "@/pages/admin/TenantConfig";

function DashboardRedirect() {
  const { userRole, isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    console.log('DashboardRedirect - Auth state:', { userRole, isAuthenticated, isLoading });
    
    if (!isLoading && isAuthenticated && userRole) {
      console.log('Redirecting user with role:', userRole);
      switch (userRole) {
        case 'super_admin':
          setLocation('/super-admin');
          break;
        case 'admin':
          setLocation('/admin/dashboard');
          break;
        case 'teacher':
          setLocation('/teacher/dashboard');
          break;
        case 'client':
          setLocation('/client/dashboard');
          break;
        case 'rental_player':
          setLocation('/rental-player/dashboard');
          break;
        default:
          console.warn('Unknown user role:', userRole);
          setLocation('/admin/dashboard'); // Default to admin dashboard
      }
    } else if (!isLoading && !isAuthenticated) {
      console.log('User not authenticated, redirecting to /auth');
      setLocation('/auth');
    }
  }, [userRole, isAuthenticated, isLoading, setLocation]);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, don't render anything (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  // If authenticated but no specific role handling needed, show default
  return <Layout><Dashboard /></Layout>;
}

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={Auth} />
      <Route path="/login" component={MultiTenantAuth} />
      <Route path="/register" component={UserTypeSelection} />
      <Route path="/register/client" component={ClientRegistration} />
      <Route path="/register/rental-player" component={RegisterRentalPlayer} />
      <Route path="/register/teacher" component={RegisterTeacher} />
      <Route path="/admin/register" component={RegisterAdmin} />
      <Route path="/" component={DashboardRedirect} />
      <Route path="/dashboard" component={DashboardRedirect} />
      <Route path="/courts" component={() => <Layout><Courts /></Layout>} />
      <Route path="/bookings" component={() => <Redirect to="/admin/bookings" />} />
      <Route path="/users" component={() => <Layout><Users /></Layout>} />
      <Route path="/whatsapp" component={() => <Layout><WhatsAppAdmin /></Layout>} />
      <Route path="/payments" component={() => <Layout><Payments /></Layout>} />
      <Route path="/corporate" component={() => <Layout><CorporateIntegrations /></Layout>} />
      <Route path="/financial-reports" component={() => <Layout><FinancialReports /></Layout>} />
      <Route path="/brand-customization" component={() => <Layout><BrandCustomization /></Layout>} />
      
      {/* Admin Routes */}
      <Route path="/admin/dashboard" component={() => <Layout><AdminDashboard /></Layout>} />
      <Route path="/admin/profile" component={() => <Layout><TenantProfileSimple /></Layout>} />
      <Route path="/admin/branding" component={() => <Layout><BrandCustomization /></Layout>} />
      <Route path="/admin/courts" component={() => <Layout><AdminCourts /></Layout>} />
      <Route path="/admin/pricing" component={() => <Layout><AdminPricing /></Layout>} />
      <Route path="/admin/events" component={() => <Layout><AdminEvents /></Layout>} />
      <Route path="/admin/events/new" component={() => <CreateEvent />} />
      <Route path="/admin/events/edit/:id" component={() => <Layout><EventFormPage /></Layout>} />
      <Route path="/admin/bookings" component={() => <Layout><BookingsProtected /></Layout>} />
      <Route path="/admin/reservations/new" component={() => <Layout><NewReservation /></Layout>} />
      <Route path="/admin/bookings/edit/:id" component={() => <Layout><EditReservation /></Layout>} />
      <Route path="/admin/availability" component={() => <Layout><CourtAvailability /></Layout>} />
      <Route path="/admin/clients" component={() => <Layout><ClientsManagement /></Layout>} />
      <Route path="/admin/clients/new" component={() => <Layout><NewClient /></Layout>} />
      <Route path="/admin/clients/:id/edit" component={() => <Layout><EditClient /></Layout>} />
      <Route path="/admin/clients/:id" component={() => <Layout><ClientDetails /></Layout>} />
      <Route path="/admin/loyalty" component={() => <Layout><LoyaltyConfig /></Layout>} />
      <Route path="/admin/professors" component={() => <Layout><ProfessorsManagement /></Layout>} />
      <Route path="/admin/professors/:id" component={() => <Layout><ProfessorProfile /></Layout>} />
      <Route path="/admin/players-for-hire" component={() => <Layout><PlayersForHire /></Layout>} />
      <Route path="/admin/players-for-hire/new" component={() => <Layout><PlayersForHireNew /></Layout>} />
      <Route path="/admin/players-for-hire/view/:id" component={() => <Layout><PlayersForHireView /></Layout>} />
      <Route path="/admin/players-for-hire/edit/:id" component={() => <Layout><PlayersForHireEdit /></Layout>} />
      <Route path="/admin/players-for-hire/profile/:id" component={() => <Layout><PlayerForHireProfile /></Layout>} />
      <Route path="/reservations/new" component={() => <Layout><NewReservation /></Layout>} />
      <Route path="/reservations/edit/:id" component={() => <Layout><EditReservation /></Layout>} />
      <Route path="/reservations/:id/edit" component={() => <Layout><EditReservation /></Layout>} />
      <Route path="/court-availability" component={() => <Layout><CourtAvailability /></Layout>} />
      <Route path="/availability" component={() => <Layout><CourtAvailability /></Layout>} />
      
      {/* Teacher Routes */}
      <Route path="/teacher/dashboard" component={() => <Layout><TeacherDashboard /></Layout>} />
      <Route path="/teacher/availability" component={() => <Layout><AvailabilityManagement /></Layout>} />
      <Route path="/teacher/classes" component={() => <Layout><ClassManagement /></Layout>} />
      <Route path="/teacher/students" component={() => <Layout><StudentManagement /></Layout>} />
      <Route path="/teacher/earnings" component={() => <Layout><CommissionEarnings /></Layout>} />
      
      {/* Client Routes */}
      <Route path="/client/dashboard" component={() => <Layout><ClientDashboard /></Layout>} />
      <Route path="/client/quadras" component={() => <Layout><CourtsPage /></Layout>} />
      <Route path="/client/quadras/:tenantId" component={() => <Layout><CourtProfilePage /></Layout>} />
      <Route path="/client/reserve" component={() => <Layout><CourtReservation /></Layout>} />
      <Route path="/client/calendar" component={() => <Layout><CourtCalendar /></Layout>} />
      <Route path="/client/booking" component={() => <Layout><BookingProcess /></Layout>} />
      <Route path="/client/teachers" component={() => <Layout><TeachersList /></Layout>} />
      <Route path="/client/rental-players" component={() => <Layout><RentalPlayer /></Layout>} />
      <Route path="/client/payments" component={() => <Layout><ClientPayments /></Layout>} />
      <Route path="/client/loyalty" component={() => <Layout><LoyaltyProgram /></Layout>} />
      <Route path="/client/community" component={() => <Layout><Community /></Layout>} />
      
      {/* Rental Player Routes */}
      <Route path="/rental-player/dashboard" component={() => <Layout><RentalPlayerDashboard /></Layout>} />
      <Route path="/rental-player/availability" component={() => <Layout><RentalPlayerAvailability /></Layout>} />
      <Route path="/rental-player/requests" component={() => <Layout><RequestsManagement /></Layout>} />
      <Route path="/rental-player/history" component={() => <Layout><GameHistory /></Layout>} />
      <Route path="/rental-player/earnings" component={() => <Layout><EarningsPayments /></Layout>} />
      
      {/* Gamification Routes */}
      <Route path="/gamification" component={() => <Layout><GamificationDashboard /></Layout>} />
      <Route path="/gamification/dashboard" component={() => <Layout><GamificationDashboard /></Layout>} />
      <Route path="/gamification/leaderboard" component={() => <Layout><GamificationLeaderboard /></Layout>} />
      <Route path="/gamification/rewards" component={() => <Layout><GamificationRewards /></Layout>} />
      <Route path="/gamification/badges" component={() => <Layout><GamificationBadges /></Layout>} />
      
      {/* Notifications Route */}
      <Route path="/notifications" component={() => <Layout><NotificationsPage /></Layout>} />
      
      {/* Super Admin Route */}
      <Route path="/super-admin" component={() => <Layout><SuperAdminDashboard /></Layout>} />
      
      {/* Partners Management Route */}
      <Route path="/partners" component={() => <Layout><PartnersManagement /></Layout>} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
