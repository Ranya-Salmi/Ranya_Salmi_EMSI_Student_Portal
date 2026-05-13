"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { 
  AlertTriangle, 
  Bell, 
  TrendingDown, 
  Calendar,
  Mail,
  MessageSquare,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Brain
} from "lucide-react"
import { toast } from "sonner"

interface Alert {
  id: number
  etudiant: string
  email: string
  type: "absences" | "notes" | "risque_ia"
  niveau: "warning" | "danger" | "critical"
  message: string
  details: string
  date_detection: string
  statut: "pending" | "contacted" | "resolved"
  score_risque?: number
}

const mockAlerts: Alert[] = [
  {
    id: 1,
    etudiant: "El Amrani Youssef",
    email: "y.elamrani@emsi-edu.ma",
    type: "risque_ia",
    niveau: "critical",
    message: "Profil à haut risque détecté par IA",
    details: "Combinaison de facteurs: 8 absences, moyenne 9.5/20, tendance décroissante sur 3 mois",
    date_detection: "2024-03-15",
    statut: "pending",
    score_risque: 85
  },
  {
    id: 2,
    etudiant: "Bennani Sara",
    email: "s.bennani@emsi-edu.ma",
    type: "absences",
    niveau: "danger",
    message: "Seuil d'absences dépassé",
    details: "12 heures d'absences non justifiées ce mois (seuil: 8h)",
    date_detection: "2024-03-14",
    statut: "contacted",
    score_risque: 65
  },
  {
    id: 3,
    etudiant: "Chaoui Ahmed",
    email: "a.chaoui@emsi-edu.ma",
    type: "notes",
    niveau: "warning",
    message: "Baisse significative des résultats",
    details: "Moyenne passée de 14/20 à 10/20 en 2 mois",
    date_detection: "2024-03-13",
    statut: "pending",
    score_risque: 45
  },
  {
    id: 4,
    etudiant: "Idrissi Leila",
    email: "l.idrissi@emsi-edu.ma",
    type: "absences",
    niveau: "warning",
    message: "Absences répétées le lundi",
    details: "3 absences consécutives les lundis matins",
    date_detection: "2024-03-12",
    statut: "resolved",
    score_risque: 30
  },
  {
    id: 5,
    etudiant: "Tazi Mehdi",
    email: "m.tazi@emsi-edu.ma",
    type: "risque_ia",
    niveau: "danger",
    message: "Risque d'abandon détecté",
    details: "Pattern similaire aux cas d'abandon précédents: absences croissantes + désengagement",
    date_detection: "2024-03-11",
    statut: "contacted",
    score_risque: 72
  },
]

const niveauConfig = {
  warning: { label: "Attention", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200", icon: AlertTriangle },
  danger: { label: "Danger", color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200", icon: AlertTriangle },
  critical: { label: "Critique", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200", icon: XCircle },
}

const typeConfig = {
  absences: { label: "Absences", icon: Calendar },
  notes: { label: "Notes", icon: TrendingDown },
  risque_ia: { label: "Risque IA", icon: Brain },
}

const statutConfig = {
  pending: { label: "En attente", color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200", icon: Clock },
  contacted: { label: "Contacté", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200", icon: Mail },
  resolved: { label: "Résolu", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200", icon: CheckCircle },
}

export default function AlertesPage() {
  const [alerts, setAlerts] = useState<Alert[]>(mockAlerts)
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null)
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false)
  const [contactMessage, setContactMessage] = useState("")
  const [filter, setFilter] = useState<string>("all")

  const filteredAlerts = alerts.filter(alert => {
    if (filter === "all") return true
    if (filter === "pending") return alert.statut === "pending"
    if (filter === "critical") return alert.niveau === "critical" || alert.niveau === "danger"
    return alert.type === filter
  })

  const pendingCount = alerts.filter(a => a.statut === "pending").length
  const criticalCount = alerts.filter(a => a.niveau === "critical" || a.niveau === "danger").length

  const handleContact = (alert: Alert) => {
    setSelectedAlert(alert)
    setContactMessage(`Bonjour ${alert.etudiant.split(" ")[1]},\n\nNous avons constaté ${alert.type === "absences" ? "un nombre important d'absences" : alert.type === "notes" ? "une baisse de vos résultats" : "des indicateurs préoccupants"} dans votre parcours.\n\nNous souhaitons vous rencontrer pour discuter de votre situation et vous accompagner.\n\nCordialement,\nLe Chef de Filière`)
    setIsContactDialogOpen(true)
  }

  const sendContact = () => {
    if (!selectedAlert) return
    setAlerts(alerts.map(a => 
      a.id === selectedAlert.id ? { ...a, statut: "contacted" } : a
    ))
    setIsContactDialogOpen(false)
    setSelectedAlert(null)
    toast.success("Message envoyé à l'étudiant")
  }

  const markResolved = (alert: Alert) => {
    setAlerts(alerts.map(a => 
      a.id === alert.id ? { ...a, statut: "resolved" } : a
    ))
    toast.success("Alerte marquée comme résolue")
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Système d&apos;Alertes</h1>
          <p className="text-muted-foreground">
            Détection automatique des étudiants à risque avec analyse IA
          </p>
        </div>

        {/* Statistics */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Alertes</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{alerts.length}</div>
            </CardContent>
          </Card>
          <Card className="border-yellow-200 dark:border-yellow-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">En Attente</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
            </CardContent>
          </Card>
          <Card className="border-red-200 dark:border-red-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Critiques</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{criticalCount}</div>
            </CardContent>
          </Card>
          <Card className="border-green-200 dark:border-green-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Résolues</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {alerts.filter(a => a.statut === "resolved").length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alerts Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Liste des Alertes</CardTitle>
                <CardDescription>
                  Alertes détectées automatiquement par le système
                </CardDescription>
              </div>
              <Tabs value={filter} onValueChange={setFilter}>
                <TabsList>
                  <TabsTrigger value="all">Toutes</TabsTrigger>
                  <TabsTrigger value="pending">En attente</TabsTrigger>
                  <TabsTrigger value="critical">Critiques</TabsTrigger>
                  <TabsTrigger value="risque_ia">IA</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Étudiant</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Niveau</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Score Risque</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAlerts.map((alert) => {
                  const TypeIcon = typeConfig[alert.type].icon
                  const NiveauIcon = niveauConfig[alert.niveau].icon
                  const StatutIcon = statutConfig[alert.statut].icon
                  
                  return (
                    <TableRow key={alert.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{alert.etudiant}</div>
                            <div className="text-xs text-muted-foreground">{alert.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <TypeIcon className="h-4 w-4" />
                          <span>{typeConfig[alert.type].label}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={niveauConfig[alert.niveau].color} variant="secondary">
                          <NiveauIcon className="mr-1 h-3 w-3" />
                          {niveauConfig[alert.niveau].label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[200px]">
                          <div className="font-medium truncate">{alert.message}</div>
                          <div className="text-xs text-muted-foreground truncate">{alert.details}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {alert.score_risque && (
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${
                                  alert.score_risque >= 70 ? "bg-red-500" :
                                  alert.score_risque >= 40 ? "bg-yellow-500" :
                                  "bg-green-500"
                                }`}
                                style={{ width: `${alert.score_risque}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium">{alert.score_risque}%</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={statutConfig[alert.statut].color} variant="secondary">
                          <StatutIcon className="mr-1 h-3 w-3" />
                          {statutConfig[alert.statut].label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(alert.date_detection).toLocaleDateString("fr-FR")}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {alert.statut !== "resolved" && (
                            <>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleContact(alert)}
                              >
                                <Mail className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => markResolved(alert)}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Contact Dialog */}
        <Dialog open={isContactDialogOpen} onOpenChange={setIsContactDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Contacter l&apos;étudiant</DialogTitle>
              <DialogDescription>
                Envoyer un message à {selectedAlert?.etudiant}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Destinataire</Label>
                <Input value={selectedAlert?.email || ""} disabled />
              </div>
              <div className="space-y-2">
                <Label>Message</Label>
                <Textarea 
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  rows={8}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsContactDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={sendContact}>
                <Mail className="mr-2 h-4 w-4" />
                Envoyer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
