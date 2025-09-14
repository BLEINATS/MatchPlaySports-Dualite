import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { TenantSelector } from "./TenantSelector";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, ArrowRight } from "lucide-react";

const registerSchema = z.object({
  username: z.string().min(3, "Username deve ter pelo menos 3 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  confirmPassword: z.string(),
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  phone: z.string().optional(),
  role: z.enum(['client', 'teacher', 'rental_player', 'admin']),
  hourlyRate: z.string().optional(),
  commissionPercent: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Senhas não coincidem",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

interface MultiTenantRegisterProps {
  onSuccess?: (user: any) => void;
  onLoginClick?: () => void;
}

export function MultiTenantRegister({ onSuccess, onLoginClick }: MultiTenantRegisterProps) {
  const [step, setStep] = useState(1);
  const [selectedTenants, setSelectedTenants] = useState<number[]>([]);
  const { toast } = useToast();

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      name: "",
      phone: "",
      role: "client",
      hourlyRate: "",
      commissionPercent: ""
    }
  });

  const role = form.watch("role");

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterFormData & { tenantIds: number[] }) => {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Registration failed');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Cadastro realizado com sucesso!",
        description: "Sua conta foi criada. Agora você pode fazer login.",
      });
      onSuccess?.(data.user);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro no cadastro",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const onSubmit = (data: RegisterFormData) => {
    if (step === 1) {
      setStep(2);
      return;
    }

    if (selectedTenants.length === 0) {
      toast({
        title: "Seleção obrigatória",
        description: "Selecione pelo menos uma quadra para continuar.",
        variant: "destructive",
      });
      return;
    }

    registerMutation.mutate({ ...data, tenantIds: selectedTenants });
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'client':
        return 'Cliente/Jogador';
      case 'teacher':
        return 'Professor';
      case 'rental_player':
        return 'Jogador de Aluguel';
      case 'admin':
        return 'Administrador';
      default:
        return role;
    }
  };

  const shouldShowTenantSelection = () => {
    return role && ['client', 'teacher', 'rental_player', 'admin'].includes(role);
  };

  const isMultipleSelection = () => {
    return role === 'teacher' || role === 'rental_player' || role === 'client';
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">
          Criar Conta - {step === 1 ? 'Dados Pessoais' : 'Seleção de Quadras'}
        </CardTitle>
        <CardDescription className="text-center">
          {step === 1 
            ? 'Preencha seus dados para criar uma conta'
            : `Como ${getRoleLabel(role).toLowerCase()}, selecione as quadras onde deseja atuar`
          }
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {step === 1 && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome Completo</FormLabel>
                        <FormControl>
                          <Input placeholder="Seu nome completo" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome de Usuário</FormLabel>
                        <FormControl>
                          <Input placeholder="seu_usuario" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="seu@email.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone (Opcional)</FormLabel>
                        <FormControl>
                          <Input placeholder="(11) 99999-9999" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Senha</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Sua senha" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirmar Senha</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Confirme sua senha" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Usuário</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione seu tipo de usuário" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="client">Cliente/Jogador</SelectItem>
                          <SelectItem value="teacher">Professor</SelectItem>
                          <SelectItem value="rental_player">Jogador de Aluguel</SelectItem>
                          <SelectItem value="admin">Administrador de Quadra</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {(role === 'teacher' || role === 'rental_player') && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="hourlyRate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Taxa por Hora (R$)</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="150.00" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="commissionPercent"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Comissão (%)</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="15" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </>
            )}

            {step === 2 && shouldShowTenantSelection() && (
              <TenantSelector
                selectedTenants={selectedTenants}
                onSelectionChange={setSelectedTenants}
                multiple={isMultipleSelection()}
                role={role as any}
              />
            )}

            <div className="flex justify-between">
              {step === 2 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Voltar
                </Button>
              )}
              
              <div className="flex-1" />
              
              <Button
                type="submit"
                disabled={registerMutation.isPending}
                className="flex items-center gap-2"
              >
                {registerMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : step === 1 ? (
                  <>
                    Próximo
                    <ArrowRight className="h-4 w-4" />
                  </>
                ) : (
                  'Criar Conta'
                )}
              </Button>
            </div>
          </form>
        </Form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Já tem uma conta?{' '}
            <button
              onClick={onLoginClick}
              className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
            >
              Fazer login
            </button>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}