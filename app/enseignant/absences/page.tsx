"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
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
import { cn } from "@/lib/utils";
import {
  Calendar,
  Search,
  Save,
  Users,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

// Mock modules (in real app, would come from API)
const mockModules = [
  { id: 1, nom: "Analyse Numérique S2", code: "MATH301" },
  { id: 2, nom: "Base de données avancées", code: "INFO302" },
  { id: 3, nom: "Réseaux et Protocoles", code: "NET303" },
  { id: 4, nom: "Génie Logiciel", code: "GL304" },
];

export default function AbsencesPage() {
  const [etudiants, setEtudiants] = useState<EtudiantRisque[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedModule, setSelectedModule] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [search, setSearch] = useState("");
  const [absents, setAbsents] = useState<Set<number>>(new Set());

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await api.getEtudiantsRisque();
        setEtudiants(data);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Erreur de chargement");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const filteredEtudiants = etudiants.filter((e) =>
    e.full_name.toLowerCase().includes(search.toLowerCase()) ||
    e.cne?.toLowerCase().includes(search.toLowerCase())
  );

  const toggleAbsent = (etudiantId: number) => {
    setAbsents((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(etudiantId)) {
        newSet.delete(etudiantId);
      } else {
        newSet.add(etudiantId);
      }
      return newSet;
    });
  };

  const selectAllAbsent = () => {
    if (absents.size === filteredEtudiants.length) {
      setAbsents(new Set());
    } else {
      setAbsents(new Set(filteredEtudiants.map((e) => e.id)));
    }
  };

  const handleSaveAbsences = async () => {
    if (!selectedModule || !selectedDate) {
      toast.error("Veuillez sélectionner un module et une date");
      return;
    }

    if (absents.size === 0) {
      toast.info("Aucune absence à enregistrer");
      return;
    }

    setSaving(true);
    try {
      const result = await api.saisirAbsences(
        parseInt(selectedModule),
        new Date(selectedDate).toISOString(),
        Array.from(absents)
      );
      toast.success(`${result.crees} absence(s) enregistrée(s)`);
      setAbsents(new Set());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur d'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const presentCount = filteredEtudiants.length - absents.size;
  const absentCount = absents.size;

  return (
    <DashboardLayout requiredRoles={["enseignant", "admin", "chef_filiere"]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Saisie des absences</h1>
            <p className="text-muted-foreground">
              Marquez les absences de votre séance
            </p>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Séance</CardTitle>
            <CardDescription>
              Sélectionnez le module et la date du cours
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Module</Label>
                <Select value={selectedModule} onValueChange={setSelectedModule}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un module" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockModules.map((module) => (
                      <SelectItem key={module.id} value={String(module.id)}>
                        {module.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Date du cours</Label>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Rechercher</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Nom ou CNE..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        {selectedModule && (
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted">
                    <Users className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{filteredEtudiants.length}</p>
                    <p className="text-sm text-muted-foreground">Total étudiants</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-primary">{presentCount}</p>
                    <p className="text-sm text-muted-foreground">Présents</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-destructive/10">
                    <XCircle className="h-5 w-5 text-destructive" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-destructive">{absentCount}</p>
                    <p className="text-sm text-muted-foreground">Absents</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Attendance Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Liste de présence
              </CardTitle>
              <CardDescription>
                {selectedModule
                  ? `Cochez les étudiants absents`
                  : "Sélectionnez un module"}
              </CardDescription>
            </div>
            {selectedModule && absents.size > 0 && (
              <Button onClick={handleSaveAbsences} disabled={saving}>
                {saving ? (
                  <>Enregistrement...</>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Enregistrer ({absents.size})
                  </>
                )}
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {!selectedModule ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Calendar className="h-12 w-12 mb-4 opacity-50" />
                <p className="text-lg font-medium">Sélectionnez un module</p>
                <p className="text-sm">pour commencer la saisie des absences</p>
              </div>
            ) : loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : filteredEtudiants.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Search className="h-12 w-12 mb-4 opacity-50" />
                <p className="text-lg font-medium">Aucun étudiant trouvé</p>
              </div>
            ) : (
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={absents.size === filteredEtudiants.length}
                          onCheckedChange={selectAllAbsent}
                          aria-label="Tous absents"
                        />
                      </TableHead>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Étudiant</TableHead>
                      <TableHead className="hidden md:table-cell">CNE</TableHead>
                      <TableHead className="hidden sm:table-cell">Taux absence</TableHead>
                      <TableHead className="w-24 text-center">Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEtudiants.map((etudiant, index) => {
                      const isAbsent = absents.has(etudiant.id);
                      const isHighAbsence = etudiant.taux_absence > 25;

                      return (
                        <TableRow
                          key={etudiant.id}
                          className={cn(
                            "cursor-pointer transition-colors",
                            isAbsent && "bg-destructive/5"
                          )}
                          onClick={() => toggleAbsent(etudiant.id)}
                        >
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={isAbsent}
                              onCheckedChange={() => toggleAbsent(etudiant.id)}
                              aria-label={`Marquer ${etudiant.full_name} absent`}
                            />
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {index + 1}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div>
                                <p className="font-medium">{etudiant.full_name}</p>
                                <p className="text-sm text-muted-foreground md:hidden">
                                  {etudiant.cne}
                                </p>
                              </div>
                              {isHighAbsence && (
                                <AlertTriangle className="h-4 w-4 text-[var(--risk-medium)]" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell font-mono text-sm">
                            {etudiant.cne}
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <span className={cn(
                              "font-medium",
                              etudiant.taux_absence > 30 && "text-destructive",
                              etudiant.taux_absence > 20 && etudiant.taux_absence <= 30 && "text-[var(--risk-medium)]"
                            )}>
                              {etudiant.taux_absence?.toFixed(1) || 0}%
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            {isAbsent ? (
                              <Badge variant="destructive" className="w-full justify-center">
                                Absent
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="w-full justify-center bg-primary/5 text-primary border-primary/20">
                                Présent
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
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
