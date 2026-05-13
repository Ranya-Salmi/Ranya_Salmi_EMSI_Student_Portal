import { create } from 'zustand';
import { api, type User, type Role, type Alerte } from './api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  alertes: Alerte[];
  alertesNonLues: number;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  fetchAlertes: () => Promise<void>;
  marquerAlerteLue: (alerteId: number) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  alertes: [],
  alertesNonLues: 0,

  login: async (email: string, password: string) => {
    const response = await api.login(email, password);
    api.setToken(response.access_token);
    
    // Store user info in localStorage for quick access
    if (typeof window !== 'undefined') {
      localStorage.setItem('emsi_user', JSON.stringify({
        id: response.user_id,
        role: response.role,
        full_name: response.full_name,
      }));
    }

    const user = await api.me();
    set({ user, isAuthenticated: true, isLoading: false });
    
    // Fetch alertes after login
    get().fetchAlertes();
  },

  logout: () => {
    api.setToken(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('emsi_user');
      localStorage.removeItem('emsi_token');
      localStorage.removeItem('emsi_mock_user');
    }
    set({ user: null, isAuthenticated: false, isLoading: false, alertes: [], alertesNonLues: 0 });
  },

  checkAuth: async () => {
    const token = api.getToken();
    if (!token) {
      set({ isLoading: false });
      return;
    }

    try {
      const user = await api.me();
      set({ user, isAuthenticated: true, isLoading: false });
      get().fetchAlertes();
    } catch {
      // Token invalid
      api.setToken(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('emsi_user');
      }
      set({ isLoading: false });
    }
  },

  fetchAlertes: async () => {
    try {
      const alertes = await api.getMesAlertes();
      const alertesNonLues = alertes.filter(a => !a.lue).length;
      set({ alertes, alertesNonLues });
    } catch {
      // Ignore errors for alertes
    }
  },

  marquerAlerteLue: async (alerteId: number) => {
    await api.marquerAlerteLue(alerteId);
    const { alertes } = get();
    const updatedAlertes = alertes.map(a => 
      a.id === alerteId ? { ...a, lue: true } : a
    );
    const alertesNonLues = updatedAlertes.filter(a => !a.lue).length;
    set({ alertes: updatedAlertes, alertesNonLues });
  },
}));

// Role helpers
export function getRoleLabel(role: Role): string {
  const labels: Record<Role, string> = {
    admin: 'Administrateur',
    chef_filiere: 'Chef de Filière',
    enseignant: 'Enseignant',
    etudiant: 'Étudiant',
  };
  return labels[role] || role;
}

export function getRoleColor(role: Role): string {
  const colors: Record<Role, string> = {
    admin: 'bg-chart-4 text-white',
    chef_filiere: 'bg-primary text-primary-foreground',
    enseignant: 'bg-chart-2 text-white',
    etudiant: 'bg-chart-3 text-foreground',
  };
  return colors[role] || 'bg-muted text-muted-foreground';
}

export function getRiskColor(niveau: string): string {
  switch (niveau) {
    case 'faible':
      return 'text-[var(--risk-low)]';
    case 'modere':
      return 'text-[var(--risk-medium)]';
    case 'eleve':
      return 'text-[var(--risk-high)]';
    default:
      return 'text-muted-foreground';
  }
}

export function getRiskBgColor(niveau: string): string {
  switch (niveau) {
    case 'faible':
      return 'bg-[var(--risk-low)]/10 text-[var(--risk-low)]';
    case 'modere':
      return 'bg-[var(--risk-medium)]/10 text-[var(--risk-medium)]';
    case 'eleve':
      return 'bg-[var(--risk-high)]/10 text-[var(--risk-high)]';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

export function getUrgenceColor(urgence: string): string {
  switch (urgence) {
    case 'info':
      return 'bg-chart-2/10 text-chart-2 border-chart-2/20';
    case 'warning':
      return 'bg-[var(--risk-medium)]/10 text-[var(--risk-medium)] border-[var(--risk-medium)]/20';
    case 'critical':
      return 'bg-destructive/10 text-destructive border-destructive/20';
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
}
