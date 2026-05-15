"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Database,
  FileEdit,
  History,
  Server,
  Settings,
  Shield,
  TrendingUp,
  UserPlus,
  Users,
  UserX,
  Zap,
} from "lucide-react";
import {
  Bar,
  BarChart,
  Cell,
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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { api, type AuditLog, type EtudiantRisque, type User } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

type ServiceStatus = {
  label: string;
  status: "ok" | "error";
  value: number;
  icon: "database" | "backend" | "ai";
};

function getActionIcon(action: string) {
  switch (action) {
    case "create":
      return <UserPlus className="h-4 w-4 text-success" />;
    case "update":
      return <FileEdit className="h-4 w-4 text-info" />;
    case "delete":
    case "deactivate":
      return <UserX className="h-4 w-4 text-destructive" />;
    default:
      return <Database className="h-4 w-4 text-muted-foreground" />;
  }
}

function getActionLabel(action: string) {
  switch (action) {
    case "create":
      return "Création";
    case "update":
      return "Modification";
    case "delete":
      return "Suppression";
    case "deactivate":
      return "Désactivation";
    case "validate":
      return "Validation";
    default:
      return action || "Action";
  }
}

function getLogDate(log: AuditLog) {
  const rawDate =
    (log as any).timestamp ||
    (log as any).created_at ||
    (log as any).date ||
    "";

  const date = new Date(rawDate);

  if (Number.isNaN(date.getTime())) {
    return "Date non disponible";
  }

  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getLogUser(log: AuditLog) {
  return (
    (log as any).user_email ||
    (log as any).actor_email ||
    (log as any).performed_by ||
    "Système"
  );
}

function getLogTable(log: AuditLog) {
  return (
    (log as any).table_name ||
    (log as any).entity ||
    (log as any).resource ||
    "ressource"
  );
}

function getRiskLevel(student: EtudiantRisque) {
  return (
    (student as any).niveau_risque ||
    (student as any).niveau ||
    (student as any).risk_level ||
    ""
  );
}

export default function AdminDashboardPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [etudiantsRisque, setEtudiantsRisque] = useState<EtudiantRisque[]>([]);
  const [backendOnline, setBackendOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [healthLoading, setHealthLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        setError("");

        const [usersData, logsData, etudiantsData] = await Promise.all([
          api.getUsers(),
          api.getAuditLogs({ limit: 10 }),
          api.getEtudiantsRisque(),
        ]);

        setUsers(Array.isArray(usersData) ? usersData : []);
        setAuditLogs(Array.isArray(logsData) ? logsData : []);
        setEtudiantsRisque(Array.isArray(etudiantsData) ? etudiantsData : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur de chargement");
      } finally {
        setLoading(false);
      }
    }

    async function checkBackendHealth() {
      try {
        const response = await fetch(`${API_URL}/health`, {
          cache: "no-store",
        });

        setBackendOnline(response.ok);
      } catch {
        setBackendOnline(false);
      } finally {
        setHealthLoading(false);
      }
    }

    fetchData();
    checkBackendHealth();
  }, []);

  const stats = useMemo(() => {
    const admins = users.filter((user) => user.role === "admin").length;
    const chefs = users.filter((user) => user.role === "chef_filiere").length;
    const enseignants = users.filter((user) => user.role === "enseignant").length;
    const etudiants = users.filter((user) => user.role === "etudiant").length;
    const activeUsers = users.filter((user) => user.is_active).length;
    const risqueEleve = etudiantsRisque.filter(
      (student) => getRiskLevel(student) === "eleve"
    ).length;

    return {
      totalUsers: users.length,
      admins,
      chefs,
      enseignants,
      etudiants,
      activeUsers,
      risqueEleve,
    };
  }, [users, etudiantsRisque]);

  const chartData = useMemo(
    () => [
      { name: "Admin", value: stats.admins, color: "oklch(0.65 0.24 25)" },
      { name: "Chef", value: stats.chefs, color: "oklch(0.70 0.18 300)" },
      {
        name: "Prof",
        value: stats.enseignants,
        color: "oklch(0.70 0.15 220)",
      },
      {
        name: "Étudiant",
        value: stats.etudiants,
        color: "oklch(0.72 0.19 145)",
      },
    ],
    [stats]
  );

  const systemHealth: ServiceStatus[] = useMemo(() => {
    const hasUserData = users.length > 0;
    const hasRiskModule =
      etudiantsRisque.length > 0 ||
      !error.toLowerCase().includes("risque") ||
      !error.toLowerCase().includes("ia");

    return [
      {
        label: "Base de données",
        status: hasUserData ? "ok" : error ? "error" : "ok",
        value: hasUserData ? 100 : error ? 0 : 75,
        icon: "database",
      },
      {
        label: "API Backend",
        status: backendOnline ? "ok" : "error",
        value: backendOnline ? 100 : 0,
        icon: "backend",
      },
      {
        label: "Service IA",
        status: hasRiskModule ? "ok" : "error",
        value: hasRiskModule ? 100 : 0,
        icon: "ai",
      },
    ];
  }, [users.length, etudiantsRisque.length, backendOnline, error]);

  const userProgress =
    stats.totalUsers > 0 ? (stats.etudiants / stats.totalUsers) * 100 : 0;

  return (
    <DashboardLayout requiredRoles={["admin"]}>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Administration
            </h1>
            <p className="text-muted-foreground">
              Gestion du système et supervision globale
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/audit">
                <History className="h-4 w-4 mr-2" />
                Journal
              </Link>
            </Button>

            <Button size="sm" asChild className="glow-primary">
              <Link href="/admin/utilisateurs">
                <Users className="h-4 w-4 mr-2" />
                Utilisateurs
              </Link>
            </Button>
          </div>
        </div>

        {error && (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="pt-6">
              <p className="text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="relative overflow-hidden group hover:border-primary/30 transition-colors">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-primary/10 to-transparent rounded-bl-full" />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Utilisateurs
              </CardTitle>
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold stat-number">
                    {stats.totalUsers}
                  </span>
                  <span className="text-xs text-muted-foreground">total</span>
                </div>
              )}

              <div className="flex items-center gap-2 mt-2">
                <Badge
                  variant="outline"
                  className="text-xs bg-success/10 text-success border-success/20"
                >
                  {stats.activeUsers} actifs
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden group hover:border-chart-2/30 transition-colors">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-chart-2/10 to-transparent rounded-bl-full" />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Étudiants
              </CardTitle>
              <div className="p-2 rounded-lg bg-chart-2/10">
                <TrendingUp className="h-4 w-4 text-chart-2" />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold stat-number">
                    {stats.etudiants}
                  </span>
                  <span className="text-xs text-muted-foreground">inscrits</span>
                </div>
              )}

              <Progress value={userProgress} className="h-1.5 mt-3" />
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden group hover:border-chart-4/30 transition-colors">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-chart-4/10 to-transparent rounded-bl-full" />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Personnel
              </CardTitle>
              <div className="p-2 rounded-lg bg-chart-4/10">
                <Shield className="h-4 w-4 text-chart-4" />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold stat-number">
                    {stats.enseignants + stats.chefs}
                  </span>
                  <span className="text-xs text-muted-foreground">membres</span>
                </div>
              )}

              <p className="text-xs text-muted-foreground mt-2">
                {stats.enseignants} enseignants + {stats.chefs} chefs
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden group hover:border-destructive/30 transition-colors">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-destructive/10 to-transparent rounded-bl-full" />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Alertes IA
              </CardTitle>
              <div className="p-2 rounded-lg bg-destructive/10">
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold stat-number text-destructive">
                    {stats.risqueEleve}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    à risque
                  </span>
                </div>
              )}

              <Link
                href="/admin/configuration"
                className="flex items-center gap-1 mt-2 text-xs text-primary hover:underline"
              >
                Configurer les seuils
                <ChevronRight className="h-3 w-3" />
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-7">
          <Card className="lg:col-span-4">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">
                    Répartition des utilisateurs
                  </CardTitle>
                  <CardDescription>
                    Distribution par rôle dans le système
                  </CardDescription>
                </div>

                <Button variant="outline" size="sm" asChild>
                  <Link href="/admin/utilisateurs">
                    Gérer
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              <div className="h-[280px]">
                {loading ? (
                  <Skeleton className="h-full w-full" />
                ) : stats.totalUsers === 0 ? (
                  <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                    Aucun utilisateur enregistré.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} layout="vertical">
                      <XAxis
                        type="number"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "oklch(0.55 0 0)", fontSize: 12 }}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "oklch(0.55 0 0)", fontSize: 12 }}
                        width={70}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "oklch(0.13 0.008 260)",
                          border: "1px solid oklch(0.22 0.01 260)",
                          borderRadius: "8px",
                        }}
                      />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="grid grid-cols-4 gap-2 mt-4">
                {chartData.map((item) => (
                  <div
                    key={item.name}
                    className="flex flex-col items-center p-3 rounded-lg bg-muted/30"
                  >
                    <div
                      className="w-3 h-3 rounded-full mb-2"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-lg font-bold">{item.value}</span>
                    <span className="text-xs text-muted-foreground">
                      {item.name}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5 text-success" />
                État du système
              </CardTitle>
              <CardDescription>
                Statut des services selon les réponses backend
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {healthLoading ? (
                <>
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </>
              ) : (
                systemHealth.map((service) => (
                  <div
                    key={service.label}
                    className="p-4 rounded-xl bg-muted/30 border border-border/50"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-lg ${
                            service.status === "ok"
                              ? "bg-success/10"
                              : "bg-destructive/10"
                          }`}
                        >
                          {service.icon === "database" && (
                            <Database
                              className={`h-4 w-4 ${
                                service.status === "ok"
                                  ? "text-success"
                                  : "text-destructive"
                              }`}
                            />
                          )}
                          {service.icon === "backend" && (
                            <Server
                              className={`h-4 w-4 ${
                                service.status === "ok"
                                  ? "text-success"
                                  : "text-destructive"
                              }`}
                            />
                          )}
                          {service.icon === "ai" && (
                            <Zap
                              className={`h-4 w-4 ${
                                service.status === "ok"
                                  ? "text-success"
                                  : "text-destructive"
                              }`}
                            />
                          )}
                        </div>
                        <span className="font-medium">{service.label}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <CheckCircle2
                          className={`h-4 w-4 ${
                            service.status === "ok"
                              ? "text-success"
                              : "text-destructive"
                          }`}
                        />
                        <span
                          className={`text-sm font-medium ${
                            service.status === "ok"
                              ? "text-success"
                              : "text-destructive"
                          }`}
                        >
                          {service.status === "ok" ? "En ligne" : "Indisponible"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Progress value={service.value} className="h-1.5 flex-1" />
                      <span className="text-xs text-muted-foreground w-12 text-right">
                        {service.value}%
                      </span>
                    </div>
                  </div>
                ))
              )}

              <Button variant="outline" size="sm" className="w-full" asChild>
                <Link href="/admin/configuration">
                  <Settings className="h-4 w-4 mr-2" />
                  Configuration système
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Activité récente
                </CardTitle>
                <CardDescription>
                  Dernières modifications enregistrées dans le journal d’audit
                </CardDescription>
              </div>

              <Button variant="outline" size="sm" asChild>
                <Link href="/admin/audit">
                  Voir tout
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, index) => (
                  <Skeleton key={index} className="h-20 w-full" />
                ))}
              </div>
            ) : auditLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <History className="h-8 w-8 opacity-50" />
                </div>
                <p className="text-lg font-medium">Aucune activité récente</p>
                <p className="text-sm">Les actions seront enregistrées ici</p>
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {auditLogs.slice(0, 6).map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start gap-3 p-4 rounded-xl bg-muted/30 border border-transparent hover:border-border transition-colors"
                  >
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-background shrink-0">
                      {getActionIcon(log.action)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">
                        {getActionLabel(log.action)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        sur {getLogTable(log)}
                      </p>
                      <p className="text-xs text-muted-foreground/60 mt-1">
                        {getLogUser(log)} • {getLogDate(log)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}