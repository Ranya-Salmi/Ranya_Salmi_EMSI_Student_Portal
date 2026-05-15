"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Download,
  Filter,
  Eye,
  Edit,
  Trash2,
  Plus,
  LogIn,
  LogOut,
  RefreshCw,
  History,
  CalendarDays,
  ArrowDownUp,
} from "lucide-react";
import { toast } from "sonner";
import { api, type AuditLog } from "@/lib/api";

const actionIcons: Record<string, React.ReactNode> = {
  create: <Plus className="h-4 w-4" />,
  update: <Edit className="h-4 w-4" />,
  delete: <Trash2 className="h-4 w-4" />,
  read: <Eye className="h-4 w-4" />,
  login: <LogIn className="h-4 w-4" />,
  logout: <LogOut className="h-4 w-4" />,
};

const actionColors: Record<string, string> = {
  create: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  update: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  delete: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  read: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  login: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  logout:
    "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
};

const actionLabels: Record<string, string> = {
  create: "CREATE",
  update: "UPDATE",
  delete: "DELETE",
  read: "READ",
  login: "LOGIN",
  logout: "LOGOUT",
};

function normalizeAction(action: string) {
  return action.toLowerCase();
}

function getActionIcon(action: string) {
  const normalized = normalizeAction(action);
  return actionIcons[normalized] || <History className="h-4 w-4" />;
}

function getActionColor(action: string) {
  const normalized = normalizeAction(action);

  return (
    actionColors[normalized] ||
    "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
  );
}

function getActionLabel(action: string) {
  const normalized = normalizeAction(action);
  return actionLabels[normalized] || action.toUpperCase();
}

function formatDate(value: string) {
  if (!value) return "-";

  try {
    return new Date(value).toLocaleDateString("fr-FR");
  } catch {
    return value;
  }
}

function formatTime(value: string) {
  if (!value) return "";

  try {
    return new Date(value).toLocaleTimeString("fr-FR");
  } catch {
    return "";
  }
}

function formatDetails(log: AuditLog) {
  const action = normalizeAction(log.action);

  if (log.raison_modification) {
    return log.raison_modification;
  }

  if (action === "create") {
    return `Création dans ${log.table_name}`;
  }

  if (action === "update") {
    return `Modification dans ${log.table_name}`;
  }

  if (action === "delete") {
    return `Suppression dans ${log.table_name}`;
  }

  return `Action ${log.action} sur ${log.table_name}`;
}

function matchesPeriod(timestamp: string, periodFilter: string) {
  if (periodFilter === "all") return true;

  const logTime = new Date(timestamp).getTime();

  if (Number.isNaN(logTime)) return false;

  const now = new Date();
  const nowTime = now.getTime();

  const todayStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  ).getTime();

  if (periodFilter === "today") {
    return logTime >= todayStart;
  }

  if (periodFilter === "7days") {
    return logTime >= nowTime - 7 * 24 * 60 * 60 * 1000;
  }

  if (periodFilter === "30days") {
    return logTime >= nowTime - 30 * 24 * 60 * 60 * 1000;
  }

  return true;
}

function getTimestamp(value: string) {
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
}

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [entityFilter, setEntityFilter] = useState<string>("all");
  const [periodFilter, setPeriodFilter] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  async function fetchLogs() {
    try {
      setLoading(true);
      setError("");

      const data = await api.getAuditLogs({ limit: 200 });
      setLogs(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erreur de chargement";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs
    .filter((log) => {
      const query = searchQuery.toLowerCase();
      const details = formatDetails(log).toLowerCase();

      const matchesSearch =
        log.user_email.toLowerCase().includes(query) ||
        log.table_name.toLowerCase().includes(query) ||
        details.includes(query) ||
        String(log.record_id).includes(query);

      const matchesAction =
        actionFilter === "all" || normalizeAction(log.action) === actionFilter;

      const matchesEntity =
        entityFilter === "all" || log.table_name === entityFilter;

      const matchesDate = matchesPeriod(log.timestamp, periodFilter);

      return matchesSearch && matchesAction && matchesEntity && matchesDate;
    })
    .sort((a, b) => {
      const aTime = getTimestamp(a.timestamp);
      const bTime = getTimestamp(b.timestamp);

      if (sortOrder === "asc") {
        return aTime - bTime;
      }

      return bTime - aTime;
    });

  const uniqueEntities = [...new Set(logs.map((log) => log.table_name))];

  const createCount = logs.filter(
    (log) => normalizeAction(log.action) === "create"
  ).length;

  const updateCount = logs.filter(
    (log) => normalizeAction(log.action) === "update"
  ).length;

  const deleteCount = logs.filter(
    (log) => normalizeAction(log.action) === "delete"
  ).length;

  const exportLogs = () => {
    const csv = [
      [
        "Date",
        "Utilisateur",
        "Action",
        "Entité",
        "Record ID",
        "Détails",
        "Adresse IP",
      ].join(","),
      ...filteredLogs.map((log) =>
        [
          new Date(log.timestamp).toLocaleString("fr-FR"),
          log.user_email,
          getActionLabel(log.action),
          log.table_name,
          log.record_id,
          `"${formatDetails(log).replaceAll('"', '""')}"`,
          log.ip_adresse || "",
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");

    link.href = URL.createObjectURL(blob);
    link.download = `audit_logs_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();

    URL.revokeObjectURL(link.href);
  };

  return (
    <DashboardLayout requiredRoles={["admin"]}>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Journal d&apos;Audit
            </h1>
            <p className="text-muted-foreground">
              Traçabilité complète des actions sur le portail
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchLogs} disabled={loading}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Actualiser
            </Button>

            <Button onClick={exportLogs} variant="outline" disabled={loading}>
              <Download className="mr-2 h-4 w-4" />
              Exporter CSV
            </Button>
          </div>
        </div>

        {error && (
          <Card className="border-destructive/40 bg-destructive/5">
            <CardContent className="p-4">
              <p className="text-sm text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total actions</CardDescription>
              <CardTitle className="text-2xl">
                {loading ? <Skeleton className="h-8 w-16" /> : logs.length}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Créations</CardDescription>
              <CardTitle className="text-2xl text-green-600">
                {loading ? <Skeleton className="h-8 w-16" /> : createCount}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Modifications</CardDescription>
              <CardTitle className="text-2xl text-blue-600">
                {loading ? <Skeleton className="h-8 w-16" /> : updateCount}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Suppressions</CardDescription>
              <CardTitle className="text-2xl text-red-600">
                {loading ? <Skeleton className="h-8 w-16" /> : deleteCount}
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
                  <CardDescription>
                    {filteredLogs.length} entrée(s) trouvée(s)
                  </CardDescription>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher..."
                    className="pl-8 w-[220px]"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <Select value={actionFilter} onValueChange={setActionFilter}>
                  <SelectTrigger className="w-[150px]">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes</SelectItem>
                    <SelectItem value="create">Création</SelectItem>
                    <SelectItem value="update">Modification</SelectItem>
                    <SelectItem value="delete">Suppression</SelectItem>
                    <SelectItem value="read">Consultation</SelectItem>
                    <SelectItem value="login">Connexion</SelectItem>
                    <SelectItem value="logout">Déconnexion</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={entityFilter} onValueChange={setEntityFilter}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Entité" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes</SelectItem>
                    {uniqueEntities.map((entity) => (
                      <SelectItem key={entity} value={entity}>
                        {entity}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={periodFilter} onValueChange={setPeriodFilter}>
                  <SelectTrigger className="w-[190px]">
                    <CalendarDays className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Période" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les dates</SelectItem>
                    <SelectItem value="today">Aujourd&apos;hui</SelectItem>
                    <SelectItem value="7days">7 derniers jours</SelectItem>
                    <SelectItem value="30days">30 derniers jours</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={sortOrder}
                  onValueChange={(value) =>
                    setSortOrder(value as "desc" | "asc")
                  }
                >
                  <SelectTrigger className="w-[190px]">
                    <ArrowDownUp className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Tri" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">Plus récent d&apos;abord</SelectItem>
                    <SelectItem value="asc">Plus ancien d&apos;abord</SelectItem>
                  </SelectContent>
                </Select>
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
                {loading ? (
                  Array.from({ length: 6 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Skeleton className="h-5 w-28" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-44" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-6 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-72" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-28" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-10 text-center text-muted-foreground"
                    >
                      Aucune entrée trouvée
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-muted-foreground whitespace-nowrap">
                        {formatDate(log.timestamp)}
                        <br />
                        <span className="text-xs">
                          {formatTime(log.timestamp)}
                        </span>
                      </TableCell>

                      <TableCell className="font-medium">
                        {log.user_email}
                      </TableCell>

                      <TableCell>
                        <Badge
                          className={getActionColor(log.action)}
                          variant="secondary"
                        >
                          <span className="mr-1">
                            {getActionIcon(log.action)}
                          </span>
                          {getActionLabel(log.action)}
                        </Badge>
                      </TableCell>

                      <TableCell>{log.table_name}</TableCell>

                      <TableCell
                        className="max-w-[320px] truncate"
                        title={formatDetails(log)}
                      >
                        {formatDetails(log)}
                      </TableCell>

                      <TableCell className="text-muted-foreground font-mono text-sm">
                        {log.ip_adresse || "-"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}