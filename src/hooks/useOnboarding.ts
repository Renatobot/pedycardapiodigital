import { useState, useEffect, useCallback } from 'react';

const ONBOARDING_PROGRESS_KEY = 'pedy_onboarding_progress';
const ONBOARDING_COMPLETE_KEY = 'pedy_onboarding_complete';

export interface OnboardingStep {
  id: string;
  label: string;
  completed: boolean;
}

const DEFAULT_STEPS: OnboardingStep[] = [
  { id: 'logo', label: 'Adicionar logo', completed: false },
  { id: 'category', label: 'Criar primeira categoria', completed: false },
  { id: 'product', label: 'Adicionar primeiro produto', completed: false },
  { id: 'product_image', label: 'Adicionar foto ao produto', completed: false },
  { id: 'share_link', label: 'Copiar link do cardápio', completed: false },
];

export function useOnboarding() {
  const [steps, setSteps] = useState<OnboardingStep[]>(DEFAULT_STEPS);
  const [isComplete, setIsComplete] = useState(false);
  const [showProgress, setShowProgress] = useState(true);

  // Carregar progresso salvo
  useEffect(() => {
    try {
      const savedProgress = localStorage.getItem(ONBOARDING_PROGRESS_KEY);
      const isOnboardingComplete = localStorage.getItem(ONBOARDING_COMPLETE_KEY);

      if (isOnboardingComplete === 'true') {
        setIsComplete(true);
        setShowProgress(false);
        return;
      }

      if (savedProgress) {
        const parsed = JSON.parse(savedProgress);
        setSteps(prevSteps => 
          prevSteps.map(step => ({
            ...step,
            completed: parsed[step.id] || false,
          }))
        );
      }
    } catch (error) {
      console.error('Erro ao carregar progresso do onboarding:', error);
    }
  }, []);

  // Salvar progresso
  const saveProgress = useCallback((updatedSteps: OnboardingStep[]) => {
    try {
      const progress: Record<string, boolean> = {};
      updatedSteps.forEach(step => {
        progress[step.id] = step.completed;
      });
      localStorage.setItem(ONBOARDING_PROGRESS_KEY, JSON.stringify(progress));
    } catch (error) {
      console.error('Erro ao salvar progresso do onboarding:', error);
    }
  }, []);

  // Marcar passo como completo
  const completeStep = useCallback((stepId: string) => {
    setSteps(prevSteps => {
      const updated = prevSteps.map(step =>
        step.id === stepId ? { ...step, completed: true } : step
      );
      saveProgress(updated);

      // Verificar se todos os passos foram completados
      const allComplete = updated.every(step => step.completed);
      if (allComplete) {
        localStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
        setIsComplete(true);
      }

      return updated;
    });
  }, [saveProgress]);

  // Resetar onboarding
  const resetOnboarding = useCallback(() => {
    localStorage.removeItem(ONBOARDING_PROGRESS_KEY);
    localStorage.removeItem(ONBOARDING_COMPLETE_KEY);
    setSteps(DEFAULT_STEPS);
    setIsComplete(false);
    setShowProgress(true);
  }, []);

  // Fechar barra de progresso
  const dismissProgress = useCallback(() => {
    setShowProgress(false);
  }, []);

  // Calcular progresso
  const completedCount = steps.filter(step => step.completed).length;
  const totalSteps = steps.length;
  const progressPercentage = Math.round((completedCount / totalSteps) * 100);

  return {
    steps,
    isComplete,
    showProgress,
    completedCount,
    totalSteps,
    progressPercentage,
    completeStep,
    resetOnboarding,
    dismissProgress,
  };
}

// Hook para verificar se é a primeira visita do usuário
export function useFirstVisit(key: string = 'pedy_first_visit') {
  const [isFirstVisit, setIsFirstVisit] = useState(false);

  useEffect(() => {
    const hasVisited = localStorage.getItem(key);
    if (!hasVisited) {
      setIsFirstVisit(true);
    }
  }, [key]);

  const markAsVisited = useCallback(() => {
    localStorage.setItem(key, 'true');
    setIsFirstVisit(false);
  }, [key]);

  return { isFirstVisit, markAsVisited };
}
