"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuthStore, getRoleLabel, getRoleColor } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  ClipboardList,
  BarChart3,
  FileText,
  Settings,
  LogOut,
  Bell,
  Menu,
  ChevronRight,
  History,
  AlertTriangle,
  CheckCircle2,
  Info,
  Loader2,
  Sparkles,
  User,
  ChevronDown,
} from "lucide-react";
import type { Role } from "@/lib/api";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: Role[];
  badge?: string;
}

const navItems: NavItem[] = [
  { href: "/admin", label: "Tableau de bord", icon: LayoutDashboard, roles: ["admin"] },
  { href: "/admin/utilisateurs", label: "Utilisateurs", icon: Users, roles: ["admin"] },
  { href: "/admin/audit", label: "Journal d'audit", icon: History, roles: ["admin"] },
  { href: "/admin/configuration", label: "Configuration", icon: Settings, roles: ["admin"] },

  { href: "/chef", label: "Tableau de bord", icon: LayoutDashboard, roles: ["chef_filiere"] },
  { href: "/chef/etudiants", label: "Etudiants", icon: Users, roles: ["chef_filiere"] },
  { href: "/chef/alertes", label: "Alertes IA", icon: Sparkles, roles: ["chef_filiere"], badge: "IA" },
  { href: "/chef/statistiques", label: "Statistiques", icon: BarChart3, roles: ["chef_filiere"] },
  { href: "/chef/pv", label: "PV & Bulletins", icon: FileText, roles: ["chef_filiere"] },
  { href: "/chef/rapports", label: "Rapports", icon: FileText, roles: ["chef_filiere"] },

  { href: "/enseignant", label: "Mes modules", icon: BookOpen, roles: ["enseignant"] },
  { href: "/enseignant/notes", label: "Saisie notes", icon: ClipboardList, roles: ["enseignant"] },
  { href: "/enseignant/absences", label: "Saisie absences", icon: Users, roles: ["enseignant"] },
  { href: "/enseignant/import", label: "Import / Export", icon: FileText, roles: ["enseignant"] },

  { href: "/etudiant", label: "Mon espace", icon: LayoutDashboard, roles: ["etudiant"] },
  { href: "/etudiant/notes", label: "Mes notes", icon: ClipboardList, roles: ["etudiant"] },
  { href: "/etudiant/absences", label: "Mes absences", icon: Users, roles: ["etudiant"] },
  { href: "/etudiant/alertes", label: "Mes alertes", icon: Bell, roles: ["etudiant"] },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
  requiredRoles?: Role[];
}

export function DashboardLayout({ children, requiredRoles }: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();

  const {
    user,
    isAuthenticated,
    isLoading,
    checkAuth,
    logout,
    alertes,
    alertesNonLues,
    marquerAlerteLue,
  } = useAuthStore();

  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isLoading && isAuthenticated && user && requiredRoles) {
      if (!requiredRoles.includes(user.role)) {
        const routes: Record<string, string> = {
          admin: "/admin",
          chef_filiere: "/chef",
          enseignant: "/enseignant",
          etudiant: "/etudiant",
        };

        router.push(routes[user.role] || "/");
      }
    }
  }, [isLoading, isAuthenticated, user, requiredRoles, router]);

  if (isLoading || !isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (requiredRoles && !requiredRoles.includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Redirection...</p>
        </div>
      </div>
    );
  }

  const filteredNavItems = navItems.filter((item) => item.roles.includes(user.role));

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-sidebar">
      <div className="flex items-center gap-3 px-5 h-16 border-b border-sidebar-border">
        <img
          src="/emsi-icon.png"
          alt="Logo EMSI"
          className="h-11 w-11 rounded-xl object-cover shadow-md"
        />

        <div className="flex flex-col">
          <span className="font-bold text-sidebar-foreground text-sm tracking-tight">
            EMSI Centre
          </span>
          <span className="text-[10px] text-sidebar-foreground/50 uppercase tracking-wider">
            Portail Suivi
          </span>
        </div>
      </div>

      <ScrollArea className="flex-1 py-4">
        <div className="px-3 space-y-1">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary/15 text-primary"
                    : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 transition-colors",
                    isActive
                      ? "text-primary"
                      : "text-sidebar-foreground/40 group-hover:text-sidebar-foreground/70"
                  )}
                />

                <span className="flex-1">{item.label}</span>

                {item.badge && (
                  <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-primary/20 text-primary">
                    {item.badge}
                  </span>
                )}

                {isActive && <div className="w-1 h-4 rounded-full bg-primary" />}
              </Link>
            );
          })}
        </div>
      </ScrollArea>

      <div className="p-3 border-t border-sidebar-border">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-sidebar-accent/50">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-linear-to-br from-primary/30 to-primary/10 border border-primary/20">
            <User className="h-5 w-5 text-primary" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">
              {user.full_name}
            </p>
            <p className="text-xs text-sidebar-foreground/50 truncate">
              {getRoleLabel(user.role)}
            </p>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="h-8 w-8 text-sidebar-foreground/50 hover:text-destructive hover:bg-destructive/10"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:block lg:w-64 border-r border-sidebar-border">
        <SidebarContent />
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-64 p-0 border-sidebar-border">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-40 h-16 border-b border-border bg-background/80 backdrop-blur-xl">
          <div className="flex items-center justify-between h-full px-4 lg:px-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden h-9 w-9"
                onClick={() => setMobileOpen(true)}
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Menu</span>
              </Button>

              <div className="hidden sm:flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={cn("font-medium border-0", getRoleColor(user.role))}
                >
                  {getRoleLabel(user.role)}
                </Badge>

                <ChevronRight className="h-4 w-4 text-muted-foreground/50" />

                <span className="text-sm text-muted-foreground">
                  {filteredNavItems.find((item) => item.href === pathname)?.label ||
                    "Dashboard"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative h-9 w-9">
                    <Bell className="h-4.5 w-4.5" />

                    {alertesNonLues > 0 && (
                      <span className="absolute top-1 right-1 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-primary-foreground bg-primary rounded-full ring-2 ring-background">
                        {alertesNonLues > 9 ? "9" : alertesNonLues}
                      </span>
                    )}

                    <span className="sr-only">Notifications</span>
                  </Button>
                </PopoverTrigger>

                <PopoverContent align="end" className="w-80 p-0">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <div>
                      <h3 className="font-semibold text-sm">Notifications</h3>
                      <p className="text-xs text-muted-foreground">
                        {alertesNonLues > 0
                          ? `${alertesNonLues} non lue(s)`
                          : "Tout est à jour"}
                      </p>
                    </div>

                    {alertesNonLues > 0 && (
                      <span className="flex items-center justify-center w-6 h-6 text-xs font-bold text-primary-foreground bg-primary rounded-full">
                        {alertesNonLues}
                      </span>
                    )}
                  </div>

                  <ScrollArea className="h-75">
                    {alertes.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                          <Bell className="h-6 w-6 opacity-50" />
                        </div>
                        <p className="text-sm font-medium">Aucune notification</p>
                        <p className="text-xs text-muted-foreground/70">
                          Vous êtes à jour
                        </p>
                      </div>
                    ) : (
                      <div className="divide-y divide-border">
                        {alertes.slice(0, 10).map((alerte) => (
                          <button
                            key={alerte.id}
                            onClick={() => marquerAlerteLue(alerte.id)}
                            className={cn(
                              "w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors",
                              !alerte.lue && "bg-primary/5"
                            )}
                          >
                            <div className="flex items-start gap-3">
                              <div
                                className={cn(
                                  "flex items-center justify-center w-8 h-8 rounded-full shrink-0 mt-0.5",
                                  alerte.urgence === "critical" &&
                                    "bg-destructive/15 text-destructive",
                                  alerte.urgence === "warning" &&
                                    "bg-warning/15 text-warning",
                                  alerte.urgence === "info" &&
                                    "bg-info/15 text-info"
                                )}
                              >
                                {alerte.urgence === "critical" ? (
                                  <AlertTriangle className="h-4 w-4" />
                                ) : alerte.urgence === "warning" ? (
                                  <Info className="h-4 w-4" />
                                ) : (
                                  <CheckCircle2 className="h-4 w-4" />
                                )}
                              </div>

                              <div className="flex-1 min-w-0">
                                <p
                                  className={cn(
                                    "text-sm leading-tight",
                                    !alerte.lue
                                      ? "font-medium text-foreground"
                                      : "text-muted-foreground"
                                  )}
                                >
                                  {alerte.titre}
                                </p>

                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                  {alerte.message}
                                </p>

                                <p className="text-[10px] text-muted-foreground/60 mt-1.5 uppercase tracking-wide">
                                  {new Date(alerte.created_at).toLocaleDateString(
                                    "fr-FR",
                                    {
                                      day: "numeric",
                                      month: "short",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    }
                                  )}
                                </p>
                              </div>

                              {!alerte.lue && (
                                <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </PopoverContent>
              </Popover>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-9 gap-2 px-2">
                    <div className="flex items-center justify-center w-7 h-7 rounded-full bg-linear-to-br from-primary/30 to-primary/10 border border-primary/20">
                      <User className="h-4 w-4 text-primary" />
                    </div>

                    <span className="hidden md:inline text-sm font-medium max-w-25 truncate">
                      {user.first_name}
                    </span>

                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{user.full_name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-destructive focus:text-destructive focus:bg-destructive/10"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Déconnexion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}