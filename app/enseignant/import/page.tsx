"use client"

import { useState, useCallback } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, FileSpreadsheet, CheckCircle2, XCircle, AlertTriangle, Download, FileText } from "lucide-react"
import { toast } from "sonner"

interface ImportRow {
  id: number
  etudiant: string
  matricule: string
  value: string
  status: "valid" | "error" | "warning"
  message?: string
}

export default function ImportPage() {
  const [selectedModule, setSelectedModule] = useState("")
  const [selectedType, setSelectedType] = useState<"notes" | "absences">("notes")
  const [file, setFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const [previewData, setPreviewData] = useState<ImportRow[]>([])
  const [importComplete, setImportComplete] = useState(false)

  const modules = [
    { id: "1", name: "Analyse Numérique", code: "AN-S2" },
    { id: "2", name: "Bases de Données Avancées", code: "BDA-S2" },
    { id: "3", name: "Réseaux et Protocoles", code: "RP-S2" },
  ]

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      const validTypes = [
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "text/csv"
      ]
      if (!validTypes.includes(selectedFile.type) && !selectedFile.name.endsWith('.csv')) {
        toast.error("Format de fichier non supporté. Utilisez CSV ou Excel.")
        return
      }
      setFile(selectedFile)
      setImportComplete(false)
      
      // Simulate preview data parsing
      const mockPreview: ImportRow[] = [
        { id: 1, etudiant: "Ahmed Benali", matricule: "3IIR-2025-001", value: selectedType === "notes" ? "15.5" : "Présent", status: "valid" },
        { id: 2, etudiant: "Sara Idrissi", matricule: "3IIR-2025-002", value: selectedType === "notes" ? "12.0" : "Absent", status: "valid" },
        { id: 3, etudiant: "Mohamed Tazi", matricule: "3IIR-2025-003", value: selectedType === "notes" ? "22" : "Présent", status: "error", message: "Note invalide (> 20)" },
        { id: 4, etudiant: "Fatima Alaoui", matricule: "3IIR-2025-004", value: selectedType === "notes" ? "14.75" : "Justifié", status: "valid" },
        { id: 5, etudiant: "Youssef Berrada", matricule: "UNKNOWN", value: selectedType === "notes" ? "11.0" : "Absent", status: "warning", message: "Matricule non reconnu" },
        { id: 6, etudiant: "Amina Fassi", matricule: "3IIR-2025-006", value: selectedType === "notes" ? "16.25" : "Présent", status: "valid" },
      ]
      setPreviewData(mockPreview)
    }
  }, [selectedType])

  const handleImport = async () => {
    if (!file || !selectedModule) {
      toast.error("Veuillez sélectionner un module et un fichier")
      return
    }

    setImporting(true)
    setImportProgress(0)

    // Simulate import progress
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 200))
      setImportProgress(i)
    }

    setImporting(false)
    setImportComplete(true)
    toast.success(`Import terminé: ${previewData.filter(r => r.status === "valid").length} lignes importées`)
  }

  const downloadTemplate = (type: "notes" | "absences") => {
    const content = type === "notes" 
      ? "Matricule,Nom,Prénom,DS1,DS2,TP,Examen\n3IIR-2025-001,Benali,Ahmed,15,14,16,15.5"
      : "Matricule,Nom,Prénom,Date,Statut\n3IIR-2025-001,Benali,Ahmed,2026-03-15,Présent"
    
    const blob = new Blob([content], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `template_${type}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success("Modèle téléchargé")
  }

  const validCount = previewData.filter(r => r.status === "valid").length
  const errorCount = previewData.filter(r => r.status === "error").length
  const warningCount = previewData.filter(r => r.status === "warning").length

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Import de Données</h1>
          <p className="text-muted-foreground">Importez des notes ou des absences depuis un fichier CSV ou Excel</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Configuration */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Configuration</CardTitle>
              <CardDescription>Paramètres de l&apos;import</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Type de données</Label>
                <Select value={selectedType} onValueChange={(v: "notes" | "absences") => setSelectedType(v)}>
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
                    <SelectValue placeholder="Sélectionner un module" />
                  </SelectTrigger>
                  <SelectContent>
                    {modules.map(m => (
                      <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Fichier (CSV ou Excel)</Label>
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
                    <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} Ko</p>
                  </div>
                </div>
              )}

              <div className="pt-4 space-y-2">
                <p className="text-sm font-medium">Télécharger un modèle</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => downloadTemplate("notes")}>
                    <Download className="h-4 w-4 mr-1" />
                    Notes
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => downloadTemplate("absences")}>
                    <Download className="h-4 w-4 mr-1" />
                    Absences
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preview & Import */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Aperçu et Validation</CardTitle>
              <CardDescription>
                Vérifiez les données avant import
              </CardDescription>
            </CardHeader>
            <CardContent>
              {previewData.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Upload className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Sélectionnez un fichier pour voir l&apos;aperçu</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Stats */}
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm">{validCount} valides</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm">{warningCount} avertissements</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-600" />
                      <span className="text-sm">{errorCount} erreurs</span>
                    </div>
                  </div>

                  {/* Table */}
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Étudiant</TableHead>
                          <TableHead>Matricule</TableHead>
                          <TableHead>{selectedType === "notes" ? "Note" : "Statut"}</TableHead>
                          <TableHead>Validation</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {previewData.map(row => (
                          <TableRow key={row.id}>
                            <TableCell className="font-medium">{row.etudiant}</TableCell>
                            <TableCell className="font-mono text-sm">{row.matricule}</TableCell>
                            <TableCell>{row.value}</TableCell>
                            <TableCell>
                              {row.status === "valid" && (
                                <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Valide
                                </Badge>
                              )}
                              {row.status === "warning" && (
                                <Badge variant="outline" className="text-yellow-600 border-yellow-200 bg-yellow-50">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  {row.message}
                                </Badge>
                              )}
                              {row.status === "error" && (
                                <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">
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

                  {/* Import Button */}
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
                      disabled={!selectedModule || errorCount === previewData.length}
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

        {/* Export Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Export de Données</CardTitle>
            <CardDescription>Exportez les données de vos modules</CardDescription>
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
                  {modules.map(m => (
                    <Card key={m.id} className="bg-muted/30">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{m.name}</p>
                            <p className="text-sm text-muted-foreground">{m.code}</p>
                          </div>
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" title="Export CSV">
                              <FileSpreadsheet className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" title="Export PDF">
                              <FileText className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="absences" className="pt-4">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {modules.map(m => (
                    <Card key={m.id} className="bg-muted/30">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{m.name}</p>
                            <p className="text-sm text-muted-foreground">{m.code}</p>
                          </div>
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" title="Export CSV">
                              <FileSpreadsheet className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" title="Export PDF">
                              <FileText className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="statistiques" className="pt-4">
                <div className="flex flex-wrap gap-3">
                  <Button variant="outline">
                    <FileText className="h-4 w-4 mr-2" />
                    Rapport Global (PDF)
                  </Button>
                  <Button variant="outline">
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Données Brutes (Excel)
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
