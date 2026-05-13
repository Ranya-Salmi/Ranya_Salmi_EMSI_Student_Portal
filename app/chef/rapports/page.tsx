"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  FileText, 
  Download, 
  Calendar,
  Users,
  TrendingUp,
  AlertTriangle,
  Clock,
  FileBarChart
} from "lucide-react"
import { toast } from "sonner"

const reportTypes = [
  {
    id: "bulletin",
    title: "Bulletin de Notes",
    description: "Relevé de notes individuel par étudiant",
    icon: FileText,
    fields: ["etudiant", "semestre"]
  },
  {
    id: "absences",
    title: "Rapport d'Absences",
    description: "Récapitulatif des absences par classe ou individuel",
    icon: Calendar,
    fields: ["groupe", "periode"]
  },
  {
    id: "statistiques",
    title: "Statistiques de Classe",
    description: "Moyennes, répartition des notes, comparatifs",
    icon: TrendingUp,
    fields: ["groupe", "module", "semestre"]
  },
  {
    id: "risque",
    title: "Rapport Étudiants à Risque",
    description: "Liste des profils détectés par l'IA avec indicateurs",
    icon: AlertTriangle,
    fields: ["groupe", "seuil_risque"]
  },
  {
    id: "suivi",
    title: "Rapport de Suivi Mensuel",
    description: "Synthèse mensuelle: notes, absences, alertes",
    icon: FileBarChart,
    fields: ["groupe", "mois"]
  },
]

const mockGroupes = [
  { id: "3IIR-G1", label: "3IIR - Groupe 1" },
  { id: "3IIR-G2", label: "3IIR - Groupe 2" },
  { id: "4IIR-G1", label: "4IIR - Groupe 1" },
  { id: "5IIR-G1", label: "5IIR - Groupe 1" },
]

const mockModules = [
  { id: "MATH", label: "Mathématiques" },
  { id: "PROG", label: "Programmation" },
  { id: "BD", label: "Bases de Données" },
  { id: "RES", label: "Réseaux" },
  { id: "ALGO", label: "Algorithmique" },
]

const mockEtudiants = [
  { id: "1", label: "El Amrani Youssef" },
  { id: "2", label: "Bennani Sara" },
  { id: "3", label: "Chaoui Ahmed" },
  { id: "4", label: "Idrissi Leila" },
]

const recentReports = [
  { id: 1, type: "Bulletin de Notes", details: "El Amrani Youssef - S1", date: "2024-03-15", status: "ready" },
  { id: 2, type: "Rapport d'Absences", details: "3IIR-G1 - Mars 2024", date: "2024-03-14", status: "ready" },
  { id: 3, type: "Statistiques de Classe", details: "4IIR-G1 - Mathématiques", date: "2024-03-13", status: "ready" },
  { id: 4, type: "Rapport Risque", details: "Tous les groupes", date: "2024-03-12", status: "ready" },
]

export default function RapportsPage() {
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [formData, setFormData] = useState({
    etudiant: "",
    groupe: "",
    module: "",
    semestre: "",
    periode: "",
    mois: "",
    seuil_risque: "50",
    includeCharts: true,
    includeComments: true,
  })

  const handleGenerate = async () => {
    if (!selectedType) return
    
    setIsGenerating(true)
    // Simulate PDF generation
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsGenerating(false)
    
    toast.success("Rapport généré avec succès", {
      description: "Le téléchargement va démarrer automatiquement",
      action: {
        label: "Télécharger",
        onClick: () => {
          // Simulate download
          const link = document.createElement("a")
          link.href = "#"
          link.download = `rapport_${selectedType}_${new Date().toISOString().split("T")[0]}.pdf`
          toast.info("Téléchargement simulé - En production, le PDF serait téléchargé")
        }
      }
    })
  }

  const selectedReport = reportTypes.find(r => r.id === selectedType)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Génération de Rapports</h1>
          <p className="text-muted-foreground">
            Générez des rapports PDF personnalisés
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Report Types */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Types de Rapports</CardTitle>
                <CardDescription>
                  Sélectionnez le type de rapport à générer
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  {reportTypes.map((report) => {
                    const Icon = report.icon
                    const isSelected = selectedType === report.id
                    
                    return (
                      <Card 
                        key={report.id}
                        className={`cursor-pointer transition-all hover:border-primary ${
                          isSelected ? "border-primary bg-primary/5" : ""
                        }`}
                        onClick={() => setSelectedType(report.id)}
                      >
                        <CardHeader className="pb-2">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${
                              isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
                            }`}>
                              <Icon className="h-5 w-5" />
                            </div>
                            <CardTitle className="text-base">{report.title}</CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">
                            {report.description}
                          </p>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Configuration */}
            {selectedReport && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Configuration du Rapport</CardTitle>
                  <CardDescription>
                    Personnalisez les paramètres de votre rapport
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    {selectedReport.fields.includes("etudiant") && (
                      <div className="space-y-2">
                        <Label>Étudiant</Label>
                        <Select
                          value={formData.etudiant}
                          onValueChange={(v) => setFormData({ ...formData, etudiant: v })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un étudiant" />
                          </SelectTrigger>
                          <SelectContent>
                            {mockEtudiants.map((e) => (
                              <SelectItem key={e.id} value={e.id}>{e.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {selectedReport.fields.includes("groupe") && (
                      <div className="space-y-2">
                        <Label>Groupe</Label>
                        <Select
                          value={formData.groupe}
                          onValueChange={(v) => setFormData({ ...formData, groupe: v })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un groupe" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Tous les groupes</SelectItem>
                            {mockGroupes.map((g) => (
                              <SelectItem key={g.id} value={g.id}>{g.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {selectedReport.fields.includes("module") && (
                      <div className="space-y-2">
                        <Label>Module</Label>
                        <Select
                          value={formData.module}
                          onValueChange={(v) => setFormData({ ...formData, module: v })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un module" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Tous les modules</SelectItem>
                            {mockModules.map((m) => (
                              <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {selectedReport.fields.includes("semestre") && (
                      <div className="space-y-2">
                        <Label>Semestre</Label>
                        <Select
                          value={formData.semestre}
                          onValueChange={(v) => setFormData({ ...formData, semestre: v })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un semestre" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="S1">Semestre 1</SelectItem>
                            <SelectItem value="S2">Semestre 2</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {selectedReport.fields.includes("periode") && (
                      <div className="space-y-2">
                        <Label>Période</Label>
                        <Select
                          value={formData.periode}
                          onValueChange={(v) => setFormData({ ...formData, periode: v })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner une période" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="semaine">Cette semaine</SelectItem>
                            <SelectItem value="mois">Ce mois</SelectItem>
                            <SelectItem value="trimestre">Ce trimestre</SelectItem>
                            <SelectItem value="semestre">Ce semestre</SelectItem>
                            <SelectItem value="annee">Cette année</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {selectedReport.fields.includes("mois") && (
                      <div className="space-y-2">
                        <Label>Mois</Label>
                        <Select
                          value={formData.mois}
                          onValueChange={(v) => setFormData({ ...formData, mois: v })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un mois" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="01">Janvier</SelectItem>
                            <SelectItem value="02">Février</SelectItem>
                            <SelectItem value="03">Mars</SelectItem>
                            <SelectItem value="04">Avril</SelectItem>
                            <SelectItem value="05">Mai</SelectItem>
                            <SelectItem value="06">Juin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {selectedReport.fields.includes("seuil_risque") && (
                      <div className="space-y-2">
                        <Label>Seuil de Risque Minimum</Label>
                        <Select
                          value={formData.seuil_risque}
                          onValueChange={(v) => setFormData({ ...formData, seuil_risque: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="30">30% et plus</SelectItem>
                            <SelectItem value="50">50% et plus</SelectItem>
                            <SelectItem value="70">70% et plus (critique)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-3 pt-4 border-t">
                    <Label>Options supplémentaires</Label>
                    <div className="flex items-center gap-2">
                      <Checkbox 
                        id="charts"
                        checked={formData.includeCharts}
                        onCheckedChange={(checked) => 
                          setFormData({ ...formData, includeCharts: checked as boolean })
                        }
                      />
                      <Label htmlFor="charts" className="font-normal">
                        Inclure les graphiques
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox 
                        id="comments"
                        checked={formData.includeComments}
                        onCheckedChange={(checked) => 
                          setFormData({ ...formData, includeComments: checked as boolean })
                        }
                      />
                      <Label htmlFor="comments" className="font-normal">
                        Inclure les commentaires et recommandations
                      </Label>
                    </div>
                  </div>

                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={handleGenerate}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <>
                        <Clock className="mr-2 h-4 w-4 animate-spin" />
                        Génération en cours...
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 h-4 w-4" />
                        Générer le PDF
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Recent Reports */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Rapports Récents
                </CardTitle>
                <CardDescription>
                  Derniers rapports générés
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentReports.map((report) => (
                    <div 
                      key={report.id}
                      className="flex items-start justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div className="space-y-1">
                        <p className="font-medium text-sm">{report.type}</p>
                        <p className="text-xs text-muted-foreground">{report.details}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(report.date).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                      <Button size="sm" variant="ghost">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileBarChart className="h-5 w-5" />
                  Statistiques
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Ce mois</span>
                    <span className="font-medium">24 rapports</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total année</span>
                    <span className="font-medium">156 rapports</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Plus fréquent</span>
                    <span className="font-medium">Bulletins</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
