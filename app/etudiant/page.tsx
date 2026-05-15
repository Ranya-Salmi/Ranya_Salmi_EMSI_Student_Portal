"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Area,
  AreaChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  ArrowUpRight,
  Bell,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Download,
  FileText,
  GraduationCap,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { api, type Alerte, type RecapEtudiant } from "@/lib/api";
import { getRiskBgColor, getRiskColor } from "@/lib/store";
import { cn } from "@/lib/utils";

type ChartPoint = {
  label: string;
  note: number;
};

type RadarPoint = {
  subject: string;
  A: number;
  fullMark: number;
};

function normalizeRiskLevel(niveau?: string) {
  if (niveau === "eleve" || niveau === "modere" || niveau === "faible") {
    return niveau;
  }

  return "faible";
}

function formatDate(value?: string) {
  if (!value) return "Date non disponible";

  try {
    return new Date(value).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "Date non disponible";
  }
}

function getNoteModuleName(note: any): string {
  return (
    note.module_nom ||
    note.module ||
    note.evaluation_module ||
    note.evaluation?.module?.nom ||
    note.evaluation?.module_nom ||
    "Module"
  );
}

function getNoteDate(note: any): string {
  return (
    note.date ||
    note.created_at ||
    note.evaluation?.date ||
    note.evaluation_date ||
    ""
  );
}

function getNoteValueOn20(note: any): number {
  const valeur = Number(note.valeur ?? note.note ?? 0);
  const bareme = Number(note.bareme_max ?? note.evaluation?.bareme_max ?? 20);

  if (!bareme || bareme <= 0) return valeur;

  return (valeur / bareme) * 20;
}

function buildTrendData(notes: any[]): ChartPoint[] {
  if (!notes.length) return [];

  const sorted = [...notes].sort((a, b) => {
    const dateA = new Date(getNoteDate(a)).getTime() || 0;
    const dateB = new Date(getNoteDate(b)).getTime() || 0;
    return dateA - dateB;
  });

  return sorted.slice(-8).map((note, index) => {
    const rawDate = getNoteDate(note);
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
      label,
      note: Number(getNoteValueOn20(note).toFixed(2)),
    };
  });
}

function buildRadarData(notes: any[]): RadarPoint[] {
  if (!notes.length) return [];

  const grouped = new Map<string, { total: number; count: number }>();

  for (const note of notes) {
    const moduleName = getNoteModuleName(note);
    const value = getNoteValueOn20(note);

    if (!grouped.has(moduleName)) {
      grouped.set(moduleName, { total: 0, count: 0 });
    }

    const current = grouped.get(moduleName)!;
    current.total += value;
    current.count += 1;
  }

  return Array.from(grouped.entries())
    .map(([subject, data]) => ({
      subject,
      A: Number(((data.total / data.count) * 5).toFixed(1)),
      fullMark: 100,
    }))
    .slice(0, 6);
}

function getAlertIcon(urgence: string) {
  if (urgence === "critical") {
    return <AlertTriangle className="h-4 w-4 text-destructive" />;
  }

  if (urgence === "warning") {
    return <Bell className="h-4 w-4 text-warning" />;
  }

  return <CheckCircle2 className="h-4 w-4 text-success" />;
}

export default function EtudiantDashboardPage() {
  const [recap, setRecap] = useState<RecapEtudiant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [generatingBulletin, setGeneratingBulletin] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        setError("");
        const data = await api.getRecapEtudiant();
        setRecap(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur de chargement");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const stats = useMemo(() => {
    if (!recap) {
      return {
        totalNotes: 0,
        totalAbsences: 0,
        absencesNonJustifiees: 0,
        moyenneGenerale: null as number | null,
        alertesNonLues: 0,
      };
    }

    const notes = recap.notes || [];
    const absences = recap.absences || [];
    const alertes = recap.alertes || [];

    const totalCoef = notes.reduce(
      (acc: number, note: any) => acc + Number(note.coefficient || 0),
      0
    );

    const moyenneGenerale =
      notes.length > 0 && totalCoef > 0
        ? notes.reduce(
            (acc: number, note: any) =>
              acc + getNoteValueOn20(note) * Number(note.coefficient || 0),
            0
          ) / totalCoef
        : null;

    const totalAbsences = absences.reduce((acc: number, absence: any) => {
      return acc + Number(absence.duree_heures ?? absence.duree ?? 1);
    }, 0);

    const absencesNonJustifiees = absences
      .filter((absence: any) => !absence.justifiee)
      .reduce((acc: number, absence: any) => {
        return acc + Number(absence.duree_heures ?? absence.duree ?? 1);
      }, 0);

    return {
      totalNotes: notes.length,
      totalAbsences,
      absencesNonJustifiees,
      moyenneGenerale,
      alertesNonLues: alertes.filter((alerte: Alerte) => !alerte.lue).length,
    };
  }, [recap]);

  const trendData = useMemo(
    () => buildTrendData((recap?.notes || []) as any[]),
    [recap]
  );

  const radarData = useMemo(
    () => buildRadarData((recap?.notes || []) as any[]),
    [recap]
  );

  const recentAlerts = useMemo(() => {
    return [...(recap?.alertes || [])]
      .sort((a: any, b: any) => {
        const dateA = new Date(a.created_at || "").getTime() || 0;
        const dateB = new Date(b.created_at || "").getTime() || 0;
        return dateB - dateA;
      })
      .slice(0, 3);
  }, [recap]);

  const handleGenerateBulletin = async () => {
    setGeneratingBulletin(true);

    try {
      const maybeApi = api as any;

      if (typeof maybeApi.generateBulletinEtudiant === "function") {
        const result = await maybeApi.generateBulletinEtudiant();

        if (result?.download_url) {
          window.open(result.download_url, "_blank");
        }

        toast.success("Bulletin généré avec succès");
        return;
      }

      if (typeof maybeApi.getMonBulletinUrl === "function") {
        window.open(maybeApi.getMonBulletinUrl(), "_blank");
        toast.success("Téléchargement du bulletin lancé");
        return;
      }

      toast.info(
        "Le bulletin est disponible depuis l'espace PV & Bulletins après génération."
      );
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erreur lors de la génération"
      );
    } finally {
      setGeneratingBulletin(false);
    }
  };

  const riskLevel = normalizeRiskLevel(recap?.score_risque?.niveau);
  const riskScore = Number(recap?.score_risque?.score ?? 0);

  return (
    <DashboardLayout requiredRoles={["etudiant"]}>
      <div className="space-y-6">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-primary/5 to-background border border-primary/10 p-6 md:p-8">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />

          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                <Sparkles className="h-4 w-4" />
                Semestre en cours
              </div>

              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                Bienvenue,{" "}
                {loading ? (
                  <span className="inline-block align-middle">
                    <Skeleton className="h-8 w-40" />
                  </span>
                ) : (
                  recap?.etudiant.full_name || "Étudiant"
                )}
              </h1>

              <p className="text-muted-foreground mt-2 max-w-lg">
                Suivez votre progression académique, vos absences, vos alertes
                et vos performances en temps réel.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button variant="outline" size="lg" asChild>
                <Link href="/etudiant/notes">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Mes notes
                </Link>
              </Button>

              <Button
                size="lg"
                onClick={handleGenerateBulletin}
                disabled={generatingBulletin}
                className="glow-primary"
              >
                <Download className="h-4 w-4 mr-2" />
                {generatingBulletin ? "Génération..." : "Télécharger bulletin"}
              </Button>
            </div>
          </div>
        </div>

        {error && (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="pt-6">
              <p className="text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}

        {!loading && riskLevel !== "faible" && (
          <Card
            className={cn(
              "border overflow-hidden",
              riskLevel === "eleve"
                ? "border-destructive/50 bg-destructive/5"
                : "border-warning/50 bg-warning/5"
            )}
          >
            <CardContent className="p-0">
              <div className="flex items-stretch">
                <div
                  className={cn(
                    "w-1.5",
                    riskLevel === "eleve" ? "bg-destructive" : "bg-warning"
                  )}
                />

                <div className="flex items-center gap-4 p-4 flex-1">
                  <div
                    className={cn(
                      "flex items-center justify-center w-12 h-12 rounded-xl shrink-0",
                      riskLevel === "eleve"
                        ? "bg-destructive/10 text-destructive"
                        : "bg-warning/10 text-warning"
                    )}
                  >
                    <AlertTriangle className="h-6 w-6" />
                  </div>

                  <div className="flex-1">
                    <h3 className={cn("font-semibold", getRiskColor(riskLevel))}>
                      Attention : profil à risque{" "}
                      {riskLevel === "eleve" ? "élevé" : "modéré"} détecté
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Score IA : {riskScore.toFixed(0)}/100. Consultez votre
                      coordinateur pour un accompagnement.
                    </p>
                  </div>

                  <Button variant="outline" size="sm" asChild>
                    <Link href="/etudiant/alertes">
                      Voir détails
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="relative overflow-hidden group hover:border-primary/30 transition-colors">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-primary/10 to-transparent rounded-bl-full" />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Moyenne générale
              </CardTitle>
              <div className="p-2 rounded-lg bg-primary/10">
                <GraduationCap className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-10 w-24" />
              ) : (
                <div className="flex items-baseline gap-1">
                  <span
                    className={cn(
                      "text-3xl font-bold stat-number",
                      (stats.moyenneGenerale ?? 0) < 10 && "text-destructive"
                    )}
                  >
                    {stats.moyenneGenerale !== null
                      ? stats.moyenneGenerale.toFixed(1)
                      : "—"}
                  </span>
                  <span className="text-lg text-muted-foreground">/20</span>
                </div>
              )}

              <Progress
                value={
                  stats.moyenneGenerale !== null
                    ? (stats.moyenneGenerale / 20) * 100
                    : 0
                }
                className="h-1.5 mt-3"
              />

              <p className="text-xs text-muted-foreground mt-2">
                Calculée à partir des évaluations enregistrées.
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden group hover:border-chart-2/30 transition-colors">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-chart-2/10 to-transparent rounded-bl-full" />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Évaluations
              </CardTitle>
              <div className="p-2 rounded-lg bg-chart-2/10">
                <FileText className="h-4 w-4 text-chart-2" />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-10 w-20" />
              ) : (
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold stat-number">
                    {stats.totalNotes}
                  </span>
                  <span className="text-sm text-muted-foreground">notes</span>
                </div>
              )}

              <p className="text-xs text-muted-foreground mt-2">
                Notes enregistrées dans la base de données.
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden group hover:border-warning/30 transition-colors">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-warning/10 to-transparent rounded-bl-full" />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Absences
              </CardTitle>
              <div className="p-2 rounded-lg bg-warning/10">
                <Clock className="h-4 w-4 text-warning" />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-10 w-20" />
              ) : (
                <div className="flex items-baseline gap-2">
                  <span
                    className={cn(
                      "text-3xl font-bold stat-number",
                      stats.absencesNonJustifiees > 3 && "text-destructive"
                    )}
                  >
                    {stats.totalAbsences.toFixed(0)}
                  </span>
                  <span className="text-sm text-muted-foreground">heures</span>
                </div>
              )}

              <div className="flex items-center gap-2 mt-2">
                <Badge
                  variant="outline"
                  className="text-xs bg-destructive/10 text-destructive border-destructive/20"
                >
                  {stats.absencesNonJustifiees.toFixed(0)} non justifiée(s)
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden group hover:border-success/30 transition-colors">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-success/10 to-transparent rounded-bl-full" />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Score de risque
              </CardTitle>
              <div className="p-2 rounded-lg bg-success/10">
                <Target className="h-4 w-4 text-success" />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-10 w-20" />
              ) : (
                <div className="flex items-baseline gap-1">
                  <span
                    className={cn(
                      "text-3xl font-bold stat-number",
                      getRiskColor(riskLevel)
                    )}
                  >
                    {riskScore.toFixed(0)}
                  </span>
                  <span className="text-lg text-muted-foreground">/100</span>
                </div>
              )}

              <Badge className={cn("mt-2", getRiskBgColor(riskLevel))}>
                {riskLevel === "eleve"
                  ? "Élevé"
                  : riskLevel === "modere"
                    ? "Modéré"
                    : "Faible"}
              </Badge>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-7">
          <Card className="lg:col-span-4">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">
                    Évolution des notes
                  </CardTitle>
                  <CardDescription>
                    Dernières évaluations enregistrées
                  </CardDescription>
                </div>

                <Badge
                  variant="outline"
                  className="bg-success/10 text-success border-success/20"
                >
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Données réelles
                </Badge>
              </div>
            </CardHeader>

            <CardContent>
              <div className="h-[250px]">
                {loading ? (
                  <Skeleton className="h-full w-full" />
                ) : trendData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                    Aucune note disponible pour afficher l’évolution.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData}>
                      <defs>
                        <linearGradient
                          id="colorNote"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#22c55e"
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="95%"
                            stopColor="#22c55e"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="label"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#94a3b8", fontSize: 12 }}
                      />
                      <YAxis
                        domain={[0, 20]}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#94a3b8", fontSize: 12 }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#020617",
                          border: "1px solid #334155",
                          borderRadius: "8px",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="note"
                        stroke="#22c55e"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorNote)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Performance par module
              </CardTitle>
              <CardDescription>
                Moyenne calculée par domaine/module
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="h-[250px]">
                {loading ? (
                  <Skeleton className="h-full w-full" />
                ) : radarData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                    Aucune donnée disponible pour cette analyse.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="#334155" />
                      <PolarAngleAxis
                        dataKey="subject"
                        tick={{ fill: "#94a3b8", fontSize: 10 }}
                      />
                      <Radar
                        name="Score"
                        dataKey="A"
                        stroke="#22c55e"
                        fill="#22c55e"
                        fillOpacity={0.3}
                        strokeWidth={2}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#020617",
                          border: "1px solid #334155",
                          borderRadius: "8px",
                        }}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Notifications récentes
                  </CardTitle>
                  <CardDescription>
                    {stats.alertesNonLues} nouvelle(s)
                  </CardDescription>
                </div>

                <Button variant="ghost" size="sm" asChild>
                  <Link href="/etudiant/alertes">
                    Voir tout
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  <Skeleton className="h-18 w-full" />
                  <Skeleton className="h-18 w-full" />
                </div>
              ) : recentAlerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-8 w-8 mb-2 opacity-50 text-success" />
                  <p className="text-sm font-medium">Aucune alerte récente</p>
                  <p className="text-xs">Votre espace est à jour.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentAlerts.map((alerte: Alerte) => (
                    <div
                      key={alerte.id}
                      className={cn(
                        "flex items-start gap-3 p-3 rounded-lg border",
                        alerte.urgence === "critical" &&
                          "bg-destructive/5 border-destructive/20",
                        alerte.urgence === "warning" &&
                          "bg-warning/5 border-warning/20",
                        alerte.urgence !== "critical" &&
                          alerte.urgence !== "warning" &&
                          "bg-success/5 border-success/20"
                      )}
                    >
                      <div className="p-1.5 rounded-lg bg-background/60">
                        {getAlertIcon(alerte.urgence)}
                      </div>

                      <div className="flex-1">
                        <p className="text-sm font-medium">{alerte.titre}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {alerte.message}
                        </p>
                        <p className="text-xs text-muted-foreground/60 mt-1">
                          {formatDate(alerte.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Actions rapides</CardTitle>
              <CardDescription>
                Accès direct aux fonctionnalités principales
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Link
                  href="/etudiant/notes"
                  className="group p-4 rounded-xl bg-muted/30 border border-transparent hover:border-primary/20 hover:bg-muted/50 transition-all"
                >
                  <div className="p-2 rounded-lg bg-primary/10 w-fit mb-3 group-hover:bg-primary/20 transition-colors">
                    <BookOpen className="h-5 w-5 text-primary" />
                  </div>
                  <p className="font-medium group-hover:text-primary transition-colors">
                    Mes notes
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Consulter toutes mes notes
                  </p>
                </Link>

                <Link
                  href="/etudiant/absences"
                  className="group p-4 rounded-xl bg-muted/30 border border-transparent hover:border-warning/20 hover:bg-muted/50 transition-all"
                >
                  <div className="p-2 rounded-lg bg-warning/10 w-fit mb-3 group-hover:bg-warning/20 transition-colors">
                    <Clock className="h-5 w-5 text-warning" />
                  </div>
                  <p className="font-medium group-hover:text-warning transition-colors">
                    Mes absences
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Historique et justificatifs
                  </p>
                </Link>

                <Link
                  href="/etudiant/alertes"
                  className="group p-4 rounded-xl bg-muted/30 border border-transparent hover:border-chart-2/20 hover:bg-muted/50 transition-all"
                >
                  <div className="p-2 rounded-lg bg-chart-2/10 w-fit mb-3 group-hover:bg-chart-2/20 transition-colors">
                    <Bell className="h-5 w-5 text-chart-2" />
                  </div>
                  <p className="font-medium group-hover:text-chart-2 transition-colors">
                    Alertes
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Notifications importantes
                  </p>
                </Link>

                <button
                  onClick={handleGenerateBulletin}
                  disabled={generatingBulletin}
                  className="group p-4 rounded-xl bg-muted/30 border border-transparent hover:border-success/20 hover:bg-muted/50 transition-all text-left disabled:opacity-50"
                >
                  <div className="p-2 rounded-lg bg-success/10 w-fit mb-3 group-hover:bg-success/20 transition-colors">
                    <Download className="h-5 w-5 text-success" />
                  </div>
                  <p className="font-medium group-hover:text-success transition-colors">
                    {generatingBulletin ? "Génération..." : "Bulletin PDF"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Télécharger mon bulletin
                  </p>
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}