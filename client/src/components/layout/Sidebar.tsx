import React from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  MapPin, 
  CreditCard, 
  MessageSquare, 
  Building2,
  Bell,
  Settings,
  LogOut,
  DollarSign,
  PartyPopper,
  GraduationCap,
  Palette
} from 'lucide-react';

// Navigation for different user roles
const getNavigationForRole = (role: string) => {
  if (role === 'admin') {
    // Admin/Court Owner Navigation - Updated with Players for Hire
    return [
      { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
      { name: 'Quadras', href: '/admin/courts', icon: MapPin },
      { name: 'Professores', href: '/admin/professors', icon: GraduationCap },
      { name: 'Jogadores', href: '/admin/players-for-hire', icon: Users },
      { name: 'Preços', href: '/admin/pricing', icon: DollarSign },
      { name: 'Eventos', href: '/admin/events', icon: PartyPopper },
      { name: 'Reservas', href: '/admin/bookings', icon: Calendar },
      { name: 'Pagamentos', href: '/admin/payments', icon: CreditCard },
      { name: 'Relatórios', href: '/admin/reports', icon: CreditCard },
      { name: 'WhatsApp', href: '/admin/whatsapp', icon: MessageSquare },
      { name: 'Integrações', href: '/admin/corporate', icon: Building2 },
      { name: 'Notificações', href: '/admin/notifications', icon: Bell },
      { name: 'Perfil', href: '/admin/profile', icon: Building2 },
      { name: 'Personalização', href: '/admin/branding', icon: Palette }
    ];
  } else if (role === 'client') {
    // Client Navigation
    return [
      { name: 'Dashboard', href: '/', icon: LayoutDashboard },
      { name: 'Reservar Quadra', href: '/book-court', icon: Calendar },
      { name: 'Agendar Aula', href: '/book-lesson', icon: Users },
      { name: 'Histórico', href: '/history', icon: CreditCard },
      { name: 'Programa Fidelidade', href: '/loyalty', icon: Settings },
      { name: 'Comunidade', href: '/community', icon: Users },
      { name: 'Gamificação', href: '/gamification', icon: Settings },
      { name: 'Ranking', href: '/ranking', icon: Settings },
      { name: 'Recompensas', href: '/rewards', icon: Settings },
      { name: 'Medalhas', href: '/badges', icon: Settings },
      { name: 'Notificações', href: '/notifications', icon: Bell }
    ];
  } else if (role === 'teacher') {
    // Teacher Navigation
    return [
      { name: 'Dashboard', href: '/', icon: LayoutDashboard },
      { name: 'Minhas Aulas', href: '/teacher/lessons', icon: Calendar },
      { name: 'Alunos', href: '/teacher/students', icon: Users },
      { name: 'Horários', href: '/teacher/schedule', icon: Calendar },
      { name: 'Pagamentos', href: '/teacher/payments', icon: CreditCard },
      { name: 'Relatórios', href: '/teacher/reports', icon: CreditCard },
      { name: 'Notificações', href: '/notifications', icon: Bell }
    ];
  } else if (role === 'rental_player') {
    // Rental Player Navigation
    return [
      { name: 'Dashboard', href: '/', icon: LayoutDashboard },
      { name: 'Solicitações', href: '/rental/requests', icon: Calendar },
      { name: 'Histórico de Jogos', href: '/rental/history', icon: CreditCard },
      { name: 'Ganhos', href: '/rental/earnings', icon: DollarSign },
      { name: 'Disponibilidade', href: '/rental/availability', icon: Settings },
      { name: 'Notificações', href: '/notifications', icon: Bell }
    ];
  }
  
  // Default fallback
  return [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard }
  ];
};

const Sidebar: React.FC = () => {
  const [location] = useLocation();
  const { user, userRole, logout, courtInfo } = useAuth();

  // Force admin navigation if user is authenticated
  const effectiveRole = user ? 'admin' : userRole || 'client';
  const navigation = getNavigationForRole(effectiveRole);
  
  // Debug: Force console log to verify menu items - Config menu added
  console.log('MENU_UPDATED_CONFIG_2025:', navigation.map(item => item.name));

  return (
    <div className="flex h-full flex-col bg-white dark:bg-gray-800 shadow-sm border-r border-gray-200 dark:border-gray-700">
      {/* Logo */}
      <div className="flex h-16 items-center justify-center px-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">MP</span>
          </div>
          <span className="text-xl font-bold text-gray-900 dark:text-white">MatchPlay</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.name} href={item.href}>
              <a
                className={cn(
                  'group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                  isActive
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700'
                )}
              >
                <item.icon
                  className={cn(
                    'mr-3 h-5 w-5 flex-shrink-0',
                    isActive
                      ? 'text-blue-500 dark:text-blue-300'
                      : 'text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300'
                  )}
                />
                {item.name}
              </a>
            </Link>
          );
        })}
      </nav>

      {/* Court info for admin users */}
      {userRole === 'admin' && (
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
            <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
              Quadra Ativa
            </h3>
            <p className="text-xs text-blue-700 dark:text-blue-300">
              {courtInfo?.courtName || 'Centro Esportivo Vila Nova'}
            </p>
          </div>
        </div>
      )}

      {/* User info and logout */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center space-x-3 mb-3">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center">
            <span className="text-white text-sm font-medium">
              {user?.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {user?.name}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
              {userRole}
            </p>
          </div>
        </div>
        
        <button
          onClick={logout}
          className="flex w-full items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <LogOut className="mr-3 h-4 w-4" />
          Sair
        </button>
      </div>
    </div>
  );
};

export default Sidebar;