"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  BookOpen,
  Calendar,
  Clock,
  FileText,
  Search,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";

type ModuleItem = {
  id: number;
  nom: string;
  code?: string;
  coefficient?: number;
  semestre?: string;
  promotion_id?: number;
  promotion_nom?: string;
  filiere_nom?: string;
  groupes?: string[];
  heures_total?: number;
  heuresTotal?: number;
};

type ModuleStats = {
  module_id?: number;
  nombre_etudiants?: number;
  nombreEtudiants?: number;
  nb_etudiants?: number;
  moyenne_classe?: number | null;
  moyenneClasse?: number | null;
  moyenne?: number | null;
  taux_absence?: number | null;
  tauxAbsence?: number | null;
  heures_effectuees?: number;
  heuresEffectuees?: number;
  heures_total?: number;
  heuresTotal?: number;
  prochain_cours?: string | null;
  prochainCours?: string | null;
};

type ModuleView = {
  id: number;
  nom: string;
  code: string;
  groupes: string[];
  nombreEtudiants: number;
  heuresEffectuees: number;
  heuresTotal: number;
  prochainCours: string | null;
  moyenneClasse: number | null;
  tauxAbsence: number | null;
  semestre?: string;
  promotionNom?: string;
  filiereNom?: string;
};

function formatDateTime(value?: string | null) {
  if (!value) return "Aucun cours programmé";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Aucun cours programmé";
  }

  return date.toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeModule(module: ModuleItem, stats?: ModuleStats): ModuleView {
  const groupes =
    Array.isArray(module.groupes) && module.groupes.length > 0
      ? module.groupes
      : [
          module.promotion_nom ||
            module.filiere_nom ||
            module.semestre ||
            "Groupe principal",
        ].filter(Boolean);

  return {
    id: Number(module.id),
    nom: module.nom || "Module sans nom",
    code: module.code || `MOD-${module.id}`,
    groupes,
    nombreEtudiants: getNumber(
      stats?.nombre_etudiants ??
        stats?.nombreEtudiants ??
        stats?.nb_etudiants,
      0
    ),
    heuresEffectuees: getNumber(
      stats?.heures_effectuees ?? stats?.heuresEffectuees,
      0
    ),
    heuresTotal: getNumber(
      stats?.heures_total ??
        stats?.heuresTotal ??
        module.heures_total ??
        module.heuresTotal,
      48
    ),
    prochainCours: stats?.prochain_cours ?? stats?.prochainCours ?? null,
    moyenneClasse:
      stats?.moyenne_classe ??
      stats?.moyenneClasse ??
      stats?.moyenne ??
      null,
    tauxAbsence: stats?.taux_absence ?? stats?.tauxAbsence ?? null,
    semestre: module.semestre,
    promotionNom: module.promotion_nom,
    filiereNom: module.filiere_nom,
  };
}

export default function ModulesPage() {
  const [search, setSearch] = useState("");
  const [modules, setModules] = useState<ModuleView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchModules() {
      try {
        setError("");

        const maybeApi = api as any;

        let modulesData: ModuleItem[] = [];

        if (typeof maybeApi.getMesModules === "function") {
          modulesData = await maybeApi.getMesModules();
        } else if (typeof maybeApi.getTeacherModules === "function") {
          modulesData = await maybeApi.getTeacherModules();
        } else if (typeof maybeApi.getModules === "function") {
          modulesData = await maybeApi.getModules();
        } else {
          throw new Error("Endpoint des modules indisponible dans lib/api.ts");
        }

        const moduleViews = await Promise.all(
          modulesData.map(async (module) => {
            let stats: ModuleStats | undefined;

            try {
              if (typeof maybeApi.getModuleStats === "function") {
                stats = await maybeApi.getModuleStats(Number(module.id));
              } else if (typeof maybeApi.getEnseignantModuleStats === "function") {
                stats = await maybeApi.getEnseignantModuleStats(Number(module.id));
              } else if (typeof maybeApi.getModuleStudents === "function") {
                const students = await maybeApi.getModuleStudents(Number(module.id));

                stats = {
                  nombre_etudiants: Array.isArray(students) ? students.length : 0,
                  moyenne_classe:
                    Array.isArray(students) && students.length > 0
                      ? students.reduce(
                          (sum: number, student: any) =>
                            sum + getNumber(student.moyenne_generale, 0),
                          0
                        ) / students.length
                      : null,
                  taux_absence:
                    Array.isArray(students) && students.length > 0
                      ? students.reduce(
                          (sum: number, student: any) =>
                            sum + getNumber(student.taux_absence, 0),
                          0
                        ) / students.length
                      : null,
                };
              }
            } catch {
              stats = undefined;
            }

            return normalizeModule(module, stats);
          })
        );

        setModules(moduleViews);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Erreur de chargement des modules";
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    }

    fetchModules();
  }, []);

  const filteredModules = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) return modules;

    return modules.filter((module) => {
      return (
        module.nom.toLowerCase().includes(normalizedSearch) ||
        module.code.toLowerCase().includes(normalizedSearch) ||
        module.groupes.some((groupe) =>
          groupe.toLowerCase().includes(normalizedSearch)
        )
      );
    });
  }, [modules, search]);

  const totals = useMemo(() => {
    const totalModules = modules.length;
    const totalStudents = modules.reduce(
      (sum, module) => sum + module.nombreEtudiants,
      0
    );
    const totalHours = modules.reduce(
      (sum, module) => sum + module.heuresEffectuees,
      0
    );

    const modulesWithAverage = modules.filter(
      (module) => typeof module.moyenneClasse === "number"
    );

    const average =
      modulesWithAverage.length > 0
        ? modulesWithAverage.reduce(
            (sum, module) => sum + Number(module.moyenneClasse),
            0
          ) / modulesWithAverage.length
        : null;

    return {
      totalModules,
      totalStudents,
      totalHours,
      average,
    };
  }, [modules]);

  return (
    <DashboardLayout requiredRoles={["enseignant"]}>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Mes modules</h1>
            <p className="text-muted-foreground">
              Consultez vos modules, vos groupes et les indicateurs pédagogiques.
            </p>
          </div>

          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher un module..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {error && (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="pt-6">
              <p className="text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <div>
                  {loading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <p className="text-2xl font-bold">{totals.totalModules}</p>
                  )}
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
                  {loading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <p className="text-2xl font-bold">{totals.totalStudents}</p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    Étudiants suivis
                  </p>
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
                  {loading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <p className="text-2xl font-bold">{totals.totalHours}h</p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    Heures effectuées
                  </p>
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
                  {loading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <p className="text-2xl font-bold">
                      {totals.average !== null
                        ? totals.average.toFixed(1)
                        : "—"}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    Moyenne générale
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-80 w-full" />
            <Skeleton className="h-80 w-full" />
            <Skeleton className="h-80 w-full" />
          </div>
        ) : filteredModules.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Aucun module trouvé.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredModules.map((module) => {
              const progression =
                module.heuresTotal > 0
                  ? Math.min(
                      (module.heuresEffectuees / module.heuresTotal) * 100,
                      100
                    )
                  : 0;

              return (
                <Card
                  key={module.id}
                  className="hover:shadow-lg transition-shadow"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <CardTitle className="text-lg">{module.nom}</CardTitle>
                        <CardDescription>{module.code}</CardDescription>
                      </div>
                      <Badge variant="outline">
                        {module.groupes.length} groupe(s)
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {module.groupes.map((groupe) => (
                        <Badge key={groupe} variant="secondary">
                          {groupe}
                        </Badge>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{module.nombreEtudiants} étudiants</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                        <span>
                          Moy :{" "}
                          {typeof module.moyenneClasse === "number"
                            ? `${module.moyenneClasse.toFixed(1)}/20`
                            : "—"}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>
                          Abs :{" "}
                          {typeof module.tauxAbsence === "number"
                            ? `${module.tauxAbsence.toFixed(1)}%`
                            : "—"}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{module.semestre || "Semestre"}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Progression du cours
                        </span>
                        <span className="font-medium">
                          {module.heuresEffectuees}/{module.heuresTotal}h
                        </span>
                      </div>
                      <Progress value={progression} />
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>
                        Prochain cours : {formatDateTime(module.prochainCours)}
                      </span>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        asChild
                      >
                        <Link href={`/enseignant/notes?module=${module.id}`}>
                          <FileText className="mr-2 h-4 w-4" />
                          Notes
                        </Link>
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        asChild
                      >
                        <Link href={`/enseignant/absences?module=${module.id}`}>
                          <Clock className="mr-2 h-4 w-4" />
                          Absences
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}