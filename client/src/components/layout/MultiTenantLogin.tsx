import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Building2, Eye, EyeOff } from "lucide-react";
import { useLocation } from "wouter";

const loginSchema = z.object({
  email: z.string().min(1, "Digite um endereço de e-mail ou username"),
  password: z.string().min(1, "Senha é obrigatória"),
  tenantId: z.number().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface MultiTenantLoginProps {
  onSuccess?: (user: any) => void;
  onRegisterClick?: () => void;
}

interface Tenant {
  id: number;
  name: string;
  subdomain: string;
  customDomain?: string;
  status: string;
  plan: string;
}

export function MultiTenantLogin({ onSuccess, onRegisterClick }: MultiTenantLoginProps) {
  const [step, setStep] = useState(1);
  const [userTenants, setUserTenants] = useState<Tenant[]>([]);
  const [tempCredentials, setTempCredentials] = useState<{ email: string; password: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    }
  });

  // First, try to login and get available tenants
  const checkUserMutation = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      // If user has multiple tenants, show tenant selection
      if (data.user.availableTenants && data.user.availableTenants.length > 1) {
        setUserTenants(data.user.availableTenants);
        setTempCredentials({ email: form.getValues('email'), password: form.getValues('password') });
        setStep(2);
      } else {
        // Store JWT token in localStorage
        if (data.token) {
          localStorage.setItem('matchplay-token', data.token);
          console.log('✅ JWT token stored successfully');
        }
        
        // Direct login success
        toast({
          title: "Login realizado com sucesso!",
          description: `Bem-vindo, ${data.user.name}!`,
        });
        
        // Handle redirect based on user role
        if (data.user.role === 'admin') {
          setLocation('/admin/dashboard');
        } else if (data.user.role === 'teacher') {
          setLocation('/teacher/dashboard');
        } else if (data.user.role === 'client') {
          setLocation('/client/dashboard');
        } else if (data.user.role === 'rental_player') {
          setLocation('/rental-player/dashboard');
        } else {
          onSuccess?.(data.user);
        }
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Erro no login",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Login with specific tenant
  const loginWithTenantMutation = useMutation({
    mutationFn: async (data: { email: string; password: string; tenantId: number }) => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      // Store JWT token in localStorage
      if (data.token) {
        localStorage.setItem('matchplay-token', data.token);
        console.log('✅ JWT token stored successfully');
      }
      
      toast({
        title: "Login realizado com sucesso!",
        description: `Bem-vindo, ${data.user.name}!`,
      });
      
      // Handle redirect based on user role
      if (data.user.role === 'admin') {
        setLocation('/admin/dashboard');
      } else if (data.user.role === 'teacher') {
        setLocation('/teacher/dashboard');
      } else if (data.user.role === 'client') {
        setLocation('/client/dashboard');
      } else if (data.user.role === 'rental_player') {
        setLocation('/rental-player/dashboard');
      } else if (data.redirectTo) {
        window.location.href = data.redirectTo;
      } else {
        setLocation('/dashboard');
      }
      
      onSuccess?.(data.user);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro no login",
        description: error.message,
        variant: "destructive",
      });
      // Go back to step 1 on error
      setStep(1);
      setTempCredentials(null);
    }
  });

  const onSubmit = (data: LoginFormData) => {
    if (step === 1) {
      checkUserMutation.mutate({ email: data.email, password: data.password });
    } else if (step === 2 && tempCredentials && data.tenantId) {
      loginWithTenantMutation.mutate({
        email: tempCredentials.email,
        password: tempCredentials.password,
        tenantId: data.tenantId
      });
    }
  };

  const handleTenantSelect = (tenantId: number) => {
    form.setValue('tenantId', tenantId);
    if (tempCredentials) {
      loginWithTenantMutation.mutate({
        ...tempCredentials,
        tenantId
      });
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">
          {step === 1 ? 'Entrar' : 'Selecionar Quadra'}
        </CardTitle>
        <CardDescription className="text-center">
          {step === 1 
            ? 'Entre com suas credenciais'
            : 'Você tem acesso a múltiplas quadras. Selecione onde deseja entrar:'
          }
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {step === 1 && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input 
                        type="text" 
                        placeholder="Digite um endereço de e-mail" 
                        {...field} 
                        disabled={checkUserMutation.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          type={showPassword ? "text" : "password"}
                          placeholder="Digite sua senha" 
                          {...field} 
                          disabled={checkUserMutation.isPending}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                          disabled={checkUserMutation.isPending}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />



              <Button 
                type="submit" 
                className="w-full" 
                disabled={checkUserMutation.isPending}
              >
                {checkUserMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  'Entrar'
                )}
              </Button>
            </form>
          </Form>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="grid gap-3">
              {userTenants.map((tenant) => (
                <Card
                  key={tenant.id}
                  className="cursor-pointer transition-all hover:shadow-md hover:bg-gray-50 dark:hover:bg-gray-800"
                  onClick={() => handleTenantSelect(tenant.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <Building2 className="h-8 w-8 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 dark:text-white truncate">
                          {tenant.name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {tenant.subdomain}.matchplay.com
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          tenant.plan === 'premium' 
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                        }`}>
                          {tenant.plan}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setStep(1);
                setTempCredentials(null);
                setUserTenants([]);
              }}
              disabled={loginWithTenantMutation.isPending}
            >
              Voltar ao Login
            </Button>

            {loginWithTenantMutation.isPending && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                  Conectando...
                </span>
              </div>
            )}
          </div>
        )}

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Não tem uma conta?{' '}
            <button
              onClick={onRegisterClick}
              className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
              disabled={checkUserMutation.isPending || loginWithTenantMutation.isPending}
            >
              Cadastrar-se
            </button>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}