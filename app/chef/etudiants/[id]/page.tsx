"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  BookOpen,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Clock,
  FileText,
  Send,
  Brain,
  Target,
  Activity
} from "lucide-react"
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from "recharts"
import { toast } from "sonner"

// Mock data for student detail
const mockStudent = {
  id: "1",
  nom: "Alaoui",
  prenom: "Youssef",
  email: "youssef.alaoui@emsi-edu.ma",
  telephone: "+212 6 12 34 56 78",
  dateNaissance: "2002-05-15",
  filiere: "Génie Informatique",
  niveau: "4ème année",
  groupe: "GI4-A",
  moyenneGenerale: 13.5,
  tauxAbsence: 18,
  scoreRisque: 65,
  niveauRisque: "moyen" as const,
  dateInscription: "2022-09-01",
  photo: null,
}

const mockNotes = [
  { module: "Développement Web", note: 15.5, coefficient: 3, semestre: "S1" },
  { module: "Base de Données", note: 12.0, coefficient: 3, semestre: "S1" },
  { module: "Algorithmes Avancés", note: 14.0, coefficient: 2, semestre: "S1" },
  { module: "Réseaux", note: 11.5, coefficient: 2, semestre: "S1" },
  { module: "Gestion de Projet", note: 16.0, coefficient: 1, semestre: "S1" },
  { module: "Intelligence Artificielle", note: 13.0, coefficient: 3, semestre: "S2" },
  { module: "Sécurité Informatique", note: 14.5, coefficient: 2, semestre: "S2" },
]

const mockAbsences = [
  { date: "2024-01-15", module: "Base de Données", heures: 2, justifiee: false },
  { date: "2024-01-22", module: "Réseaux", heures: 2, justifiee: true, motif: "Rendez-vous médical" },
  { date: "2024-02-05", module: "Algorithmes Avancés", heures: 2, justifiee: false },
  { date: "2024-02-12", module: "Développement Web", heures: 2, justifiee: false },
  { date: "2024-02-19", module: "Base de Données", heures: 2, justifiee: true, motif: "Maladie" },
  { date: "2024-03-04", module: "Réseaux", heures: 4, justifiee: false },
]

const evolutionNotes = [
  { mois: "Sep", moyenne: 14.2 },
  { mois: "Oct", moyenne: 13.8 },
  { mois: "Nov", moyenne: 13.5 },
  { mois: "Dec", moyenne: 12.9 },
  { mois: "Jan", moyenne: 13.2 },
  { mois: "Fev", moyenne: 13.5 },
]

const evolutionAbsences = [
  { mois: "Sep", heures: 2 },
  { mois: "Oct", heures: 4 },
  { mois: "Nov", heures: 6 },
  { mois: "Dec", heures: 8 },
  { mois: "Jan", heures: 6 },
  { mois: "Fev", heures: 4 },
]

const competencesData = [
  { competence: "Développement", valeur: 85 },
  { competence: "Base de Données", valeur: 65 },
  { competence: "Réseaux", valeur: 60 },
  { competence: "Algorithmique", valeur: 75 },
  { competence: "Gestion Projet", valeur: 90 },
  { competence: "IA/ML", valeur: 70 },
]

const iaAnalysis = {
  scoreRisque: 65,
  niveauRisque: "moyen",
  facteurs: [
    { facteur: "Taux d'absence élevé", impact: "fort", description: "18% d'absences, seuil critique à 20%" },
    { facteur: "Baisse de moyenne", impact: "moyen", description: "Diminution de 1.3 points sur 6 mois" },
    { facteur: "Absences non justifiées", impact: "moyen", description: "4 absences non justifiées ce semestre" },
  ],
  recommandations: [
    "Planifier un entretien individuel pour comprendre les difficultés",
    "Proposer un accompagnement en Base de Données (module le plus faible)",
    "Suivre l'assiduité de manière hebdomadaire",
    "Envoyer une alerte aux parents si le taux d'absence dépasse 20%",
  ],
  prediction: "Sans intervention, risque d'échec estimé à 45% pour le semestre en cours",
}

export default function StudentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [student] = useState(mockStudent)
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  const getRiskColor = (niveau: string) => {
    switch (niveau) {
      case "faible": return "bg-green-500"
      case "moyen": return "bg-yellow-500"
      case "eleve": return "bg-red-500"
      default: return "bg-gray-500"
    }
  }

  const getRiskBadge = (niveau: string) => {
    switch (niveau) {
      case "faible": return <Badge className="bg-green-100 text-green-800">Risque Faible</Badge>
      case "moyen": return <Badge className="bg-yellow-100 text-yellow-800">Risque Moyen</Badge>
      case "eleve": return <Badge className="bg-red-100 text-red-800">Risque Élevé</Badge>
      default: return <Badge>Inconnu</Badge>
    }
  }

  const handleSendAlert = async () => {
    if (!message.trim()) {
      toast.error("Veuillez saisir un message")
      return
    }
    setLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    toast.success("Alerte envoyée avec succès")
    setMessage("")
    setLoading(false)
  }

  const handleGenerateReport = async () => {
    setLoading(true)
    // Simulate PDF generation
    await new Promise(resolve => setTimeout(resolve, 1500))
    toast.success("Rapport PDF généré avec succès")
    setLoading(false)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {student.prenom} {student.nom}
              </h1>
              <p className="text-muted-foreground">{student.filiere} - {student.niveau}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {getRiskBadge(student.niveauRisque)}
            <Button variant="outline" onClick={handleGenerateReport} disabled={loading}>
              <FileText className="mr-2 h-4 w-4" />
              Générer Rapport
            </Button>
          </div>
        </div>

        {/* Student Info Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Groupe</p>
                  <p className="font-semibold">{student.groupe}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Moyenne Générale</p>
                  <p className="font-semibold text-lg">{student.moyenneGenerale}/20</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-orange-500/10 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-orange-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Taux d&apos;Absence</p>
                  <p className="font-semibold text-lg">{student.tauxAbsence}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className={`h-12 w-12 rounded-full ${getRiskColor(student.niveauRisque)}/10 flex items-center justify-center`}>
                  <Brain className={`h-6 w-6 ${getRiskColor(student.niveauRisque).replace('bg-', 'text-')}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Score IA</p>
                  <p className="font-semibold text-lg">{student.scoreRisque}/100</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Vue d&apos;ensemble</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
            <TabsTrigger value="absences">Absences</TabsTrigger>
            <TabsTrigger value="ia">Analyse IA</TabsTrigger>
            <TabsTrigger value="contact">Contact</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Evolution des notes */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingDown className="h-5 w-5 text-red-500" />
                    Évolution de la Moyenne
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={evolutionNotes}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="mois" />
                      <YAxis domain={[10, 16]} />
                      <Tooltip />
                      <Line type="monotone" dataKey="moyenne" stroke="hsl(var(--primary))" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Evolution des absences */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-orange-500" />
                    Évolution des Absences
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={evolutionAbsences}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="mois" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="heures" fill="hsl(var(--chart-5))" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Radar des compétences */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Profil de Compétences
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={competencesData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="competence" />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} />
                    <Radar name="Niveau" dataKey="valeur" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.5} />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Relevé de Notes</CardTitle>
                <CardDescription>Notes par module pour l&apos;année en cours</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockNotes.map((note, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{note.module}</p>
                        <p className="text-sm text-muted-foreground">Coefficient: {note.coefficient} | {note.semestre}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-xl font-bold ${note.note >= 12 ? 'text-green-600' : note.note >= 10 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {note.note}/20
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="absences" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Historique des Absences</CardTitle>
                <CardDescription>Total: {mockAbsences.reduce((sum, a) => sum + a.heures, 0)} heures d&apos;absence</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockAbsences.map((absence, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className={`w-3 h-3 rounded-full ${absence.justifiee ? 'bg-green-500' : 'bg-red-500'}`} />
                        <div>
                          <p className="font-medium">{absence.module}</p>
                          <p className="text-sm text-muted-foreground">{absence.date} - {absence.heures}h</p>
                          {absence.motif && (
                            <p className="text-sm text-green-600">Motif: {absence.motif}</p>
                          )}
                        </div>
                      </div>
                      <Badge variant={absence.justifiee ? "default" : "destructive"}>
                        {absence.justifiee ? "Justifiée" : "Non justifiée"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ia" className="space-y-4">
            {/* Score de risque */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary" />
                  Analyse IA - Score de Risque
                </CardTitle>
                <CardDescription>Évaluation automatique basée sur les performances et l&apos;assiduité</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">Score de risque</span>
                    <span className="font-bold">{iaAnalysis.scoreRisque}/100</span>
                  </div>
                  <Progress value={iaAnalysis.scoreRisque} className="h-3" />
                  <p className="text-sm text-muted-foreground">
                    Plus le score est élevé, plus le risque d&apos;échec est important
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Facteurs de risque */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  Facteurs de Risque Identifiés
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {iaAnalysis.facteurs.map((facteur, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{facteur.facteur}</span>
                        <Badge variant={facteur.impact === 'fort' ? 'destructive' : 'secondary'}>
                          Impact {facteur.impact}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{facteur.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recommandations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-green-500" />
                  Recommandations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {iaAnalysis.recommandations.map((rec, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-medium text-primary">{index + 1}</span>
                      </div>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Prédiction:</strong> {iaAnalysis.prediction}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contact" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Informations de contact */}
              <Card>
                <CardHeader>
                  <CardTitle>Informations de Contact</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{student.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Téléphone</p>
                      <p className="font-medium">{student.telephone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Date de naissance</p>
                      <p className="font-medium">{student.dateNaissance}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Envoyer une alerte */}
              <Card>
                <CardHeader>
                  <CardTitle>Envoyer une Alerte</CardTitle>
                  <CardDescription>Contacter l&apos;étudiant ou ses parents</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder="Rédigez votre message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={5}
                  />
                  <div className="flex gap-2">
                    <Button onClick={handleSendAlert} disabled={loading} className="flex-1">
                      <Send className="mr-2 h-4 w-4" />
                      Envoyer à l&apos;étudiant
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
