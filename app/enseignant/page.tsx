"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  api,
  type AcademicModule,
  type Alerte,
  type ModuleStats,
} from "@/lib/api";
import { getUrgenceColor } from "@/lib/store";
import { cn } from "@/lib/utils";
import {
  ClipboardList,
  Bell,
  ChevronRight,
  Calendar,
  TrendingUp,
  Info,
  CheckCircle2,
  BookOpen,
  BarChart3,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type ModuleStatsMap = Record<number, ModuleStats>;

function formatNumber(value: number | undefined | null, digits = 1) {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return "-";
  }

  return value.toFixed(digits);
}

function getModuleCoefficient(module: AcademicModule) {
  return Number(module.coefficient || 1);
}

export default function EnseignantDashboardPage() {
  const [modules, setModules] = useState<AcademicModule[]>([]);
  const [moduleStats, setModuleStats] = useState<ModuleStatsMap>({});
  const [alertes, setAlertes] = useState<Alerte[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function fetchData() {
    try {
      setLoading(true);
      setError("");

      const modulesData = await api.getModules();
      setModules(modulesData);

      const statsResults = await Promise.allSettled(
        modulesData.map(async (module) => {
          const stats = await api.getModuleStats(module.id);
          return [module.id, stats] as const;
        })
      );

      const statsMap: ModuleStatsMap = {};

      statsResults.forEach((result) => {
        if (result.status === "fulfilled") {
          const [moduleId, stats] = result.value;
          statsMap[moduleId] = stats;
        }
      });

      setModuleStats(statsMap);

      try {
        const alertesData = await api.getMesAlertes();
        setAlertes(alertesData);
      } catch {
        setAlertes([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  const averageClassGrade = useMemo(() => {
    let weightedSum = 0;
    let totalCoeff = 0;

    modules.forEach((module) => {
      const stats = moduleStats[module.id];

      if (!stats) return;

      const moyenne = Number(stats.moyenne_classe);

      if (Number.isNaN(moyenne) || moyenne <= 0) return;

      const coeff = getModuleCoefficient(module);
      weightedSum += moyenne * coeff;
      totalCoeff += coeff;
    });

    if (totalCoeff === 0) return null;

    return weightedSum / totalCoeff;
  }, [modules, moduleStats]);

  const averageSuccessRate = useMemo(() => {
    let weightedSum = 0;
    let totalCoeff = 0;

    modules.forEach((module) => {
      const stats = moduleStats[module.id];

      if (!stats) return;

      const taux = Number(stats.taux_reussite);

      if (Number.isNaN(taux)) return;

      const coeff = getModuleCoefficient(module);
      weightedSum += taux * coeff;
      totalCoeff += coeff;
    });

    if (totalCoeff === 0) return null;

    return weightedSum / totalCoeff;
  }, [modules, moduleStats]);

  const stats = {
    modulesCount: modules.length,
    moyenneClasse: averageClassGrade,
    tauxReussite: averageSuccessRate,
    alertesNonLues: alertes.filter((alerte) => !alerte.lue).length,
  };

  const quickActions = [
    {
      title: "Saisir des notes",
      description: "Enregistrer les notes d’une évaluation",
      href: "/enseignant/notes",
      icon: ClipboardList,
      color: "bg-primary/10 text-primary",
    },
    {
      title: "Saisir des absences",
      description: "Marquer les absences d’une séance",
      href: "/enseignant/absences",
      icon: Calendar,
      color: "bg-chart-2/10 text-chart-2",
    },
  ];

  return (
    <DashboardLayout requiredRoles={["enseignant"]}>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Mes modules</h1>
            <p className="text-muted-foreground">
              Gérez vos cours, notes et absences
            </p>
          </div>

          <Button variant="outline" onClick={fetchData} disabled={loading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Actualiser
          </Button>
        </div>

        {error && (
          <Card className="border-destructive bg-destructive/5">
            <CardContent className="pt-6">
              <p className="text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          {quickActions.map((action) => {
            const Icon = action.icon;

            return (
              <Link key={action.href} href={action.href}>
                <Card className="h-full cursor-pointer transition-shadow hover:shadow-md">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div
                        className={cn(
                          "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
                          action.color
                        )}
                      >
                        <Icon className="h-6 w-6" />
                      </div>

                      <div className="flex-1">
                        <h3 className="font-semibold">{action.title}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {action.description}
                        </p>
                      </div>

                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        <div className="grid gap-4 sm:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>

                <div>
                  <div className="text-2xl font-bold text-primary">
                    {loading ? (
                      <Skeleton className="inline-block h-8 w-10" />
                    ) : (
                      stats.modulesCount
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">Modules</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-chart-2/10">
                  <BarChart3 className="h-5 w-5 text-chart-2" />
                </div>

                <div>
                  <div className="text-2xl font-bold text-chart-2">
                    {loading ? (
                      <Skeleton className="inline-block h-8 w-14" />
                    ) : stats.moyenneClasse === null ? (
                      "-"
                    ) : (
                      `${formatNumber(stats.moyenneClasse)}/20`
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Moyenne classe
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--risk-medium)]/10">
                  <TrendingUp className="h-5 w-5 text-[var(--risk-medium)]" />
                </div>

                <div>
                  <div className="text-2xl font-bold text-[var(--risk-medium)]">
                    {loading ? (
                      <Skeleton className="inline-block h-8 w-14" />
                    ) : stats.tauxReussite === null ? (
                      "-"
                    ) : (
                      `${formatNumber(stats.tauxReussite, 0)}%`
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Taux réussite
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-chart-2/10">
                  <Bell className="h-5 w-5 text-chart-2" />
                </div>

                <div>
                  <div className="text-2xl font-bold text-chart-2">
                    {loading ? (
                      <Skeleton className="inline-block h-8 w-8" />
                    ) : (
                      stats.alertesNonLues
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Alertes non lues
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Modules enseignés
              </CardTitle>
              <CardDescription>
                Moyennes et taux de réussite calculés depuis les notes
              </CardDescription>
            </CardHeader>

            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <Skeleton key={index} className="h-16 w-full" />
                  ))}
                </div>
              ) : modules.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <CheckCircle2 className="mb-2 h-8 w-8 opacity-50 text-primary" />
                  <p className="text-sm">Aucun module affecté</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {modules.map((module) => {
                    const statsModule = moduleStats[module.id];

                    return (
                      <div
                        key={module.id}
                        className="rounded-lg border bg-muted/30 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate font-medium">{module.nom}</p>
                            <p className="text-sm text-muted-foreground">
                              {module.code || "Code non défini"}
                              {module.semestre ? ` • S${module.semestre}` : ""}
                              {module.coefficient
                                ? ` • Coef. ${module.coefficient}`
                                : ""}
                            </p>
                          </div>

                          <Badge variant="outline">Module #{module.id}</Badge>
                        </div>

                        {statsModule ? (
                          <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                            <div className="rounded-md bg-background p-2">
                              <span className="text-muted-foreground">
                                Moyenne :{" "}
                              </span>
                              <span
                                className={cn(
                                  "font-medium",
                                  statsModule.moyenne_classe < 10 &&
                                    "text-destructive",
                                  statsModule.moyenne_classe >= 10 &&
                                    "text-primary"
                                )}
                              >
                                {formatNumber(statsModule.moyenne_classe)}/20
                              </span>
                            </div>

                            <div className="rounded-md bg-background p-2">
                              <span className="text-muted-foreground">
                                Réussite :{" "}
                              </span>
                              <span className="font-medium">
                                {formatNumber(statsModule.taux_reussite, 0)}%
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-3 rounded-md bg-background p-2 text-sm text-muted-foreground">
                            Aucune note saisie pour ce module
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Alertes récentes
              </CardTitle>
              <CardDescription>
                Notifications concernant vos étudiants
              </CardDescription>
            </CardHeader>

            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <Skeleton key={index} className="h-14 w-full" />
                  ))}
                </div>
              ) : alertes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <Bell className="mb-2 h-8 w-8 opacity-50" />
                  <p className="text-sm">Aucune alerte</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {alertes.slice(0, 5).map((alerte) => (
                    <div
                      key={alerte.id}
                      className={cn(
                        "flex items-start gap-3 rounded-lg border p-3",
                        getUrgenceColor(alerte.urgence)
                      )}
                    >
                      <div className="mt-0.5 shrink-0">
                        {alerte.urgence === "critical" ? (
                          <AlertTriangle className="h-4 w-4" />
                        ) : alerte.urgence === "warning" ? (
                          <Info className="h-4 w-4" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p
                          className={cn(
                            "text-sm",
                            !alerte.lue && "font-medium"
                          )}
                        >
                          {alerte.titre}
                        </p>
                        <p className="mt-0.5 line-clamp-1 text-xs opacity-80">
                          {alerte.etudiant_nom || "Étudiant"} —{" "}
                          {alerte.message}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}