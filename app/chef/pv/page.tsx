"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  CheckCircle2,
  Download,
  Eye,
  FileCheck2,
  FileText,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Users,
} from "lucide-react";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { api } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

type Promotion = {
  id: number;
  nom?: string;
  name?: string;
  annee?: string;
  filiere_id?: number;
};

type ModuleItem = {
  id: number;
  nom?: string;
  code?: string | null;
  semestre?: number;
  promotion_id?: number;
};

type StudentItem = {
  id: number;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  cne?: string | null;
  email?: string;
  moyenne_generale?: number;
  taux_absence?: number;
};

type GeneratedPV = {
  pv_id: number;
  statut?: string;
  hash_controle?: string | null;
  chemin_fichier?: string | null;
  download_url?: string;
};

type IntegrityResult = {
  pv_id: number;
  statut?: string;
  hash_controle?: string | null;
  hash_fichier?: string | null;
  signature_numerique?: string | null;
  integrite_verifiee: boolean;
};

type BulletinResult = {
  bulletin_id: number;
  decision?: string;
  moyenne_generale?: number | null;
  download_url?: string;
};

function getToken() {
  const maybeApi = api as any;

  if (typeof maybeApi.getToken === "function") {
    return maybeApi.getToken();
  }

  if (typeof window !== "undefined") {
    return localStorage.getItem("emsi_token");
  }

  return null;
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Erreur API ${response.status}`);
  }

  return response.json();
}

function openBackendUrl(path?: string | null) {
  if (!path) {
    toast.error("Lien de téléchargement indisponible");
    return;
  }

  if (path.startsWith("http")) {
    window.open(path, "_blank");
    return;
  }

  window.open(`${API_URL}${path}`, "_blank");
}

function promotionLabel(promotion: Promotion) {
  return promotion.nom || promotion.name || `Promotion #${promotion.id}`;
}

function studentName(student: StudentItem) {
  return (
    student.full_name ||
    `${student.first_name || ""} ${student.last_name || ""}`.trim() ||
    `Étudiant #${student.id}`
  );
}

function mentionFromAverage(value?: number | null) {
  if (typeof value !== "number") return "—";
  if (value >= 16) return "Très bien";
  if (value >= 14) return "Bien";
  if (value >= 12) return "Assez bien";
  if (value >= 10) return "Passable";
  return "—";
}

function decisionFromAverage(value?: number | null) {
  if (typeof value !== "number") return "En attente";
  return value >= 10 ? "Admis" : "Ajourné";
}

function decisionBadge(value?: number | null) {
  const decision = decisionFromAverage(value);

  if (decision === "Admis") {
    return <Badge className="bg-green-100 text-green-800">Admis</Badge>;
  }

  if (decision === "Ajourné") {
    return <Badge className="bg-yellow-100 text-yellow-800">Ajourné</Badge>;
  }

  return <Badge variant="outline">En attente</Badge>;
}

function shortHash(hash?: string | null) {
  if (!hash) return "—";
  return `${hash.slice(0, 12)}...${hash.slice(-8)}`;
}

export default function PVPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [modules, setModules] = useState<ModuleItem[]>([]);
  const [students, setStudents] = useState<StudentItem[]>([]);

  const [selectedPromotion, setSelectedPromotion] = useState("");
  const [selectedSemestre, setSelectedSemestre] = useState("2");
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [busy, setBusy] = useState(false);

  const [generatedPV, setGeneratedPV] = useState<GeneratedPV | null>(null);
  const [integrity, setIntegrity] = useState<IntegrityResult | null>(null);
  const [bulletins, setBulletins] = useState<BulletinResult[]>([]);

  const selectedPromotionObject = useMemo(() => {
    return promotions.find((promotion) => String(promotion.id) === selectedPromotion);
  }, [promotions, selectedPromotion]);

  const stats = useMemo(() => {
    const averages = students
      .map((student) => student.moyenne_generale)
      .filter((value): value is number => typeof value === "number");

    const admitted = averages.filter((value) => value >= 10).length;

    return {
      total: students.length,
      admitted,
      failed: Math.max(students.length - admitted, 0),
      average:
        averages.length > 0
          ? averages.reduce((sum, value) => sum + value, 0) / averages.length
          : null,
      successRate: students.length > 0 ? (admitted / students.length) * 100 : 0,
    };
  }, [students]);

  useEffect(() => {
    async function loadPromotions() {
      try {
        const data = await apiFetch<Promotion[]>("/academic/promotions");
        setPromotions(Array.isArray(data) ? data : []);

        if (Array.isArray(data) && data.length > 0) {
          setSelectedPromotion(String(data[0].id));
        }
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Erreur lors du chargement des promotions"
        );
      } finally {
        setLoading(false);
      }
    }

    loadPromotions();
  }, []);

  useEffect(() => {
    async function loadPromotionData() {
      if (!selectedPromotion) return;

      setLoadingStudents(true);
      setStudents([]);
      setModules([]);
      setSelectedStudents([]);
      setGeneratedPV(null);
      setIntegrity(null);
      setBulletins([]);

      try {
        const moduleData = await apiFetch<ModuleItem[]>(
          `/academic/modules?promotion_id=${encodeURIComponent(selectedPromotion)}`
        );

        const filteredModules = (Array.isArray(moduleData) ? moduleData : []).filter(
          (module) => !module.semestre || String(module.semestre) === selectedSemestre
        );

        setModules(filteredModules);

        if (filteredModules.length === 0) {
          toast.info("Aucun module trouvé pour cette promotion/semestre");
          return;
        }

        const studentMaps = await Promise.all(
          filteredModules.map(async (module) => {
            try {
              const moduleStudents = await apiFetch<StudentItem[]>(
                `/academic/modules/${module.id}/etudiants`
              );
              return Array.isArray(moduleStudents) ? moduleStudents : [];
            } catch {
              return [];
            }
          })
        );

        const byId = new Map<number, StudentItem>();

        for (const list of studentMaps) {
          for (const student of list) {
            const previous = byId.get(student.id);

            byId.set(student.id, {
              ...previous,
              ...student,
              moyenne_generale:
                typeof student.moyenne_generale === "number"
                  ? student.moyenne_generale
                  : previous?.moyenne_generale,
              taux_absence:
                typeof student.taux_absence === "number"
                  ? student.taux_absence
                  : previous?.taux_absence,
            });
          }
        }

        setStudents(
          Array.from(byId.values()).sort((a, b) =>
            studentName(a).localeCompare(studentName(b), "fr")
          )
        );
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Erreur lors du chargement des données PV"
        );
      } finally {
        setLoadingStudents(false);
      }
    }

    loadPromotionData();
  }, [selectedPromotion, selectedSemestre]);

  const handleGeneratePV = async () => {
    if (!selectedPromotion) {
      toast.error("Veuillez sélectionner une promotion");
      return;
    }

    setBusy(true);

    try {
      const result = await apiFetch<GeneratedPV>(
        `/pdf/pv/promotion/${selectedPromotion}?semestre=${selectedSemestre}`,
        { method: "POST", body: "{}" }
      );

      setGeneratedPV(result);
      setIntegrity(null);

      toast.success("PV généré avec succès");
      openBackendUrl(result.download_url);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur de génération du PV");
    } finally {
      setBusy(false);
    }
  };

  const handleValidatePV = async () => {
    if (!generatedPV?.pv_id) {
      toast.error("Veuillez d'abord générer un PV");
      return;
    }

    setBusy(true);

    try {
      const result = await apiFetch<GeneratedPV & { signature_numerique?: string }>(
        `/pdf/pv/${generatedPV.pv_id}/valider`,
        { method: "POST", body: "{}" }
      );

      setGeneratedPV((current) => ({
        ...current,
        ...result,
        statut: result.statut || "valide",
      }));

      toast.success("PV validé avec succès");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur de validation du PV");
    } finally {
      setBusy(false);
    }
  };

  const handleVerifyIntegrity = async () => {
    if (!generatedPV?.pv_id) {
      toast.error("Veuillez d'abord générer un PV");
      return;
    }

    setBusy(true);

    try {
      const result = await apiFetch<IntegrityResult>(
        `/pdf/pv/${generatedPV.pv_id}/verifier-integrite`
      );

      setIntegrity(result);

      if (result.integrite_verifiee) {
        toast.success("Intégrité du PV vérifiée");
      } else {
        toast.error("L'intégrité du PV n'est pas vérifiée");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erreur de vérification d'intégrité"
      );
    } finally {
      setBusy(false);
    }
  };

  const toggleStudent = (id: number) => {
    setSelectedStudents((current) =>
      current.includes(id)
        ? current.filter((studentId) => studentId !== id)
        : [...current, id]
    );
  };

  const toggleAllStudents = () => {
    setSelectedStudents((current) =>
      current.length === students.length ? [] : students.map((student) => student.id)
    );
  };

  const handleGenerateBulletins = async () => {
    if (selectedStudents.length === 0) {
      toast.error("Veuillez sélectionner au moins un étudiant");
      return;
    }

    setBusy(true);
    setBulletins([]);

    try {
      const results: BulletinResult[] = [];

      for (const studentId of selectedStudents) {
        const result = await apiFetch<BulletinResult>(
          `/pdf/bulletin/${studentId}?semestre=${selectedSemestre}`,
          { method: "POST", body: "{}" }
        );

        results.push(result);
      }

      setBulletins(results);
      toast.success(`${results.length} bulletin(s) généré(s)`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erreur de génération des bulletins"
      );
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout requiredRoles={["chef_filiere"]}>
        <div className="flex min-h-[50vh] items-center justify-center text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Chargement des promotions...
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout requiredRoles={["chef_filiere"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">PV & Bulletins</h1>
          <p className="text-muted-foreground">
            Génération réelle des procès-verbaux et bulletins depuis les données backend.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Paramètres</CardTitle>
            <CardDescription>
              Sélectionnez la promotion et le semestre à traiter.
            </CardDescription>
          </CardHeader>

          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Promotion</Label>
              <Select value={selectedPromotion} onValueChange={setSelectedPromotion}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une promotion" />
                </SelectTrigger>
                <SelectContent>
                  {promotions.map((promotion) => (
                    <SelectItem key={promotion.id} value={String(promotion.id)}>
                      {promotionLabel(promotion)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Semestre</Label>
              <Select value={selectedSemestre} onValueChange={setSelectedSemestre}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Semestre 1</SelectItem>
                  <SelectItem value="2">Semestre 2</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  const current = selectedPromotion;
                  setSelectedPromotion("");
                  setTimeout(() => setSelectedPromotion(current), 0);
                }}
                className="w-full"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Recharger
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Étudiants</p>
              <p className="mt-2 text-3xl font-bold">{stats.total}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Admis</p>
              <p className="mt-2 text-3xl font-bold text-green-600">
                {stats.admitted}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Ajournés</p>
              <p className="mt-2 text-3xl font-bold text-yellow-600">
                {stats.failed}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Moyenne promo</p>
              <p className="mt-2 text-3xl font-bold">
                {stats.average === null ? "—" : stats.average.toFixed(2)}
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="pv" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pv">PV de délibération</TabsTrigger>
            <TabsTrigger value="bulletins">Bulletins individuels</TabsTrigger>
          </TabsList>

          <TabsContent value="pv" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Génération du PV</CardTitle>
                <CardDescription>
                  {selectedPromotionObject
                    ? `${promotionLabel(selectedPromotionObject)} - Semestre ${selectedSemestre}`
                    : "Aucune promotion sélectionnée"}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-3">
                  <Button onClick={handleGeneratePV} disabled={busy || !selectedPromotion}>
                    {busy ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <FileText className="mr-2 h-4 w-4" />
                    )}
                    Générer le PV réel
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => openBackendUrl(generatedPV?.download_url)}
                    disabled={!generatedPV?.download_url}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Ouvrir le PDF
                  </Button>

                  <Button
                    variant="outline"
                    onClick={handleValidatePV}
                    disabled={busy || !generatedPV?.pv_id || generatedPV?.statut === "valide"}
                  >
                    <FileCheck2 className="mr-2 h-4 w-4" />
                    Valider le PV
                  </Button>

                  <Button
                    variant="outline"
                    onClick={handleVerifyIntegrity}
                    disabled={busy || !generatedPV?.pv_id}
                  >
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    Vérifier intégrité
                  </Button>
                </div>

                {generatedPV && (
                  <div className="rounded-lg border p-4 text-sm">
                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <span className="text-muted-foreground">PV ID : </span>
                        <span className="font-medium">{generatedPV.pv_id}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Statut : </span>
                        <Badge>
                          {generatedPV.statut === "valide"
                            ? "Validé"
                            : generatedPV.statut || "Brouillon"}
                        </Badge>
                      </div>
                      <div className="md:col-span-2">
                        <span className="text-muted-foreground">Hash : </span>
                        <span className="font-mono">{shortHash(generatedPV.hash_controle)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {integrity && (
                  <div className="rounded-lg border p-4 text-sm">
                    <div className="mb-2 flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4" />
                      <span className="font-semibold">Vérification d’intégrité</span>
                      {integrity.integrite_verifiee ? (
                        <Badge className="bg-green-100 text-green-800">Valide</Badge>
                      ) : (
                        <Badge variant="destructive">Non valide</Badge>
                      )}
                    </div>

                    <p className="font-mono text-xs text-muted-foreground">
                      Hash enregistré : {integrity.hash_controle || "—"}
                    </p>
                    <p className="font-mono text-xs text-muted-foreground">
                      Hash fichier : {integrity.hash_fichier || "—"}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Étudiants concernés</CardTitle>
                <CardDescription>
                  Liste récupérée depuis les modules de la promotion sélectionnée.
                </CardDescription>
              </CardHeader>

              <CardContent>
                {loadingStudents ? (
                  <div className="flex items-center justify-center py-10 text-muted-foreground">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Chargement...
                  </div>
                ) : students.length === 0 ? (
                  <div className="py-10 text-center text-sm text-muted-foreground">
                    Aucun étudiant trouvé pour cette promotion/semestre.
                  </div>
                ) : (
                  <div className="rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Matricule</TableHead>
                          <TableHead>Nom & Prénom</TableHead>
                          <TableHead>Moyenne</TableHead>
                          <TableHead>Mention</TableHead>
                          <TableHead>Décision</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {students.map((student) => (
                          <TableRow key={student.id}>
                            <TableCell className="font-mono">
                              {student.cne || "—"}
                            </TableCell>
                            <TableCell className="font-medium">
                              {studentName(student)}
                            </TableCell>
                            <TableCell>
                              {typeof student.moyenne_generale === "number"
                                ? student.moyenne_generale.toFixed(2)
                                : "—"}
                            </TableCell>
                            <TableCell>{mentionFromAverage(student.moyenne_generale)}</TableCell>
                            <TableCell>{decisionBadge(student.moyenne_generale)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bulletins" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Bulletins individuels</CardTitle>
                <CardDescription>
                  Sélectionnez des étudiants puis générez leurs bulletins réels.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={handleGenerateBulletins}
                    disabled={busy || selectedStudents.length === 0}
                  >
                    {busy ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="mr-2 h-4 w-4" />
                    )}
                    Générer {selectedStudents.length || ""} bulletin(s)
                  </Button>

                  <Button variant="outline" onClick={toggleAllStudents} disabled={!students.length}>
                    <Users className="mr-2 h-4 w-4" />
                    {selectedStudents.length === students.length
                      ? "Tout désélectionner"
                      : "Tout sélectionner"}
                  </Button>
                </div>

                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={students.length > 0 && selectedStudents.length === students.length}
                            onCheckedChange={toggleAllStudents}
                          />
                        </TableHead>
                        <TableHead>Matricule</TableHead>
                        <TableHead>Nom & Prénom</TableHead>
                        <TableHead>Moyenne</TableHead>
                        <TableHead>Décision</TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {students.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedStudents.includes(student.id)}
                              onCheckedChange={() => toggleStudent(student.id)}
                            />
                          </TableCell>
                          <TableCell className="font-mono">{student.cne || "—"}</TableCell>
                          <TableCell className="font-medium">{studentName(student)}</TableCell>
                          <TableCell>
                            {typeof student.moyenne_generale === "number"
                              ? student.moyenne_generale.toFixed(2)
                              : "—"}
                          </TableCell>
                          <TableCell>{decisionBadge(student.moyenne_generale)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {bulletins.length > 0 && (
                  <div className="space-y-2 rounded-lg border p-4">
                    <div className="flex items-center gap-2 font-semibold">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      Bulletins générés
                    </div>

                    {bulletins.map((bulletin) => (
                      <div
                        key={bulletin.bulletin_id}
                        className="flex items-center justify-between rounded-md border p-3 text-sm"
                      >
                        <div>
                          Bulletin #{bulletin.bulletin_id} —{" "}
                          {bulletin.decision || "Décision non disponible"}
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openBackendUrl(bulletin.download_url)}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Télécharger
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}