"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  Brain,
  Calendar,
  Clock,
  FileText,
  Mail,
  Phone,
  Send,
  Target,
  TrendingDown,
  User,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

type RiskLevel = "faible" | "modere" | "moyen" | "eleve";

type StudentDetail = {
  id: number;
  full_name: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  telephone?: string;
  cne?: string;
  date_naissance?: string;
  filiere?: string;
  filiere_nom?: string;
  promotion?: string;
  promotion_nom?: string;
  groupe?: string;
  niveau?: string;
  moyenne_generale?: number | null;
  taux_absence?: number | null;
  score_risque?: {
    score: number;
    niveau: RiskLevel;
    source?: string;
  } | null;
};

type NoteItem = {
  id?: number;
  module?: string;
  module_nom?: string;
  evaluation?: {
    nom?: string;
    date?: string;
    coefficient?: number;
    bareme_max?: number;
    module?: {
      nom?: string;
      coefficient?: number;
    };
  };
  evaluation_nom?: string;
  date?: string;
  created_at?: string;
  valeur?: number;
  note?: number;
  coefficient?: number;
  bareme_max?: number;
  semestre?: string;
};

type AbsenceItem = {
  id?: number;
  module?: string;
  module_nom?: string;
  date?: string;
  date_absence?: string;
  created_at?: string;
  duree?: number;
  duree_heures?: number;
  heures?: number;
  justifiee?: boolean;
  motif?: string;
};

type AlerteItem = {
  id?: number;
  titre?: string;
  message?: string;
  type?: string;
  urgence?: string;
  score_risque?: number | null;
  created_at?: string;
};

type StudentRecap = {
  etudiant?: StudentDetail;
  student?: StudentDetail;
  notes?: NoteItem[];
  absences?: AbsenceItem[];
  alertes?: AlerteItem[];
  score_risque?: {
    score: number;
    niveau: RiskLevel;
    source?: string;
  } | null;
};

type TrendPoint = {
  mois: string;
  moyenne: number;
};

type AbsenceTrendPoint = {
  mois: string;
  heures: number;
};

type CompetencePoint = {
  competence: string;
  valeur: number;
};

function normalizeRiskLevel(level?: string | null): RiskLevel {
  if (level === "eleve") return "eleve";
  if (level === "modere" || level === "moyen") return "modere";
  return "faible";
}

function getRiskColor(niveau: RiskLevel) {
  switch (normalizeRiskLevel(niveau)) {
    case "faible":
      return "bg-green-500";
    case "modere":
    case "moyen":
      return "bg-yellow-500";
    case "eleve":
      return "bg-red-500";
    default:
      return "bg-gray-500";
  }
}

function getRiskTextColor(niveau: RiskLevel) {
  switch (normalizeRiskLevel(niveau)) {
    case "faible":
      return "text-green-600";
    case "modere":
    case "moyen":
      return "text-yellow-600";
    case "eleve":
      return "text-red-600";
    default:
      return "text-gray-600";
  }
}

function getRiskBadge(niveau: RiskLevel) {
  switch (normalizeRiskLevel(niveau)) {
    case "faible":
      return <Badge className="bg-green-100 text-green-800">Risque faible</Badge>;
    case "modere":
    case "moyen":
      return <Badge className="bg-yellow-100 text-yellow-800">Risque modéré</Badge>;
    case "eleve":
      return <Badge className="bg-red-100 text-red-800">Risque élevé</Badge>;
    default:
      return <Badge>Inconnu</Badge>;
  }
}

function getNoteModuleName(note: NoteItem) {
  return (
    note.module_nom ||
    note.module ||
    note.evaluation?.module?.nom ||
    "Module non défini"
  );
}

function getNoteValueOn20(note: NoteItem) {
  const value = Number(note.valeur ?? note.note ?? 0);
  const bareme = Number(note.bareme_max ?? note.evaluation?.bareme_max ?? 20);

  if (!bareme || bareme <= 0) return value;

  return (value / bareme) * 20;
}

function getNoteCoefficient(note: NoteItem) {
  return Number(note.coefficient ?? note.evaluation?.coefficient ?? 1);
}

function getAbsenceHours(absence: AbsenceItem) {
  return Number(absence.duree_heures ?? absence.duree ?? absence.heures ?? 1);
}

function formatDate(value?: string) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function buildNoteChartData(notes: NoteItem[]): TrendPoint[] {
  if (!notes.length) return [];

  const sorted = [...notes].sort((a, b) => {
    const da =
      new Date(a.date || a.created_at || a.evaluation?.date || "").getTime() ||
      0;
    const db =
      new Date(b.date || b.created_at || b.evaluation?.date || "").getTime() ||
      0;

    return da - db;
  });

  return sorted.slice(-8).map((note, index) => {
    const rawDate = note.date || note.created_at || note.evaluation?.date;
    let label = `N${index + 1}`;

    if (rawDate) {
      const date = new Date(rawDate);

      if (!Number.isNaN(date.getTime())) {
        label = date.toLocaleDateString("fr-FR", {
          day: "2-digit",
          month: "short",
        });
      }
    }

    return {
      mois: label,
      moyenne: Number(getNoteValueOn20(note).toFixed(2)),
    };
  });
}

function buildAbsenceChartData(absences: AbsenceItem[]): AbsenceTrendPoint[] {
  if (!absences.length) return [];

  const grouped = new Map<string, number>();

  for (const absence of absences) {
    const rawDate = absence.date || absence.date_absence || absence.created_at;
    let label = "Date inconnue";

    if (rawDate) {
      const date = new Date(rawDate);

      if (!Number.isNaN(date.getTime())) {
        label = date.toLocaleDateString("fr-FR", {
          month: "short",
        });
      }
    }

    grouped.set(label, (grouped.get(label) || 0) + getAbsenceHours(absence));
  }

  return Array.from(grouped.entries()).map(([mois, heures]) => ({
    mois,
    heures,
  }));
}

function buildModulePerformanceData(notes: NoteItem[]): CompetencePoint[] {
  if (!notes.length) return [];

  const grouped = new Map<string, { total: number; count: number }>();

  for (const note of notes) {
    const module = getNoteModuleName(note);
    const value = getNoteValueOn20(note);

    if (!grouped.has(module)) {
      grouped.set(module, { total: 0, count: 0 });
    }

    const item = grouped.get(module)!;
    item.total += value;
    item.count += 1;
  }

  return Array.from(grouped.entries())
    .map(([competence, data]) => {
      const averageOn20 = data.total / data.count;

      return {
        competence,
        valeur: Number((averageOn20 * 5).toFixed(1)),
      };
    })
    .slice(0, 6);
}

function buildRiskFactors(
  student: StudentDetail | null,
  notes: NoteItem[],
  absences: AbsenceItem[]
) {
  const factors: Array<{
    facteur: string;
    impact: "faible" | "moyen" | "fort";
    description: string;
  }> = [];

  const moyenne = Number(student?.moyenne_generale ?? 0);
  const tauxAbsence = Number(student?.taux_absence ?? 0);
  const nonJustifiees = absences.filter((absence) => !absence.justifiee).length;
  const modulesSous10 = buildModulePerformanceData(notes).filter(
    (item) => item.valeur < 50
  ).length;

  if (tauxAbsence >= 20) {
    factors.push({
      facteur: "Taux d'absence élevé",
      impact: "fort",
      description: `${tauxAbsence.toFixed(1)}% d'absence, seuil critique atteint.`,
    });
  } else if (tauxAbsence >= 10) {
    factors.push({
      facteur: "Taux d'absence à surveiller",
      impact: "moyen",
      description: `${tauxAbsence.toFixed(1)}% d'absence, suivi recommandé.`,
    });
  }

  if (moyenne > 0 && moyenne < 10) {
    factors.push({
      facteur: "Moyenne générale insuffisante",
      impact: "fort",
      description: `Moyenne actuelle : ${moyenne.toFixed(2)}/20.`,
    });
  } else if (moyenne >= 10 && moyenne < 12) {
    factors.push({
      facteur: "Moyenne fragile",
      impact: "moyen",
      description: `Moyenne actuelle : ${moyenne.toFixed(2)}/20.`,
    });
  }

  if (nonJustifiees > 0) {
    factors.push({
      facteur: "Absences non justifiées",
      impact: nonJustifiees >= 3 ? "fort" : "moyen",
      description: `${nonJustifiees} absence(s) non justifiée(s) enregistrée(s).`,
    });
  }

  if (modulesSous10 > 0) {
    factors.push({
      facteur: "Modules sous la moyenne",
      impact: modulesSous10 >= 2 ? "fort" : "moyen",
      description: `${modulesSous10} module(s) nécessitent un accompagnement.`,
    });
  }

  if (!factors.length) {
    factors.push({
      facteur: "Situation stable",
      impact: "faible",
      description: "Aucun facteur critique détecté à partir des données actuelles.",
    });
  }

  return factors;
}

function buildRecommendations(riskLevel: RiskLevel, factorsCount: number) {
  if (normalizeRiskLevel(riskLevel) === "eleve") {
    return [
      "Planifier un entretien individuel avec l’étudiant.",
      "Mettre en place un accompagnement pédagogique ciblé.",
      "Suivre l’assiduité de manière hebdomadaire.",
      "Informer l’équipe pédagogique de la situation.",
    ];
  }

  if (normalizeRiskLevel(riskLevel) === "modere") {
    return [
      "Organiser un suivi pédagogique préventif.",
      "Identifier les modules nécessitant un renforcement.",
      "Surveiller l’évolution des absences et des notes.",
      "Encourager l’étudiant à consulter régulièrement son espace.",
    ];
  }

  if (factorsCount > 1) {
    return [
      "Maintenir un suivi régulier de la progression.",
      "Encourager l’étudiant à stabiliser son assiduité.",
      "Vérifier les prochaines évaluations.",
    ];
  }

  return [
    "Continuer le suivi normal de l’étudiant.",
    "Maintenir la consultation régulière des indicateurs pédagogiques.",
  ];
}

export default function StudentDetailPage() {
  const params = useParams();
  const router = useRouter();

  const studentId = Number(params?.id);

  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [absences, setAbsences] = useState<AbsenceItem[]>([]);
  const [alertes, setAlertes] = useState<AlerteItem[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchStudentData() {
      try {
        setError("");

        const maybeApi = api as any;
        let data: StudentRecap | null = null;

        if (typeof maybeApi.getEtudiantRecap === "function") {
          data = await maybeApi.getEtudiantRecap(studentId);
        } else if (typeof maybeApi.getStudentRecap === "function") {
          data = await maybeApi.getStudentRecap(studentId);
        } else if (typeof maybeApi.getChefEtudiantRecap === "function") {
          data = await maybeApi.getChefEtudiantRecap(studentId);
        } else if (typeof maybeApi.getEtudiantDetails === "function") {
          data = await maybeApi.getEtudiantDetails(studentId);
        } else {
          throw new Error(
            "Endpoint de détail étudiant indisponible dans lib/api.ts"
          );
        }

        const etudiant = data?.etudiant || data?.student || null;

        setStudent({
          ...(etudiant || ({} as StudentDetail)),
          score_risque: data?.score_risque || etudiant?.score_risque || null,
        });
        setNotes(data?.notes || []);
        setAbsences(data?.absences || []);
        setAlertes(data?.alertes || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur de chargement");
      } finally {
        setLoading(false);
      }
    }

    if (Number.isFinite(studentId)) {
      fetchStudentData();
    } else {
      setError("Identifiant étudiant invalide");
      setLoading(false);
    }
  }, [studentId]);

  const moyenneGenerale = useMemo(() => {
    if (typeof student?.moyenne_generale === "number") {
      return student.moyenne_generale;
    }

    if (!notes.length) return null;

    const totalCoef = notes.reduce(
      (acc, note) => acc + getNoteCoefficient(note),
      0
    );

    if (!totalCoef) return null;

    return (
      notes.reduce(
        (acc, note) => acc + getNoteValueOn20(note) * getNoteCoefficient(note),
        0
      ) / totalCoef
    );
  }, [student, notes]);

  const tauxAbsence = useMemo(() => {
    if (typeof student?.taux_absence === "number") {
      return student.taux_absence;
    }

    const totalHeures = absences.reduce(
      (acc, absence) => acc + getAbsenceHours(absence),
      0
    );

    return Math.min((totalHeures / 120) * 100, 100);
  }, [student, absences]);

  const riskScore = Number(
    student?.score_risque?.score ??
      Math.min(
        Math.max(
          (tauxAbsence || 0) * 1.5 +
            (moyenneGenerale !== null && moyenneGenerale < 10
              ? (10 - moyenneGenerale) * 8
              : 0),
          0
        ),
        100
      )
  );

  const riskLevel: RiskLevel = normalizeRiskLevel(
    student?.score_risque?.niveau ||
      (riskScore >= 70 ? "eleve" : riskScore >= 40 ? "modere" : "faible")
  );

  const noteChartData = useMemo(() => buildNoteChartData(notes), [notes]);
  const absenceChartData = useMemo(
    () => buildAbsenceChartData(absences),
    [absences]
  );
  const modulePerformanceData = useMemo(
    () => buildModulePerformanceData(notes),
    [notes]
  );
  const riskFactors = useMemo(
    () => buildRiskFactors(student, notes, absences),
    [student, notes, absences]
  );
  const recommendations = useMemo(
    () => buildRecommendations(riskLevel, riskFactors.length),
    [riskLevel, riskFactors.length]
  );

  const totalAbsenceHours = absences.reduce(
    (sum, absence) => sum + getAbsenceHours(absence),
    0
  );

  const handleSendAlert = async () => {
    if (!message.trim()) {
      toast.error("Veuillez saisir un message");
      return;
    }

    setActionLoading(true);

    try {
      const maybeApi = api as any;

      if (typeof maybeApi.createAlerte === "function") {
        await maybeApi.createAlerte({
          etudiant_id: studentId,
          type: "message",
          urgence: "info",
          titre: "Message du chef de filière",
          message,
        });
      } else if (typeof maybeApi.sendStudentMessage === "function") {
        await maybeApi.sendStudentMessage(studentId, message);
      }

      toast.success("Message envoyé avec succès");
      setMessage("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur d’envoi");
    } finally {
      setActionLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    setActionLoading(true);

    try {
      const maybeApi = api as any;

      if (typeof maybeApi.generateBulletin === "function") {
        const result = await maybeApi.generateBulletin(studentId);

        if (result?.download_url) {
          window.open(result.download_url, "_blank");
        }
      } else if (typeof maybeApi.getBulletinUrl === "function") {
        window.open(maybeApi.getBulletinUrl(studentId), "_blank");
      }

      toast.success("Rapport PDF généré avec succès");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur de génération");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout requiredRoles={["chef_filiere"]}>
        <div className="space-y-6">
          <Skeleton className="h-12 w-80" />
          <div className="grid gap-4 md:grid-cols-4">
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !student) {
    return (
      <DashboardLayout requiredRoles={["chef_filiere"]}>
        <div className="space-y-6">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5 mr-2" />
            Retour
          </Button>

          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="pt-6">
              <p className="text-destructive">
                {error || "Étudiant introuvable"}
              </p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout requiredRoles={["chef_filiere"]}>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5" />
            </Button>

            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {student.full_name ||
                  `${student.first_name || ""} ${student.last_name || ""}`.trim() ||
                  `Étudiant #${studentId}`}
              </h1>
              <p className="text-muted-foreground">
                {student.filiere_nom || student.filiere || "Filière"} -{" "}
                {student.promotion_nom ||
                  student.promotion ||
                  student.niveau ||
                  "Promotion"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {getRiskBadge(riskLevel)}

            <Button
              variant="outline"
              onClick={handleGenerateReport}
              disabled={actionLoading}
            >
              <FileText className="mr-2 h-4 w-4" />
              Générer rapport
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Groupe</p>
                  <p className="font-semibold">
                    {student.groupe || student.promotion_nom || "—"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Moyenne générale
                  </p>
                  <p className="font-semibold text-lg">
                    {moyenneGenerale !== null
                      ? `${moyenneGenerale.toFixed(2)}/20`
                      : "—"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-orange-500/10 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-orange-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Taux d&apos;absence
                  </p>
                  <p className="font-semibold text-lg">
                    {tauxAbsence.toFixed(1)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "h-12 w-12 rounded-full flex items-center justify-center",
                    normalizeRiskLevel(riskLevel) === "eleve" && "bg-red-500/10",
                    normalizeRiskLevel(riskLevel) === "modere" &&
                      "bg-yellow-500/10",
                    normalizeRiskLevel(riskLevel) === "faible" &&
                      "bg-green-500/10"
                  )}
                >
                  <Brain
                    className={cn("h-6 w-6", getRiskTextColor(riskLevel))}
                  />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Score IA</p>
                  <p className="font-semibold text-lg">
                    {riskScore.toFixed(0)}/100
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Vue d&apos;ensemble</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
            <TabsTrigger value="absences">Absences</TabsTrigger>
            <TabsTrigger value="ia">Analyse IA</TabsTrigger>
            <TabsTrigger value="contact">Contact</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingDown className="h-5 w-5 text-red-500" />
                    Évolution des notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[220px]">
                    {noteChartData.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                        Aucune note disponible.
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={noteChartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="mois" />
                          <YAxis domain={[0, 20]} />
                          <Tooltip />
                          <Line
                            type="monotone"
                            dataKey="moyenne"
                            stroke="hsl(var(--primary))"
                            strokeWidth={2}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-orange-500" />
                    Évolution des absences
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[220px]">
                    {absenceChartData.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                        Aucune absence enregistrée.
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={absenceChartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="mois" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="heures" fill="hsl(var(--chart-5))" />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Profil de compétences
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {modulePerformanceData.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                      Aucune donnée de compétence disponible.
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={modulePerformanceData}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="competence" />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} />
                        <Radar
                          name="Niveau"
                          dataKey="valeur"
                          stroke="hsl(var(--primary))"
                          fill="hsl(var(--primary))"
                          fillOpacity={0.5}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Relevé de notes</CardTitle>
                <CardDescription>
                  Notes enregistrées par module pour l&apos;année en cours
                </CardDescription>
              </CardHeader>
              <CardContent>
                {notes.length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    Aucune note enregistrée.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {notes.map((note, index) => {
                      const value = getNoteValueOn20(note);

                      return (
                        <div
                          key={note.id || index}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div>
                            <p className="font-medium">
                              {getNoteModuleName(note)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Coefficient : {getNoteCoefficient(note)}{" "}
                              {note.semestre ? `| ${note.semestre}` : ""}
                            </p>
                          </div>

                          <div className="text-right">
                            <p
                              className={cn(
                                "text-xl font-bold",
                                value >= 12
                                  ? "text-green-600"
                                  : value >= 10
                                    ? "text-yellow-600"
                                    : "text-red-600"
                              )}
                            >
                              {value.toFixed(2)}/20
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="absences" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Historique des absences</CardTitle>
                <CardDescription>
                  Total : {totalAbsenceHours.toFixed(0)} heure(s)
                  d&apos;absence
                </CardDescription>
              </CardHeader>
              <CardContent>
                {absences.length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    Aucune absence enregistrée.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {absences.map((absence, index) => (
                      <div
                        key={absence.id || index}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={cn(
                              "w-3 h-3 rounded-full",
                              absence.justifiee ? "bg-green-500" : "bg-red-500"
                            )}
                          />

                          <div>
                            <p className="font-medium">
                              {absence.module_nom ||
                                absence.module ||
                                "Module non défini"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {formatDate(
                                absence.date ||
                                  absence.date_absence ||
                                  absence.created_at
                              )}{" "}
                              - {getAbsenceHours(absence)}h
                            </p>
                            {absence.motif && (
                              <p className="text-sm text-green-600">
                                Motif : {absence.motif}
                              </p>
                            )}
                          </div>
                        </div>

                        <Badge
                          variant={absence.justifiee ? "default" : "destructive"}
                        >
                          {absence.justifiee ? "Justifiée" : "Non justifiée"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ia" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary" />
                  Analyse IA - score de risque
                </CardTitle>
                <CardDescription>
                  Évaluation automatique basée sur les performances et
                  l&apos;assiduité
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">Score de risque</span>
                    <span className="font-bold">{riskScore.toFixed(0)}/100</span>
                  </div>
                  <Progress value={riskScore} className="h-3" />
                  <p className="text-sm text-muted-foreground">
                    Plus le score est élevé, plus le risque d&apos;échec est
                    important.
                  </p>
                </div>

                {student.score_risque?.source && (
                  <div className="rounded-lg border p-3 text-sm text-muted-foreground">
                    Source du calcul :{" "}
                    <span className="font-medium text-foreground">
                      {student.score_risque.source}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  Facteurs de risque identifiés
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {riskFactors.map((facteur, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{facteur.facteur}</span>
                        <Badge
                          variant={
                            facteur.impact === "fort"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          Impact {facteur.impact}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {facteur.description}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-green-500" />
                  Recommandations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-medium text-primary">
                          {index + 1}
                        </span>
                      </div>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contact" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Informations de contact</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">
                        {student.email || "Non renseigné"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Téléphone
                      </p>
                      <p className="font-medium">
                        {student.telephone || student.phone || "Non renseigné"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Date de naissance
                      </p>
                      <p className="font-medium">
                        {formatDate(student.date_naissance)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Envoyer une alerte</CardTitle>
                  <CardDescription>
                    Contacter l&apos;étudiant ou préparer un message de suivi
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder="Rédigez votre message..."
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    rows={5}
                  />

                  <div className="flex gap-2">
                    <Button
                      onClick={handleSendAlert}
                      disabled={actionLoading}
                      className="flex-1"
                    >
                      <Send className="mr-2 h-4 w-4" />
                      Envoyer à l&apos;étudiant
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}