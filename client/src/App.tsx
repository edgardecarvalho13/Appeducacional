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
  PlannerPage,
  LibraryPage,
  FlashcardsPage,
  TurmasPage,
  AvisosPage,
} from "./pages/ModulePlaceholder";
import QuestPage from "./pages/QuestPage";
import TutorPage from "./pages/TutorPage";
import CadernoErrosPage from "./pages/CadernoErrosPage";
import DesempenhoPage from "./pages/DesempenhoPage";

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/" component={() => <Redirect to="/login" />} />
      <Route path="/login" component={Login} />
      <Route path="/acesso-negado" component={AccessDenied} />

      {/* Protected: All authenticated users */}
      <Route path="/dashboard">
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </Route>

      {/* Protected: Student modules */}
      <Route path="/planner">
        <ProtectedRoute>
          <PlannerPage />
        </ProtectedRoute>
      </Route>
      <Route path="/quest">
        <ProtectedRoute>
          <QuestPage />
        </ProtectedRoute>
      </Route>
      <Route path="/tutor">
        <ProtectedRoute>
          <TutorPage />
        </ProtectedRoute>
      </Route>
      <Route path="/library">
        <ProtectedRoute>
          <LibraryPage />
        </ProtectedRoute>
      </Route>
      <Route path="/caderno-erros">
        <ProtectedRoute>
          <CadernoErrosPage />
        </ProtectedRoute>
      </Route>
      <Route path="/desempenho">
        <ProtectedRoute>
          <DesempenhoPage />
        </ProtectedRoute>
      </Route>
      <Route path="/flashcards">
        <ProtectedRoute>
          <FlashcardsPage />
        </ProtectedRoute>
      </Route>

      {/* Protected: Coordination & Admin only */}
      <Route path="/analytics">
        <ProtectedRoute allowedRoles={['coordenacao', 'admin']}>
          <DesempenhoPage />
        </ProtectedRoute>
      </Route>
      <Route path="/turmas">
        <ProtectedRoute allowedRoles={['coordenacao', 'admin', 'professor']}>
          <TurmasPage />
        </ProtectedRoute>
      </Route>
      <Route path="/avisos">
        <ProtectedRoute allowedRoles={['coordenacao', 'admin']}>
          <AvisosPage />
        </ProtectedRoute>
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
      <ThemeProvider defaultTheme="dark">
        <AuthProvider>
          <TooltipProvider>
            <Toaster
              position="top-right"
              toastOptions={{
                style: {
                  background: 'oklch(0.19 0.025 250)',
                  border: '1px solid oklch(0.28 0.02 250)',
                  color: 'oklch(0.93 0.005 250)',
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
