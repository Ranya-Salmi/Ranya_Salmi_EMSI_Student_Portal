"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { api, type User, type AuditLog, type EtudiantRisque } from "@/lib/api";
import { getRoleColor, getRoleLabel, getRiskBgColor } from "@/lib/store";
import { cn } from "@/lib/utils";
import {
  Users,
  History,
  Settings,
  AlertTriangle,
  TrendingUp,
  Shield,
  ChevronRight,
  UserPlus,
  FileEdit,
  UserX,
  Database,
  Activity,
  Server,
  Zap,
  CheckCircle2,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

export default function AdminDashboardPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [etudiantsRisque, setEtudiantsRisque] = useState<EtudiantRisque[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        const [usersData, logsData, etudiantsData] = await Promise.all([
          api.getUsers(),
          api.getAuditLogs({ limit: 10 }),
          api.getEtudiantsRisque(),
        ]);
        setUsers(usersData);
        setAuditLogs(logsData);
        setEtudiantsRisque(etudiantsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur de chargement");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Mock stats for demo
  const stats = {
    totalUsers: users.length || 156,
    admins: users.filter(u => u.role === "admin").length || 3,
    chefs: users.filter(u => u.role === "chef_filiere").length || 5,
    enseignants: users.filter(u => u.role === "enseignant").length || 20,
    etudiants: users.filter(u => u.role === "etudiant").length || 128,
    activeUsers: users.filter(u => u.is_active).length || 148,
    risqueEleve: etudiantsRisque.filter(e => e.niveau_risque === "eleve").length || 8,
  };

  const chartData = [
    { name: "Admin", value: stats.admins, color: "oklch(0.65 0.24 25)" },
    { name: "Chef", value: stats.chefs, color: "oklch(0.70 0.18 300)" },
    { name: "Prof", value: stats.enseignants, color: "oklch(0.70 0.15 220)" },
    { name: "Etudiant", value: stats.etudiants, color: "oklch(0.72 0.19 145)" },
  ];

  const getActionIcon = (action: string) => {
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
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case "create": return "Creation";
      case "update": return "Modification";
      case "delete": return "Suppression";
      case "deactivate": return "Desactivation";
      case "validate": return "Validation";
      default: return action;
    }
  };

  // System health metrics (mock)
  const systemHealth = [
    { label: "Base de donnees", status: "ok", value: 99.9 },
    { label: "API Backend", status: "ok", value: 100 },
    { label: "Service IA", status: "ok", value: 98.5 },
  ];

  return (
    <DashboardLayout requiredRoles={["admin"]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Administration</h1>
            <p className="text-muted-foreground">
              Gestion du systeme et supervision globale
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

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Total Users */}
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
                  <span className="text-3xl font-bold stat-number">{stats.totalUsers}</span>
                  <span className="text-xs text-muted-foreground">total</span>
                </div>
              )}
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="text-xs bg-success/10 text-success border-success/20">
                  {stats.activeUsers} actifs
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Students */}
          <Card className="relative overflow-hidden group hover:border-chart-2/30 transition-colors">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-chart-2/10 to-transparent rounded-bl-full" />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Etudiants
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
                  <span className="text-3xl font-bold stat-number">{stats.etudiants}</span>
                  <span className="text-xs text-muted-foreground">inscrits</span>
                </div>
              )}
              <Progress value={(stats.etudiants / stats.totalUsers) * 100} className="h-1.5 mt-3" />
            </CardContent>
          </Card>

          {/* Staff */}
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
                  <span className="text-3xl font-bold stat-number">{stats.enseignants + stats.chefs}</span>
                  <span className="text-xs text-muted-foreground">membres</span>
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                {stats.enseignants} profs + {stats.chefs} chefs
              </p>
            </CardContent>
          </Card>

          {/* Alerts */}
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
                  <span className="text-3xl font-bold stat-number text-destructive">{stats.risqueEleve}</span>
                  <span className="text-xs text-muted-foreground">a risque</span>
                </div>
              )}
              <Link href="/admin/configuration" className="flex items-center gap-1 mt-2 text-xs text-primary hover:underline">
                Configurer les seuils
                <ChevronRight className="h-3 w-3" />
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-7">
          {/* User Distribution Chart */}
          <Card className="lg:col-span-4">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Repartition des utilisateurs</CardTitle>
                  <CardDescription>Distribution par role dans le systeme</CardDescription>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/admin/utilisateurs">
                    Gerer
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical">
                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: 'oklch(0.55 0 0)', fontSize: 12 }} />
                    <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'oklch(0.55 0 0)', fontSize: 12 }} width={70} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'oklch(0.13 0.008 260)',
                        border: '1px solid oklch(0.22 0.01 260)',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-4 gap-2 mt-4">
                {chartData.map((item) => (
                  <div key={item.name} className="flex flex-col items-center p-3 rounded-lg bg-muted/30">
                    <div className="w-3 h-3 rounded-full mb-2" style={{ backgroundColor: item.color }} />
                    <span className="text-lg font-bold">{item.value}</span>
                    <span className="text-xs text-muted-foreground">{item.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* System Status */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5 text-success" />
                Etat du systeme
              </CardTitle>
              <CardDescription>Statut des services en temps reel</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {systemHealth.map((service) => (
                <div key={service.label} className="p-4 rounded-xl bg-muted/30 border border-border/50">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-success/10">
                        {service.label === "Base de donnees" && <Database className="h-4 w-4 text-success" />}
                        {service.label === "API Backend" && <Server className="h-4 w-4 text-success" />}
                        {service.label === "Service IA" && <Zap className="h-4 w-4 text-success" />}
                      </div>
                      <span className="font-medium">{service.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-success" />
                      <span className="text-sm text-success font-medium">En ligne</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Progress value={service.value} className="h-1.5 flex-1" />
                    <span className="text-xs text-muted-foreground w-12 text-right">{service.value}%</span>
                  </div>
                </div>
              ))}
              <Button variant="outline" size="sm" className="w-full" asChild>
                <Link href="/admin/configuration">
                  <Settings className="h-4 w-4 mr-2" />
                  Configuration systeme
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Activite recente
                </CardTitle>
                <CardDescription>Dernieres modifications dans le systeme</CardDescription>
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
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : auditLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <History className="h-8 w-8 opacity-50" />
                </div>
                <p className="text-lg font-medium">Aucune activite recente</p>
                <p className="text-sm">Les actions seront enregistrees ici</p>
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {(auditLogs.length > 0 ? auditLogs : [
                  { id: 1, action: "create", table_name: "utilisateurs", user_email: "admin@emsi.ma", timestamp: new Date().toISOString() },
                  { id: 2, action: "update", table_name: "notes", user_email: "prof.analyse@emsi.ma", timestamp: new Date(Date.now() - 3600000).toISOString() },
                  { id: 3, action: "create", table_name: "absences", user_email: "prof.analyse@emsi.ma", timestamp: new Date(Date.now() - 7200000).toISOString() },
                ]).slice(0, 6).map((log) => (
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
                        sur {log.table_name}
                      </p>
                      <p className="text-xs text-muted-foreground/60 mt-1">
                        {log.user_email || "Systeme"} • {new Date(log.timestamp).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
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
