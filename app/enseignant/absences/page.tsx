"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { api, type AcademicModule, type ModuleEtudiant } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  Calendar,
  Search,
  Save,
  Users,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

export default function AbsencesPage() {
  const [etudiants, setEtudiants] = useState<ModuleEtudiant[]>([]);
  const [modules, setModules] = useState<AcademicModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [selectedModule, setSelectedModule] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  const [search, setSearch] = useState("");
  const [absents, setAbsents] = useState<Set<number>>(new Set());

  async function loadStudentsForModule(moduleId: string) {
    if (!moduleId) {
      setEtudiants([]);
      return;
    }

    try {
      const studentsData = await api.getModuleStudents(Number(moduleId));
      setEtudiants(studentsData);
    } catch (err) {
      setEtudiants([]);
      toast.error(
        err instanceof Error
          ? err.message
          : "Erreur de chargement des étudiants"
      );
    }
  }

  async function fetchData() {
    try {
      setLoading(true);

      const modulesData = await api.getModules();
      setModules(modulesData);

      const initialModuleId =
        selectedModule || (modulesData.length > 0 ? String(modulesData[0].id) : "");

      if (initialModuleId) {
        setSelectedModule(initialModuleId);
        await loadStudentsForModule(initialModuleId);
      } else {
        setEtudiants([]);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredEtudiants = etudiants.filter((etudiant) => {
    const query = search.toLowerCase();

    return (
      etudiant.full_name.toLowerCase().includes(query) ||
      etudiant.cne?.toLowerCase().includes(query) ||
      etudiant.email?.toLowerCase().includes(query)
    );
  });

  const selectedModuleObject = modules.find(
    (module) => String(module.id) === selectedModule
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
    if (filteredEtudiants.length === 0) return;

    if (absents.size === filteredEtudiants.length) {
      setAbsents(new Set());
    } else {
      setAbsents(new Set(filteredEtudiants.map((etudiant) => etudiant.id)));
    }
  };

  const handleModuleChange = async (value: string) => {
    setSelectedModule(value);
    setAbsents(new Set());

    try {
      setLoading(true);
      await loadStudentsForModule(value);
    } finally {
      setLoading(false);
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
        Number(selectedModule),
        selectedDate,
        Array.from(absents)
      );

      toast.success(`${result.crees} absence(s) enregistrée(s)`);
      setAbsents(new Set());
      await loadStudentsForModule(selectedModule);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erreur d'enregistrement"
      );
    } finally {
      setSaving(false);
    }
  };

  const presentCount = Math.max(filteredEtudiants.length - absents.size, 0);
  const absentCount = absents.size;
  const allFilteredSelected =
    filteredEtudiants.length > 0 && absents.size === filteredEtudiants.length;

  return (
    <DashboardLayout requiredRoles={["enseignant", "admin", "chef_filiere"]}>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Saisie des absences
            </h1>
            <p className="text-muted-foreground">
              Marquez les absences de votre séance
            </p>
          </div>

          <Button variant="outline" onClick={fetchData} disabled={loading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Actualiser
          </Button>
        </div>

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

                <Select
                  value={selectedModule}
                  onValueChange={handleModuleChange}
                  disabled={loading || modules.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un module" />
                  </SelectTrigger>

                  <SelectContent>
                    {modules.length === 0 ? (
                      <SelectItem value="none" disabled>
                        Aucun module disponible
                      </SelectItem>
                    ) : (
                      modules.map((module) => (
                        <SelectItem key={module.id} value={String(module.id)}>
                          {module.code
                            ? `${module.nom} (${module.code})`
                            : module.nom}
                        </SelectItem>
                      ))
                    )}
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
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Nom, email ou CNE..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            {selectedModuleObject && (
              <div className="mt-4 rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
                Module sélectionné :{" "}
                <span className="font-medium text-foreground">
                  {selectedModuleObject.nom}
                </span>
                {selectedModuleObject.code && (
                  <span> — {selectedModuleObject.code}</span>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {selectedModule && (
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                    <Users className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {filteredEtudiants.length}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Total étudiants
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-primary">
                      {presentCount}
                    </p>
                    <p className="text-sm text-muted-foreground">Présents</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                    <XCircle className="h-5 w-5 text-destructive" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-destructive">
                      {absentCount}
                    </p>
                    <p className="text-sm text-muted-foreground">Absents</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Liste de présence
              </CardTitle>
              <CardDescription>
                {selectedModule
                  ? "Cochez les étudiants absents"
                  : "Sélectionnez un module"}
              </CardDescription>
            </div>

            {selectedModule && absents.size > 0 && (
              <Button onClick={handleSaveAbsences} disabled={saving}>
                {saving ? (
                  "Enregistrement..."
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
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Skeleton key={index} className="h-12 w-full" />
                ))}
              </div>
            ) : modules.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Calendar className="mb-4 h-12 w-12 opacity-50" />
                <p className="text-lg font-medium">Aucun module disponible</p>
                <p className="text-sm">
                  Aucun module n&apos;est enregistré dans la base de données.
                </p>
              </div>
            ) : !selectedModule ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Calendar className="mb-4 h-12 w-12 opacity-50" />
                <p className="text-lg font-medium">Sélectionnez un module</p>
                <p className="text-sm">
                  pour commencer la saisie des absences
                </p>
              </div>
            ) : filteredEtudiants.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Search className="mb-4 h-12 w-12 opacity-50" />
                <p className="text-lg font-medium">Aucun étudiant trouvé</p>
                <p className="text-sm">
                  Aucun étudiant n&apos;est inscrit dans ce module.
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={allFilteredSelected}
                          onCheckedChange={selectAllAbsent}
                          aria-label="Tous absents"
                        />
                      </TableHead>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Étudiant</TableHead>
                      <TableHead className="hidden md:table-cell">
                        CNE
                      </TableHead>
                      <TableHead className="hidden sm:table-cell">
                        Moyenne
                      </TableHead>
                      <TableHead className="hidden sm:table-cell">
                        Taux absence
                      </TableHead>
                      <TableHead className="w-24 text-center">
                        Statut
                      </TableHead>
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
                                <p className="font-medium">
                                  {etudiant.full_name}
                                </p>
                                <p className="text-sm text-muted-foreground md:hidden">
                                  {etudiant.cne || "-"}
                                </p>
                              </div>

                              {isHighAbsence && (
                                <AlertTriangle className="h-4 w-4 text-[var(--risk-medium)]" />
                              )}
                            </div>
                          </TableCell>

                          <TableCell className="hidden font-mono text-sm md:table-cell">
                            {etudiant.cne || "-"}
                          </TableCell>

                          <TableCell className="hidden sm:table-cell">
                            <span
                              className={cn(
                                "font-medium",
                                etudiant.moyenne_generale < 10 &&
                                  "text-destructive",
                                etudiant.moyenne_generale >= 10 &&
                                  "text-primary"
                              )}
                            >
                              {etudiant.moyenne_generale.toFixed(2)}/20
                            </span>
                          </TableCell>

                          <TableCell className="hidden sm:table-cell">
                            <span
                              className={cn(
                                "font-medium",
                                etudiant.taux_absence > 30 &&
                                  "text-destructive",
                                etudiant.taux_absence > 20 &&
                                  etudiant.taux_absence <= 30 &&
                                  "text-[var(--risk-medium)]"
                              )}
                            >
                              {etudiant.taux_absence.toFixed(1)}%
                            </span>
                          </TableCell>

                          <TableCell className="text-center">
                            {isAbsent ? (
                              <Badge
                                variant="destructive"
                                className="w-full justify-center"
                              >
                                Absent
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="w-full justify-center border-primary/20 bg-primary/5 text-primary"
                              >
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