"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { api, type KPIs, type EtudiantRisque } from "@/lib/api";
import { getRiskBgColor, getRiskColor } from "@/lib/store";
import { cn } from "@/lib/utils";
import {
  Users,
  GraduationCap,
  TrendingUp,
  AlertTriangle,
  Bell,
  ArrowUpRight,
  Sparkles,
  ChevronRight,
  Activity,
  Target,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import Link from "next/link";

export default function ChefDashboardPage() {
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [etudiantsRisque, setEtudiantsRisque] = useState<EtudiantRisque[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        const [kpisData, etudiantsData] = await Promise.all([
          api.getKPIs(),
          api.getEtudiantsRisque(),
        ]);
        setKpis(kpisData);
        setEtudiantsRisque(etudiantsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur de chargement");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Mock trend data for area chart
  const trendData = [
    { month: "Jan", moyenne: 12.5, absence: 8 },
    { month: "Fev", moyenne: 13.2, absence: 6 },
    { month: "Mar", moyenne: 12.8, absence: 10 },
    { month: "Avr", moyenne: 14.1, absence: 5 },
    { month: "Mai", moyenne: 13.9, absence: 7 },
    { month: "Jun", moyenne: 14.5, absence: 4 },
  ];

  const riskDistribution = [
    { name: "Faible", value: etudiantsRisque.filter(e => e.niveau_risque === "faible").length, color: "oklch(0.72 0.19 145)" },
    { name: "Modere", value: etudiantsRisque.filter(e => e.niveau_risque === "modere").length, color: "oklch(0.80 0.16 85)" },
    { name: "Eleve", value: etudiantsRisque.filter(e => e.niveau_risque === "eleve").length, color: "oklch(0.65 0.24 25)" },
  ];

  const topRisqueEtudiants = etudiantsRisque
    .filter(e => e.niveau_risque === "eleve" || e.niveau_risque === "modere")
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  return (
    <DashboardLayout requiredRoles={["chef_filiere"]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Tableau de bord</h1>
            <p className="text-muted-foreground">
              Vue d&apos;ensemble de votre filiere IIR
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" asChild>
              <Link href="/chef/statistiques">
                <Activity className="h-4 w-4 mr-2" />
                Statistiques
              </Link>
            </Button>
            <Button size="sm" asChild className="glow-primary">
              <Link href="/chef/alertes">
                <Sparkles className="h-4 w-4 mr-2" />
                Alertes IA
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

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Total Students */}
          <Card className="relative overflow-hidden group hover:border-primary/30 transition-colors">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-primary/10 to-transparent rounded-bl-full" />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Etudiants
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
                  <span className="text-3xl font-bold stat-number">{kpis?.nombre_etudiants || 128}</span>
                  <span className="text-xs text-muted-foreground">inscrits</span>
                </div>
              )}
              <div className="flex items-center gap-1 mt-2 text-xs text-success">
                <ArrowUpRight className="h-3 w-3" />
                <span>+12 ce semestre</span>
              </div>
            </CardContent>
          </Card>

          {/* Average Grade */}
          <Card className="relative overflow-hidden group hover:border-chart-2/30 transition-colors">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-chart-2/10 to-transparent rounded-bl-full" />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Moyenne generale
              </CardTitle>
              <div className="p-2 rounded-lg bg-chart-2/10">
                <GraduationCap className="h-4 w-4 text-chart-2" />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold stat-number">
                    {kpis?.moyenne_generale_filiere?.toFixed(1) || "13.8"}
                  </span>
                  <span className="text-lg text-muted-foreground">/20</span>
                </div>
              )}
              <Progress value={69} className="h-1.5 mt-3" />
            </CardContent>
          </Card>

          {/* Success Rate */}
          <Card className="relative overflow-hidden group hover:border-success/30 transition-colors">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-success/10 to-transparent rounded-bl-full" />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Taux de reussite
              </CardTitle>
              <div className="p-2 rounded-lg bg-success/10">
                <Target className="h-4 w-4 text-success" />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold stat-number text-success">
                    {kpis?.taux_reussite?.toFixed(0) || 78}
                  </span>
                  <span className="text-lg text-muted-foreground">%</span>
                </div>
              )}
              <div className="flex items-center gap-1 mt-2 text-xs text-success">
                <TrendingUp className="h-3 w-3" />
                <span>+5% vs semestre precedent</span>
              </div>
            </CardContent>
          </Card>

          {/* Alerts */}
          <Card className="relative overflow-hidden group hover:border-destructive/30 transition-colors">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-destructive/10 to-transparent rounded-bl-full" />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Alertes actives
              </CardTitle>
              <div className="p-2 rounded-lg bg-destructive/10">
                <Bell className="h-4 w-4 text-destructive" />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold stat-number text-destructive">
                    {kpis?.etudiants_risque_eleve || 8}
                  </span>
                  <span className="text-xs text-muted-foreground">etudiants a risque</span>
                </div>
              )}
              <Link href="/chef/alertes" className="flex items-center gap-1 mt-2 text-xs text-primary hover:underline">
                <span>Voir les alertes</span>
                <ChevronRight className="h-3 w-3" />
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid gap-6 lg:grid-cols-7">
          {/* Trend Chart - Takes more space */}
          <Card className="lg:col-span-4">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Evolution semestrielle</CardTitle>
                  <CardDescription>Moyenne et taux d&apos;absence</CardDescription>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-primary" />
                    <span className="text-muted-foreground">Moyenne</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-chart-3" />
                    <span className="text-muted-foreground">Absences</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="colorMoyenne" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="oklch(0.72 0.19 145)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="oklch(0.72 0.19 145)" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorAbsence" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="oklch(0.80 0.16 85)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="oklch(0.80 0.16 85)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="month" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'oklch(0.55 0 0)', fontSize: 12 }}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'oklch(0.55 0 0)', fontSize: 12 }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'oklch(0.13 0.008 260)',
                        border: '1px solid oklch(0.22 0.01 260)',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                      }}
                      labelStyle={{ color: 'oklch(0.95 0 0)' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="moyenne" 
                      stroke="oklch(0.72 0.19 145)" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorMoyenne)" 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="absence" 
                      stroke="oklch(0.80 0.16 85)" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorAbsence)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Risk Distribution */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Analyse IA des risques
              </CardTitle>
              <CardDescription>Distribution par niveau de risque</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-[200px] w-full" />
              ) : (
                <>
                  <div className="h-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={riskDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {riskDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'oklch(0.13 0.008 260)',
                            border: '1px solid oklch(0.22 0.01 260)',
                            borderRadius: '8px'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-4">
                    {riskDistribution.map((item) => (
                      <div 
                        key={item.name} 
                        className="flex flex-col items-center p-3 rounded-lg bg-muted/30"
                      >
                        <div 
                          className="w-3 h-3 rounded-full mb-2"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-xl font-bold">{item.value}</span>
                        <span className="text-xs text-muted-foreground">{item.name}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Students at Risk */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Etudiants a surveiller
                </CardTitle>
                <CardDescription>
                  Etudiants avec les scores de risque les plus eleves
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/chef/etudiants">
                  Voir tous
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : topRisqueEtudiants.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mb-4">
                  <Target className="h-8 w-8 text-success" />
                </div>
                <p className="text-lg font-medium">Excellent!</p>
                <p className="text-sm">Aucun etudiant a risque eleve</p>
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {topRisqueEtudiants.map((etudiant, index) => (
                  <Link
                    key={etudiant.id}
                    href={`/chef/etudiants/${etudiant.id}`}
                    className="group p-4 rounded-xl bg-muted/30 border border-transparent hover:border-primary/20 hover:bg-muted/50 transition-all"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs text-muted-foreground">#{index + 1}</span>
                      <Badge className={cn("text-xs", getRiskBgColor(etudiant.niveau_risque))}>
                        {etudiant.niveau_risque === "eleve" ? "Eleve" : "Modere"}
                      </Badge>
                    </div>
                    <p className="font-semibold truncate group-hover:text-primary transition-colors">
                      {etudiant.full_name}
                    </p>
                    <div className="mt-3 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Score IA</span>
                        <span className={cn("font-bold", getRiskColor(etudiant.niveau_risque))}>
                          {etudiant.score.toFixed(0)}
                        </span>
                      </div>
                      <Progress 
                        value={etudiant.score} 
                        className="h-1.5"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Moy: {etudiant.moyenne_generale?.toFixed(1) || "—"}</span>
                        <span>Abs: {etudiant.taux_absence?.toFixed(0) || 0}%</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
