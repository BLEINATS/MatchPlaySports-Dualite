import React from 'react';
import { useLocation } from 'wouter';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Sparkles } from "lucide-react";

interface ReservationHeaderProps {
  title: string;
  subtitle: string;
}

export const ReservationHeader: React.FC<ReservationHeaderProps> = ({ title, subtitle }) => {
  const [, navigate] = useLocation();

  return (
    <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between h-auto sm:h-16 py-3 sm:py-0 gap-3 sm:gap-0">
          <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/admin/bookings")}
              className="flex items-center gap-1 sm:gap-2 hover:bg-blue-50 dark:hover:bg-gray-800 text-xs sm:text-sm"
            >
              <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
              Voltar
            </Button>
            <div className="h-4 sm:h-6 w-px bg-gray-300 dark:bg-gray-600" />
            <div className="flex-1">
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {title}
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 hidden sm:block">
                {subtitle}
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="flex items-center gap-1 text-xs self-start sm:self-center">
            <Sparkles className="h-3 w-3" />
            <span className="hidden sm:inline">Sistema Profissional</span>
            <span className="sm:hidden">Pro</span>
          </Badge>
        </div>
      </div>
    </div>
  );
};