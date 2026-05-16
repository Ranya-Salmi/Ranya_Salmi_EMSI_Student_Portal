"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Clock,
  Info,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

import { api, type Alerte } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type AlertsUpdatedEventDetail = {
  unread_count?: number;
  alerts?: Alerte[];
};

function formatRelativeTime(value?: string) {
  if (!value) return "Date non disponible";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date non disponible";
  }

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return "À l’instant";
  if (diffMinutes < 60) return `Il y a ${diffMinutes} min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  return `Il y a ${diffDays}j`;
}

function getAlertIcon(urgence: string) {
  if (urgence === "critical" || urgence === "danger") {
    return <AlertTriangle className="h-4 w-4 text-destructive" />;
  }

  if (urgence === "warning") {
    return <Info className="h-4 w-4 text-warning" />;
  }

  return <CheckCircle2 className="h-4 w-4 text-success" />;
}

function getAlertClassName(urgence: string, lue: boolean) {
  if (urgence === "critical" || urgence === "danger") {
    return cn(
      "border-destructive/20 bg-destructive/5",
      !lue && "bg-destructive/10"
    );
  }

  if (urgence === "warning") {
    return cn("border-warning/20 bg-warning/5", !lue && "bg-warning/10");
  }

  return cn("border-border bg-muted/30", !lue && "bg-primary/5");
}

function getUrgenceLabel(urgence: string) {
  if (urgence === "critical" || urgence === "danger") return "Critique";
  if (urgence === "warning") return "Attention";
  return "Information";
}

function mergeAlerts(current: Alerte[], incoming: Alerte[]) {
  const byId = new Map<number, Alerte>();

  for (const alert of current) {
    byId.set(alert.id, alert);
  }

  for (const alert of incoming) {
    byId.set(alert.id, {
      ...byId.get(alert.id),
      ...alert,
    });
  }

  return Array.from(byId.values()).sort((a, b) => {
    const dateA = new Date(a.created_at || "").getTime() || 0;
    const dateB = new Date(b.created_at || "").getTime() || 0;
    return dateB - dateA;
  });
}

export function NotificationCenter() {
  const [alertes, setAlertes] = useState<Alerte[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingId, setMarkingId] = useState<number | null>(null);
  const [open, setOpen] = useState(false);

  const refreshNotifications = useCallback(async () => {
    try {
      const data = await api.getMesAlertes();
      setAlertes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("[Notifications] Refresh failed", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshNotifications();
  }, [refreshNotifications]);

  useEffect(() => {
    const handleAlertsUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<AlertsUpdatedEventDetail>;
      const incomingAlerts = customEvent.detail?.alerts || [];

      if (incomingAlerts.length > 0) {
        setAlertes((current) => mergeAlerts(current, incomingAlerts));
      }

      refreshNotifications();
    };

    window.addEventListener("emsi:alerts-updated", handleAlertsUpdated);

    return () => {
      window.removeEventListener("emsi:alerts-updated", handleAlertsUpdated);
    };
  }, [refreshNotifications]);

  const unreadCount = useMemo(() => {
    return alertes.filter((alerte) => !alerte.lue).length;
  }, [alertes]);

  const sortedAlertes = useMemo(() => {
    return [...alertes].sort((a, b) => {
      const dateA = new Date(a.created_at || "").getTime() || 0;
      const dateB = new Date(b.created_at || "").getTime() || 0;
      return dateB - dateA;
    });
  }, [alertes]);

  const markAsRead = async (alerteId: number) => {
    setMarkingId(alerteId);

    try {
      await api.marquerAlerteLue(alerteId);

      setAlertes((current) =>
        current.map((alerte) =>
          alerte.id === alerteId ? { ...alerte, lue: true } : alerte
        )
      );

      window.dispatchEvent(
        new CustomEvent("emsi:alerts-updated", {
          detail: { alerts: [] },
        })
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Erreur lors de la mise à jour de la notification"
      );
    } finally {
      setMarkingId(null);
    }
  };

  const markAllAsRead = async () => {
    const unreadAlertes = alertes.filter((alerte) => !alerte.lue);

    if (unreadAlertes.length === 0) return;

    try {
      await Promise.all(
        unreadAlertes.map((alerte) => api.marquerAlerteLue(alerte.id))
      );

      setAlertes((current) =>
        current.map((alerte) => ({
          ...alerte,
          lue: true,
        }))
      );

      window.dispatchEvent(
        new CustomEvent("emsi:alerts-updated", {
          detail: { alerts: [] },
        })
      );

      toast.success("Notifications marquées comme lues");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Erreur lors de la mise à jour des notifications"
      );
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />

          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[11px] font-bold text-destructive-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-96 p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div>
            <DropdownMenuLabel className="p-0 text-base">
              Notifications
            </DropdownMenuLabel>

            <p className="text-xs text-muted-foreground">
              Alertes pédagogiques et informations importantes
            </p>
          </div>

          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              Tout lire
            </Button>
          )}
        </div>

        <ScrollArea className="h-[420px]">
          {loading ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Chargement des notifications...
            </div>
          ) : sortedAlertes.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-12 text-center text-muted-foreground">
              <CheckCircle2 className="mb-3 h-9 w-9 text-success" />

              <p className="text-sm font-medium">Aucune notification</p>

              <p className="mt-1 text-xs">
                Les nouvelles alertes apparaîtront ici automatiquement.
              </p>
            </div>
          ) : (
            <div className="space-y-2 p-3">
              {sortedAlertes.map((alerte) => (
                <div
                  key={alerte.id}
                  className={cn(
                    "rounded-lg border p-3 transition-colors",
                    getAlertClassName(alerte.urgence, alerte.lue)
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-md bg-background/70 p-1.5">
                      {getAlertIcon(alerte.urgence)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={cn(
                            "text-sm leading-tight",
                            !alerte.lue && "font-semibold"
                          )}
                        >
                          {alerte.titre}
                        </p>

                        <Badge
                          variant="outline"
                          className="shrink-0 text-[10px]"
                        >
                          {getUrgenceLabel(alerte.urgence)}
                        </Badge>
                      </div>

                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                        {alerte.message}
                      </p>

                      {alerte.etudiant_nom && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Étudiant : {alerte.etudiant_nom}
                        </p>
                      )}

                      {typeof alerte.score_risque === "number" && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Score IA : {alerte.score_risque}/100
                        </p>
                      )}

                      <div className="mt-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatRelativeTime(alerte.created_at)}
                        </div>

                        {!alerte.lue && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            disabled={markingId === alerte.id}
                            onClick={() => markAsRead(alerte.id)}
                          >
                            {markingId === alerte.id ? (
                              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                            ) : (
                              <CheckCircle2 className="mr-1 h-3 w-3" />
                            )}
                            Lu
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="border-t p-3">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={refreshNotifications}
          >
            Actualiser
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}