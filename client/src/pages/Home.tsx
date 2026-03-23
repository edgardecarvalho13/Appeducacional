/**
 * FAMP Academy — Home Page
 * Redireciona para login ou dashboard conforme estado de autenticação.
 */

import { Redirect } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';

export default function Home() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Redirect to="/dashboard" />;
  }

  return <Redirect to="/login" />;
}
