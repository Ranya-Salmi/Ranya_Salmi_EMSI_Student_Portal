// API configuration and helper functions for EMSI Portail
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Mock mode forced until the real backend/database is implemented
const MOCK_MODE = true;

// Mock users for testing
const MOCK_USERS: Record<string, { password: string; user: User }> = {
  'admin@emsi.ma': {
    password: 'admin2026',
    user: {
      id: 1,
      email: 'admin@emsi.ma',
      role: 'admin',
      first_name: 'Admin',
      last_name: 'EMSI',
      full_name: 'Admin EMSI',
      is_active: true,
    },
  },
  'chef.iir@emsi.ma': {
    password: 'chef2026',
    user: {
      id: 2,
      email: 'chef.iir@emsi.ma',
      role: 'chef_filiere',
      first_name: 'Mohammed',
      last_name: 'BENALI',
      full_name: 'Mohammed BENALI',
      is_active: true,
    },
  },
  'prof.analyse@emsi.ma': {
    password: 'prof2026',
    user: {
      id: 3,
      email: 'prof.analyse@emsi.ma',
      role: 'enseignant',
      first_name: 'Fatima',
      last_name: 'ZAHRA',
      full_name: 'Fatima ZAHRA',
      is_active: true,
    },
  },
  'etudiant1@emsi.ma': {
    password: 'etu2026',
    user: {
      id: 4,
      email: 'etudiant1@emsi.ma',
      role: 'etudiant',
      first_name: 'Youssef',
      last_name: 'ALAMI',
      full_name: 'Youssef ALAMI',
      cne: 'E123456789',
      promotion_id: 1,
      is_active: true,
    },
  },
};

export type Role = 'admin' | 'chef_filiere' | 'enseignant' | 'etudiant';

export interface User {
  id: number;
  email: string;
  role: Role;
  first_name: string;
  last_name: string;
  full_name: string;
  cne?: string;
  promotion_id?: number;
  is_active: boolean;
}

export interface LoginResponse {
  access_token: string;
  role: Role;
  user_id: number;
  full_name: string;
}

export interface Alerte {
  id: number;
  etudiant_id: number;
  etudiant_nom?: string;
  type: string;
  urgence: 'info' | 'warning' | 'critical';
  titre: string;
  message: string;
  lue: boolean;
  created_at: string;
}

export interface EtudiantRisque {
  id: number;
  full_name: string;
  cne: string;
  email: string;
  score: number;
  niveau_risque: 'faible' | 'modere' | 'eleve';
  couleur_alerte: 'green' | 'orange' | 'red';
  taux_absence: number;
  moyenne_generale: number;
}

export interface KPIs {
  nombre_etudiants: number;
  moyenne_generale_filiere: number;
  taux_reussite: number;
  taux_absence_moyen: number;
  etudiants_risque_eleve: number;
  nombre_alertes_non_lues: number;
}

export interface ModuleStats {
  module_id: number;
  module_nom: string;
  moyenne_classe: number;
  taux_reussite: number;
  ecart_type: number;
  distribution: {
    '0-5': number;
    '5-10': number;
    '10-12': number;
    '12-14': number;
    '14-16': number;
    '16-20': number;
  };
}

export interface Note {
  id: number;
  etudiant_id: number;
  evaluation_id: number;
  evaluation_nom: string;
  module_nom: string;
  module_id: number;
  valeur: number | null;
  coefficient: number;
  bareme_max: number;
  date: string;
  statut: string;
}

export interface Absence {
  id: number;
  etudiant_id: number;
  module_id: number;
  module_nom: string;
  date_cours: string;
  justifiee: boolean;
  statut: string;
  motif_justification?: string;
}

export interface RecapEtudiant {
  etudiant: {
    id: number;
    cne: string;
    full_name: string;
    email: string;
  };
  notes: Note[];
  absences: Absence[];
  alertes: Alerte[];
  score_risque: {
    score: number;
    niveau: string;
    couleur: string;
  } | null;
}

export interface AuditLog {
  id: number;
  user_id: number;
  user_email: string;
  table_name: string;
  record_id: number;
  action: string;
  ancienne_valeur: Record<string, unknown> | null;
  nouvelle_valeur: Record<string, unknown> | null;
  raison_modification: string | null;
  timestamp: string;
  ip_adresse: string | null;
}

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('emsi_token', token);
      } else {
        localStorage.removeItem('emsi_token');
      }
    }
  }

  getToken(): string | null {
    if (this.token) return this.token;
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('emsi_token');
    }
    return this.token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Erreur réseau' }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Auth
  async login(email: string, password: string): Promise<LoginResponse> {
    // Mock mode - authenticate locally
    if (MOCK_MODE) {
      return this.mockLogin(email, password);
    }
    
    return this.request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  private mockLogin(email: string, password: string): Promise<LoginResponse> {
    return new Promise((resolve, reject) => {
      // Simulate network delay
      setTimeout(() => {
        const mockUser = MOCK_USERS[email.toLowerCase()];
        
        if (!mockUser) {
          reject(new Error('Email ou mot de passe incorrect'));
          return;
        }
        
        if (mockUser.password !== password) {
          reject(new Error('Email ou mot de passe incorrect'));
          return;
        }
        
        // Store mock user in localStorage for me() to retrieve
        if (typeof window !== 'undefined') {
          localStorage.setItem('emsi_mock_user', JSON.stringify(mockUser.user));
        }
        
        resolve({
          access_token: `mock_token_${mockUser.user.id}_${Date.now()}`,
          role: mockUser.user.role,
          user_id: mockUser.user.id,
          full_name: mockUser.user.full_name,
        });
      }, 500);
    });
  }

  async me(): Promise<User> {
    // Mock mode - return stored user
    if (MOCK_MODE) {
      return this.mockMe();
    }
    
    return this.request<User>('/auth/me');
  }

  private mockMe(): Promise<User> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined') {
        reject(new Error('Non authentifié'));
        return;
      }
      
      const storedUser = localStorage.getItem('emsi_mock_user');
      if (!storedUser) {
        reject(new Error('Non authentifié'));
        return;
      }
      
      try {
        resolve(JSON.parse(storedUser) as User);
      } catch {
        reject(new Error('Session invalide'));
      }
    });
  }

  // Dashboard
  async getEtudiantsRisque(filiereId?: number): Promise<EtudiantRisque[]> {
    if (MOCK_MODE) {
      return Promise.resolve([
        { id: 4, full_name: 'Youssef ALAMI', cne: 'E123456789', email: 'youssef.alami@emsi.ma', score: 78, niveau_risque: 'eleve', couleur_alerte: 'red', moyenne_generale: 8.5, taux_absence: 25 },
        { id: 5, full_name: 'Sara IDRISSI', cne: 'E987654321', email: 'sara.idrissi@emsi.ma', score: 55, niveau_risque: 'modere', couleur_alerte: 'orange', moyenne_generale: 11.2, taux_absence: 15 },
        { id: 8, full_name: 'Imane BENNANI', cne: 'E456789123', email: 'imane.bennani@emsi.ma', score: 82, niveau_risque: 'eleve', couleur_alerte: 'red', moyenne_generale: 7.8, taux_absence: 30 },
        { id: 9, full_name: 'Omar ZIANI', cne: 'E321654987', email: 'omar.ziani@emsi.ma', score: 45, niveau_risque: 'modere', couleur_alerte: 'orange', moyenne_generale: 12.5, taux_absence: 10 },
        { id: 10, full_name: 'Leila FASSI', cne: 'E789123456', email: 'leila.fassi@emsi.ma', score: 25, niveau_risque: 'faible', couleur_alerte: 'green', moyenne_generale: 14.2, taux_absence: 5 },
      ]);
    }
    const params = filiereId ? `?filiere_id=${filiereId}` : '';
    return this.request<EtudiantRisque[]>(`/dashboard/etudiants-risque${params}`);
  }

  async getKPIs(filiereId?: number): Promise<KPIs> {
    if (MOCK_MODE) {
      return Promise.resolve({
        nombre_etudiants: 156,
        moyenne_generale_filiere: 12.8,
        taux_reussite: 85,
        taux_absence_moyen: 8.5,
        etudiants_risque_eleve: 12,
        nombre_alertes_non_lues: 5,
      });
    }
    const params = filiereId ? `?filiere_id=${filiereId}` : '';
    return this.request<KPIs>(`/dashboard/kpis${params}`);
  }

  async getModuleStats(moduleId: number): Promise<ModuleStats> {
    if (MOCK_MODE) {
      return Promise.resolve({
        module_id: moduleId,
        module_nom: 'Analyse de donnees',
        moyenne_classe: 13.5,
        taux_reussite: 88,
        ecart_type: 2.8,
        distribution: {
          '0-5': 2,
          '5-10': 5,
          '10-12': 12,
          '12-14': 15,
          '14-16': 8,
          '16-20': 3,
        },
      });
    }
    return this.request<ModuleStats>(`/dashboard/module/${moduleId}/stats`);
  }

  async getMesAlertes(lues?: boolean): Promise<Alerte[]> {
    // Mock mode - return empty array
    if (MOCK_MODE) {
      return Promise.resolve([]);
    }
    const params = lues !== undefined ? `?lues=${lues}` : '';
    return this.request<Alerte[]>(`/dashboard/mes-alertes${params}`);
  }

  async marquerAlerteLue(alerteId: number): Promise<{ id: number; lue: boolean }> {
    // Mock mode
    if (MOCK_MODE) {
      return Promise.resolve({ id: alerteId, lue: true });
    }
    return this.request(`/dashboard/alertes/${alerteId}/lue`, { method: 'PATCH' });
  }

  // Notes
  async saisirNote(etudiantId: number, evaluationId: number, valeur: number): Promise<Note> {
    return this.request<Note>('/notes', {
      method: 'POST',
      body: JSON.stringify({
        etudiant_id: etudiantId,
        evaluation_id: evaluationId,
        valeur,
      }),
    });
  }

  async getNotesEtudiant(etudiantId: number): Promise<Note[]> {
    return this.request<Note[]>(`/notes/etudiant/${etudiantId}`);
  }

  // Absences
  async saisirAbsences(moduleId: number, dateCours: string, etudiantsAbsents: number[]): Promise<{ crees: number; ids: number[] }> {
    return this.request('/absences/batch', {
      method: 'POST',
      body: JSON.stringify({
        module_id: moduleId,
        date_cours: dateCours,
        etudiants_absents: etudiantsAbsents,
      }),
    });
  }

  async justifierAbsence(absenceId: number, motif: string): Promise<{ id: number; justifiee: boolean; statut: string }> {
    return this.request(`/absences/${absenceId}/justifier`, {
      method: 'PATCH',
      body: JSON.stringify({ motif_justification: motif }),
    });
  }

  async getAbsencesEtudiant(etudiantId: number): Promise<Absence[]> {
    return this.request<Absence[]>(`/absences/etudiant/${etudiantId}`);
  }

  
  // Etudiant
async getRecapEtudiant(): Promise<RecapEtudiant> {
  if (MOCK_MODE) {
    return Promise.resolve({
      etudiant: {
        id: 4,
        cne: "E123456789",
        full_name: "Youssef ALAMI",
        email: "etudiant1@emsi.ma",
      },
      notes: [
        {
          id: 1,
          etudiant_id: 4,
          evaluation_id: 1,
          evaluation_nom: "Contrôle 1",
          module_nom: "Bases de Données",
          module_id: 1,
          valeur: 14,
          coefficient: 1,
          bareme_max: 20,
          date: "2026-03-10",
          statut: "validée",
        },
        {
          id: 2,
          etudiant_id: 4,
          evaluation_id: 2,
          evaluation_nom: "Projet",
          module_nom: "Programmation Web",
          module_id: 2,
          valeur: 16,
          coefficient: 2,
          bareme_max: 20,
          date: "2026-03-18",
          statut: "validée",
        },
        {
          id: 3,
          etudiant_id: 4,
          evaluation_id: 3,
          evaluation_nom: "Contrôle 2",
          module_nom: "Mathématiques",
          module_id: 3,
          valeur: 12.5,
          coefficient: 1,
          bareme_max: 20,
          date: "2026-03-22",
          statut: "validée",
        },
      ],
      absences: [
        {
          id: 1,
          etudiant_id: 4,
          module_id: 1,
          module_nom: "Mathématiques",
          date_cours: "2026-03-12",
          justifiee: false,
          statut: "non justifiée",
          motif_justification: undefined,
        },
        {
          id: 2,
          etudiant_id: 4,
          module_id: 2,
          module_nom: "Programmation Web",
          date_cours: "2026-03-18",
          justifiee: true,
          statut: "justifiée",
          motif_justification: "Certificat médical",
        },
        {
          id: 3,
          etudiant_id: 4,
          module_id: 3,
          module_nom: "Bases de Données",
          date_cours: "2026-03-20",
          justifiee: false,
          statut: "non justifiée",
          motif_justification: undefined,
        },
      ],
      alertes: [
        {
          id: 1,
          etudiant_id: 4,
          etudiant_nom: "Youssef ALAMI",
          type: "absence",
          urgence: "critical",
          titre: "Seuil d'absences atteint",
          message:
            "Vous avez atteint 8 heures d'absences non justifiées ce mois. Veuillez contacter votre chef de filière.",
          lue: false,
          created_at: "2026-03-15T10:30:00.000Z",
        },
        {
          id: 2,
          etudiant_id: 4,
          etudiant_nom: "Youssef ALAMI",
          type: "note",
          urgence: "warning",
          titre: "Note en dessous de la moyenne",
          message:
            "Votre note en Bases de Données est en dessous de la moyenne de la classe.",
          lue: false,
          created_at: "2026-03-14T14:00:00.000Z",
        },
        {
          id: 3,
          etudiant_id: 4,
          etudiant_nom: "Youssef ALAMI",
          type: "note",
          urgence: "info",
          titre: "Nouvelle note disponible",
          message: "La note du contrôle de Programmation Web a été publiée.",
          lue: true,
          created_at: "2026-03-13T09:00:00.000Z",
        },
      ],
      score_risque: {
        score: 25,
        niveau: "faible",
        couleur: "green",
      },
    });
  }

  return this.request<RecapEtudiant>("/etudiant/me/recap");
}
 

  // Admin
  async getUsers(): Promise<User[]> {
    if (MOCK_MODE) {
      return Promise.resolve([
        { id: 1, email: 'admin@emsi.ma', role: 'admin', first_name: 'Admin', last_name: 'EMSI', full_name: 'Admin EMSI', is_active: true },
        { id: 2, email: 'chef.iir@emsi.ma', role: 'chef_filiere', first_name: 'Mohammed', last_name: 'BENALI', full_name: 'Mohammed BENALI', is_active: true },
        { id: 3, email: 'prof.analyse@emsi.ma', role: 'enseignant', first_name: 'Fatima', last_name: 'ZAHRA', full_name: 'Fatima ZAHRA', is_active: true },
        { id: 4, email: 'etudiant1@emsi.ma', role: 'etudiant', first_name: 'Youssef', last_name: 'ALAMI', full_name: 'Youssef ALAMI', cne: 'E123456789', is_active: true },
        { id: 5, email: 'etudiant2@emsi.ma', role: 'etudiant', first_name: 'Sara', last_name: 'IDRISSI', full_name: 'Sara IDRISSI', cne: 'E987654321', is_active: true },
        { id: 6, email: 'prof.math@emsi.ma', role: 'enseignant', first_name: 'Ahmed', last_name: 'TAZI', full_name: 'Ahmed TAZI', is_active: true },
        { id: 7, email: 'chef.cc@emsi.ma', role: 'chef_filiere', first_name: 'Karim', last_name: 'MOUSSAOUI', full_name: 'Karim MOUSSAOUI', is_active: true },
        { id: 8, email: 'etudiant3@emsi.ma', role: 'etudiant', first_name: 'Imane', last_name: 'BENNANI', full_name: 'Imane BENNANI', cne: 'E456789123', is_active: false },
      ]);
    }
    return this.request<User[]>('/admin/users');
  }

  async createUser(userData: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    role: Role;
    cne?: string;
    promotion_id?: number;
    filiere_dirigee_id?: number;
  }): Promise<User> {
    if (MOCK_MODE) {
      return Promise.resolve({
        id: Math.floor(Math.random() * 1000) + 100,
        email: userData.email,
        role: userData.role,
        first_name: userData.first_name,
        last_name: userData.last_name,
        full_name: `${userData.first_name} ${userData.last_name}`,
        cne: userData.cne,
        is_active: true,
      });
    }
    return this.request<User>('/admin/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async updateUser(userId: number, data: Partial<User>): Promise<User> {
    if (MOCK_MODE) {
      return Promise.resolve({
        id: userId,
        email: data.email || 'user@emsi.ma',
        role: data.role || 'etudiant',
        first_name: data.first_name || 'User',
        last_name: data.last_name || 'EMSI',
        full_name: `${data.first_name || 'User'} ${data.last_name || 'EMSI'}`,
        is_active: data.is_active ?? true,
      });
    }
    return this.request<User>(`/admin/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deactivateUser(userId: number): Promise<{ id: number; is_active: boolean }> {
    if (MOCK_MODE) {
      return Promise.resolve({ id: userId, is_active: false });
    }
    return this.request(`/admin/users/${userId}`, { method: 'DELETE' });
  }

  // Audit
  async getAuditLogs(filters?: {
    table_name?: string;
    record_id?: number;
    user_id?: number;
    limit?: number;
  }): Promise<AuditLog[]> {
    if (MOCK_MODE) {
      return Promise.resolve([
        { id: 1, user_id: 3, user_email: 'prof.analyse@emsi.ma', table_name: 'notes', record_id: 15, action: 'update', ancienne_valeur: { valeur: 12 }, nouvelle_valeur: { valeur: 14 }, raison_modification: 'Correction erreur saisie', timestamp: new Date(Date.now() - 3600000).toISOString(), ip_adresse: '192.168.1.100' },
        { id: 2, user_id: 3, user_email: 'prof.analyse@emsi.ma', table_name: 'absences', record_id: 42, action: 'create', ancienne_valeur: null, nouvelle_valeur: { etudiant_id: 4, justifiee: false }, raison_modification: null, timestamp: new Date(Date.now() - 7200000).toISOString(), ip_adresse: '192.168.1.100' },
        { id: 3, user_id: 1, user_email: 'admin@emsi.ma', table_name: 'users', record_id: 8, action: 'update', ancienne_valeur: { is_active: true }, nouvelle_valeur: { is_active: false }, raison_modification: 'Desactivation compte', timestamp: new Date(Date.now() - 86400000).toISOString(), ip_adresse: '192.168.1.1' },
        { id: 4, user_id: 6, user_email: 'prof.math@emsi.ma', table_name: 'notes', record_id: 22, action: 'create', ancienne_valeur: null, nouvelle_valeur: { valeur: 16, etudiant_id: 5 }, raison_modification: null, timestamp: new Date(Date.now() - 172800000).toISOString(), ip_adresse: '192.168.1.105' },
        { id: 5, user_id: 3, user_email: 'prof.analyse@emsi.ma', table_name: 'absences', record_id: 38, action: 'update', ancienne_valeur: { justifiee: false }, nouvelle_valeur: { justifiee: true }, raison_modification: 'Justificatif medical recu', timestamp: new Date(Date.now() - 259200000).toISOString(), ip_adresse: '192.168.1.100' },
      ]);
    }
    const params = new URLSearchParams();
    if (filters?.table_name) params.set('table_name', filters.table_name);
    if (filters?.record_id) params.set('record_id', String(filters.record_id));
    if (filters?.user_id) params.set('user_id', String(filters.user_id));
    if (filters?.limit) params.set('limit', String(filters.limit));
    const query = params.toString();
    return this.request<AuditLog[]>(`/audit/logs${query ? `?${query}` : ''}`);
  }

  // PDF
  async genererBulletin(etudiantId: number, semestre: number = 2): Promise<{
    bulletin_id: number;
    decision: string;
    moyenne_generale: number;
    chemin_fichier: string;
    download_url: string;
  }> {
    return this.request(`/pdf/bulletin/${etudiantId}?semestre=${semestre}`, {
      method: 'POST',
    });
  }

  async genererPV(promotionId: number, semestre: number = 2): Promise<{
    pv_id: number;
    statut: string;
    hash_controle: string;
    chemin_fichier: string;
    download_url: string;
  }> {
    return this.request(`/pdf/pv/promotion/${promotionId}?semestre=${semestre}`, {
      method: 'POST',
    });
  }

  async validerPV(pvId: number): Promise<{
    pv_id: number;
    statut: string;
    signature_numerique: string;
    date_validation: string;
    integrite_verifiee: boolean;
  }> {
    return this.request(`/pdf/pv/${pvId}/valider`, { method: 'POST' });
  }

  getBulletinDownloadUrl(bulletinId: number): string {
    return `${API_URL}/pdf/bulletin/${bulletinId}/download`;
  }

  getPVDownloadUrl(pvId: number): string {
    return `${API_URL}/pdf/pv/${pvId}/download`;
  }

  // CSV
  async importNotes(file: File): Promise<{ importes: number; erreurs: string[] }> {
    const formData = new FormData();
    formData.append('file', file);
    
    const token = this.getToken();
    const response = await fetch(`${API_URL}/csv/notes/import`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Erreur import' }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }
    
    return response.json();
  }

  getExportNotesUrl(moduleId: number): string {
    const token = this.getToken();
    return `${API_URL}/csv/notes/export/module/${moduleId}?token=${token}`;
  }
}

export const api = new ApiClient();
