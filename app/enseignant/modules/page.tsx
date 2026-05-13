"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  BookOpen, 
  Users, 
  Calendar,
  Clock,
  Search,
  BarChart3,
  FileText
} from "lucide-react"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"

// Mock data
const mockModules = [
  {
    id: "1",
    nom: "Développement Web Avancé",
    code: "INF401",
    groupes: ["GI4-A", "GI4-B"],
    nombreEtudiants: 65,
    heuresEffectuees: 32,
    heuresTotal: 48,
    prochainCours: "2024-02-26 08:30",
    moyenneClasse: 14.2,
    tauxAbsence: 8,
  },
  {
    id: "2",
    nom: "Base de Données Avancées",
    code: "INF402",
    groupes: ["GI4-A"],
    nombreEtudiants: 32,
    heuresEffectuees: 28,
    heuresTotal: 42,
    prochainCours: "2024-02-27 10:00",
    moyenneClasse: 12.8,
    tauxAbsence: 12,
  },
  {
    id: "3",
    nom: "Intelligence Artificielle",
    code: "INF501",
    groupes: ["GI5-A", "GI5-B"],
    nombreEtudiants: 58,
    heuresEffectuees: 24,
    heuresTotal: 36,
    prochainCours: "2024-02-28 14:00",
    moyenneClasse: 13.5,
    tauxAbsence: 10,
  },
]

export default function ModulesPage() {
  const [search, setSearch] = useState("")
  const [modules] = useState(mockModules)

  const filteredModules = modules.filter(m => 
    m.nom.toLowerCase().includes(search.toLowerCase()) ||
    m.code.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Mes Modules</h1>
            <p className="text-muted-foreground">Gérez vos modules et consultez les statistiques</p>
          </div>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher un module..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{modules.length}</p>
                  <p className="text-sm text-muted-foreground">Modules</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{modules.reduce((sum, m) => sum + m.nombreEtudiants, 0)}</p>
                  <p className="text-sm text-muted-foreground">Étudiants total</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{modules.reduce((sum, m) => sum + m.heuresEffectuees, 0)}h</p>
                  <p className="text-sm text-muted-foreground">Heures effectuées</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-orange-500/10 flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-orange-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {(modules.reduce((sum, m) => sum + m.moyenneClasse, 0) / modules.length).toFixed(1)}
                  </p>
                  <p className="text-sm text-muted-foreground">Moyenne générale</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Modules Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredModules.map((module) => (
            <Card key={module.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{module.nom}</CardTitle>
                    <CardDescription>{module.code}</CardDescription>
                  </div>
                  <Badge variant="outline">{module.groupes.length} groupe(s)</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Groupes */}
                <div className="flex flex-wrap gap-2">
                  {module.groupes.map((groupe) => (
                    <Badge key={groupe} variant="secondary">{groupe}</Badge>
                  ))}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{module.nombreEtudiants} étudiants</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    <span>Moy: {module.moyenneClasse}/20</span>
                  </div>
                </div>

                {/* Progress */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progression du cours</span>
                    <span className="font-medium">{module.heuresEffectuees}/{module.heuresTotal}h</span>
                  </div>
                  <Progress value={(module.heuresEffectuees / module.heuresTotal) * 100} />
                </div>

                {/* Prochain cours */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Prochain cours: {new Date(module.prochainCours).toLocaleDateString('fr-FR', { 
                    weekday: 'short', 
                    day: 'numeric', 
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</span>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1" asChild>
                    <Link href={`/enseignant/notes?module=${module.id}`}>
                      <FileText className="mr-2 h-4 w-4" />
                      Notes
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1" asChild>
                    <Link href={`/enseignant/absences?module=${module.id}`}>
                      <Clock className="mr-2 h-4 w-4" />
                      Absences
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}
