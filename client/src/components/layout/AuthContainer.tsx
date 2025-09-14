import { useState } from "react";
import { MultiTenantLogin } from "./MultiTenantLogin";
import { MultiTenantRegister } from "./MultiTenantRegister";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AuthContainerProps {
  onSuccess?: (user: any) => void;
  defaultTab?: 'login' | 'register';
}

export function AuthContainer({ onSuccess, defaultTab = 'login' }: AuthContainerProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);

  const handleSuccess = (user: any) => {
    onSuccess?.(user);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">M</span>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
            MatchPlay
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Sistema de gestão de quadras esportivas
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Entrar</TabsTrigger>
            <TabsTrigger value="register">Cadastrar</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login" className="mt-6">
            <MultiTenantLogin
              onSuccess={handleSuccess}
              onRegisterClick={() => setActiveTab('register')}
            />
          </TabsContent>
          
          <TabsContent value="register" className="mt-6">
            <MultiTenantRegister
              onSuccess={handleSuccess}
              onLoginClick={() => setActiveTab('login')}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}