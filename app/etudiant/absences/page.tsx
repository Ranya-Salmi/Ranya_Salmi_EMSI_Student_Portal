"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api, type RecapEtudiant, type Absence } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  BookOpen,
} from "lucide-react";

export default function EtudiantAbsencesPage() {
  const [recap, setRecap] = useState<RecapEtudiant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedModule, setSelectedModule] = useState<string>("all");

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

  // Group absences by module
  const absencesParModule = recap?.absences.reduce((acc, absence) => {
    if (!acc[absence.module_nom]) {
      acc[absence.module_nom] = {
        module_id: absence.module_id,
        module_nom: absence.module_nom,
        absences: [],
        justifiees: 0,
        nonJustifiees: 0,
      };
    }
    acc[absence.module_nom].absences.push(absence);
    if (absence.justifiee) {
      acc[absence.module_nom].justifiees++;
    } else {
      acc[absence.module_nom].nonJustifiees++;
    }
    return acc;
  }, {} as Record<string, { module_id: number; module_nom: string; absences: Absence[]; justifiees: number; nonJustifiees: number }>) || {};

  const modules = Object.values(absencesParModule);
  const filteredAbsences = selectedModule === "all"
    ? recap?.absences || []
    : recap?.absences.filter(a => String(a.module_id) === selectedModule) || [];

  // Calculate stats
  const totalAbsences = recap?.absences.length || 0;
  const justifiees = recap?.absences.filter(a => a.justifiee).length || 0;
  const nonJustifiees = totalAbsences - justifiees;
  const enAttente = recap?.absences.filter(a => a.statut === "en_attente_justification").length || 0;

  return (
    <DashboardLayout requiredRoles={["etudiant"]}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mes absences</h1>
          <p className="text-muted-foreground">
            Consultez votre historique d&apos;absences
          </p>
        </div>

        {error && (
          <Card className="border-destructive bg-destructive/5">
            <CardContent className="pt-6">
              <p className="text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Warning if high absence rate */}
        {nonJustifiees > 3 && (
          <Card className="border-[var(--risk-medium)] bg-[var(--risk-medium)]/5">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[var(--risk-medium)]/10 shrink-0">
                  <AlertTriangle className="h-5 w-5 text-[var(--risk-medium)]" />
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--risk-medium)]">
                    Attention : Taux d&apos;absence élevé
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Vous avez {nonJustifiees} absence(s) non justifiée(s). Un taux d&apos;absence supérieur à 30%
                    peut entraîner l&apos;exclusion du module. Pensez à justifier vos absences.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total absences
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">{totalAbsences}</div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                séances manquées
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Justifiées
              </CardTitle>
              <CheckCircle2 className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold text-primary">{justifiees}</div>
              )}
              <Progress
                value={totalAbsences > 0 ? (justifiees / totalAbsences) * 100 : 0}
                className="h-2 mt-2"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Non justifiées
              </CardTitle>
              <XCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className={cn(
                  "text-2xl font-bold",
                  nonJustifiees > 3 && "text-destructive"
                )}>
                  {nonJustifiees}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                à justifier
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                En attente
              </CardTitle>
              <Clock className="h-4 w-4 text-[var(--risk-medium)]" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold text-[var(--risk-medium)]">{enAttente}</div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                justification en cours
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Module Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Absences par module
            </CardTitle>
            <CardDescription>
              Récapitulatif de vos absences par module
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : modules.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <CheckCircle2 className="h-8 w-8 mb-2 opacity-50 text-primary" />
                <p className="text-sm">Aucune absence enregistrée</p>
                <p className="text-xs mt-1">Continuez comme ça !</p>
              </div>
            ) : (
              <div className="space-y-4">
                {modules.map((module) => (
                  <div
                    key={module.module_id}
                    className="flex items-center gap-4 p-4 rounded-lg bg-muted/50"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{module.module_nom}</p>
                      <p className="text-sm text-muted-foreground">
                        {module.absences.length} absence(s)
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                        {module.justifiees} justifiée(s)
                      </Badge>
                      {module.nonJustifiees > 0 && (
                        <Badge variant="destructive">
                          {module.nonJustifiees} non justifiée(s)
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Detailed Absences */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Historique détaillé
                </CardTitle>
                <CardDescription>
                  Liste de toutes vos absences
                </CardDescription>
              </div>
              <Select value={selectedModule} onValueChange={setSelectedModule}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filtrer par module" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les modules</SelectItem>
                  {modules.map((module) => (
                    <SelectItem key={module.module_id} value={String(module.module_id)}>
                      {module.module_nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : filteredAbsences.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Calendar className="h-8 w-8 mb-2 opacity-50" />
                <p className="text-sm">Aucune absence</p>
              </div>
            ) : (
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Module</TableHead>
                      <TableHead className="hidden md:table-cell">Motif</TableHead>
                      <TableHead className="text-center">Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAbsences.map((absence) => (
                      <TableRow key={absence.id}>
                        <TableCell>
                          <div className="font-medium">
                            {new Date(absence.date_cours).toLocaleDateString("fr-FR", {
                              weekday: "short",
                              day: "numeric",
                              month: "short",
                            })}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {absence.module_nom}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">
                          {absence.motif_justification || "—"}
                        </TableCell>
                        <TableCell className="text-center">
                          {absence.justifiee ? (
                            <Badge className="bg-primary/10 text-primary border-primary/20">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Justifiée
                            </Badge>
                          ) : absence.statut === "en_attente_justification" ? (
                            <Badge className="bg-[var(--risk-medium)]/10 text-[var(--risk-medium)] border-[var(--risk-medium)]/20">
                              <Clock className="h-3 w-3 mr-1" />
                              En attente
                            </Badge>
                          ) : (
                            <Badge variant="destructive">
                              <XCircle className="h-3 w-3 mr-1" />
                              Non justifiée
                            </Badge>
                          )}
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
