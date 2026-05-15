// API configuration and helper functions for EMSI Portail
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

export type Role = "admin" | "chef_filiere" | "enseignant" | "etudiant";

export interface User {
  id: number;
  email: string;
  role: Role;
  first_name: string;
  last_name: string;
  full_name: string;
  cne?: string;
  promotion_id?: number;
  filiere_dirigee_id?: number;
  is_active: boolean;
  created_at?: string;
}

export interface LoginResponse {
  access_token: string;
  role: Role;
  user_id: number;
  full_name: string;
}

export interface AcademicModule {
  id: number;
  nom: string;
  code?: string | null;
  coefficient?: number | null;
  semestre?: number | string | null;
  promotion_id?: number | null;
  enseignant_id?: number | null;
  promotion_nom?: string | null;
  filiere_nom?: string | null;
  groupes?: string[];
  heures_total?: number | null;
}

export interface Filiere {
  id: number;
  nom: string;
  description?: string | null;
}

export interface Promotion {
  id: number;
  nom: string;
  annee_universitaire?: string | null;
  filiere_id?: number | null;
  filiere_nom?: string | null;
}

export interface ModuleEtudiant {
  id: number;
  full_name: string;
  cne?: string | null;
  email: string;
  taux_absence: number;
  moyenne_generale: number;
}

export interface Evaluation {
  id: number;
  nom: string;
  type: string;
  coefficient: number;
  bareme_max: number;
  date?: string | null;
  module_id: number;
}

export interface Alerte {
  id: number;
  etudiant_id: number;
  etudiant_nom?: string;
  etudiant_email?: string;
  type: string;
  urgence: "info" | "warning" | "danger" | "critical";
  titre: string;
  message: string;
  lue: boolean;
  score_risque?: number | null;
  created_at: string;
}

export interface EtudiantRisque {
  id: number;
  full_name: string;
  cne: string;
  email: string;
  score: number;
  niveau_risque: "faible" | "modere" | "eleve";
  couleur_alerte: "green" | "orange" | "red";
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
  nombre_etudiants?: number;
  taux_absence?: number;
  heures_effectuees?: number;
  heures_total?: number;
  prochain_cours?: string | null;
  distribution: {
    "0-5": number;
    "5-10": number;
    "10-12": number;
    "12-14": number;
    "14-16": number;
    "16-20": number;
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
  date?: string;
  duree_heures?: number;
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
    source?: string;
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

    if (typeof window !== "undefined") {
      if (token) {
        localStorage.setItem("emsi_token", token);
      } else {
        localStorage.removeItem("emsi_token");
        localStorage.removeItem("emsi_user");
      }
    }
  }

  getToken(): string | null {
    if (this.token) return this.token;

    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("emsi_token");
    }

    return this.token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken();

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    if (token) {
      (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ detail: "Erreur réseau" }));

      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  }

  private async fileRequest<T>(
    endpoint: string,
    formData: FormData
  ): Promise<T> {
    const token = this.getToken();

    const response = await fetch(`${API_URL}${endpoint}`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ detail: "Erreur import" }));

      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Auth
  async login(email: string, password: string): Promise<LoginResponse> {
    return this.request<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  }

  async me(): Promise<User> {
    return this.request<User>("/auth/me");
  }

  // Academic
  async getFilieres(): Promise<Filiere[]> {
    return this.request<Filiere[]>("/academic/filieres");
  }

  async getPromotions(): Promise<Promotion[]> {
    return this.request<Promotion[]>("/academic/promotions");
  }

  async listPromotions(): Promise<Promotion[]> {
    return this.getPromotions();
  }

  async getModules(params?: {
    promotion_id?: number;
    enseignant_id?: number;
  }): Promise<AcademicModule[]> {
    const query = new URLSearchParams();

    if (params?.promotion_id) {
      query.set("promotion_id", String(params.promotion_id));
    }

    if (params?.enseignant_id) {
      query.set("enseignant_id", String(params.enseignant_id));
    }

    const suffix = query.toString() ? `?${query.toString()}` : "";

    return this.request<AcademicModule[]>(`/academic/modules${suffix}`);
  }

  async getMesModules(): Promise<AcademicModule[]> {
    return this.getModules();
  }

  async getTeacherModules(): Promise<AcademicModule[]> {
    return this.getModules();
  }

  async getEvaluations(moduleId?: number): Promise<Evaluation[]> {
    const query = moduleId ? `?module_id=${moduleId}` : "";
    return this.request<Evaluation[]>(`/academic/evaluations${query}`);
  }

  async getModuleStudents(moduleId: number): Promise<ModuleEtudiant[]> {
    return this.request<ModuleEtudiant[]>(
      `/academic/modules/${moduleId}/etudiants`
    );
  }

  // Dashboard
  async getEtudiantsRisque(filiereId?: number): Promise<EtudiantRisque[]> {
    const params = filiereId ? `?filiere_id=${filiereId}` : "";
    return this.request<EtudiantRisque[]>(
      `/dashboard/etudiants-risque${params}`
    );
  }

  async getChefEtudiants(): Promise<EtudiantRisque[]> {
    return this.getEtudiantsRisque();
  }

  async getEtudiants(): Promise<EtudiantRisque[]> {
    return this.getEtudiantsRisque();
  }

  async getKPIs(filiereId?: number): Promise<KPIs> {
    const params = filiereId ? `?filiere_id=${filiereId}` : "";
    return this.request<KPIs>(`/dashboard/kpis${params}`);
  }

  async getModuleStats(moduleId: number): Promise<ModuleStats> {
    return this.request<ModuleStats>(`/dashboard/module/${moduleId}/stats`);
  }

  async getEnseignantModuleStats(moduleId: number): Promise<ModuleStats> {
    return this.getModuleStats(moduleId);
  }

  async getMesAlertes(lues?: boolean): Promise<Alerte[]> {
    const params = lues !== undefined ? `?lues=${lues}` : "";
    return this.request<Alerte[]>(`/dashboard/mes-alertes${params}`);
  }

  async getAlertes(lues?: boolean): Promise<Alerte[]> {
    return this.getMesAlertes(lues);
  }

  async marquerAlerteLue(
    alerteId: number
  ): Promise<{ id: number; lue: boolean }> {
    return this.request(`/dashboard/alertes/${alerteId}/lue`, {
      method: "PATCH",
    });
  }

  async markAlerteLue(
    alerteId: number
  ): Promise<{ id: number; lue: boolean }> {
    return this.marquerAlerteLue(alerteId);
  }

  async createAlerte(data: {
    etudiant_id: number;
    type: string;
    urgence: string;
    titre: string;
    message: string;
  }): Promise<Alerte> {
    return this.request<Alerte>("/dashboard/alertes", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async sendStudentMessage(etudiantId: number, message: string): Promise<Alerte> {
    return this.createAlerte({
      etudiant_id: etudiantId,
      type: "message",
      urgence: "info",
      titre: "Message du chef de filière",
      message,
    });
  }

  // Notes
  async saisirNote(
    etudiantId: number,
    evaluationId: number,
    valeur: number
  ): Promise<Note> {
    return this.request<Note>("/notes", {
      method: "POST",
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
  async saisirAbsences(
    moduleId: number,
    dateCours: string,
    etudiantsAbsents: number[]
  ): Promise<{ crees: number; ids: number[] }> {
    return this.request("/absences/batch", {
      method: "POST",
      body: JSON.stringify({
        module_id: moduleId,
        date_cours: dateCours,
        etudiants_absents: etudiantsAbsents,
      }),
    });
  }

  async justifierAbsence(
    absenceId: number,
    motif: string
  ): Promise<{ id: number; justifiee: boolean; statut: string }> {
    return this.request(`/absences/${absenceId}/justifier`, {
      method: "PATCH",
      body: JSON.stringify({ motif_justification: motif }),
    });
  }

  async getAbsencesEtudiant(etudiantId: number): Promise<Absence[]> {
    return this.request<Absence[]>(`/absences/etudiant/${etudiantId}`);
  }

  // Etudiant
  async getRecapEtudiant(): Promise<RecapEtudiant> {
    return this.request<RecapEtudiant>("/dashboard/etudiant/me/recap");
  }

  async getEtudiantRecap(etudiantId: number): Promise<RecapEtudiant> {
    return this.request<RecapEtudiant>(
      `/dashboard/etudiant/${etudiantId}/recap`
    );
  }

  async getStudentRecap(etudiantId: number): Promise<RecapEtudiant> {
    return this.getEtudiantRecap(etudiantId);
  }

  async getChefEtudiantRecap(etudiantId: number): Promise<RecapEtudiant> {
    return this.getEtudiantRecap(etudiantId);
  }

  async getEtudiantDetails(etudiantId: number): Promise<RecapEtudiant> {
    return this.getEtudiantRecap(etudiantId);
  }

  // Admin
  async getUsers(): Promise<User[]> {
    return this.request<User[]>("/admin/users");
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
    return this.request<User>("/admin/users", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  }

  async updateUser(userId: number, data: Partial<User>): Promise<User> {
    return this.request<User>(`/admin/users/${userId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deactivateUser(
    userId: number
  ): Promise<{ id: number; is_active: boolean }> {
    return this.request(`/admin/users/${userId}`, {
      method: "DELETE",
    });
  }

  // Audit
  async getAuditLogs(filters?: {
    table_name?: string;
    record_id?: number;
    user_id?: number;
    limit?: number;
  }): Promise<AuditLog[]> {
    const params = new URLSearchParams();

    if (filters?.table_name) params.set("table_name", filters.table_name);
    if (filters?.record_id) params.set("record_id", String(filters.record_id));
    if (filters?.user_id) params.set("user_id", String(filters.user_id));
    if (filters?.limit) params.set("limit", String(filters.limit));

    const query = params.toString();

    return this.request<AuditLog[]>(`/audit/logs${query ? `?${query}` : ""}`);
  }

  // PDF
  async genererBulletin(
    etudiantId: number,
    semestre: number = 2
  ): Promise<{
    bulletin_id: number;
    decision: string;
    moyenne_generale: number;
    chemin_fichier: string;
    download_url: string;
  }> {
    return this.request(`/pdf/bulletin/${etudiantId}?semestre=${semestre}`, {
      method: "POST",
    });
  }

  async generateBulletin(
    etudiantId: number,
    semestre: number = 2
  ): Promise<{
    bulletin_id: number;
    decision: string;
    moyenne_generale: number;
    chemin_fichier: string;
    download_url: string;
  }> {
    return this.genererBulletin(etudiantId, semestre);
  }

  async generateBulletinEtudiant(): Promise<{
    bulletin_id: number;
    decision: string;
    moyenne_generale: number;
    chemin_fichier: string;
    download_url: string;
  }> {
    return this.request(`/pdf/bulletin/me`, {
      method: "POST",
    });
  }

  async genererPV(
    promotionId: number,
    semestre: number | string = 2
  ): Promise<{
    pv_id: number;
    statut: string;
    hash_controle: string;
    chemin_fichier: string;
    download_url: string;
  }> {
    return this.request(
      `/pdf/pv/promotion/${promotionId}?semestre=${semestre}`,
      {
        method: "POST",
      }
    );
  }

  async generatePV(
    promotionId: number,
    options?: { semestre?: number | string }
  ): Promise<{
    pv_id: number;
    statut: string;
    hash_controle: string;
    chemin_fichier: string;
    download_url: string;
  }> {
    return this.genererPV(promotionId, options?.semestre || 2);
  }

  async validerPV(pvId: number): Promise<{
    pv_id: number;
    statut: string;
    signature_numerique: string;
    date_validation: string;
    integrite_verifiee: boolean;
  }> {
    return this.request(`/pdf/pv/${pvId}/valider`, {
      method: "POST",
    });
  }

  getBulletinDownloadUrl(bulletinId: number): string {
    return `${API_URL}/pdf/bulletin/${bulletinId}/download`;
  }

  getPVDownloadUrl(pvId: number): string {
    return `${API_URL}/pdf/pv/${pvId}/download`;
  }

  getBulletinUrl(etudiantId: number, semestre: number = 2): string {
    const token = this.getToken();
    return `${API_URL}/pdf/bulletin/${etudiantId}?semestre=${semestre}${
      token ? `&token=${encodeURIComponent(token)}` : ""
    }`;
  }

  getMonBulletinUrl(semestre: number = 2): string {
    const token = this.getToken();
    return `${API_URL}/pdf/bulletin/me?semestre=${semestre}${
      token ? `&token=${encodeURIComponent(token)}` : ""
    }`;
  }

  getPVUrl(promotionId: number, semestre: number | string = 2): string {
    const token = this.getToken();
    return `${API_URL}/pdf/pv/promotion/${promotionId}?semestre=${semestre}${
      token ? `&token=${encodeURIComponent(token)}` : ""
    }`;
  }

  // CSV
  async importNotes(
    file: File
  ): Promise<{ importes: number; erreurs: string[] }> {
    const formData = new FormData();
    formData.append("file", file);

    return this.fileRequest<{ importes: number; erreurs: string[] }>(
      "/csv/notes/import",
      formData
    );
  }

  async importNotesForModule(
    moduleId: number,
    file: File
  ): Promise<{ importes: number; erreurs: string[] }> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("module_id", String(moduleId));

    return this.fileRequest<{ importes: number; erreurs: string[] }>(
      "/csv/notes/import",
      formData
    );
  }

  getExportNotesUrl(moduleId: number): string {
    const token = this.getToken();
    return `${API_URL}/csv/notes/export/module/${moduleId}${
      token ? `?token=${encodeURIComponent(token)}` : ""
    }`;
  }

  // Generic report aliases
  async generateRapport(payload: Record<string, unknown>): Promise<{
    download_url?: string;
  }> {
    return this.request("/pdf/rapport", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async generateReport(payload: Record<string, unknown>): Promise<{
    download_url?: string;
  }> {
    return this.generateRapport(payload);
  }
}

export const api = new ApiClient();