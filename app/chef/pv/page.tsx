"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  FileText,
  Download,
  Eye,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileSpreadsheet,
  Printer,
  Send,
  Calendar,
  Users,
  GraduationCap
} from "lucide-react"
import { toast } from "sonner"

interface Student {
  id: number
  matricule: string
  nom: string
  prenom: string
  moyenneGenerale: number
  credits: number
  totalCredits: number
  mention: string
  decision: "admis" | "ajourne" | "exclus"
}

interface PV {
  id: string
  type: "deliberation" | "bulletin"
  filiere: string
  semestre: string
  date: string
  status: "draft" | "validated" | "published"
  generatedBy: string
}

export default function PVPage() {
  const [selectedFiliere, setSelectedFiliere] = useState("3IIR-G2")
  const [selectedSemestre, setSelectedSemestre] = useState("S2")
  const [generating, setGenerating] = useState(false)
  const [generateProgress, setGenerateProgress] = useState(0)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [selectedStudents, setSelectedStudents] = useState<number[]>([])

  const filieres = [
    { id: "3IIR-G1", name: "3IIR - Groupe 1" },
    { id: "3IIR-G2", name: "3IIR - Groupe 2" },
    { id: "3IIR-G3", name: "3IIR - Groupe 3" },
  ]

  const semestres = [
    { id: "S1", name: "Semestre 1" },
    { id: "S2", name: "Semestre 2" },
  ]

  const students: Student[] = [
    { id: 1, matricule: "3IIR-2025-001", nom: "Benali", prenom: "Ahmed", moyenneGenerale: 14.75, credits: 28, totalCredits: 30, mention: "Assez Bien", decision: "admis" },
    { id: 2, matricule: "3IIR-2025-002", nom: "Idrissi", prenom: "Sara", moyenneGenerale: 16.20, credits: 30, totalCredits: 30, mention: "Bien", decision: "admis" },
    { id: 3, matricule: "3IIR-2025-003", nom: "Tazi", prenom: "Mohamed", moyenneGenerale: 9.50, credits: 18, totalCredits: 30, mention: "-", decision: "ajourne" },
    { id: 4, matricule: "3IIR-2025-004", nom: "Alaoui", prenom: "Fatima", moyenneGenerale: 12.30, credits: 26, totalCredits: 30, mention: "Passable", decision: "admis" },
    { id: 5, matricule: "3IIR-2025-005", nom: "Berrada", prenom: "Youssef", moyenneGenerale: 8.20, credits: 12, totalCredits: 30, mention: "-", decision: "exclus" },
    { id: 6, matricule: "3IIR-2025-006", nom: "Fassi", prenom: "Amina", moyenneGenerale: 17.80, credits: 30, totalCredits: 30, mention: "Tres Bien", decision: "admis" },
    { id: 7, matricule: "3IIR-2025-007", nom: "El Amrani", prenom: "Karim", moyenneGenerale: 11.50, credits: 24, totalCredits: 30, mention: "Passable", decision: "admis" },
    { id: 8, matricule: "3IIR-2025-008", nom: "Bennis", prenom: "Laila", moyenneGenerale: 15.40, credits: 30, totalCredits: 30, mention: "Bien", decision: "admis" },
  ]

  const previousPVs: PV[] = [
    { id: "pv-001", type: "deliberation", filiere: "3IIR-G2", semestre: "S1", date: "2026-01-15", status: "published", generatedBy: "Dr. El Mansouri" },
    { id: "pv-002", type: "deliberation", filiere: "3IIR-G1", semestre: "S1", date: "2026-01-15", status: "published", generatedBy: "Dr. El Mansouri" },
    { id: "pv-003", type: "deliberation", filiere: "3IIR-G2", semestre: "S2", date: "2026-03-10", status: "draft", generatedBy: "Dr. El Mansouri" },
  ]

  const stats = {
    totalEtudiants: students.length,
    admis: students.filter(s => s.decision === "admis").length,
    ajournes: students.filter(s => s.decision === "ajourne").length,
    exclus: students.filter(s => s.decision === "exclus").length,
    moyennePromo: (students.reduce((acc, s) => acc + s.moyenneGenerale, 0) / students.length).toFixed(2),
    tauxReussite: ((students.filter(s => s.decision === "admis").length / students.length) * 100).toFixed(1),
  }

  const handleGeneratePV = async () => {
    setGenerating(true)
    setGenerateProgress(0)

    for (let i = 0; i <= 100; i += 5) {
      await new Promise(resolve => setTimeout(resolve, 100))
      setGenerateProgress(i)
    }

    setGenerating(false)
    toast.success("PV de délibération généré avec succès")
    setPreviewOpen(true)
  }

  const handleGenerateBulletins = async () => {
    if (selectedStudents.length === 0) {
      toast.error("Veuillez sélectionner au moins un étudiant")
      return
    }
    
    setGenerating(true)
    setGenerateProgress(0)

    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 150))
      setGenerateProgress(i)
    }

    setGenerating(false)
    toast.success(`${selectedStudents.length} bulletin(s) généré(s) avec succès`)
  }

  const toggleStudent = (id: number) => {
    setSelectedStudents(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    )
  }

  const toggleAllStudents = () => {
    if (selectedStudents.length === students.length) {
      setSelectedStudents([])
    } else {
      setSelectedStudents(students.map(s => s.id))
    }
  }

  const getDecisionBadge = (decision: Student["decision"]) => {
    switch (decision) {
      case "admis":
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Admis</Badge>
      case "ajourne":
        return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">Ajourné</Badge>
      case "exclus":
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Exclu</Badge>
    }
  }

  const getStatusBadge = (status: PV["status"]) => {
    switch (status) {
      case "draft":
        return <Badge variant="outline" className="text-yellow-600"><Clock className="h-3 w-3 mr-1" />Brouillon</Badge>
      case "validated":
        return <Badge variant="outline" className="text-blue-600"><CheckCircle2 className="h-3 w-3 mr-1" />Validé</Badge>
      case "published":
        return <Badge variant="outline" className="text-green-600"><CheckCircle2 className="h-3 w-3 mr-1" />Publié</Badge>
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">PV et Bulletins</h1>
          <p className="text-muted-foreground">Générez les procès-verbaux de délibération et les bulletins de notes</p>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4">
              <div className="space-y-1">
                <Label className="text-xs">Filière</Label>
                <Select value={selectedFiliere} onValueChange={setSelectedFiliere}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {filieres.map(f => (
                      <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Semestre</Label>
                <Select value={selectedSemestre} onValueChange={setSelectedSemestre}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {semestres.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalEtudiants}</p>
                  <p className="text-sm text-muted-foreground">Total étudiants</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.admis}</p>
                  <p className="text-sm text-muted-foreground">Admis ({stats.tauxReussite}%)</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-100">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.ajournes}</p>
                  <p className="text-sm text-muted-foreground">Ajournés</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100">
                  <GraduationCap className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.moyennePromo}</p>
                  <p className="text-sm text-muted-foreground">Moyenne promo</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="deliberation" className="space-y-4">
          <TabsList>
            <TabsTrigger value="deliberation">PV de Délibération</TabsTrigger>
            <TabsTrigger value="bulletins">Bulletins Individuels</TabsTrigger>
            <TabsTrigger value="historique">Historique</TabsTrigger>
          </TabsList>

          {/* Deliberation Tab */}
          <TabsContent value="deliberation">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Résultats de Délibération</CardTitle>
                    <CardDescription>
                      {selectedFiliere} - {selectedSemestre} - {students.length} étudiants
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setPreviewOpen(true)}>
                      <Eye className="h-4 w-4 mr-2" />
                      Aperçu
                    </Button>
                    <Button onClick={handleGeneratePV} disabled={generating}>
                      <FileText className="h-4 w-4 mr-2" />
                      {generating ? "Génération..." : "Générer le PV"}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {generating && (
                  <div className="mb-4 space-y-2">
                    <Progress value={generateProgress} />
                    <p className="text-sm text-center text-muted-foreground">
                      Génération en cours... {generateProgress}%
                    </p>
                  </div>
                )}
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[120px]">Matricule</TableHead>
                        <TableHead>Nom & Prénom</TableHead>
                        <TableHead className="text-center">Moyenne</TableHead>
                        <TableHead className="text-center">Crédits</TableHead>
                        <TableHead className="text-center">Mention</TableHead>
                        <TableHead className="text-center">Décision</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students.map(student => (
                        <TableRow key={student.id}>
                          <TableCell className="font-mono text-sm">{student.matricule}</TableCell>
                          <TableCell className="font-medium">{student.nom} {student.prenom}</TableCell>
                          <TableCell className="text-center font-medium">{student.moyenneGenerale.toFixed(2)}</TableCell>
                          <TableCell className="text-center">{student.credits}/{student.totalCredits}</TableCell>
                          <TableCell className="text-center">{student.mention}</TableCell>
                          <TableCell className="text-center">{getDecisionBadge(student.decision)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bulletins Tab */}
          <TabsContent value="bulletins">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Bulletins Individuels</CardTitle>
                    <CardDescription>
                      Sélectionnez les étudiants pour générer leurs bulletins
                    </CardDescription>
                  </div>
                  <Button 
                    onClick={handleGenerateBulletins} 
                    disabled={generating || selectedStudents.length === 0}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Générer {selectedStudents.length > 0 ? `(${selectedStudents.length})` : ""}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {generating && (
                  <div className="mb-4 space-y-2">
                    <Progress value={generateProgress} />
                    <p className="text-sm text-center text-muted-foreground">
                      Génération en cours... {generateProgress}%
                    </p>
                  </div>
                )}
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">
                          <Checkbox
                            checked={selectedStudents.length === students.length}
                            onCheckedChange={toggleAllStudents}
                          />
                        </TableHead>
                        <TableHead className="w-[120px]">Matricule</TableHead>
                        <TableHead>Nom & Prénom</TableHead>
                        <TableHead className="text-center">Moyenne</TableHead>
                        <TableHead className="text-center">Décision</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students.map(student => (
                        <TableRow key={student.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedStudents.includes(student.id)}
                              onCheckedChange={() => toggleStudent(student.id)}
                            />
                          </TableCell>
                          <TableCell className="font-mono text-sm">{student.matricule}</TableCell>
                          <TableCell className="font-medium">{student.nom} {student.prenom}</TableCell>
                          <TableCell className="text-center font-medium">{student.moyenneGenerale.toFixed(2)}</TableCell>
                          <TableCell className="text-center">{getDecisionBadge(student.decision)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="icon" title="Aperçu">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" title="Télécharger">
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="historique">
            <Card>
              <CardHeader>
                <CardTitle>Historique des PV</CardTitle>
                <CardDescription>
                  Documents générés précédemment
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Filière</TableHead>
                        <TableHead>Semestre</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Généré par</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previousPVs.map(pv => (
                        <TableRow key={pv.id}>
                          <TableCell>
                            <Badge variant="secondary">
                              {pv.type === "deliberation" ? "PV Délibération" : "Bulletin"}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">{pv.filiere}</TableCell>
                          <TableCell>{pv.semestre}</TableCell>
                          <TableCell>{new Date(pv.date).toLocaleDateString("fr-FR")}</TableCell>
                          <TableCell>{getStatusBadge(pv.status)}</TableCell>
                          <TableCell className="text-muted-foreground">{pv.generatedBy}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="icon" title="Aperçu">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" title="Télécharger">
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" title="Imprimer">
                                <Printer className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Preview Dialog */}
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Aperçu du PV de Délibération</DialogTitle>
              <DialogDescription>
                {selectedFiliere} - {selectedSemestre} - Année universitaire 2025/2026
              </DialogDescription>
            </DialogHeader>
            
            <div className="border rounded-lg p-6 bg-white space-y-6">
              {/* Header */}
              <div className="text-center space-y-2 border-b pb-4">
                <h2 className="text-xl font-bold">EMSI CENTRE</h2>
                <p className="text-muted-foreground">École Marocaine des Sciences de l&apos;Ingénieur</p>
                <h3 className="text-lg font-semibold mt-4">PROCÈS-VERBAL DE DÉLIBÉRATION</h3>
                <p>Session : {selectedSemestre} - Année 2025/2026</p>
                <p>Filière : {filieres.find(f => f.id === selectedFiliere)?.name}</p>
              </div>

              {/* Results Table */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>N°</TableHead>
                    <TableHead>Matricule</TableHead>
                    <TableHead>Nom & Prénom</TableHead>
                    <TableHead className="text-center">Moyenne</TableHead>
                    <TableHead className="text-center">Mention</TableHead>
                    <TableHead className="text-center">Décision</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student, index) => (
                    <TableRow key={student.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="font-mono text-sm">{student.matricule}</TableCell>
                      <TableCell>{student.nom} {student.prenom}</TableCell>
                      <TableCell className="text-center">{student.moyenneGenerale.toFixed(2)}</TableCell>
                      <TableCell className="text-center">{student.mention}</TableCell>
                      <TableCell className="text-center font-medium">
                        {student.decision.toUpperCase()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Stats Summary */}
              <div className="grid grid-cols-4 gap-4 text-center border-t pt-4">
                <div>
                  <p className="text-2xl font-bold">{stats.totalEtudiants}</p>
                  <p className="text-sm text-muted-foreground">Total</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">{stats.admis}</p>
                  <p className="text-sm text-muted-foreground">Admis</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-yellow-600">{stats.ajournes}</p>
                  <p className="text-sm text-muted-foreground">Ajournés</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.tauxReussite}%</p>
                  <p className="text-sm text-muted-foreground">Taux de réussite</p>
                </div>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-8 pt-8 border-t">
                <div className="text-center">
                  <p className="font-medium">Le Chef de Filière</p>
                  <div className="h-16 border-b border-dashed mt-8 mb-2" />
                  <p className="text-sm text-muted-foreground">Date et Signature</p>
                </div>
                <div className="text-center">
                  <p className="font-medium">Le Directeur des Études</p>
                  <div className="h-16 border-b border-dashed mt-8 mb-2" />
                  <p className="text-sm text-muted-foreground">Date et Signature</p>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setPreviewOpen(false)}>
                Fermer
              </Button>
              <Button variant="outline">
                <Printer className="h-4 w-4 mr-2" />
                Imprimer
              </Button>
              <Button>
                <Download className="h-4 w-4 mr-2" />
                Télécharger PDF
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
