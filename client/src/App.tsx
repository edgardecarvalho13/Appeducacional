/**
 * FAMP Academy — App Root
 * Design: "Command Center" — Dark theme, RBAC routing.
 */

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, Redirect } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

// Pages
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import AccessDenied from "./pages/AccessDenied";
import {
  FlashcardsPage,
  TurmasPage,
  AvisosPage,
  ENAMEDPage,
  InternatoPage,
} from "./pages/ModulePlaceholder";
import PlannerPage from "./pages/PlannerPage";
import BibliotecaPage from "./pages/BibliotecaPage";
import QuestPage from "./pages/QuestPage";
import TutorPage from "./pages/TutorPage";
import CadernoErrosPage from "./pages/CadernoErrosPage";
import DesempenhoPage from "./pages/DesempenhoPage";

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/" component={() => <Redirect to="/dashboard" />} />
      <Route path="/login" component={Login} />
      <Route path="/acesso-negado" component={AccessDenied} />

      {/* All authenticated users - sem ProtectedRoute para demo */}
      <Route path="/dashboard">
        <Dashboard />
      </Route>

      {/* Student modules - sem ProtectedRoute para demo */}
      <Route path="/planner">
        <PlannerPage />
      </Route>
      <Route path="/quest">
        <QuestPage />
      </Route>
      <Route path="/tutor">
        <TutorPage />
      </Route>
      <Route path="/library">
        <BibliotecaPage />
      </Route>
      <Route path="/caderno-erros">
        <CadernoErrosPage />
      </Route>
      <Route path="/desempenho">
        <DesempenhoPage />
      </Route>
      <Route path="/flashcards">
        <FlashcardsPage />
      </Route>
      <Route path="/enamed">
        <ENAMEDPage />
      </Route>
      <Route path="/internato">
        <InternatoPage />
      </Route>

      {/* Coordination & Admin - sem ProtectedRoute para demo */}
      <Route path="/analytics">
        <DesempenhoPage />
      </Route>
      <Route path="/turmas">
        <TurmasPage />
      </Route>
      <Route path="/avisos">
        <AvisosPage />
      </Route>

      {/* Fallback */}
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark" switchable>
        <AuthProvider>
          <TooltipProvider>
            <Toaster
              position="top-right"
              toastOptions={{
                style: {
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  color: 'var(--card-foreground)',
                },
              }}
            />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
