"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  Calendar,
  Clock,
  Download,
  FileBarChart,
  FileText,
  TrendingUp,
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";

type ReportTypeId =
  | "bulletin"
  | "pv"
  | "absences"
  | "statistiques"
  | "risque"
  | "suivi";

type ReportField =
  | "etudiant"
  | "promotion"
  | "module"
  | "semestre"
  | "periode"
  | "mois"
  | "seuil_risque";

type Option = {
  id: string;
  label: string;
};

type GeneratedReport = {
  id: string;
  type: string;
  details: string;
  date: string;
  downloadUrl?: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

const reportTypes: Array<{
  id: ReportTypeId;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  fields: ReportField[];
}> = [
  {
    id: "bulletin",
    title: "Bulletin de notes",
    description: "Relevé individuel des notes, moyennes et décisions.",
    icon: FileText,
    fields: ["etudiant", "semestre"],
  },
  {
    id: "pv",
    title: "Procès-verbal de délibération",
    description: "PV officiel par promotion avec synthèse des résultats.",
    icon: Users,
    fields: ["promotion", "semestre"],
  },
  {
    id: "absences",
    title: "Rapport d’absences",
    description: "Récapitulatif des absences par promotion ou étudiant.",
    icon: Calendar,
    fields: ["promotion", "periode"],
  },
  {
    id: "statistiques",
    title: "Statistiques pédagogiques",
    description: "Moyennes, taux de réussite et indicateurs par module.",
    icon: TrendingUp,
    fields: ["promotion", "module", "semestre"],
  },
  {
    id: "risque",
    title: "Rapport étudiants à risque",
    description: "Liste des profils détectés par l’IA avec indicateurs.",
    icon: AlertTriangle,
    fields: ["promotion", "seuil_risque"],
  },
  {
    id: "suivi",
    title: "Rapport de suivi mensuel",
    description: "Synthèse mensuelle des notes, absences et alertes.",
    icon: FileBarChart,
    fields: ["promotion", "mois"],
  },
];

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

function getFileNameFromResponse(response: Response, fallback: string) {
  const disposition = response.headers.get("content-disposition");

  if (!disposition) return fallback;

  const match = disposition.match(/filename="?([^"]+)"?/);

  return match?.[1] || fallback;
}

async function downloadFromUrl(url: string, fileName: string) {
  const token = getToken();

  const response = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Erreur lors du téléchargement");
  }

  const blob = await response.blob();
  const blobUrl = window.URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = getFileNameFromResponse(response, fileName);
  document.body.appendChild(link);
  link.click();
  link.remove();

  window.URL.revokeObjectURL(blobUrl);
}

function mapOption(item: any, fallbackPrefix: string): Option {
  return {
    id: String(item.id),
    label:
      item.label ||
      item.nom ||
      item.name ||
      item.full_name ||
      item.titre ||
      `${fallbackPrefix} #${item.id}`,
  };
}

function getTodayIso() {
  return new Date().toISOString().split("T")[0];
}

export default function RapportsPage() {
  const [selectedType, setSelectedType] = useState<ReportTypeId | null>(
    "bulletin"
  );
  const [loadingData, setLoadingData] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [promotions, setPromotions] = useState<Option[]>([]);
  const [modules, setModules] = useState<Option[]>([]);
  const [etudiants, setEtudiants] = useState<Option[]>([]);
  const [generatedReports, setGeneratedReports] = useState<GeneratedReport[]>(
    []
  );

  const [formData, setFormData] = useState({
    etudiant: "",
    promotion: "",
    module: "",
    semestre: "",
    periode: "",
    mois: "",
    seuil_risque: "50",
    includeCharts: true,
    includeComments: true,
  });

  const selectedReport = reportTypes.find((report) => report.id === selectedType);

  useEffect(() => {
    async function fetchReferenceData() {
      setLoadingData(true);

      try {
        const maybeApi = api as any;

        const [promotionsData, modulesData, etudiantsData] = await Promise.all([
          typeof maybeApi.getPromotions === "function"
            ? maybeApi.getPromotions()
            : typeof maybeApi.listPromotions === "function"
              ? maybeApi.listPromotions()
              : Promise.resolve([]),

          typeof maybeApi.getModules === "function"
            ? maybeApi.getModules()
            : typeof maybeApi.listModules === "function"
              ? maybeApi.listModules()
              : Promise.resolve([]),

          typeof maybeApi.getChefEtudiants === "function"
            ? maybeApi.getChefEtudiants()
            : typeof maybeApi.getEtudiants === "function"
              ? maybeApi.getEtudiants()
              : typeof maybeApi.getEtudiantsRisque === "function"
                ? maybeApi.getEtudiantsRisque()
                : Promise.resolve([]),
        ]);

        setPromotions(
          Array.isArray(promotionsData)
            ? promotionsData.map((item) => mapOption(item, "Promotion"))
            : []
        );

        setModules(
          Array.isArray(modulesData)
            ? modulesData.map((item) => mapOption(item, "Module"))
            : []
        );

        setEtudiants(
          Array.isArray(etudiantsData)
            ? etudiantsData.map((item) => {
                const fullName =
                  item.full_name ||
                  item.etudiant_nom ||
                  item.nom_complet ||
                  [item.first_name, item.last_name].filter(Boolean).join(" ") ||
                  [item.prenom, item.nom].filter(Boolean).join(" ");

                return {
                  id: String(item.id || item.etudiant_id),
                  label: fullName || `Étudiant #${item.id || item.etudiant_id}`,
                };
              })
            : []
        );
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Erreur lors du chargement des données"
        );
      } finally {
        setLoadingData(false);
      }
    }

    fetchReferenceData();
  }, []);

  const currentDetails = useMemo(() => {
    const promotion = promotions.find((item) => item.id === formData.promotion);
    const module = modules.find((item) => item.id === formData.module);
    const etudiant = etudiants.find((item) => item.id === formData.etudiant);

    const parts = [
      etudiant?.label,
      promotion?.label,
      module?.label,
      formData.semestre,
      formData.periode,
      formData.mois ? `Mois ${formData.mois}` : "",
    ].filter(Boolean);

    return parts.length > 0 ? parts.join(" - ") : "Paramètres sélectionnés";
  }, [formData, promotions, modules, etudiants]);

  const reportStats = useMemo(() => {
    const month = new Date().getMonth();
    const year = new Date().getFullYear();

    const thisMonth = generatedReports.filter((report) => {
      const date = new Date(report.date);
      return date.getMonth() === month && date.getFullYear() === year;
    }).length;

    return {
      thisMonth,
      total: generatedReports.length,
      latest:
        generatedReports.length > 0
          ? generatedReports[0].type
          : "Aucun rapport généré",
    };
  }, [generatedReports]);

  function validateForm() {
    if (!selectedReport) {
      toast.error("Veuillez sélectionner un type de rapport");
      return false;
    }

    if (selectedReport.fields.includes("etudiant") && !formData.etudiant) {
      toast.error("Veuillez sélectionner un étudiant");
      return false;
    }

    if (selectedReport.fields.includes("promotion") && !formData.promotion) {
      toast.error("Veuillez sélectionner une promotion");
      return false;
    }

    if (selectedReport.fields.includes("module") && !formData.module) {
      toast.error("Veuillez sélectionner un module");
      return false;
    }

    if (selectedReport.fields.includes("semestre") && !formData.semestre) {
      toast.error("Veuillez sélectionner un semestre");
      return false;
    }

    if (selectedReport.fields.includes("periode") && !formData.periode) {
      toast.error("Veuillez sélectionner une période");
      return false;
    }

    if (selectedReport.fields.includes("mois") && !formData.mois) {
      toast.error("Veuillez sélectionner un mois");
      return false;
    }

    return true;
  }

  async function generateBulletin() {
    const maybeApi = api as any;
    const etudiantId = Number(formData.etudiant);

    if (typeof maybeApi.generateBulletin === "function") {
      const result = await maybeApi.generateBulletin(etudiantId);

      if (result?.download_url) {
        await downloadFromUrl(
          result.download_url,
          `bulletin_${etudiantId}_${getTodayIso()}.pdf`
        );
      }

      return;
    }

    if (typeof maybeApi.getBulletinUrl === "function") {
      await downloadFromUrl(
        maybeApi.getBulletinUrl(etudiantId),
        `bulletin_${etudiantId}_${getTodayIso()}.pdf`
      );
      return;
    }

    await downloadFromUrl(
      `${API_URL}/pdf/bulletin/${etudiantId}`,
      `bulletin_${etudiantId}_${getTodayIso()}.pdf`
    );
  }

  async function generatePv() {
    const maybeApi = api as any;
    const promotionId = Number(formData.promotion);

    if (typeof maybeApi.generatePV === "function") {
      const result = await maybeApi.generatePV(promotionId, {
        semestre: formData.semestre,
      });

      if (result?.download_url) {
        await downloadFromUrl(
          result.download_url,
          `pv_promotion_${promotionId}_${getTodayIso()}.pdf`
        );
      }

      return;
    }

    if (typeof maybeApi.getPVUrl === "function") {
      await downloadFromUrl(
        maybeApi.getPVUrl(promotionId, formData.semestre),
        `pv_promotion_${promotionId}_${getTodayIso()}.pdf`
      );
      return;
    }

    await downloadFromUrl(
      `${API_URL}/pdf/pv/promotion/${promotionId}?semestre=${encodeURIComponent(
        formData.semestre || ""
      )}`,
      `pv_promotion_${promotionId}_${getTodayIso()}.pdf`
    );
  }

  async function generateGenericReport() {
    const maybeApi = api as any;

    if (typeof maybeApi.generateRapport === "function") {
      const result = await maybeApi.generateRapport({
        type: selectedType,
        ...formData,
      });

      if (result?.download_url) {
        await downloadFromUrl(
          result.download_url,
          `rapport_${selectedType}_${getTodayIso()}.pdf`
        );
      }

      return;
    }

    if (typeof maybeApi.generateReport === "function") {
      const result = await maybeApi.generateReport({
        type: selectedType,
        ...formData,
      });

      if (result?.download_url) {
        await downloadFromUrl(
          result.download_url,
          `rapport_${selectedType}_${getTodayIso()}.pdf`
        );
      }

      return;
    }

    throw new Error(
      "Aucun endpoint backend n’est disponible pour ce type de rapport."
    );
  }

  const handleGenerate = async () => {
    if (!selectedType || !selectedReport) return;

    if (!validateForm()) return;

    setIsGenerating(true);

    try {
      if (selectedType === "bulletin") {
        await generateBulletin();
      } else if (selectedType === "pv") {
        await generatePv();
      } else {
        await generateGenericReport();
      }

      const newReport: GeneratedReport = {
        id: `${selectedType}-${Date.now()}`,
        type: selectedReport.title,
        details: currentDetails,
        date: new Date().toISOString(),
      };

      setGeneratedReports((current) => [newReport, ...current].slice(0, 8));

      toast.success("Rapport généré avec succès", {
        description: "Le téléchargement du document a été lancé.",
      });
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Erreur lors de la génération du rapport"
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <DashboardLayout requiredRoles={["chef_filiere"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Génération de rapports
          </h1>
          <p className="text-muted-foreground">
            Génération des bulletins, PV et rapports pédagogiques à partir des
            données enregistrées.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Types de rapports</CardTitle>
                <CardDescription>
                  Sélectionnez le type de rapport à générer.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  {reportTypes.map((report) => {
                    const Icon = report.icon;
                    const isSelected = selectedType === report.id;

                    return (
                      <Card
                        key={report.id}
                        className={`cursor-pointer transition-all hover:border-primary ${
                          isSelected ? "border-primary bg-primary/5" : ""
                        }`}
                        onClick={() => setSelectedType(report.id)}
                      >
                        <CardHeader className="pb-2">
                          <div className="flex items-center gap-3">
                            <div
                              className={`p-2 rounded-lg ${
                                isSelected
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted"
                              }`}
                            >
                              <Icon className="h-5 w-5" />
                            </div>
                            <CardTitle className="text-base">
                              {report.title}
                            </CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">
                            {report.description}
                          </p>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {selectedReport && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Configuration du rapport</CardTitle>
                  <CardDescription>
                    Les listes sont chargées depuis le backend.
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  {loadingData ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {selectedReport.fields.includes("etudiant") && (
                        <div className="space-y-2">
                          <Label>Étudiant</Label>
                          <Select
                            value={formData.etudiant}
                            onValueChange={(value) =>
                              setFormData({ ...formData, etudiant: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner un étudiant" />
                            </SelectTrigger>
                            <SelectContent>
                              {etudiants.length === 0 ? (
                                <SelectItem value="none" disabled>
                                  Aucun étudiant disponible
                                </SelectItem>
                              ) : (
                                etudiants.map((student) => (
                                  <SelectItem
                                    key={student.id}
                                    value={student.id}
                                  >
                                    {student.label}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {selectedReport.fields.includes("promotion") && (
                        <div className="space-y-2">
                          <Label>Promotion</Label>
                          <Select
                            value={formData.promotion}
                            onValueChange={(value) =>
                              setFormData({ ...formData, promotion: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner une promotion" />
                            </SelectTrigger>
                            <SelectContent>
                              {promotions.length === 0 ? (
                                <SelectItem value="none" disabled>
                                  Aucune promotion disponible
                                </SelectItem>
                              ) : (
                                promotions.map((promotion) => (
                                  <SelectItem
                                    key={promotion.id}
                                    value={promotion.id}
                                  >
                                    {promotion.label}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {selectedReport.fields.includes("module") && (
                        <div className="space-y-2">
                          <Label>Module</Label>
                          <Select
                            value={formData.module}
                            onValueChange={(value) =>
                              setFormData({ ...formData, module: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner un module" />
                            </SelectTrigger>
                            <SelectContent>
                              {modules.length === 0 ? (
                                <SelectItem value="none" disabled>
                                  Aucun module disponible
                                </SelectItem>
                              ) : (
                                modules.map((module) => (
                                  <SelectItem key={module.id} value={module.id}>
                                    {module.label}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {selectedReport.fields.includes("semestre") && (
                        <div className="space-y-2">
                          <Label>Semestre</Label>
                          <Select
                            value={formData.semestre}
                            onValueChange={(value) =>
                              setFormData({ ...formData, semestre: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner un semestre" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="S1">Semestre 1</SelectItem>
                              <SelectItem value="S2">Semestre 2</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {selectedReport.fields.includes("periode") && (
                        <div className="space-y-2">
                          <Label>Période</Label>
                          <Select
                            value={formData.periode}
                            onValueChange={(value) =>
                              setFormData({ ...formData, periode: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner une période" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="semaine">
                                Cette semaine
                              </SelectItem>
                              <SelectItem value="mois">Ce mois</SelectItem>
                              <SelectItem value="trimestre">
                                Ce trimestre
                              </SelectItem>
                              <SelectItem value="semestre">
                                Ce semestre
                              </SelectItem>
                              <SelectItem value="annee">Cette année</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {selectedReport.fields.includes("mois") && (
                        <div className="space-y-2">
                          <Label>Mois</Label>
                          <Select
                            value={formData.mois}
                            onValueChange={(value) =>
                              setFormData({ ...formData, mois: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner un mois" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="01">Janvier</SelectItem>
                              <SelectItem value="02">Février</SelectItem>
                              <SelectItem value="03">Mars</SelectItem>
                              <SelectItem value="04">Avril</SelectItem>
                              <SelectItem value="05">Mai</SelectItem>
                              <SelectItem value="06">Juin</SelectItem>
                              <SelectItem value="07">Juillet</SelectItem>
                              <SelectItem value="08">Août</SelectItem>
                              <SelectItem value="09">Septembre</SelectItem>
                              <SelectItem value="10">Octobre</SelectItem>
                              <SelectItem value="11">Novembre</SelectItem>
                              <SelectItem value="12">Décembre</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {selectedReport.fields.includes("seuil_risque") && (
                        <div className="space-y-2">
                          <Label>Seuil de risque minimum</Label>
                          <Select
                            value={formData.seuil_risque}
                            onValueChange={(value) =>
                              setFormData({
                                ...formData,
                                seuil_risque: value,
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="30">30% et plus</SelectItem>
                              <SelectItem value="50">50% et plus</SelectItem>
                              <SelectItem value="70">
                                70% et plus critique
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex flex-col gap-3 pt-4 border-t">
                    <Label>Options supplémentaires</Label>

                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="charts"
                        checked={formData.includeCharts}
                        onCheckedChange={(checked) =>
                          setFormData({
                            ...formData,
                            includeCharts: Boolean(checked),
                          })
                        }
                      />
                      <Label htmlFor="charts" className="font-normal">
                        Inclure les graphiques
                      </Label>
                    </div>

                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="comments"
                        checked={formData.includeComments}
                        onCheckedChange={(checked) =>
                          setFormData({
                            ...formData,
                            includeComments: Boolean(checked),
                          })
                        }
                      />
                      <Label htmlFor="comments" className="font-normal">
                        Inclure les commentaires et recommandations
                      </Label>
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleGenerate}
                    disabled={isGenerating || loadingData}
                  >
                    {isGenerating ? (
                      <>
                        <Clock className="mr-2 h-4 w-4 animate-spin" />
                        Génération en cours...
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 h-4 w-4" />
                        Générer le PDF
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Rapports récents
                </CardTitle>
                <CardDescription>
                  Rapports générés pendant la session actuelle.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {generatedReports.length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    Aucun rapport généré pour le moment.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {generatedReports.map((report) => (
                      <div
                        key={report.id}
                        className="flex items-start justify-between p-3 rounded-lg bg-muted/50"
                      >
                        <div className="space-y-1">
                          <p className="font-medium text-sm">{report.type}</p>
                          <p className="text-xs text-muted-foreground">
                            {report.details}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(report.date).toLocaleDateString("fr-FR", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>

                        <Badge variant="outline">PDF</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileBarChart className="h-5 w-5" />
                  Statistiques
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Ce mois
                    </span>
                    <span className="font-medium">
                      {reportStats.thisMonth} rapport(s)
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Total session
                    </span>
                    <span className="font-medium">
                      {reportStats.total} rapport(s)
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Dernier type
                    </span>
                    <span className="font-medium text-right">
                      {reportStats.latest}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}