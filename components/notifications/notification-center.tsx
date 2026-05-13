"use client"

import { useState, useEffect } from "react"
import { Bell, CheckCheck, AlertTriangle, Info, X, ChevronDown, User, BookOpen, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

export interface Notification {
  id: string
  type: "alert" | "info" | "success" | "warning"
  title: string
  message: string
  timestamp: Date
  read: boolean
  category: "notes" | "absences" | "risque" | "system"
  link?: string
}

interface NotificationCenterProps {
  notifications?: Notification[]
  onMarkAsRead?: (id: string) => void
  onMarkAllAsRead?: () => void
  onDismiss?: (id: string) => void
}

const defaultNotifications: Notification[] = [
  {
    id: "1",
    type: "alert",
    title: "Étudiant à risque élevé",
    message: "Ahmed Benali a atteint un score de risque de 78/100",
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
    read: false,
    category: "risque",
    link: "/chef/etudiants/1"
  },
  {
    id: "2", 
    type: "warning",
    title: "Seuil d'absence atteint",
    message: "Sara Idrissi a dépassé 30% d'absences en Analyse Numérique",
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    read: false,
    category: "absences"
  },
  {
    id: "3",
    type: "info",
    title: "Nouvelles notes saisies",
    message: "15 notes ont été ajoutées pour le module BDA-S2",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    read: true,
    category: "notes"
  },
  {
    id: "4",
    type: "success",
    title: "PV généré avec succès",
    message: "Le procès-verbal de délibération 3IIR-G2 est prêt",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5),
    read: true,
    category: "system"
  }
]

export function NotificationCenter({ 
  notifications = defaultNotifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDismiss 
}: NotificationCenterProps) {
  const [items, setItems] = useState<Notification[]>(notifications)
  const [open, setOpen] = useState(false)

  const unreadCount = items.filter(n => !n.read).length

  const handleMarkAsRead = (id: string) => {
    setItems(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    onMarkAsRead?.(id)
  }

  const handleMarkAllAsRead = () => {
    setItems(prev => prev.map(n => ({ ...n, read: true })))
    onMarkAllAsRead?.()
  }

  const handleDismiss = (id: string) => {
    setItems(prev => prev.filter(n => n.id !== id))
    onDismiss?.(id)
  }

  const getIcon = (type: Notification["type"]) => {
    switch (type) {
      case "alert": return <AlertTriangle className="h-4 w-4 text-red-500" />
      case "warning": return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case "success": return <CheckCheck className="h-4 w-4 text-green-500" />
      default: return <Info className="h-4 w-4 text-blue-500" />
    }
  }

  const getCategoryIcon = (category: Notification["category"]) => {
    switch (category) {
      case "risque": return <User className="h-3 w-3" />
      case "notes": return <BookOpen className="h-3 w-3" />
      case "absences": return <Calendar className="h-3 w-3" />
      default: return <Info className="h-3 w-3" />
    }
  }

  const formatTime = (date: Date) => {
    const diff = Date.now() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return "À l'instant"
    if (minutes < 60) return `Il y a ${minutes} min`
    if (hours < 24) return `Il y a ${hours}h`
    return `Il y a ${days}j`
  }

  // Simulate real-time notifications
  useEffect(() => {
    const interval = setInterval(() => {
      // In production, this would be WebSocket connection
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-medium">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96">
        <div className="flex items-center justify-between p-3 border-b">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead}>
              <CheckCheck className="h-4 w-4 mr-1" />
              Tout marquer lu
            </Button>
          )}
        </div>
        
        <ScrollArea className="h-[400px]">
          {items.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Aucune notification</p>
            </div>
          ) : (
            <div className="divide-y">
              {items.map(notification => (
                <div
                  key={notification.id}
                  className={cn(
                    "p-3 hover:bg-muted/50 transition-colors cursor-pointer relative group",
                    !notification.read && "bg-primary/5"
                  )}
                  onClick={() => handleMarkAsRead(notification.id)}
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn(
                          "text-sm",
                          !notification.read && "font-semibold"
                        )}>
                          {notification.title}
                        </p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDismiss(notification.id)
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary" className="text-xs px-1.5 py-0">
                          {getCategoryIcon(notification.category)}
                          <span className="ml-1 capitalize">{notification.category}</span>
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatTime(notification.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>
                  {!notification.read && (
                    <div className="absolute left-1 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary" />
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="p-2 border-t">
          <Button variant="ghost" className="w-full justify-center text-sm">
            Voir toutes les notifications
            <ChevronDown className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
