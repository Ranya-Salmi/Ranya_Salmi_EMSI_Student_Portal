"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { api, type RecapEtudiant } from "@/lib/api";
import { getRiskBgColor, getRiskColor } from "@/lib/store";
import { cn } from "@/lib/utils";
import {
  GraduationCap,
  BookOpen,
  Calendar,
  AlertTriangle,
  TrendingUp,
  Download,
  Bell,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  Target,
  Clock,
  ArrowUpRight,
  FileText,
} from "lucide-react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { toast } from "sonner";
import Link from "next/link";

export default function EtudiantDashboardPage() {
  const [recap, setRecap] = useState<RecapEtudiant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [generatingBulletin, setGeneratingBulletin] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
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

  // Calculate statistics
  const stats = recap ? {
    totalNotes: recap.notes.length,
    totalAbsences: recap.absences.length,
    absencesNonJustifiees: recap.absences.filter(a => !a.justifiee).length,
    moyenneGenerale: recap.notes.length > 0
      ? recap.notes.reduce((acc, n) => acc + (n.valeur || 0) * n.coefficient, 0) /
        recap.notes.reduce((acc, n) => acc + n.coefficient, 0)
      : null,
    alertesNonLues: recap.alertes.filter(a => !a.lue).length,
  } : null;

  // Mock data for demo
  const mockStats = {
    totalNotes: 24,
    totalAbsences: 6,
    absencesNonJustifiees: 2,
    moyenneGenerale: 14.2,
    alertesNonLues: 1,
  };

  const displayStats = stats || mockStats;

  // Mock radar data for skills
  const radarData = [
    { subject: "Programmation", A: 85, fullMark: 100 },
    { subject: "Mathematiques", A: 72, fullMark: 100 },
    { subject: "Reseaux", A: 78, fullMark: 100 },
    { subject: "Base de donnees", A: 90, fullMark: 100 },
    { subject: "Gestion projet", A: 65, fullMark: 100 },
    { subject: "Communication", A: 70, fullMark: 100 },
  ];

  // Mock trend data
  const trendData = [
    { month: "Sep", note: 12.5 },
    { month: "Oct", note: 13.2 },
    { month: "Nov", note: 14.1 },
    { month: "Dec", note: 13.8 },
    { month: "Jan", note: 14.5 },
    { month: "Fev", note: 14.2 },
  ];

  const handleGenerateBulletin = async () => {
    setGeneratingBulletin(true);
    try {
      // Simulated download
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success("Bulletin genere avec succes");
    } catch (err) {
      toast.error("Erreur lors de la generation");
    } finally {
      setGeneratingBulletin(false);
    }
  };

  const riskLevel = recap?.score_risque?.niveau || "faible";
  const riskScore = recap?.score_risque?.score || 25;

  return (
    <DashboardLayout requiredRoles={["etudiant"]}>
      <div className="space-y-6">
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-primary/5 to-background border border-primary/10 p-6 md:p-8">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                <Sparkles className="h-4 w-4" />
                Semestre en cours
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                Bienvenue, {recap?.etudiant.full_name || "Youssef"}
              </h1>
              <p className="text-muted-foreground mt-2 max-w-lg">
                Suivez votre progression academique et restez informe de vos performances en temps reel.
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
                {generatingBulletin ? "Generation..." : "Telecharger bulletin"}
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

        {/* Risk Alert */}
        {riskLevel !== "faible" && (
          <Card className={cn(
            "border overflow-hidden",
            riskLevel === "eleve"
              ? "border-destructive/50 bg-destructive/5"
              : "border-warning/50 bg-warning/5"
          )}>
            <CardContent className="p-0">
              <div className="flex items-stretch">
                <div className={cn(
                  "w-1.5",
                  riskLevel === "eleve" ? "bg-destructive" : "bg-warning"
                )} />
                <div className="flex items-center gap-4 p-4 flex-1">
                  <div className={cn(
                    "flex items-center justify-center w-12 h-12 rounded-xl shrink-0",
                    riskLevel === "eleve"
                      ? "bg-destructive/10 text-destructive"
                      : "bg-warning/10 text-warning"
                  )}>
                    <AlertTriangle className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className={cn("font-semibold", getRiskColor(riskLevel))}>
                      Attention: Profil a risque {riskLevel === "eleve" ? "eleve" : "modere"} detecte
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Score IA: {riskScore.toFixed(0)}/100 - Consultez votre coordinateur pour un accompagnement.
                    </p>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/etudiant/alertes">
                      Voir details
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Average */}
          <Card className="relative overflow-hidden group hover:border-primary/30 transition-colors">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-primary/10 to-transparent rounded-bl-full" />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Moyenne generale
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
                  <span className={cn(
                    "text-3xl font-bold stat-number",
                    (displayStats.moyenneGenerale ?? 0) < 10 && "text-destructive"
                  )}>
                    {(displayStats.moyenneGenerale ?? 0).toFixed(1)}
                  </span>
                  <span className="text-lg text-muted-foreground">/20</span>
                </div>
              )}
              <Progress 
                value={((displayStats.moyenneGenerale ?? 0) / 20) * 100} 
                className="h-1.5 mt-3" 
              />
              <div className="flex items-center gap-1 mt-2 text-xs text-success">
                <ArrowUpRight className="h-3 w-3" />
                <span>+0.8 vs mois dernier</span>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card className="relative overflow-hidden group hover:border-chart-2/30 transition-colors">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-chart-2/10 to-transparent rounded-bl-full" />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Evaluations
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
                  <span className="text-3xl font-bold stat-number">{displayStats.totalNotes}</span>
                  <span className="text-sm text-muted-foreground">notes</span>
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                dans 6 modules ce semestre
              </p>
            </CardContent>
          </Card>

          {/* Absences */}
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
                  <span className={cn(
                    "text-3xl font-bold stat-number",
                    displayStats.absencesNonJustifiees > 3 && "text-destructive"
                  )}>
                    {displayStats.totalAbsences}
                  </span>
                  <span className="text-sm text-muted-foreground">heures</span>
                </div>
              )}
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="text-xs bg-destructive/10 text-destructive border-destructive/20">
                  {displayStats.absencesNonJustifiees} non justifiees
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Risk Score */}
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
                  <span className={cn("text-3xl font-bold stat-number", getRiskColor(riskLevel))}>
                    {riskScore.toFixed(0)}
                  </span>
                  <span className="text-lg text-muted-foreground">/100</span>
                </div>
              )}
              <Badge className={cn("mt-2", getRiskBgColor(riskLevel))}>
                {riskLevel === "eleve" ? "Eleve" : riskLevel === "modere" ? "Modere" : "Faible"}
              </Badge>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid gap-6 lg:grid-cols-7">
          {/* Performance Trend */}
          <Card className="lg:col-span-4">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Evolution de la moyenne</CardTitle>
                  <CardDescription>Progression sur les 6 derniers mois</CardDescription>
                </div>
                <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +13.6%
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="colorNote" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="month" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#94a3b8', fontSize: 12 }}
                    />
                    <YAxis 
                      domain={[10, 20]}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#94a3b8', fontSize: 12 }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#020617',
                        border: '1px solid #334155',
                        borderRadius: '8px',
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
              </div>
            </CardContent>
          </Card>

          {/* Skills Radar */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Competences
              </CardTitle>
              <CardDescription>Analyse par domaine</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#334155" />
                    <PolarAngleAxis 
                      dataKey="subject" 
                      tick={{ fill: '#94a3b8', fontSize: 10 }}
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
                        backgroundColor: '#020617',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                      }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Row - Alerts & Quick Actions */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Alerts */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Notifications recentes
                  </CardTitle>
                  <CardDescription>
                    {displayStats.alertesNonLues} nouvelle(s)
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
              <div className="space-y-3">
                {/* Mock alerts */}
                <div className="flex items-start gap-3 p-3 rounded-lg bg-success/5 border border-success/20">
                  <div className="p-1.5 rounded-lg bg-success/10">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Note publiee</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Module Base de donnees - DS1: 16/20
                    </p>
                    <p className="text-xs text-muted-foreground/60 mt-1">Il y a 2 heures</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-info/5 border border-info/20">
                  <div className="p-1.5 rounded-lg bg-info/10">
                    <Calendar className="h-4 w-4 text-info" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Rappel examen</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Examen final Reseaux le 25 Fevrier
                    </p>
                    <p className="text-xs text-muted-foreground/60 mt-1">Hier</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions rapides</CardTitle>
              <CardDescription>Acces direct aux fonctionnalites</CardDescription>
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
                  <p className="font-medium group-hover:text-primary transition-colors">Mes notes</p>
                  <p className="text-xs text-muted-foreground mt-1">Consulter toutes mes notes</p>
                </Link>
                <Link
                  href="/etudiant/absences"
                  className="group p-4 rounded-xl bg-muted/30 border border-transparent hover:border-warning/20 hover:bg-muted/50 transition-all"
                >
                  <div className="p-2 rounded-lg bg-warning/10 w-fit mb-3 group-hover:bg-warning/20 transition-colors">
                    <Clock className="h-5 w-5 text-warning" />
                  </div>
                  <p className="font-medium group-hover:text-warning transition-colors">Mes absences</p>
                  <p className="text-xs text-muted-foreground mt-1">Historique et justificatifs</p>
                </Link>
                <Link
                  href="/etudiant/alertes"
                  className="group p-4 rounded-xl bg-muted/30 border border-transparent hover:border-chart-2/20 hover:bg-muted/50 transition-all"
                >
                  <div className="p-2 rounded-lg bg-chart-2/10 w-fit mb-3 group-hover:bg-chart-2/20 transition-colors">
                    <Bell className="h-5 w-5 text-chart-2" />
                  </div>
                  <p className="font-medium group-hover:text-chart-2 transition-colors">Alertes</p>
                  <p className="text-xs text-muted-foreground mt-1">Notifications importantes</p>
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
                    {generatingBulletin ? "Generation..." : "Bulletin PDF"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Telecharger mon bulletin</p>
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
