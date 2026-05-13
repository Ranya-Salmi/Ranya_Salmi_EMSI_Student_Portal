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
import { api, type RecapEtudiant, type Note } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  TrendingUp,
  TrendingDown,
  Minus,
  FileText,
  GraduationCap,
} from "lucide-react";

export default function EtudiantNotesPage() {
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

  // Group notes by module
  const notesParModule = recap?.notes.reduce((acc, note) => {
    if (!acc[note.module_nom]) {
      acc[note.module_nom] = {
        module_id: note.module_id,
        module_nom: note.module_nom,
        notes: [],
        moyenne: 0,
        totalCoef: 0,
      };
    }
    acc[note.module_nom].notes.push(note);
    return acc;
  }, {} as Record<string, { module_id: number; module_nom: string; notes: Note[]; moyenne: number; totalCoef: number }>) || {};

  // Calculate averages per module
  Object.values(notesParModule).forEach((module) => {
    const totalPoints = module.notes.reduce((acc, n) => acc + (n.valeur || 0) * n.coefficient, 0);
    const totalCoef = module.notes.reduce((acc, n) => acc + n.coefficient, 0);
    module.moyenne = totalCoef > 0 ? totalPoints / totalCoef : 0;
    module.totalCoef = totalCoef;
  });

  const modules = Object.values(notesParModule);
  const filteredNotes = selectedModule === "all"
    ? recap?.notes || []
    : recap?.notes.filter(n => String(n.module_id) === selectedModule) || [];

  // Calculate general average
  const moyenneGenerale = modules.length > 0
    ? modules.reduce((acc, m) => acc + m.moyenne * m.totalCoef, 0) / 
      modules.reduce((acc, m) => acc + m.totalCoef, 0)
    : 0;

  return (
    <DashboardLayout requiredRoles={["etudiant"]}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mes notes</h1>
          <p className="text-muted-foreground">
            Consultez vos notes par module
          </p>
        </div>

        {error && (
          <Card className="border-destructive bg-destructive/5">
            <CardContent className="pt-6">
              <p className="text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Overview Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Moyenne générale
              </CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className={cn(
                  "text-2xl font-bold",
                  moyenneGenerale < 10 && "text-destructive"
                )}>
                  {moyenneGenerale.toFixed(2)}/20
                </div>
              )}
              <Progress
                value={(moyenneGenerale / 20) * 100}
                className="h-2 mt-2"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Modules
              </CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">{modules.length}</div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                modules suivis
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Notes saisies
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">{recap?.notes.length || 0}</div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                évaluations notées
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Modules validés
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold text-primary">
                  {modules.filter(m => m.moyenne >= 10).length}/{modules.length}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                moyenne {">"}= 10/20
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Module Averages */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Moyennes par module
            </CardTitle>
            <CardDescription>
              Vue d&apos;ensemble de vos performances par module
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
                <BookOpen className="h-8 w-8 mb-2 opacity-50" />
                <p className="text-sm">Aucun module disponible</p>
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
                        {module.notes.length} note(s) • Coef. total: {module.totalCoef}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Progress
                        value={(module.moyenne / 20) * 100}
                        className="w-24 h-2 hidden sm:block"
                      />
                      <div className={cn(
                        "text-lg font-bold min-w-[60px] text-right",
                        module.moyenne < 10 && "text-destructive",
                        module.moyenne >= 14 && "text-primary"
                      )}>
                        {module.moyenne.toFixed(2)}
                      </div>
                      <Badge className={cn(
                        module.moyenne >= 10
                          ? "bg-primary/10 text-primary border-primary/20"
                          : "bg-destructive/10 text-destructive border-destructive/20"
                      )}>
                        {module.moyenne >= 10 ? "Validé" : "À rattraper"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Detailed Notes */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Détail des notes
                </CardTitle>
                <CardDescription>
                  Toutes vos évaluations
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
            ) : filteredNotes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <FileText className="h-8 w-8 mb-2 opacity-50" />
                <p className="text-sm">Aucune note disponible</p>
              </div>
            ) : (
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Évaluation</TableHead>
                      <TableHead className="hidden md:table-cell">Module</TableHead>
                      <TableHead className="hidden sm:table-cell">Date</TableHead>
                      <TableHead className="text-center">Coef.</TableHead>
                      <TableHead className="text-right">Note</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredNotes.map((note) => (
                      <TableRow key={note.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{note.evaluation_nom}</p>
                            <p className="text-sm text-muted-foreground md:hidden">
                              {note.module_nom}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">
                          {note.module_nom}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-muted-foreground">
                          {new Date(note.date).toLocaleDateString("fr-FR")}
                        </TableCell>
                        <TableCell className="text-center">
                          {note.coefficient}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={cn(
                            "text-lg font-bold",
                            note.valeur !== null && note.valeur < 10 && "text-destructive",
                            note.valeur !== null && note.valeur >= 14 && "text-primary"
                          )}>
                            {note.valeur !== null ? `${note.valeur}/${note.bareme_max}` : "—"}
                          </span>
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
