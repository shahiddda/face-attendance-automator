
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      
      {/* Watermark - removed rotation */}
      <div className="fixed bottom-4 right-4 opacity-60 text-xs text-gray-500 dark:text-gray-400 pointer-events-none select-none z-50">
        <div className="bg-white/30 dark:bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm">
          <p className="font-light">
            Developed by 
            <span className="font-medium ml-1 text-purple-600 dark:text-purple-400">Shahid Inamdar</span> & 
            <span className="font-medium ml-1 text-purple-600 dark:text-purple-400">Saloni Upaskar</span>
          </p>
        </div>
      </div>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
