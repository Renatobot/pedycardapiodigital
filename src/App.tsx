import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "next-themes";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { PWARedirectHandler } from "@/components/PWARedirectHandler";

// Landing carrega imediato (LCP crítico). O resto é code-split.
import LandingPage from "./pages/LandingPage";

const LoginPage = lazy(() => import("./pages/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const MenuPage = lazy(() => import("./pages/MenuPage"));
const CheckoutPage = lazy(() => import("./pages/CheckoutPage"));
const UpgradePage = lazy(() => import("./pages/UpgradePage"));
const AdminLoginPage = lazy(() => import("./pages/AdminLoginPage"));
const AdminDashboardPage = lazy(() => import("./pages/AdminDashboardPage"));
const AdminEstablishmentDashboard = lazy(() => import("./pages/AdminEstablishmentDashboard"));
const ResellerDashboardPage = lazy(() => import("./pages/ResellerDashboardPage"));
const ResellerSalesPage = lazy(() => import("./pages/ResellerSalesPage"));
const DemoPage = lazy(() => import("./pages/DemoPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Cache mais eficiente: reduz refetch desnecessário e melhora percepção de velocidade.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const RouteFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <TooltipProvider>
        <AuthProvider>
          <CartProvider>
            <Toaster />
            <Sonner />
            <PWAInstallPrompt />
            <BrowserRouter>
              <PWARedirectHandler />
              <Suspense fallback={<RouteFallback />}>
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/cadastro" element={<RegisterPage />} />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/cardapio/:id" element={<MenuPage />} />
                  <Route path="/cardapio/:id/checkout" element={<CheckoutPage />} />
                  <Route path="/:slug" element={<MenuPage />} />
                  <Route path="/:slug/checkout" element={<CheckoutPage />} />
                  <Route path="/upgrade" element={<UpgradePage />} />
                  <Route path="/demo" element={<DemoPage />} />
                  {/* Admin Routes */}
                  <Route path="/admin/login" element={<AdminLoginPage />} />
                  <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
                  <Route path="/admin/dashboard/:establishmentId" element={<AdminEstablishmentDashboard />} />
                  {/* Reseller Routes */}
                  <Route path="/revendedor" element={<ResellerDashboardPage />} />
                  <Route path="/parceiro/:referralCode" element={<ResellerSalesPage />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </CartProvider>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
