import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Calendar, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface Tenant {
  id: number;
  name: string;
  subdomain: string;
  customDomain?: string;
  status: string;
  plan: string;
  settings?: any;
}

interface TenantSelectorProps {
  selectedTenants: number[];
  onSelectionChange: (tenantIds: number[]) => void;
  multiple?: boolean;
  role: 'client' | 'teacher' | 'rental_player' | 'admin';
}

export function TenantSelector({ selectedTenants, onSelectionChange, multiple = false, role }: TenantSelectorProps) {
  const [location, setLocation] = useState("");
  const [search, setSearch] = useState("");

  const { data: tenants = [], isLoading } = useQuery({
    queryKey: ['/api/auth/tenants', location, search],
    queryFn: () => {
      const params = new URLSearchParams();
      if (location) params.set('location', location);
      if (search) params.set('search', search);
      return fetch(`/api/auth/tenants?${params}`).then(res => res.json());
    }
  });

  const handleTenantToggle = (tenantId: number) => {
    if (multiple) {
      const newSelection = selectedTenants.includes(tenantId)
        ? selectedTenants.filter(id => id !== tenantId)
        : [...selectedTenants, tenantId];
      onSelectionChange(newSelection);
    } else {
      onSelectionChange([tenantId]);
    }
  };

  const getRoleDescription = () => {
    switch (role) {
      case 'client':
        return 'Selecione as quadras onde você deseja jogar';
      case 'teacher':
        return 'Selecione as quadras onde você dará aulas';
      case 'rental_player':
        return 'Selecione as quadras onde você oferece serviços de aluguel';
      case 'admin':
        return 'Selecione a quadra que você administra';
      default:
        return 'Selecione as quadras';
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {getRoleDescription()}
        </Label>
        {multiple && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Você pode selecionar múltiplas quadras
          </p>
        )}
      </div>

      {/* Search and Filter */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="location" className="text-sm font-medium">Localização</Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="location"
              placeholder="Ex: Barra da Tijuca, RJ"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div>
          <Label htmlFor="search" className="text-sm font-medium">Buscar quadra</Label>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="search"
              placeholder="Nome da quadra..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Tenant List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="col-span-full text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-sm text-gray-500 mt-2">Carregando quadras...</p>
          </div>
        ) : tenants.length === 0 ? (
          <div className="col-span-full text-center py-8">
            <p className="text-sm text-gray-500">Nenhuma quadra encontrada</p>
          </div>
        ) : (
          tenants.map((tenant: Tenant) => (
            <Card
              key={tenant.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedTenants.includes(tenant.id)
                  ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
              onClick={() => handleTenantToggle(tenant.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{tenant.name}</CardTitle>
                  <Badge variant={tenant.plan === 'premium' ? 'default' : 'secondary'}>
                    {tenant.plan}
                  </Badge>
                </div>
                <CardDescription>
                  {tenant.subdomain}.matchplay.com
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>Ativo</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>Disponível</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Selection Summary */}
      {selectedTenants.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-blue-900 dark:text-blue-100">
                {selectedTenants.length} quadra{selectedTenants.length > 1 ? 's' : ''} selecionada{selectedTenants.length > 1 ? 's' : ''}
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                {multiple && role !== 'admin' ? 'Você pode adicionar ou remover quadras depois' : 'Confirme sua seleção para continuar'}
              </p>
            </div>
            {multiple && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSelectionChange([])}
                className="text-blue-700 border-blue-300 hover:bg-blue-100"
              >
                Limpar seleção
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}