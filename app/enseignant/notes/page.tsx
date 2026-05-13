"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { api, type EtudiantRisque, type Note } from "@/lib/api";
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
} from "lucide-react";
import { toast } from "sonner";

// Mock data for modules and evaluations (in real app, would come from API)
const mockModules = [
  { id: 1, nom: "Analyse Numérique S2", code: "MATH301" },
  { id: 2, nom: "Base de données avancées", code: "INFO302" },
  { id: 3, nom: "Réseaux et Protocoles", code: "NET303" },
  { id: 4, nom: "Génie Logiciel", code: "GL304" },
];

const mockEvaluations = [
  { id: 1, module_id: 1, nom: "DS1", type: "devoir", coefficient: 1, bareme_max: 20 },
  { id: 2, module_id: 1, nom: "TP1", type: "tp", coefficient: 0.5, bareme_max: 20 },
  { id: 3, module_id: 1, nom: "Examen Final", type: "examen", coefficient: 2, bareme_max: 20 },
  { id: 4, module_id: 2, nom: "DS1", type: "devoir", coefficient: 1, bareme_max: 20 },
  { id: 5, module_id: 2, nom: "Projet", type: "projet", coefficient: 1.5, bareme_max: 20 },
];

interface NoteInput {
  etudiantId: number;
  evaluationId: number;
  valeur: string;
  original?: number | null;
  modified: boolean;
}

export default function NotesPage() {
  const [etudiants, setEtudiants] = useState<EtudiantRisque[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedModule, setSelectedModule] = useState<string>("");
  const [selectedEvaluation, setSelectedEvaluation] = useState<string>("");
  const [search, setSearch] = useState("");
  const [notes, setNotes] = useState<Record<number, NoteInput>>({});
  const [importDialogOpen, setImportDialogOpen] = useState(false);

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

  const filteredEvaluations = mockEvaluations.filter(
    (e) => e.module_id === parseInt(selectedModule)
  );

  const filteredEtudiants = etudiants.filter((e) =>
    e.full_name.toLowerCase().includes(search.toLowerCase()) ||
    e.cne?.toLowerCase().includes(search.toLowerCase())
  );

  const handleNoteChange = (etudiantId: number, value: string) => {
    // Validate input
    const numValue = parseFloat(value);
    if (value !== "" && (isNaN(numValue) || numValue < 0 || numValue > 20)) {
      return;
    }

    setNotes((prev) => ({
      ...prev,
      [etudiantId]: {
        etudiantId,
        evaluationId: parseInt(selectedEvaluation),
        valeur: value,
        original: prev[etudiantId]?.original ?? null,
        modified: true,
      },
    }));
  };

  const handleSaveNotes = async () => {
    const modifiedNotes = Object.values(notes).filter((n) => n.modified && n.valeur !== "");
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
          parseFloat(note.valeur)
        );
        saved++;
        setNotes((prev) => ({
          ...prev,
          [note.etudiantId]: {
            ...prev[note.etudiantId],
            modified: false,
            original: parseFloat(note.valeur),
          },
        }));
      } catch {
        errors++;
      }
    }

    setSaving(false);
    if (saved > 0) toast.success(`${saved} note(s) enregistrée(s)`);
    if (errors > 0) toast.error(`${errors} erreur(s) lors de l'enregistrement`);
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const result = await api.importNotes(file);
      toast.success(`${result.importes} notes importées`);
      if (result.erreurs.length > 0) {
        toast.warning(`${result.erreurs.length} lignes avec erreurs`);
      }
      setImportDialogOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur d'import");
    }
  };

  const modifiedCount = Object.values(notes).filter((n) => n.modified).length;

  return (
    <DashboardLayout requiredRoles={["enseignant", "admin", "chef_filiere"]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Saisie des notes</h1>
            <p className="text-muted-foreground">
              Enregistrez les notes de vos évaluations
            </p>
          </div>
          <div className="flex gap-2">
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
                    Importez un fichier CSV avec les colonnes : cne, evaluation_id, note
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
                  <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
                    Annuler
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            {selectedModule && (
              <Button
                variant="outline"
                onClick={() => window.open(api.getExportNotesUrl(parseInt(selectedModule)), "_blank")}
              >
                <Download className="mr-2 h-4 w-4" />
                Exporter
              </Button>
            )}
          </div>
        </div>

        {/* Filters */}
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
                <Label>Évaluation</Label>
                <Select
                  value={selectedEvaluation}
                  onValueChange={setSelectedEvaluation}
                  disabled={!selectedModule}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une évaluation" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredEvaluations.map((evaluation) => (
                      <SelectItem key={evaluation.id} value={String(evaluation.id)}>
                        {evaluation.nom} ({evaluation.type}) - Coef. {evaluation.coefficient}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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

        {/* Notes Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                Notes des étudiants
              </CardTitle>
              <CardDescription>
                {selectedModule && selectedEvaluation
                  ? `${filteredEtudiants.length} étudiants`
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
                    <>Enregistrement...</>
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
            {!selectedModule || !selectedEvaluation ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <FileSpreadsheet className="h-12 w-12 mb-4 opacity-50" />
                <p className="text-lg font-medium">Sélectionnez un module et une évaluation</p>
                <p className="text-sm">pour commencer la saisie des notes</p>
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
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Étudiant</TableHead>
                      <TableHead className="hidden md:table-cell">CNE</TableHead>
                      <TableHead className="w-32">Note / 20</TableHead>
                      <TableHead className="w-20 text-center">Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEtudiants.map((etudiant, index) => {
                      const noteInput = notes[etudiant.id];
                      const currentValue = noteInput?.valeur ?? "";
                      const isModified = noteInput?.modified ?? false;
                      const numValue = parseFloat(currentValue);
                      const isInvalid = currentValue !== "" && (isNaN(numValue) || numValue < 0 || numValue > 20);

                      return (
                        <TableRow key={etudiant.id}>
                          <TableCell className="text-muted-foreground">
                            {index + 1}
                          </TableCell>
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
                            <Input
                              type="number"
                              min="0"
                              max="20"
                              step="0.25"
                              placeholder="—"
                              value={currentValue}
                              onChange={(e) => handleNoteChange(etudiant.id, e.target.value)}
                              className={cn(
                                "w-20 text-center",
                                isInvalid && "border-destructive focus-visible:ring-destructive",
                                isModified && !isInvalid && "border-primary"
                              )}
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            {isModified ? (
                              isInvalid ? (
                                <X className="h-5 w-5 text-destructive mx-auto" />
                              ) : (
                                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 mx-auto">
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
