"use client";

import { useEffect, useMemo, useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  api,
  type AcademicModule,
  type Evaluation,
  type ModuleEtudiant,
  type Note,
} from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  ClipboardList,
  Search,
  Save,
  Upload,
  Download,
  Check,
  X,
  FileSpreadsheet,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

interface NoteInput {
  etudiantId: number;
  evaluationId: number;
  valeur: string;
  original?: number | null;
  modified: boolean;
}

function formatEvaluationLabel(evaluation: Evaluation) {
  return `${evaluation.nom} (${evaluation.type}) - Coef. ${evaluation.coefficient}`;
}

export default function NotesPage() {
  const [modules, setModules] = useState<AcademicModule[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [etudiants, setEtudiants] = useState<ModuleEtudiant[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadingSelection, setLoadingSelection] = useState(false);
  const [saving, setSaving] = useState(false);

  const [selectedModule, setSelectedModule] = useState<string>("");
  const [selectedEvaluation, setSelectedEvaluation] = useState<string>("");
  const [search, setSearch] = useState("");
  const [notes, setNotes] = useState<Record<number, NoteInput>>({});
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  async function loadExistingNotesForEvaluation(
    students: ModuleEtudiant[],
    evaluationId: string
  ) {
    if (!evaluationId || students.length === 0) {
      setNotes({});
      return;
    }

    const nextNotes: Record<number, NoteInput> = {};

    const results = await Promise.allSettled(
      students.map(async (student) => {
        const studentNotes = await api.getNotesEtudiant(student.id);
        const existingNote = studentNotes.find(
          (note: Note) => note.evaluation_id === Number(evaluationId)
        );

        return {
          studentId: student.id,
          value: existingNote?.valeur ?? null,
        };
      })
    );

    results.forEach((result) => {
      if (result.status !== "fulfilled") return;

      const { studentId, value } = result.value;

      nextNotes[studentId] = {
        etudiantId: studentId,
        evaluationId: Number(evaluationId),
        valeur: value === null || value === undefined ? "" : String(value),
        original: value,
        modified: false,
      };
    });

    setNotes(nextNotes);
  }

  async function loadModuleData(moduleId: string) {
    if (!moduleId) {
      setEvaluations([]);
      setEtudiants([]);
      setSelectedEvaluation("");
      setNotes({});
      return;
    }

    setLoadingSelection(true);

    try {
      const [evaluationsData, studentsData] = await Promise.all([
        api.getEvaluations(Number(moduleId)),
        api.getModuleStudents(Number(moduleId)),
      ]);

      setEvaluations(evaluationsData);
      setEtudiants(studentsData);

      const firstEvaluationId =
        evaluationsData.length > 0 ? String(evaluationsData[0].id) : "";

      setSelectedEvaluation(firstEvaluationId);
      await loadExistingNotesForEvaluation(studentsData, firstEvaluationId);
    } catch (err) {
      setEvaluations([]);
      setEtudiants([]);
      setSelectedEvaluation("");
      setNotes({});
      toast.error(
        err instanceof Error
          ? err.message
          : "Erreur de chargement du module"
      );
    } finally {
      setLoadingSelection(false);
    }
  }

  async function loadModules() {
    const modulesData = await api.getModules();
    setModules(modulesData);

    if (modulesData.length > 0) {
      const firstModuleId = String(modulesData[0].id);
      setSelectedModule(firstModuleId);
      await loadModuleData(firstModuleId);
    } else {
      setSelectedModule("");
      setSelectedEvaluation("");
      setEvaluations([]);
      setEtudiants([]);
      setNotes({});
    }
  }

  async function refreshPage() {
    try {
      setLoading(true);
      await loadModules();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedEvaluationObject = useMemo(
    () =>
      evaluations.find(
        (evaluation) => String(evaluation.id) === selectedEvaluation
      ),
    [evaluations, selectedEvaluation]
  );

  const filteredEtudiants = etudiants.filter((etudiant) => {
    const query = search.toLowerCase();

    return (
      etudiant.full_name.toLowerCase().includes(query) ||
      etudiant.cne?.toLowerCase().includes(query) ||
      etudiant.email.toLowerCase().includes(query)
    );
  });

  const handleModuleChange = async (value: string) => {
    setSelectedModule(value);
    setSelectedEvaluation("");
    setNotes({});
    await loadModuleData(value);
  };

  const handleEvaluationChange = async (value: string) => {
    setSelectedEvaluation(value);
    await loadExistingNotesForEvaluation(etudiants, value);
  };

  const handleNoteChange = (etudiantId: number, value: string) => {
    const numValue = Number(value);

    if (
      value !== "" &&
      (Number.isNaN(numValue) || numValue < 0 || numValue > 20)
    ) {
      return;
    }

    setNotes((prev) => {
      const previousNote = prev[etudiantId];

      return {
        ...prev,
        [etudiantId]: {
          etudiantId,
          evaluationId: Number(selectedEvaluation),
          valeur: value,
          original: previousNote?.original ?? null,
          modified: value !== String(previousNote?.original ?? ""),
        },
      };
    });
  };

  const handleSaveNotes = async () => {
    if (!selectedModule || !selectedEvaluation) {
      toast.error("Veuillez sélectionner un module et une évaluation");
      return;
    }

    const modifiedNotes = Object.values(notes).filter(
      (note) => note.modified && note.valeur !== ""
    );

    if (modifiedNotes.length === 0) {
      toast.info("Aucune note à sauvegarder");
      return;
    }

    setSaving(true);

    let saved = 0;
    let errors = 0;

    for (const note of modifiedNotes) {
      try {
        await api.saisirNote(
          note.etudiantId,
          note.evaluationId,
          Number(note.valeur)
        );

        saved++;

        setNotes((prev) => ({
          ...prev,
          [note.etudiantId]: {
            ...prev[note.etudiantId],
            modified: false,
            original: Number(note.valeur),
          },
        }));
      } catch {
        errors++;
      }
    }

    setSaving(false);

    if (saved > 0) {
      toast.success(`${saved} note(s) enregistrée(s)`);
      await loadModuleData(selectedModule);
    }

    if (errors > 0) {
      toast.error(`${errors} erreur(s) lors de l'enregistrement`);
    }
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    try {
      const result = await api.importNotes(file);
      toast.success(`${result.importes} notes importées`);

      if (result.erreurs.length > 0) {
        toast.warning(`${result.erreurs.length} ligne(s) avec erreurs`);
      }

      setImportDialogOpen(false);

      if (selectedModule) {
        await loadModuleData(selectedModule);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur d'import");
    }
  };

  const modifiedCount = Object.values(notes).filter((note) => note.modified)
    .length;

  return (
    <DashboardLayout requiredRoles={["enseignant", "admin", "chef_filiere"]}>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Saisie des notes
            </h1>
            <p className="text-muted-foreground">
              Enregistrez les notes de vos évaluations
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={refreshPage} disabled={loading}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Actualiser
            </Button>

            <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Upload className="mr-2 h-4 w-4" />
                  Importer CSV
                </Button>
              </DialogTrigger>

              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Importer des notes</DialogTitle>
                  <DialogDescription>
                    Importez un fichier CSV avec les colonnes : cne,
                    evaluation_id, note.
                  </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                  <Label htmlFor="file">Fichier CSV</Label>
                  <Input
                    id="file"
                    type="file"
                    accept=".csv"
                    onChange={handleFileImport}
                    className="mt-2"
                  />
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setImportDialogOpen(false)}
                  >
                    Annuler
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {selectedModule && (
              <Button
                variant="outline"
                onClick={() =>
                  window.open(
                    api.getExportNotesUrl(Number(selectedModule)),
                    "_blank"
                  )
                }
              >
                <Download className="mr-2 h-4 w-4" />
                Exporter
              </Button>
            )}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Sélection</CardTitle>
            <CardDescription>
              Choisissez le module et l&apos;évaluation
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Module</Label>
                <Select
                  value={selectedModule}
                  onValueChange={handleModuleChange}
                  disabled={loading || loadingSelection || modules.length === 0}
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
                <Label>Évaluation</Label>
                <Select
                  value={selectedEvaluation}
                  onValueChange={handleEvaluationChange}
                  disabled={
                    loading ||
                    loadingSelection ||
                    !selectedModule ||
                    evaluations.length === 0
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une évaluation" />
                  </SelectTrigger>

                  <SelectContent>
                    {evaluations.length === 0 ? (
                      <SelectItem value="none" disabled>
                        Aucune évaluation disponible
                      </SelectItem>
                    ) : (
                      evaluations.map((evaluation) => (
                        <SelectItem
                          key={evaluation.id}
                          value={String(evaluation.id)}
                        >
                          {formatEvaluationLabel(evaluation)}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
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

            {selectedEvaluationObject && (
              <div className="mt-4 rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
                Évaluation sélectionnée :{" "}
                <span className="font-medium text-foreground">
                  {selectedEvaluationObject.nom}
                </span>
                <span>
                  {" "}
                  — {selectedEvaluationObject.type} — Coef.{" "}
                  {selectedEvaluationObject.coefficient} — Barème{" "}
                  {selectedEvaluationObject.bareme_max}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                Notes des étudiants
              </CardTitle>
              <CardDescription>
                {selectedModule && selectedEvaluation
                  ? `${filteredEtudiants.length} étudiant(s)`
                  : "Sélectionnez un module et une évaluation"}
              </CardDescription>
            </div>

            {modifiedCount > 0 && (
              <div className="flex items-center gap-3">
                <Badge variant="secondary">
                  {modifiedCount} modification(s)
                </Badge>

                <Button onClick={handleSaveNotes} disabled={saving}>
                  {saving ? (
                    "Enregistrement..."
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Enregistrer
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardHeader>

          <CardContent>
            {loading || loadingSelection ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Skeleton key={index} className="h-12 w-full" />
                ))}
              </div>
            ) : modules.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <FileSpreadsheet className="mb-4 h-12 w-12 opacity-50" />
                <p className="text-lg font-medium">Aucun module disponible</p>
                <p className="text-sm">
                  Aucun module n&apos;est affecté à cet enseignant.
                </p>
              </div>
            ) : !selectedModule ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <FileSpreadsheet className="mb-4 h-12 w-12 opacity-50" />
                <p className="text-lg font-medium">Sélectionnez un module</p>
                <p className="text-sm">
                  pour charger les évaluations et les étudiants
                </p>
              </div>
            ) : evaluations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <FileSpreadsheet className="mb-4 h-12 w-12 opacity-50" />
                <p className="text-lg font-medium">
                  Aucune évaluation disponible
                </p>
                <p className="text-sm">
                  Créez une évaluation pour ce module avant la saisie.
                </p>
              </div>
            ) : !selectedEvaluation ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <FileSpreadsheet className="mb-4 h-12 w-12 opacity-50" />
                <p className="text-lg font-medium">
                  Sélectionnez une évaluation
                </p>
                <p className="text-sm">
                  pour commencer la saisie des notes
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
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Étudiant</TableHead>
                      <TableHead className="hidden md:table-cell">
                        CNE
                      </TableHead>
                      <TableHead className="hidden lg:table-cell">
                        Moyenne module
                      </TableHead>
                      <TableHead className="w-36">Note / 20</TableHead>
                      <TableHead className="w-24 text-center">
                        Statut
                      </TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {filteredEtudiants.map((etudiant, index) => {
                      const noteInput = notes[etudiant.id];
                      const currentValue = noteInput?.valeur ?? "";
                      const isModified = noteInput?.modified ?? false;
                      const numValue = Number(currentValue);
                      const isInvalid =
                        currentValue !== "" &&
                        (Number.isNaN(numValue) ||
                          numValue < 0 ||
                          numValue > 20);

                      return (
                        <TableRow key={etudiant.id}>
                          <TableCell className="text-muted-foreground">
                            {index + 1}
                          </TableCell>

                          <TableCell>
                            <div>
                              <p className="font-medium">
                                {etudiant.full_name}
                              </p>
                              <p className="text-sm text-muted-foreground md:hidden">
                                {etudiant.cne || "-"}
                              </p>
                            </div>
                          </TableCell>

                          <TableCell className="hidden font-mono text-sm md:table-cell">
                            {etudiant.cne || "-"}
                          </TableCell>

                          <TableCell className="hidden lg:table-cell">
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

                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              max="20"
                              step="0.25"
                              placeholder="—"
                              value={currentValue}
                              onChange={(e) =>
                                handleNoteChange(etudiant.id, e.target.value)
                              }
                              className={cn(
                                "w-24 text-center",
                                isInvalid &&
                                  "border-destructive focus-visible:ring-destructive",
                                isModified &&
                                  !isInvalid &&
                                  "border-primary"
                              )}
                            />
                          </TableCell>

                          <TableCell className="text-center">
                            {isModified ? (
                              isInvalid ? (
                                <X className="mx-auto h-5 w-5 text-destructive" />
                              ) : (
                                <div className="mx-auto flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                                  <Check className="h-3 w-3 text-primary" />
                                </div>
                              )
                            ) : (
                              <span className="text-muted-foreground">—</span>
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