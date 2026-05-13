"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search, Download, Filter, Eye, Edit, Trash2, Plus, LogIn, LogOut } from "lucide-react"

interface AuditLog {
  id: number
  utilisateur: string
  action: string
  entite: string
  details: string
  ip_address: string
  date_action: string
}

const actionIcons: Record<string, React.ReactNode> = {
  CREATE: <Plus className="h-4 w-4" />,
  UPDATE: <Edit className="h-4 w-4" />,
  DELETE: <Trash2 className="h-4 w-4" />,
  READ: <Eye className="h-4 w-4" />,
  LOGIN: <LogIn className="h-4 w-4" />,
  LOGOUT: <LogOut className="h-4 w-4" />,
}

const actionColors: Record<string, string> = {
  CREATE: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  UPDATE: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  DELETE: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  READ: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  LOGIN: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  LOGOUT: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
}

// Mock audit data
const mockAuditLogs: AuditLog[] = [
  { id: 1, utilisateur: "admin@emsi.ma", action: "LOGIN", entite: "Session", details: "Connexion réussie", ip_address: "192.168.1.100", date_action: "2024-03-15T10:30:00" },
  { id: 2, utilisateur: "chef.info@emsi.ma", action: "READ", entite: "Dashboard", details: "Consultation du tableau de bord", ip_address: "192.168.1.101", date_action: "2024-03-15T10:25:00" },
  { id: 3, utilisateur: "prof.math@emsi.ma", action: "CREATE", entite: "Note", details: "Ajout note: Mathématiques - El Amrani Youssef: 15/20", ip_address: "192.168.1.102", date_action: "2024-03-15T10:20:00" },
  { id: 4, utilisateur: "prof.math@emsi.ma", action: "UPDATE", entite: "Note", details: "Modification note: Mathématiques - Bennani Sara: 12/20 → 14/20", ip_address: "192.168.1.102", date_action: "2024-03-15T10:15:00" },
  { id: 5, utilisateur: "chef.info@emsi.ma", action: "CREATE", entite: "Absence", details: "Enregistrement absence: El Amrani Youssef - 15/03/2024", ip_address: "192.168.1.101", date_action: "2024-03-15T10:10:00" },
  { id: 6, utilisateur: "admin@emsi.ma", action: "DELETE", entite: "Utilisateur", details: "Suppression compte: ancien.prof@emsi.ma", ip_address: "192.168.1.100", date_action: "2024-03-15T10:05:00" },
  { id: 7, utilisateur: "etudiant1@emsi.ma", action: "READ", entite: "Notes", details: "Consultation des notes personnelles", ip_address: "192.168.1.150", date_action: "2024-03-15T10:00:00" },
  { id: 8, utilisateur: "admin@emsi.ma", action: "UPDATE", entite: "Configuration", details: "Modification seuils alerte: absences 3→5", ip_address: "192.168.1.100", date_action: "2024-03-14T16:30:00" },
  { id: 9, utilisateur: "chef.info@emsi.ma", action: "READ", entite: "Rapport", details: "Génération PDF: Rapport mensuel Mars 2024", ip_address: "192.168.1.101", date_action: "2024-03-14T16:00:00" },
  { id: 10, utilisateur: "prof.info@emsi.ma", action: "LOGOUT", entite: "Session", details: "Déconnexion", ip_address: "192.168.1.103", date_action: "2024-03-14T15:30:00" },
]

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>(mockAuditLogs)
  const [searchQuery, setSearchQuery] = useState("")
  const [actionFilter, setActionFilter] = useState<string>("all")
  const [entityFilter, setEntityFilter] = useState<string>("all")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.utilisateur.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesAction = actionFilter === "all" || log.action === actionFilter
    const matchesEntity = entityFilter === "all" || log.entite === entityFilter
    
    let matchesDate = true
    if (dateFrom) {
      matchesDate = matchesDate && new Date(log.date_action) >= new Date(dateFrom)
    }
    if (dateTo) {
      matchesDate = matchesDate && new Date(log.date_action) <= new Date(dateTo + "T23:59:59")
    }
    
    return matchesSearch && matchesAction && matchesEntity && matchesDate
  })

  const uniqueEntities = [...new Set(logs.map(log => log.entite))]

  const exportLogs = () => {
    const csv = [
      ["Date", "Utilisateur", "Action", "Entité", "Détails", "Adresse IP"].join(","),
      ...filteredLogs.map(log => [
        new Date(log.date_action).toLocaleString("fr-FR"),
        log.utilisateur,
        log.action,
        log.entite,
        `"${log.details}"`,
        log.ip_address
      ].join(","))
    ].join("\n")

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `audit_logs_${new Date().toISOString().split("T")[0]}.csv`
    link.click()
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Journal d&apos;Audit</h1>
            <p className="text-muted-foreground">
              Traçabilité complète des actions sur le portail
            </p>
          </div>
          <Button onClick={exportLogs} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exporter CSV
          </Button>
        </div>

        {/* Statistics */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total actions</CardDescription>
              <CardTitle className="text-2xl">{logs.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Créations</CardDescription>
              <CardTitle className="text-2xl text-green-600">
                {logs.filter(l => l.action === "CREATE").length}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Modifications</CardDescription>
              <CardTitle className="text-2xl text-blue-600">
                {logs.filter(l => l.action === "UPDATE").length}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Suppressions</CardDescription>
              <CardTitle className="text-2xl text-red-600">
                {logs.filter(l => l.action === "DELETE").length}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Historique des actions</CardTitle>
                  <CardDescription>{filteredLogs.length} entrée(s) trouvée(s)</CardDescription>
                </div>
              </div>
              
              {/* Filters */}
              <div className="flex flex-wrap gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher..."
                    className="pl-8 w-[200px]"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select value={actionFilter} onValueChange={setActionFilter}>
                  <SelectTrigger className="w-[140px]">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes</SelectItem>
                    <SelectItem value="CREATE">Création</SelectItem>
                    <SelectItem value="UPDATE">Modification</SelectItem>
                    <SelectItem value="DELETE">Suppression</SelectItem>
                    <SelectItem value="READ">Consultation</SelectItem>
                    <SelectItem value="LOGIN">Connexion</SelectItem>
                    <SelectItem value="LOGOUT">Déconnexion</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={entityFilter} onValueChange={setEntityFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Entité" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes</SelectItem>
                    {uniqueEntities.map(entity => (
                      <SelectItem key={entity} value={entity}>{entity}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="date"
                  className="w-[150px]"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  placeholder="Du"
                />
                <Input
                  type="date"
                  className="w-[150px]"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  placeholder="Au"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date/Heure</TableHead>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entité</TableHead>
                  <TableHead>Détails</TableHead>
                  <TableHead>Adresse IP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-muted-foreground whitespace-nowrap">
                      {new Date(log.date_action).toLocaleDateString("fr-FR")}
                      <br />
                      <span className="text-xs">
                        {new Date(log.date_action).toLocaleTimeString("fr-FR")}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium">{log.utilisateur}</TableCell>
                    <TableCell>
                      <Badge className={actionColors[log.action]} variant="secondary">
                        <span className="mr-1">{actionIcons[log.action]}</span>
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell>{log.entite}</TableCell>
                    <TableCell className="max-w-[300px] truncate" title={log.details}>
                      {log.details}
                    </TableCell>
                    <TableCell className="text-muted-foreground font-mono text-sm">
                      {log.ip_address}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
