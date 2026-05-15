"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  Bell,
  Brain,
  Calendar,
  CheckCircle,
  Clock,
  Mail,
  TrendingDown,
  User,
  XCircle,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { api, type Alerte } from "@/lib/api";

type AlertType = "absence" | "absences" | "note" | "notes" | "risque_ia";
type AlertLevel = "info" | "warning" | "danger" | "critical";
type AlertStatus = "pending" | "contacted" | "resolved";

interface ChefAlert {
  id: number;
  etudiant_id: number;
  etudiant: string;
  email: string;
  type: AlertType;
  niveau: AlertLevel;
  message: string;
  details: string;
  date_detection: string;
  statut: AlertStatus;
  score_risque?: number | null;
  lue: boolean;
}

const niveauConfig: Record<
  AlertLevel,
  {
    label: string;
    color: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  info: {
    label: "Information",
    color:
      "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    icon: Bell,
  },
  warning: {
    label: "Attention",
    color:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    icon: AlertTriangle,
  },
  danger: {
    label: "Danger",
    color:
      "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    icon: AlertTriangle,
  },
  critical: {
    label: "Critique",
    color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    icon: XCircle,
  },
};

const typeConfig: Record<
  AlertType,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  absence: { label: "Absences", icon: Calendar },
  absences: { label: "Absences", icon: Calendar },
  note: { label: "Notes", icon: TrendingDown },
  notes: { label: "Notes", icon: TrendingDown },
  risque_ia: { label: "Risque IA", icon: Brain },
};

const statutConfig: Record<
  AlertStatus,
  {
    label: string;
    color: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  pending: {
    label: "En attente",
    color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
    icon: Clock,
  },
  contacted: {
    label: "Contacté",
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    icon: Mail,
  },
  resolved: {
    label: "Résolu",
    color:
      "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    icon: CheckCircle,
  },
};

function normalizeType(type: string): AlertType {
  if (type === "absence" || type === "absences") return "absence";
  if (type === "note" || type === "notes") return "note";
  if (type === "risque_ia") return "risque_ia";
  return "risque_ia";
}

function normalizeLevel(urgence: string): AlertLevel {
  if (urgence === "critical") return "critical";
  if (urgence === "danger") return "danger";
  if (urgence === "warning") return "warning";
  return "info";
}

function mapBackendAlert(alerte: Alerte): ChefAlert {
  const niveau = normalizeLevel(alerte.urgence);
  const type = normalizeType(alerte.type);

  return {
    id: alerte.id,
    etudiant_id: alerte.etudiant_id,
    etudiant: alerte.etudiant_nom || `Étudiant #${alerte.etudiant_id}`,
    email: (alerte as any).etudiant_email || "Email non disponible",
    type,
    niveau,
    message: alerte.titre,
    details: alerte.message,
    date_detection: alerte.created_at,
    statut: alerte.lue ? "resolved" : "pending",
    score_risque: (alerte as any).score_risque ?? null,
    lue: alerte.lue,
  };
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

export default function AlertesPage() {
  const [alerts, setAlerts] = useState<ChefAlert[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<ChefAlert | null>(null);
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);
  const [contactMessage, setContactMessage] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function fetchAlerts() {
    try {
      setError("");

      const maybeApi = api as any;
      let data: Alerte[] = [];

      if (typeof maybeApi.getMesAlertes === "function") {
        data = await maybeApi.getMesAlertes();
      } else if (typeof maybeApi.getAlertes === "function") {
        data = await maybeApi.getAlertes();
      } else {
        throw new Error("Endpoint des alertes indisponible dans lib/api.ts");
      }

      setAlerts(data.map(mapBackendAlert));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAlerts();
  }, []);

  useEffect(() => {
    const handleAlertsUpdated = () => {
      fetchAlerts();
    };

    window.addEventListener("emsi:alerts-updated", handleAlertsUpdated);

    return () => {
      window.removeEventListener("emsi:alerts-updated", handleAlertsUpdated);
    };
  }, []);

  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      if (filter === "all") return true;
      if (filter === "pending") return alert.statut === "pending";
      if (filter === "critical") {
        return alert.niveau === "critical" || alert.niveau === "danger";
      }
      if (filter === "risque_ia") return alert.type === "risque_ia";
      if (filter === "absences") {
        return alert.type === "absence" || alert.type === "absences";
      }
      if (filter === "notes") {
        return alert.type === "note" || alert.type === "notes";
      }

      return true;
    });
  }, [alerts, filter]);

  const pendingCount = alerts.filter((a) => a.statut === "pending").length;
  const criticalCount = alerts.filter(
    (a) => a.niveau === "critical" || a.niveau === "danger"
  ).length;
  const resolvedCount = alerts.filter((a) => a.statut === "resolved").length;

  const handleContact = (alert: ChefAlert) => {
    setSelectedAlert(alert);
    setContactMessage(
      `Bonjour ${alert.etudiant},\n\nNous avons constaté une alerte concernant votre parcours académique : ${alert.message}.\n\nDétails : ${alert.details}\n\nNous souhaitons vous rencontrer afin de discuter de votre situation et vous accompagner.\n\nCordialement,\nLe Chef de Filière`
    );
    setIsContactDialogOpen(true);
  };

  const sendContact = async () => {
    if (!selectedAlert) return;

    try {
      const maybeApi = api as any;

      if (typeof maybeApi.marquerAlerteLue === "function") {
        await maybeApi.marquerAlerteLue(selectedAlert.id);
      } else if (typeof maybeApi.markAlerteLue === "function") {
        await maybeApi.markAlerteLue(selectedAlert.id);
      }

      setAlerts((current) =>
        current.map((alert) =>
          alert.id === selectedAlert.id
            ? { ...alert, statut: "contacted", lue: true }
            : alert
        )
      );

      setIsContactDialogOpen(false);
      setSelectedAlert(null);
      toast.success("Message préparé et alerte marquée comme contactée");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erreur lors du traitement"
      );
    }
  };

  const markResolved = async (alert: ChefAlert) => {
    try {
      const maybeApi = api as any;

      if (typeof maybeApi.marquerAlerteLue === "function") {
        await maybeApi.marquerAlerteLue(alert.id);
      } else if (typeof maybeApi.markAlerteLue === "function") {
        await maybeApi.markAlerteLue(alert.id);
      }

      setAlerts((current) =>
        current.map((item) =>
          item.id === alert.id
            ? { ...item, statut: "resolved", lue: true }
            : item
        )
      );

      toast.success("Alerte marquée comme résolue");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erreur lors de la mise à jour"
      );
    }
  };

  return (
    <DashboardLayout requiredRoles={["chef_filiere"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Système d&apos;alertes
          </h1>
          <p className="text-muted-foreground">
            Détection automatique des étudiants à risque avec analyse IA
          </p>
        </div>

        {error && (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="pt-6">
              <p className="text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Total alertes
              </CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{alerts.length}</div>
              )}
            </CardContent>
          </Card>

          <Card className="border-yellow-200 dark:border-yellow-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                En attente
              </CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold text-yellow-600">
                  {pendingCount}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-red-200 dark:border-red-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Critiques</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold text-red-600">
                  {criticalCount}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-green-200 dark:border-green-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Résolues</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold text-green-600">
                  {resolvedCount}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Liste des alertes</CardTitle>
                <CardDescription>
                  Alertes détectées automatiquement par le système
                </CardDescription>
              </div>

              <Tabs value={filter} onValueChange={setFilter}>
                <TabsList>
                  <TabsTrigger value="all">Toutes</TabsTrigger>
                  <TabsTrigger value="pending">En attente</TabsTrigger>
                  <TabsTrigger value="critical">Critiques</TabsTrigger>
                  <TabsTrigger value="risque_ia">IA</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : filteredAlerts.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground">
                Aucune alerte trouvée pour ce filtre.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Étudiant</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Niveau</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Score risque</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filteredAlerts.map((alert) => {
                    const TypeIcon = typeConfig[alert.type].icon;
                    const NiveauIcon = niveauConfig[alert.niveau].icon;
                    const StatutIcon = statutConfig[alert.statut].icon;

                    return (
                      <TableRow key={alert.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="font-medium">
                                {alert.etudiant}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {alert.email}
                              </div>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-1">
                            <TypeIcon className="h-4 w-4" />
                            <span>{typeConfig[alert.type].label}</span>
                          </div>
                        </TableCell>

                        <TableCell>
                          <Badge
                            className={niveauConfig[alert.niveau].color}
                            variant="secondary"
                          >
                            <NiveauIcon className="mr-1 h-3 w-3" />
                            {niveauConfig[alert.niveau].label}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          <div className="max-w-60">
                            <div className="font-medium truncate">
                              {alert.message}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                              {alert.details}
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          {typeof alert.score_risque === "number" ? (
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                  className={`h-full ${
                                    alert.score_risque >= 70
                                      ? "bg-red-500"
                                      : alert.score_risque >= 40
                                        ? "bg-yellow-500"
                                        : "bg-green-500"
                                  }`}
                                  style={{ width: `${alert.score_risque}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium">
                                {alert.score_risque}%
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>

                        <TableCell>
                          <Badge
                            className={statutConfig[alert.statut].color}
                            variant="secondary"
                          >
                            <StatutIcon className="mr-1 h-3 w-3" />
                            {statutConfig[alert.statut].label}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-muted-foreground">
                          {formatDate(alert.date_detection)}
                        </TableCell>

                        <TableCell>
                          <div className="flex gap-1">
                            {alert.statut !== "resolved" && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleContact(alert)}
                                >
                                  <Mail className="h-4 w-4" />
                                </Button>

                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => markResolved(alert)}
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Dialog
          open={isContactDialogOpen}
          onOpenChange={setIsContactDialogOpen}
        >
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Contacter l&apos;étudiant</DialogTitle>
              <DialogDescription>
                Préparer un message pour {selectedAlert?.etudiant}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Destinataire</Label>
                <Input value={selectedAlert?.email || ""} disabled />
              </div>

              <div className="space-y-2">
                <Label>Message</Label>
                <Textarea
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  rows={8}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsContactDialogOpen(false)}
              >
                Annuler
              </Button>

              <Button onClick={sendContact}>
                <Mail className="mr-2 h-4 w-4" />
                Valider le contact
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}