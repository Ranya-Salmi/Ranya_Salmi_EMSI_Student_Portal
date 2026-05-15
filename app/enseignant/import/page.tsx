"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FileText,
  Upload,
  XCircle,
} from "lucide-react";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

type ImportType = "notes" | "absences";

interface ModuleOption {
  id: number;
  nom: string;
  code?: string | null;
}

interface ImportRow {
  id: number;
  etudiant: string;
  matricule: string;
  value: string;
  status: "valid" | "error" | "warning";
  message?: string;
}

function getToken() {
  const maybeApi = api as any;

  if (typeof maybeApi.getToken === "function") {
    return maybeApi.getToken();
  }

  if (typeof window !== "undefined") {
    return localStorage.getItem("emsi_token");
  }

  return null;
}

function normalizeModule(item: any): ModuleOption {
  return {
    id: Number(item.id),
    nom: item.nom || item.name || item.label || `Module #${item.id}`,
    code: item.code || null,
  };
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let insideQuotes = false;

  for (const char of line) {
    if (char === '"') {
      insideQuotes = !insideQuotes;
    } else if (char === "," && !insideQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

function validatePreviewRows(text: string, type: ImportType): ImportRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length <= 1) return [];

  return lines.slice(1, 51).map((line, index) => {
    const columns = parseCsvLine(line);

    const matricule = columns[0] || "";
    const nom = columns[1] || "";
    const prenom = columns[2] || "";
    const value =
      type === "notes" ? columns[3] || "" : columns[3] || columns[4] || "";

    const etudiant =
      [prenom, nom].filter(Boolean).join(" ") || "Étudiant non identifié";

    if (!matricule) {
      return {
        id: index + 1,
        etudiant,
        matricule: "—",
        value,
        status: "warning",
        message: "Matricule manquant",
      };
    }

    if (type === "notes") {
      const note = Number(value.replace(",", "."));

      if (!Number.isFinite(note)) {
        return {
          id: index + 1,
          etudiant,
          matricule,
          value,
          status: "error",
          message: "Note invalide",
        };
      }

      if (note < 0 || note > 20) {
        return {
          id: index + 1,
          etudiant,
          matricule,
          value,
          status: "error",
          message: "La note doit être comprise entre 0 et 20",
        };
      }
    }

    return {
      id: index + 1,
      etudiant,
      matricule,
      value,
      status: "valid",
    };
  });
}

async function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Impossible de lire le fichier"));

    reader.readAsText(file);
  });
}

function downloadCsvTemplate(type: ImportType) {
  const content =
    type === "notes"
      ? "Matricule,Nom,Prenom,Note\nCNE_EXEMPLE,NOM_EXEMPLE,PRENOM_EXEMPLE,15.5"
      : "Matricule,Nom,Prenom,Date,Statut\nCNE_EXEMPLE,NOM_EXEMPLE,PRENOM_EXEMPLE,2026-03-15,Absent";

  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `template_${type}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
  toast.success("Modèle téléchargé");
}

export default function ImportPage() {
  const [selectedModule, setSelectedModule] = useState("");
  const [selectedType, setSelectedType] = useState<ImportType>("notes");
  const [modules, setModules] = useState<ModuleOption[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [previewData, setPreviewData] = useState<ImportRow[]>([]);
  const [importComplete, setImportComplete] = useState(false);
  const [loadingModules, setLoadingModules] = useState(true);

  useEffect(() => {
    async function fetchModules() {
      try {
        const maybeApi = api as any;

        const data =
          typeof maybeApi.getMesModules === "function"
            ? await maybeApi.getMesModules()
            : typeof maybeApi.getTeacherModules === "function"
              ? await maybeApi.getTeacherModules()
              : await api.getModules();

        setModules(Array.isArray(data) ? data.map(normalizeModule) : []);
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Erreur lors du chargement des modules"
        );
      } finally {
        setLoadingModules(false);
      }
    }

    fetchModules();
  }, []);

  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = event.target.files?.[0];

      if (!selectedFile) return;

      const lowerName = selectedFile.name.toLowerCase();
      const isCsv = lowerName.endsWith(".csv");
      const isExcel = lowerName.endsWith(".xlsx") || lowerName.endsWith(".xls");

      if (!isCsv && !isExcel) {
        toast.error("Format de fichier non supporté. Utilisez CSV ou Excel.");
        return;
      }

      setFile(selectedFile);
      setImportComplete(false);
      setPreviewData([]);

      if (!isCsv) {
        toast.info(
          "Aperçu local disponible uniquement pour CSV. Le fichier Excel sera envoyé au backend."
        );
        return;
      }

      try {
        const text = await readFileAsText(selectedFile);
        const rows = validatePreviewRows(text, selectedType);
        setPreviewData(rows);
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Erreur lors de la lecture du fichier"
        );
      }
    },
    [selectedType]
  );

  const handleImport = async () => {
    if (!file || !selectedModule) {
      toast.error("Veuillez sélectionner un module et un fichier");
      return;
    }

    if (selectedType === "absences") {
      toast.error(
        "L’import des absences doit être relié à un endpoint backend dédié."
      );
      return;
    }

    setImporting(true);
    setImportProgress(20);

    try {
      const token = getToken();
      const formData = new FormData();

      formData.append("file", file);
      formData.append("module_id", selectedModule);

      const response = await fetch(`${API_URL}/csv/notes/import`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      setImportProgress(75);

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Erreur lors de l’import");
      }

      setImportProgress(100);
      setImportComplete(true);

      toast.success("Import terminé avec succès");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de l’import"
      );
    } finally {
      setImporting(false);
    }
  };

  const exportNotes = (moduleId: number) => {
    const maybeApi = api as any;

    if (typeof maybeApi.getExportNotesUrl === "function") {
      window.open(maybeApi.getExportNotesUrl(moduleId), "_blank");
      return;
    }

    const token = getToken();
    const url = `${API_URL}/csv/notes/export/module/${moduleId}${
      token ? `?token=${encodeURIComponent(token)}` : ""
    }`;

    window.open(url, "_blank");
  };

  const validCount = previewData.filter((row) => row.status === "valid").length;
  const errorCount = previewData.filter((row) => row.status === "error").length;
  const warningCount = previewData.filter(
    (row) => row.status === "warning"
  ).length;

  const selectedModuleObject = useMemo(() => {
    return modules.find((module) => String(module.id) === selectedModule);
  }, [modules, selectedModule]);

  return (
    <DashboardLayout requiredRoles={["enseignant"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Import de données
          </h1>
          <p className="text-muted-foreground">
            Importez des notes depuis un fichier CSV ou Excel et exportez les
            données de vos modules.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Configuration</CardTitle>
              <CardDescription>Paramètres de l’import</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Type de données</Label>
                <Select
                  value={selectedType}
                  onValueChange={(value: ImportType) => {
                    setSelectedType(value);
                    setPreviewData([]);
                    setImportComplete(false);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="notes">Notes</SelectItem>
                    <SelectItem value="absences">Absences</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Module</Label>
                <Select value={selectedModule} onValueChange={setSelectedModule}>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        loadingModules
                          ? "Chargement..."
                          : "Sélectionner un module"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {modules.map((module) => (
                      <SelectItem key={module.id} value={String(module.id)}>
                        {module.nom}
                        {module.code ? ` (${module.code})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Fichier CSV ou Excel</Label>
                <Input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileChange}
                  className="cursor-pointer"
                />
              </div>

              {file && (
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <FileSpreadsheet className="h-5 w-5 text-primary" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} Ko
                    </p>
                  </div>
                </div>
              )}

              {selectedModuleObject && (
                <div className="rounded-lg border p-3 text-sm text-muted-foreground">
                  Module sélectionné :{" "}
                  <span className="font-medium text-foreground">
                    {selectedModuleObject.nom}
                  </span>
                </div>
              )}

              <div className="pt-4 space-y-2">
                <p className="text-sm font-medium">Télécharger un modèle</p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadCsvTemplate("notes")}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Notes
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadCsvTemplate("absences")}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Absences
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Aperçu et validation</CardTitle>
              <CardDescription>
                Vérifiez les données avant import.
              </CardDescription>
            </CardHeader>

            <CardContent>
              {previewData.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Upload className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Sélectionnez un fichier CSV pour afficher l’aperçu.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm">{validCount} valides</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm">
                        {warningCount} avertissements
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-600" />
                      <span className="text-sm">{errorCount} erreurs</span>
                    </div>
                  </div>

                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Étudiant</TableHead>
                          <TableHead>Matricule</TableHead>
                          <TableHead>
                            {selectedType === "notes" ? "Note" : "Statut"}
                          </TableHead>
                          <TableHead>Validation</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {previewData.map((row) => (
                          <TableRow key={row.id}>
                            <TableCell className="font-medium">
                              {row.etudiant}
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {row.matricule}
                            </TableCell>
                            <TableCell>{row.value}</TableCell>
                            <TableCell>
                              {row.status === "valid" && (
                                <Badge
                                  variant="outline"
                                  className="text-green-600 border-green-200 bg-green-50"
                                >
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Valide
                                </Badge>
                              )}
                              {row.status === "warning" && (
                                <Badge
                                  variant="outline"
                                  className="text-yellow-600 border-yellow-200 bg-yellow-50"
                                >
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  {row.message}
                                </Badge>
                              )}
                              {row.status === "error" && (
                                <Badge
                                  variant="outline"
                                  className="text-red-600 border-red-200 bg-red-50"
                                >
                                  <XCircle className="h-3 w-3 mr-1" />
                                  {row.message}
                                </Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {importing ? (
                    <div className="space-y-2">
                      <Progress value={importProgress} />
                      <p className="text-sm text-center text-muted-foreground">
                        Import en cours... {importProgress}%
                      </p>
                    </div>
                  ) : importComplete ? (
                    <div className="flex items-center justify-center gap-2 p-4 bg-green-50 rounded-lg text-green-700">
                      <CheckCircle2 className="h-5 w-5" />
                      <span>Import terminé avec succès</span>
                    </div>
                  ) : (
                    <Button
                      onClick={handleImport}
                      className="w-full"
                      disabled={
                        !selectedModule ||
                        !file ||
                        errorCount === previewData.length
                      }
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Importer {validCount + warningCount} ligne(s)
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Export de données</CardTitle>
            <CardDescription>
              Exportez les notes enregistrées pour vos modules.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Tabs defaultValue="notes">
              <TabsList>
                <TabsTrigger value="notes">Notes</TabsTrigger>
                <TabsTrigger value="absences">Absences</TabsTrigger>
                <TabsTrigger value="statistiques">Statistiques</TabsTrigger>
              </TabsList>

              <TabsContent value="notes" className="pt-4">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {modules.map((module) => (
                    <Card key={module.id} className="bg-muted/30">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{module.nom}</p>
                            <p className="text-sm text-muted-foreground">
                              {module.code || `Module #${module.id}`}
                            </p>
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            title="Export CSV"
                            onClick={() => exportNotes(module.id)}
                          >
                            <FileSpreadsheet className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="absences" className="pt-4">
                <div className="text-sm text-muted-foreground">
                  L’export des absences sera disponible dès que l’endpoint
                  backend dédié sera activé.
                </div>
              </TabsContent>

              <TabsContent value="statistiques" className="pt-4">
                <div className="flex flex-wrap gap-3">
                  <Button variant="outline" disabled>
                    <FileText className="h-4 w-4 mr-2" />
                    Rapport global PDF
                  </Button>
                  <Button variant="outline" disabled>
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Données brutes Excel
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}