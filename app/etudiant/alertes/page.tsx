"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { api, type Alerte } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  Bell,
  CheckCircle,
  CheckCircle2,
  Clock,
  Info,
} from "lucide-react";

function getUrgenceLabel(urgence: Alerte["urgence"]) {
  if (urgence === "critical") return "Critique";
  if (urgence === "warning") return "Attention";
  return "Information";
}

function getUrgenceIcon(urgence: Alerte["urgence"]) {
  if (urgence === "critical") return AlertTriangle;
  if (urgence === "warning") return AlertTriangle;
  return Info;
}

function getUrgenceClasses(urgence: Alerte["urgence"]) {
  if (urgence === "critical") {
    return {
      card: "border-destructive/40 bg-destructive/5",
      iconBox: "bg-destructive/10 text-destructive",
      title: "text-destructive",
      badge: "bg-destructive/10 text-destructive border-destructive/20",
    };
  }

  if (urgence === "warning") {
    return {
      card: "border-warning/40 bg-warning/5",
      iconBox: "bg-warning/10 text-warning",
      title: "text-warning",
      badge: "bg-warning/10 text-warning border-warning/20",
    };
  }

  return {
    card: "border-primary/30 bg-primary/5",
    iconBox: "bg-primary/10 text-primary",
    title: "text-primary",
    badge: "bg-primary/10 text-primary border-primary/20",
  };
}

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
}

export default function AlertesEtudiantPage() {
  const [alertes, setAlertes] = useState<Alerte[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  async function fetchAlertes() {
    try {
      setError("");
      const data = await api.getMesAlertes();
      setAlertes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAlertes();
  }, []);

  const unreadCount = alertes.filter((alerte) => !alerte.lue).length;
  const criticalCount = alertes.filter(
    (alerte) => alerte.urgence === "critical"
  ).length;
  const warningCount = alertes.filter(
    (alerte) => alerte.urgence === "warning"
  ).length;
  const infoCount = alertes.filter((alerte) => alerte.urgence === "info").length;

  const markAsRead = async (id: number) => {
    try {
      setUpdatingId(id);
      await api.marquerAlerteLue(id);
      setAlertes((current) =>
        current.map((alerte) =>
          alerte.id === id ? { ...alerte, lue: true } : alerte
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de mise a jour");
    } finally {
      setUpdatingId(null);
    }
  };

  const markAllRead = async () => {
    const unread = alertes.filter((alerte) => !alerte.lue);

    if (unread.length === 0) return;

    try {
      setMarkingAll(true);
      await Promise.all(unread.map((alerte) => api.marquerAlerteLue(alerte.id)));
      setAlertes((current) =>
        current.map((alerte) => ({ ...alerte, lue: true }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de mise a jour");
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <DashboardLayout requiredRoles={["etudiant"]}>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Mes Alertes</h1>
            <p className="text-muted-foreground">
              Notifications et alertes concernant votre parcours
            </p>
          </div>

          {unreadCount > 0 && (
            <Button
              variant="outline"
              onClick={markAllRead}
              disabled={markingAll}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Tout marquer comme lu
            </Button>
          )}
        </div>

        {error && (
          <Card className="border-destructive/40 bg-destructive/5">
            <CardContent className="p-4">
              <p className="text-sm text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{alertes.length}</div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                alertes recues
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Non lues
              </CardTitle>
              <Clock className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold text-warning">
                  {unreadCount}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                en attente de lecture
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Critiques
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold text-destructive">
                  {criticalCount}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                action rapide conseillee
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Informations
              </CardTitle>
              <Info className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">
                  {warningCount + infoCount}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                suivi pedagogique
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Liste des alertes
            </CardTitle>
            <CardDescription>
              Alertes generees par le systeme de suivi pedagogique
            </CardDescription>
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-24 w-full rounded-xl" />
                ))}
              </div>
            ) : alertes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <CheckCircle className="h-10 w-10 mb-3 text-primary" />
                <p className="font-medium">Aucune alerte</p>
                <p className="text-sm">
                  Vous n&apos;avez aucune notification pour le moment.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {alertes.map((alerte) => {
                  const Icon = getUrgenceIcon(alerte.urgence);
                  const classes = getUrgenceClasses(alerte.urgence);

                  return (
                    <div
                      key={alerte.id}
                      className={cn(
                        "rounded-xl border p-4 transition-colors",
                        classes.card,
                        alerte.lue && "opacity-70"
                      )}
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex gap-3">
                          <div
                            className={cn(
                              "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
                              classes.iconBox
                            )}
                          >
                            <Icon className="h-5 w-5" />
                          </div>

                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className={cn("font-semibold", classes.title)}>
                                {alerte.titre}
                              </h3>

                              <Badge
                                variant="outline"
                                className={classes.badge}
                              >
                                {getUrgenceLabel(alerte.urgence)}
                              </Badge>

                              {!alerte.lue && (
                                <Badge className="bg-primary/10 text-primary border-primary/20">
                                  Nouveau
                                </Badge>
                              )}
                            </div>

                            <p className="text-sm text-muted-foreground">
                              {alerte.message}
                            </p>

                            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                              <span>Type: {alerte.type}</span>
                              <span>{formatDate(alerte.created_at)}</span>
                            </div>
                          </div>
                        </div>

                        {!alerte.lue && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => markAsRead(alerte.id)}
                            disabled={updatingId === alerte.id}
                          >
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Marquer lu
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Conseils</CardTitle>
            <CardDescription>
              Bonnes pratiques pour votre suivi pedagogique
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-primary" />
                Consultez regulierement vos alertes pour rester informe.
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-primary" />
                En cas d&apos;alerte critique, contactez rapidement votre chef de
                filiere.
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-primary" />
                Justifiez vos absences dans les plus brefs delais.
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}