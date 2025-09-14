import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import BannerDisplay from '@/components/advertising/BannerDisplay';
import AdModalManager from '@/components/advertising/AdModal';
import { 
  Home, 
  Calendar, 
  Users, 
  CreditCard, 
  MessageSquare, 
  Building2,
  User,
  LogOut,
  Menu,
  X,
  BookOpen,
  Clock,
  GraduationCap,
  DollarSign,
  BarChart3,
  Trophy,
  Award,
  Gift,
  Target,
  Bell,
  Palette,
  Handshake,
  Settings,
  MapPin,
  FileText,
  PartyPopper
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const navigation = [
  // Super Admin Navigation (Dono do SaaS) - Gestão global do sistema
  { name: 'Dashboard Global', href: '/super-admin/dashboard', icon: Home, roles: ['super_admin'] },
  { name: 'Tenants', href: '/super-admin/tenants', icon: Building2, roles: ['super_admin'] },
  { name: 'Faturamento Global', href: '/super-admin/billing', icon: CreditCard, roles: ['super_admin'] },
  { name: 'Métricas Gerais', href: '/super-admin/metrics', icon: BarChart3, roles: ['super_admin'] },
  { name: 'Configurações Globais', href: '/super-admin/settings', icon: Settings, roles: ['super_admin'] },
  
  // Admin Navigation (Dono da Quadra - Tenant) - Gestão da própria quadra
  { name: 'Dashboard', href: '/admin/dashboard', icon: Home, roles: ['admin'] },
  { name: 'Perfil da Quadra', href: '/admin/profile', icon: User, roles: ['admin'] },
  { name: 'Quadras', href: '/admin/courts', icon: MapPin, roles: ['admin'] },
  { name: 'Preços', href: '/admin/pricing', icon: DollarSign, roles: ['admin'] },
  { name: 'Eventos', href: '/admin/events', icon: PartyPopper, roles: ['admin'] },
  { name: 'Reservas', href: '/admin/bookings', icon: Calendar, roles: ['admin'] },
  { name: 'Clientes', href: '/admin/clients', icon: Users, roles: ['admin'] },
  { name: 'Fidelidade', href: '/admin/loyalty', icon: Gift, roles: ['admin'] },
  { name: 'Professores', href: '/admin/professors', icon: GraduationCap, roles: ['admin'] },
  { name: 'Jogadores', href: '/admin/players-for-hire', icon: Users, roles: ['admin'] },
  { name: 'Pagamentos', href: '/admin/payments', icon: CreditCard, roles: ['admin'] },
  { name: 'Relatórios', href: '/admin/reports', icon: BarChart3, roles: ['admin'] },
  { name: 'Personalização', href: '/admin/branding', icon: Palette, roles: ['admin'] },
  { name: 'Parceiros', href: '/admin/partners', icon: Handshake, roles: ['admin'] },
  { name: 'WhatsApp', href: '/admin/whatsapp', icon: MessageSquare, roles: ['admin'] },
  { name: 'Integrações', href: '/admin/integrations', icon: Building2, roles: ['admin'] },
  
  // Teacher Navigation - Agenda de aulas e gestão de disponibilidade
  { name: 'Dashboard', href: '/teacher/dashboard', icon: Home, roles: ['teacher'] },
  { name: 'Agenda', href: '/teacher/schedule', icon: Calendar, roles: ['teacher'] },
  { name: 'Disponibilidade', href: '/teacher/availability', icon: Clock, roles: ['teacher'] },
  { name: 'Aulas', href: '/teacher/classes', icon: BookOpen, roles: ['teacher'] },
  { name: 'Alunos', href: '/teacher/students', icon: GraduationCap, roles: ['teacher'] },
  { name: 'Comissões', href: '/teacher/earnings', icon: DollarSign, roles: ['teacher'] },
  
  // Client Navigation - Reservas, aulas e programa de fidelidade
  { name: 'Dashboard', href: '/client/dashboard', icon: Home, roles: ['client'] },
  { name: 'Reservar Quadra', href: '/client/booking', icon: Calendar, roles: ['client'] },
  { name: 'Agendar Aula', href: '/client/lessons', icon: BookOpen, roles: ['client'] },
  { name: 'Histórico', href: '/client/history', icon: FileText, roles: ['client'] },
  { name: 'Programa Fidelidade', href: '/client/loyalty', icon: Gift, roles: ['client'] },
  { name: 'Comunidade', href: '/client/community', icon: Users, roles: ['client'] },
  
  // Rental Player Navigation - Gestão de disponibilidade e jogos
  { name: 'Dashboard', href: '/rental-player/dashboard', icon: Home, roles: ['rental_player'] },
  { name: 'Disponibilidade', href: '/rental-player/availability', icon: Clock, roles: ['rental_player'] },
  { name: 'Solicitações', href: '/rental-player/requests', icon: MessageSquare, roles: ['rental_player'] },
  { name: 'Histórico de Jogos', href: '/rental-player/games', icon: Trophy, roles: ['rental_player'] },
  { name: 'Ganhos', href: '/rental-player/earnings', icon: DollarSign, roles: ['rental_player'] },
  
  // Gamification Navigation (Common for client and rental_player)
  { name: 'Gamificação', href: '/gamification', icon: Trophy, roles: ['client', 'rental_player'] },
  { name: 'Ranking', href: '/gamification/leaderboard', icon: Award, roles: ['client', 'rental_player'] },
  { name: 'Recompensas', href: '/gamification/rewards', icon: Gift, roles: ['client', 'rental_player'] },
  { name: 'Medalhas', href: '/gamification/badges', icon: Target, roles: ['client', 'rental_player'] },
  
  // Notifications (All roles)
  { name: 'Notificações', href: '/notifications', icon: Bell, roles: ['super_admin', 'admin', 'teacher', 'client', 'rental_player'] },
];

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, isLoading, logout, userRole, isAuthenticated } = useAuth();
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [layoutReady, setLayoutReady] = useState(false);

  // Layout state monitoring
  const hasValidAuth = user || isAuthenticated || localStorage.getItem('isAuthenticated') === 'true';
  const isAuthPage = location === '/auth' || location === '/' || location.startsWith('/auth');
  const shouldShowLayout = hasValidAuth || !isAuthPage;

  // Fetch tenant stats for header badges
  const { data: stats } = useQuery({
    queryKey: ['/api/admin/dashboard/stats'],
    enabled: !!user && userRole === 'admin'
  }) as { data?: { tenant?: { name?: string; status?: string; plan?: string } } };

  // Ensure layout is ready after auth check completes
  React.useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => {
        setLayoutReady(true);
      }, 100); // Small delay to ensure state is stable
      
      return () => clearTimeout(timer);
    }
  }, [isLoading, hasValidAuth]);

  // Show loading spinner during initial auth check or layout preparation
  if (isLoading || (shouldShowLayout && !layoutReady)) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Only render children without layout for auth pages when not authenticated
  if (!shouldShowLayout) {
    return <>{children}</>;
  }

  // Robust role detection with multiple fallbacks to prevent menu issues
  const getActualRole = (): string => {
    // 1. Check user object from context (highest priority)
    if (user?.role) {
      localStorage.setItem('userRole', user.role); // Persist for reliability
      return user.role;
    }
    
    // 2. Check userRole state
    if (userRole) {
      localStorage.setItem('userRole', userRole);
      return userRole;
    }
    
    // 3. Check JWT token from localStorage
    const token = localStorage.getItem('matchplay-token');
    if (token && typeof token === 'string') {
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          if (payload.userRole) {
            localStorage.setItem('userRole', payload.userRole);
            return payload.userRole;
          }
        }
      } catch (e) {
        console.warn('JWT decode failed:', e);
      }
    }
    
    // 4. Check persisted role from localStorage
    const persistedRole = localStorage.getItem('userRole');
    if (persistedRole && ['super_admin', 'admin', 'teacher', 'client', 'rental_player'].includes(persistedRole)) {
      return persistedRole;
    }
    
    // 5. Check current URL path for role context (reliable fallback)
    if (location.startsWith('/admin/')) return 'admin';
    if (location.startsWith('/teacher/')) return 'teacher';
    if (location.startsWith('/client/')) return 'client';
    if (location.startsWith('/rental-player/')) return 'rental_player';
    if (location.startsWith('/super-admin/')) return 'super_admin';
    
    // 6. Default to admin for authenticated users (prevents empty menu)
    return isAuthenticated ? 'admin' : 'client';
  };
  
  const actualRole = getActualRole();
  
  // Always show navigation - filter based on detected role
  const filteredNavigation = navigation.filter(item => 
    item.roles.includes(actualRole)
  );

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center flex-shrink-0 px-4 py-4">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">M</span>
          </div>
          <span className="ml-3 text-xl font-bold text-gray-900 dark:text-white">MatchPlay</span>
        </div>
      </div>
      
      <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
        {filteredNavigation.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                isActive
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                  : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <Icon className={`mr-3 h-5 w-5 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Sidebar Banner */}
      <div className="px-4 py-4">
        <BannerDisplay position="sidebar" className="w-full" maxAds={1} />
      </div>

      {/* User Profile Section */}
      <div className="px-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {user?.name}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
              {userRole}
            </p>
          </div>
          <button
            onClick={logout}
            className="ml-2 p-1 text-gray-400 hover:text-red-500 transition-colors"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:border-r lg:border-gray-200 lg:bg-white lg:dark:bg-gray-800 lg:dark:border-gray-700 lg:z-30">
        <SidebarContent />
      </div>

      {/* Mobile Header with Menu */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center">
            {/* Mobile Menu Button */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="mr-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-72 border-r">
                <SidebarContent />
              </SheetContent>
            </Sheet>
            
            {/* Logo */}
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">M</span>
              </div>
              <span className="ml-2 text-lg font-bold text-gray-900 dark:text-white">MatchPlay</span>
            </div>
          </div>
          
          {/* User Actions */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex min-h-screen">
        {/* Content with proper spacing */}
        <div className="flex-1 lg:ml-64 pt-16 lg:pt-0">
          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>

      {/* Banner Display Components */}
      <BannerDisplay position="header" />
      <BannerDisplay position="footer" />
      <AdModalManager />
    </div>
  );
};