import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Building2, ChevronDown, Check } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface Tenant {
  id: number;
  name: string;
  subdomain: string;
  customDomain?: string;
  status: string;
  plan: string;
}

interface TenantSwitcherProps {
  currentUser: any;
  onTenantSwitch?: (tenantId: number) => void;
}

export function TenantSwitcher({ currentUser, onTenantSwitch }: TenantSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get user's available tenants
  const { data: userTenants = [] } = useQuery({
    queryKey: ['/api/auth/user-tenants', currentUser?.id],
    queryFn: () => fetch('/api/auth/user-tenants').then(res => res.json()),
    enabled: !!currentUser?.id
  });

  const switchTenantMutation = useMutation({
    mutationFn: async (tenantId: number) => {
      const response = await fetch('/api/auth/switch-tenant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to switch tenant');
      }
      
      return response.json();
    },
    onSuccess: (data, tenantId) => {
      toast({
        title: "Quadra alterada com sucesso!",
        description: "A página será recarregada para aplicar as mudanças.",
      });
      
      // Invalidate all queries to refresh data
      queryClient.invalidateQueries();
      
      // Call callback if provided
      onTenantSwitch?.(tenantId);
      
      // Close dialog
      setIsOpen(false);
      
      // Reload page to apply tenant context
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao trocar quadra",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Don't show if user has access to only one tenant
  if (!userTenants || userTenants.length <= 1) {
    return null;
  }

  const currentTenant = userTenants.find((t: Tenant) => t.id === currentUser?.tenantId);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="justify-between">
          <div className="flex items-center space-x-2">
            <Building2 className="h-4 w-4" />
            <span className="truncate max-w-32">
              {currentTenant?.name || 'Selecionar Quadra'}
            </span>
          </div>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Trocar Quadra</DialogTitle>
          <DialogDescription>
            Você tem acesso a múltiplas quadras. Selecione onde deseja trabalhar:
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-3 py-4">
          {userTenants.map((tenant: Tenant) => (
            <Card
              key={tenant.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                tenant.id === currentUser?.tenantId
                  ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
              onClick={() => {
                if (tenant.id !== currentUser?.tenantId) {
                  switchTenantMutation.mutate(tenant.id);
                }
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <Building2 className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 dark:text-white truncate">
                        {tenant.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {tenant.subdomain}.matchplay.com
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Badge variant={tenant.plan === 'premium' ? 'default' : 'secondary'}>
                      {tenant.plan}
                    </Badge>
                    
                    {tenant.id === currentUser?.tenantId && (
                      <div className="flex items-center text-green-600">
                        <Check className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {switchTenantMutation.isPending && (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
              Trocando quadra...
            </span>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}