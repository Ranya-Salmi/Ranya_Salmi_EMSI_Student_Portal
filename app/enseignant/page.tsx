"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { api, type EtudiantRisque, type Alerte } from "@/lib/api";
import { getRiskBgColor, getUrgenceColor } from "@/lib/store";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  Users,
  ClipboardList,
  AlertTriangle,
  Bell,
  ChevronRight,
  Calendar,
  TrendingUp,
  Info,
  CheckCircle2,
} from "lucide-react";

export default function EnseignantDashboardPage() {
  const [etudiantsRisque, setEtudiantsRisque] = useState<EtudiantRisque[]>([]);
  const [alertes, setAlertes] = useState<Alerte[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        const [etudiantsData, alertesData] = await Promise.all([
          api.getEtudiantsRisque(),
          api.getMesAlertes(),
        ]);
        setEtudiantsRisque(etudiantsData);
        setAlertes(alertesData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur de chargement");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const stats = {
    etudiantsRisqueEleve: etudiantsRisque.filter(e => e.niveau_risque === "eleve").length,
    etudiantsRisqueModere: etudiantsRisque.filter(e => e.niveau_risque === "modere").length,
    alertesNonLues: alertes.filter(a => !a.lue).length,
  };

  const quickActions = [
    {
      title: "Saisir des notes",
      description: "Enregistrer les notes d'une évaluation",
      href: "/enseignant/notes",
      icon: ClipboardList,
      color: "bg-primary/10 text-primary",
    },
    {
      title: "Saisir des absences",
      description: "Marquer les absences d'une séance",
      href: "/enseignant/absences",
      icon: Calendar,
      color: "bg-chart-2/10 text-chart-2",
    },
  ];

  return (
    <DashboardLayout requiredRoles={["enseignant"]}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mes modules</h1>
          <p className="text-muted-foreground">
            Gérez vos cours, notes et absences
          </p>
        </div>

        {error && (
          <Card className="border-destructive bg-destructive/5">
            <CardContent className="pt-6">
              <p className="text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid gap-4 sm:grid-cols-2">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.href} href={action.href}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        "flex items-center justify-center w-12 h-12 rounded-xl shrink-0",
                        action.color
                      )}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{action.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
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

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-destructive/10">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-destructive">
                    {loading ? <Skeleton className="h-8 w-8 inline-block" /> : stats.etudiantsRisqueEleve}
                  </p>
                  <p className="text-sm text-muted-foreground">Étudiants à risque élevé</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[var(--risk-medium)]/10">
                  <TrendingUp className="h-5 w-5 text-[var(--risk-medium)]" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[var(--risk-medium)]">
                    {loading ? <Skeleton className="h-8 w-8 inline-block" /> : stats.etudiantsRisqueModere}
                  </p>
                  <p className="text-sm text-muted-foreground">À risque modéré</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-chart-2/10">
                  <Bell className="h-5 w-5 text-chart-2" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-chart-2">
                    {loading ? <Skeleton className="h-8 w-8 inline-block" /> : stats.alertesNonLues}
                  </p>
                  <p className="text-sm text-muted-foreground">Alertes non lues</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Two Column Layout */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Students at Risk */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Étudiants à surveiller
              </CardTitle>
              <CardDescription>
                Étudiants avec un score de risque élevé ou modéré
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-14 w-full" />
                  ))}
                </div>
              ) : etudiantsRisque.filter(e => e.niveau_risque !== "faible").length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-8 w-8 mb-2 opacity-50 text-primary" />
                  <p className="text-sm">Aucun étudiant à risque</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {etudiantsRisque
                    .filter(e => e.niveau_risque !== "faible")
                    .sort((a, b) => b.score - a.score)
                    .slice(0, 5)
                    .map((etudiant) => (
                      <div
                        key={etudiant.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{etudiant.full_name}</p>
                          <p className="text-sm text-muted-foreground">
                            Moy: {etudiant.moyenne_generale?.toFixed(1) || "—"}/20 •
                            Abs: {etudiant.taux_absence?.toFixed(0) || 0}%
                          </p>
                        </div>
                        <Badge className={cn("capitalize", getRiskBgColor(etudiant.niveau_risque))}>
                          {etudiant.niveau_risque === "eleve" ? "Élevé" : "Modéré"}
                        </Badge>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Alerts */}
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
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-14 w-full" />
                  ))}
                </div>
              ) : alertes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <Bell className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm">Aucune alerte</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {alertes.slice(0, 5).map((alerte) => (
                    <div
                      key={alerte.id}
                      className={cn(
                        "flex items-start gap-3 p-3 rounded-lg border",
                        getUrgenceColor(alerte.urgence)
                      )}
                    >
                      <div className="shrink-0 mt-0.5">
                        {alerte.urgence === "critical" ? (
                          <AlertTriangle className="h-4 w-4" />
                        ) : alerte.urgence === "warning" ? (
                          <Info className="h-4 w-4" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn("text-sm", !alerte.lue && "font-medium")}>
                          {alerte.titre}
                        </p>
                        <p className="text-xs mt-0.5 opacity-80 line-clamp-1">
                          {alerte.etudiant_nom || "Étudiant"}
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
