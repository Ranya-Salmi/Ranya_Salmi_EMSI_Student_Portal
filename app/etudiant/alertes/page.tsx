"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Bell, 
  AlertTriangle, 
  Calendar, 
  TrendingDown,
  CheckCircle,
  Info,
  X
} from "lucide-react"

interface Notification {
  id: number
  type: "warning" | "info" | "danger"
  title: string
  message: string
  date: string
  read: boolean
}

const mockNotifications: Notification[] = [
  {
    id: 1,
    type: "danger",
    title: "Seuil d'absences atteint",
    message: "Vous avez atteint 8 heures d'absences non justifiées ce mois. Veuillez contacter votre chef de filière.",
    date: "2024-03-15T10:30:00",
    read: false
  },
  {
    id: 2,
    type: "warning",
    title: "Note en dessous de la moyenne",
    message: "Votre note en Bases de Données (9/20) est en dessous de la moyenne de la classe (12.5/20).",
    date: "2024-03-14T14:00:00",
    read: false
  },
  {
    id: 3,
    type: "info",
    title: "Nouvelle note disponible",
    message: "La note du contrôle de Programmation Web a été publiée.",
    date: "2024-03-13T09:00:00",
    read: true
  },
  {
    id: 4,
    type: "warning",
    title: "Absence enregistrée",
    message: "Une absence a été enregistrée pour le cours de Mathématiques du 12/03/2024.",
    date: "2024-03-12T16:00:00",
    read: true
  },
  {
    id: 5,
    type: "info",
    title: "Convocation chef de filière",
    message: "Vous êtes convoqué pour un entretien le 18/03/2024 à 10h00 au bureau du chef de filière.",
    date: "2024-03-11T11:00:00",
    read: true
  },
]

const typeConfig = {
  warning: { 
    icon: AlertTriangle, 
    color: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-200 dark:border-yellow-800",
    badge: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
  },
  danger: { 
    icon: AlertTriangle, 
    color: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-200 dark:border-red-800",
    badge: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
  },
  info: { 
    icon: Info, 
    color: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-800",
    badge: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
  },
}

export default function AlertesEtudiantPage() {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications)

  const unreadCount = notifications.filter(n => !n.read).length

  const markAsRead = (id: number) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ))
  }

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })))
  }

  const dismiss = (id: number) => {
    setNotifications(notifications.filter(n => n.id !== id))
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Mes Alertes</h1>
            <p className="text-muted-foreground">
              Notifications et alertes concernant votre parcours
            </p>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" onClick={markAllRead}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Tout marquer comme lu
            </Button>
          )}
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Non lues</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{unreadCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Alertes Critiques</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">
                {notifications.filter(n => n.type === "danger").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <Info className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{notifications.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Notifications List */}
        <Card>
          <CardHeader>
            <CardTitle>Toutes les notifications</CardTitle>
            <CardDescription>
              Cliquez sur une notification pour la marquer comme lue
            </CardDescription>
          </CardHeader>
          <CardContent>
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>Aucune notification</p>
              </div>
            ) : (
              <div className="space-y-4">
                {notifications.map((notification) => {
                  const config = typeConfig[notification.type]
                  const Icon = config.icon
                  
                  return (
                    <div
                      key={notification.id}
                      className={`relative p-4 rounded-lg border transition-all cursor-pointer ${config.color} ${
                        !notification.read ? "ring-2 ring-primary/20" : "opacity-75"
                      }`}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className="flex items-start gap-4">
                        <div className="p-2 rounded-full bg-background/50">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">{notification.title}</h4>
                            {!notification.read && (
                              <Badge variant="secondary" className="text-xs">
                                Nouveau
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm opacity-90">{notification.message}</p>
                          <p className="text-xs mt-2 opacity-70">
                            {new Date(notification.date).toLocaleDateString("fr-FR", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-50 hover:opacity-100"
                          onClick={(e) => {
                            e.stopPropagation()
                            dismiss(notification.id)
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tips Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" />
              Conseils
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-primary" />
                Consultez régulièrement vos alertes pour rester informé
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-primary" />
                En cas d&apos;alerte critique, contactez rapidement votre chef de filière
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-primary" />
                Justifiez vos absences dans les plus brefs délais
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-primary" />
                N&apos;hésitez pas à demander de l&apos;aide en cas de difficultés
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
