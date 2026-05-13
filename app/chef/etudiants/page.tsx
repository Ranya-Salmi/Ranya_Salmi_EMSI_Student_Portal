"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api, type EtudiantRisque } from "@/lib/api";
import { getRiskBgColor, getRiskColor } from "@/lib/store";
import { cn } from "@/lib/utils";
import {
  Search,
  AlertTriangle,
  TrendingDown,
  Filter,
  Users,
  Download,
} from "lucide-react";

export default function EtudiantsRisquePage() {
  const [etudiants, setEtudiants] = useState<EtudiantRisque[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState<string>("all");

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await api.getEtudiantsRisque();
        setEtudiants(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur de chargement");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Filter and sort students
  const filteredEtudiants = etudiants
    .filter((e) => {
      const matchesSearch =
        e.full_name.toLowerCase().includes(search.toLowerCase()) ||
        e.cne?.toLowerCase().includes(search.toLowerCase()) ||
        e.email.toLowerCase().includes(search.toLowerCase());
      const matchesRisk = riskFilter === "all" || e.niveau_risque === riskFilter;
      return matchesSearch && matchesRisk;
    })
    .sort((a, b) => b.score - a.score);

  const stats = {
    total: etudiants.length,
    risqueEleve: etudiants.filter((e) => e.niveau_risque === "eleve").length,
    risqueModere: etudiants.filter((e) => e.niveau_risque === "modere").length,
    risqueFaible: etudiants.filter((e) => e.niveau_risque === "faible").length,
  };

  return (
    <DashboardLayout requiredRoles={["chef_filiere"]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Étudiants à risque</h1>
            <p className="text-muted-foreground">
              Suivi IA des profils d&apos;étudiants de votre filière
            </p>
          </div>
        </div>

        {error && (
          <Card className="border-destructive bg-destructive/5">
            <CardContent className="pt-6">
              <p className="text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted">
                  <Users className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-sm text-muted-foreground">Total étudiants</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-destructive/10">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-destructive">{stats.risqueEleve}</p>
                  <p className="text-sm text-muted-foreground">Risque élevé</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[var(--risk-medium)]/10">
                  <TrendingDown className="h-5 w-5 text-[var(--risk-medium)]" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[var(--risk-medium)]">{stats.risqueModere}</p>
                  <p className="text-sm text-muted-foreground">Risque modéré</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary">{stats.risqueFaible}</p>
                  <p className="text-sm text-muted-foreground">Sans risque</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Liste des étudiants</CardTitle>
            <CardDescription>
              Classés par score de risque IA décroissant
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par nom, CNE ou email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={riskFilter} onValueChange={setRiskFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Niveau de risque" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les niveaux</SelectItem>
                  <SelectItem value="eleve">Risque élevé</SelectItem>
                  <SelectItem value="modere">Risque modéré</SelectItem>
                  <SelectItem value="faible">Risque faible</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : filteredEtudiants.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mb-4 opacity-50" />
                <p className="text-lg font-medium">Aucun étudiant trouvé</p>
                <p className="text-sm">Essayez de modifier vos filtres</p>
              </div>
            ) : (
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Étudiant</TableHead>
                      <TableHead className="hidden md:table-cell">CNE</TableHead>
                      <TableHead>Score IA</TableHead>
                      <TableHead className="hidden sm:table-cell">Moyenne</TableHead>
                      <TableHead className="hidden sm:table-cell">Absences</TableHead>
                      <TableHead>Niveau</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEtudiants.map((etudiant) => (
                      <TableRow key={etudiant.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{etudiant.full_name}</p>
                            <p className="text-sm text-muted-foreground md:hidden">
                              {etudiant.cne}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell font-mono text-sm">
                          {etudiant.cne}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className={cn("text-lg font-bold", getRiskColor(etudiant.niveau_risque))}>
                              {etudiant.score.toFixed(0)}
                            </span>
                            <Progress
                              value={etudiant.score}
                              className="w-16 h-2 hidden lg:block"
                            />
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <span className={cn(
                            "font-medium",
                            etudiant.moyenne_generale < 10 && "text-destructive"
                          )}>
                            {etudiant.moyenne_generale?.toFixed(2) || "—"}/20
                          </span>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <span className={cn(
                            "font-medium",
                            etudiant.taux_absence > 30 && "text-destructive"
                          )}>
                            {etudiant.taux_absence?.toFixed(1) || 0}%
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge className={cn("capitalize", getRiskBgColor(etudiant.niveau_risque))}>
                            {etudiant.niveau_risque === "eleve"
                              ? "Élevé"
                              : etudiant.niveau_risque === "modere"
                              ? "Modéré"
                              : "Faible"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
