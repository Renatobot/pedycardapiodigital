import { useState, useEffect } from 'react';
import pedyLogo from '@/assets/logo_pedy.png';

interface SplashScreenProps {
  establishmentName?: string;
  onComplete: () => void;
  duration?: number;
}

export function SplashScreen({ 
  establishmentName, 
  onComplete, 
  duration = 2500 
}: SplashScreenProps) {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFadeOut(true), duration - 500);
    const completeTimer = setTimeout(onComplete, duration);
    
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
    };
  }, [duration, onComplete]);

  return (
    <div 
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center 
        bg-background transition-opacity duration-500 ${fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
    >
      {/* Logo PEDY com animação */}
      <div className="flex flex-col items-center animate-fade-in">
        <img 
          src={pedyLogo} 
          alt="PEDY" 
          className="h-24 md:h-32 mb-6 animate-pulse"
        />
        
        {/* Texto "Desenvolvido por" */}
        <p className="text-sm text-muted-foreground mb-1">
          desenvolvido por
        </p>
        
        <h1 className="text-2xl font-bold text-primary">
          PEDY
        </h1>
        
        {/* Nome do estabelecimento (opcional) */}
        {establishmentName && (
          <p className="text-sm text-muted-foreground mt-8 animate-pulse">
            Carregando {establishmentName}...
          </p>
        )}
      </div>
    </div>
  );
}
