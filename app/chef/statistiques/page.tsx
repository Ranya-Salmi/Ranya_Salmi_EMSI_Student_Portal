"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  BookOpen,
  Clock,
  AlertTriangle,
  Award,
  Target
} from "lucide-react"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Legend
} from "recharts"

// Mock data
const notesDistribution = [
  { range: "0-5", count: 2 },
  { range: "5-8", count: 5 },
  { range: "8-10", count: 12 },
  { range: "10-12", count: 28 },
  { range: "12-14", count: 35 },
  { range: "14-16", count: 25 },
  { range: "16-18", count: 15 },
  { range: "18-20", count: 3 },
]

const moyenneParModule = [
  { module: "Dev Web", moyenne: 14.2 },
  { module: "BDD", moyenne: 12.8 },
  { module: "Reseaux", moyenne: 11.5 },
  { module: "Algo", moyenne: 13.5 },
  { module: "Gestion", moyenne: 15.2 },
  { module: "IA", moyenne: 12.9 },
  { module: "Securite", moyenne: 13.8 },
]

const evolutionMoyenne = [
  { mois: "Sep", GI4A: 13.5, GI4B: 12.8, GI3A: 14.2 },
  { mois: "Oct", GI4A: 13.2, GI4B: 12.5, GI3A: 13.8 },
  { mois: "Nov", GI4A: 12.8, GI4B: 12.9, GI3A: 13.5 },
  { mois: "Dec", GI4A: 13.1, GI4B: 13.2, GI3A: 14.0 },
  { mois: "Jan", GI4A: 13.5, GI4B: 13.5, GI3A: 14.2 },
  { mois: "Fev", GI4A: 13.8, GI4B: 13.8, GI3A: 14.5 },
]

const riskDistribution = [
  { name: "Faible", value: 85, color: "#22c55e" },
  { name: "Moyen", value: 28, color: "#eab308" },
  { name: "Eleve", value: 12, color: "#ef4444" },
]

const absencesParMois = [
  { mois: "Sep", justifiees: 25, nonJustifiees: 15 },
  { mois: "Oct", justifiees: 30, nonJustifiees: 22 },
  { mois: "Nov", justifiees: 28, nonJustifiees: 28 },
  { mois: "Dec", justifiees: 20, nonJustifiees: 18 },
  { mois: "Jan", justifiees: 32, nonJustifiees: 25 },
  { mois: "Fev", justifiees: 28, nonJustifiees: 20 },
]

const tauxReussiteParModule = [
  { module: "Dev Web", reussite: 92 },
  { module: "BDD", reussite: 78 },
  { module: "Reseaux", reussite: 72 },
  { module: "Algo", reussite: 85 },
  { module: "Gestion", reussite: 95 },
  { module: "IA", reussite: 80 },
  { module: "Securite", reussite: 88 },
]

const topStudents = [
  { nom: "Benali Sara", moyenne: 17.8, groupe: "GI4-A" },
  { nom: "Tazi Mohammed", moyenne: 17.2, groupe: "GI4-B" },
  { nom: "El Amrani Fatima", moyenne: 16.9, groupe: "GI3-A" },
  { nom: "Chakir Youssef", moyenne: 16.5, groupe: "GI4-A" },
  { nom: "Idrissi Kenza", moyenne: 16.3, groupe: "GI4-B" },
]

export default function StatistiquesPage() {
  const [selectedPeriod, setSelectedPeriod] = useState("semestre")
  const [selectedGroupe, setSelectedGroupe] = useState("all")

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Statistiques</h1>
            <p className="text-muted-foreground">Analyse detaillee des performances de la filiere</p>
          </div>
          <div className="flex gap-3">
            <Select value={selectedGroupe} onValueChange={setSelectedGroupe}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Groupe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les groupes</SelectItem>
                <SelectItem value="GI4-A">GI4-A</SelectItem>
                <SelectItem value="GI4-B">GI4-B</SelectItem>
                <SelectItem value="GI3-A">GI3-A</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Periode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mois">Ce mois</SelectItem>
                <SelectItem value="semestre">Ce semestre</SelectItem>
                <SelectItem value="annee">Cette annee</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">125</p>
                  <p className="text-sm text-muted-foreground">Etudiants</p>
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
                  <p className="text-2xl font-bold">13.4</p>
                  <p className="text-sm text-muted-foreground">Moyenne generale</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">84%</p>
                  <p className="text-sm text-muted-foreground">Taux de reussite</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-red-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">12</p>
                  <p className="text-sm text-muted-foreground">Etudiants a risque</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="notes" className="space-y-4">
          <TabsList>
            <TabsTrigger value="notes">Notes</TabsTrigger>
            <TabsTrigger value="absences">Absences</TabsTrigger>
            <TabsTrigger value="risques">Analyse des Risques</TabsTrigger>
            <TabsTrigger value="classement">Classement</TabsTrigger>
          </TabsList>

          <TabsContent value="notes" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Distribution des notes */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    Distribution des Notes
                  </CardTitle>
                  <CardDescription>Repartition des etudiants par tranche de notes</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={notesDistribution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="range" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#22c55e" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Moyenne par module */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-blue-500" />
                    Moyenne par Module
                  </CardTitle>
                  <CardDescription>Performance moyenne par matiere</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={moyenneParModule} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" domain={[0, 20]} />
                      <YAxis dataKey="module" type="category" width={80} />
                      <Tooltip />
                      <Bar dataKey="moyenne" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Evolution des moyennes par groupe */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  Evolution des Moyennes par Groupe
                </CardTitle>
                <CardDescription>Comparaison des performances sur les 6 derniers mois</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={evolutionMoyenne}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mois" />
                    <YAxis domain={[10, 16]} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="GI4A" stroke="#22c55e" strokeWidth={2} name="GI4-A" />
                    <Line type="monotone" dataKey="GI4B" stroke="#3b82f6" strokeWidth={2} name="GI4-B" />
                    <Line type="monotone" dataKey="GI3A" stroke="#a855f7" strokeWidth={2} name="GI3-A" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Taux de reussite par module */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Taux de reussite par Module
                </CardTitle>
                <CardDescription>Pourcentage d&apos;etudiants ayant valide chaque module</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={tauxReussiteParModule}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="module" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip formatter={(value) => `${value}%`} />
                    <Bar dataKey="reussite" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="absences" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Absences par mois */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-orange-500" />
                    Evolution des Absences
                  </CardTitle>
                  <CardDescription>Absences justifiees vs non justifiees par mois</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={absencesParMois}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="mois" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area type="monotone" dataKey="justifiees" stackId="1" stroke="#22c55e" fill="#22c55e" fillOpacity={0.6} name="Justifiees" />
                      <Area type="monotone" dataKey="nonJustifiees" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} name="Non justifiees" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Stats absences */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-4xl font-bold text-orange-500">12%</p>
                    <p className="text-sm text-muted-foreground mt-2">Taux d&apos;absence moyen</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-4xl font-bold text-green-500">58%</p>
                    <p className="text-sm text-muted-foreground mt-2">Absences justifiees</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-4xl font-bold text-red-500">18</p>
                    <p className="text-sm text-muted-foreground mt-2">Etudiants a risque exclusion</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="risques" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Distribution des risques */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    Repartition des Niveaux de Risque
                  </CardTitle>
                  <CardDescription>Classification IA des etudiants</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={riskDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {riskDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Details risques */}
              <Card>
                <CardHeader>
                  <CardTitle>Details par Niveau de Risque</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full bg-green-500" />
                        <span className="font-semibold text-green-950">Risque Faible</span>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-600">85</p>
                        <p className="text-sm font-medium text-slate-700">68% des etudiants</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full bg-yellow-500" />
                        <span className="font-semibold text-yellow-950">Risque Moyen</span>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-yellow-600">28</p>
                        <p className="text-sm font-medium text-slate-700">22% des etudiants</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full bg-red-500" />
                        <span className="font-semibold text-red-950">Risque Eleve</span>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-red-600">12</p>
                        <p className="text-sm font-medium text-slate-700">10% des etudiants</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="classement" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-yellow-500" />
                  Top 5 des Meilleurs Etudiants
                </CardTitle>
                <CardDescription>Classement base sur la moyenne generale</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topStudents.map((student, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                          index === 0 ? 'bg-yellow-500 text-white' :
                          index === 1 ? 'bg-gray-400 text-white' :
                          index === 2 ? 'bg-amber-700 text-white' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{student.nom}</p>
                          <p className="text-sm text-muted-foreground">{student.groupe}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">{student.moyenne}</p>
                        <p className="text-sm text-muted-foreground">/20</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}





