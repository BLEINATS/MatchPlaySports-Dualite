import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

interface LogoutButtonProps {
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  className?: string;
}

export default function LogoutButton({ variant = "ghost", size = "default", className }: LogoutButtonProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      // Clear JWT token from localStorage
      localStorage.removeItem('matchplay-token');
      
      // Call logout endpoint to clear server-side session
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      
      toast({
        title: "Logout realizado com sucesso",
        description: "Você foi desconectado do sistema",
      });
      
      // Redirect to auth page for multi-tenant login
      setLocation('/auth');
      
      console.log('✅ Logout completed successfully');
    } catch (error) {
      console.error('Logout error:', error);
      // Even if server logout fails, clear client-side data
      localStorage.removeItem('matchplay-token');
      setLocation('/');
    }
  };

  return (
    <Button 
      variant={variant} 
      size={size} 
      onClick={handleLogout}
      className={className}
    >
      <LogOut className="h-4 w-4 mr-2" />
      Sair
    </Button>
  );
}