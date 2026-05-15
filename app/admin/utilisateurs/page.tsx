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
import { Label } from "@/components/ui/label";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  UserX,
  RefreshCw,
  ArrowDownUp,
} from "lucide-react";
import { toast } from "sonner";
import { api, type Role, type User } from "@/lib/api";

type FormData = {
  email: string;
  nom: string;
  prenom: string;
  role: Role;
  password: string;
};

const emptyForm: FormData = {
  email: "",
  nom: "",
  prenom: "",
  role: "etudiant",
  password: "",
};

const roleLabels: Record<Role, string> = {
  admin: "Administrateur",
  chef_filiere: "Chef de Filiere",
  enseignant: "Enseignant",
  etudiant: "Etudiant",
};

const roleColors: Record<Role, string> = {
  admin: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  chef_filiere: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  enseignant: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  etudiant: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
};

function getUserDate(user: User) {
  const extra = user as unknown as {
    date_creation?: string;
    created_at?: string;
  };

  return extra.date_creation || extra.created_at || "";
}

function getUserTimestamp(user: User) {
  const dateValue = getUserDate(user);
  const time = new Date(dateValue).getTime();

  return Number.isNaN(time) ? 0 : time;
}

function formatDate(value: string) {
  if (!value) return "-";

  try {
    return new Date(value).toLocaleDateString("fr-FR");
  } catch {
    return value;
  }
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const [formData, setFormData] = useState<FormData>(emptyForm);

  async function fetchUsers() {
    try {
      setLoading(true);
      setError("");

      const data = await api.getUsers();
      setUsers(data);
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
    fetchUsers();
  }, []);

  const filteredUsers = users
    .filter((user) => {
      const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
      const query = searchQuery.toLowerCase();

      const matchesSearch =
        fullName.includes(query) || user.email.toLowerCase().includes(query);

      const matchesRole = roleFilter === "all" || user.role === roleFilter;

      return matchesSearch && matchesRole;
    })
    .sort((a, b) => {
      const aTime = getUserTimestamp(a);
      const bTime = getUserTimestamp(b);

      if (sortOrder === "asc") {
        return aTime - bTime;
      }

      return bTime - aTime;
    });

  const resetForm = () => {
    setFormData(emptyForm);
    setSelectedUser(null);
  };

  const handleAddUser = async () => {
    if (
      !formData.email.trim() ||
      !formData.nom.trim() ||
      !formData.prenom.trim() ||
      !formData.password.trim()
    ) {
      toast.error("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    try {
      setSaving(true);

      const created = await api.createUser({
        email: formData.email.trim(),
        password: formData.password,
        first_name: formData.prenom.trim(),
        last_name: formData.nom.trim(),
        role: formData.role,
      });

      setUsers((current) => [created, ...current]);
      setIsAddDialogOpen(false);
      resetForm();
      toast.success("Utilisateur cree avec succes");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erreur lors de la creation";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleEditUser = async () => {
    if (!selectedUser) return;

    if (!formData.email.trim() || !formData.nom.trim() || !formData.prenom.trim()) {
      toast.error("Veuillez remplir les champs obligatoires.");
      return;
    }

    try {
      setSaving(true);

      const updated = await api.updateUser(selectedUser.id, {
        email: formData.email.trim(),
        first_name: formData.prenom.trim(),
        last_name: formData.nom.trim(),
        role: formData.role,
      });

      setUsers((current) =>
        current.map((user) => (user.id === selectedUser.id ? updated : user))
      );

      setIsEditDialogOpen(false);
      resetForm();
      toast.success("Utilisateur modifie avec succes");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erreur lors de la modification";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivateUser = async (user: User) => {
    try {
      setSaving(true);

      const result = await api.deactivateUser(user.id);

      setUsers((current) =>
        current.map((item) =>
          item.id === user.id
            ? { ...item, is_active: result.is_active ?? false }
            : item
        )
      );

      toast.success("Utilisateur desactive avec succes");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erreur lors de la desactivation";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const openEditDialog = (user: User) => {
    setSelectedUser(user);
    setFormData({
      email: user.email,
      nom: user.last_name,
      prenom: user.first_name,
      role: user.role,
      password: "",
    });
    setIsEditDialogOpen(true);
  };

  return (
    <DashboardLayout requiredRoles={["admin"]}>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Gestion des Utilisateurs
            </h1>
            <p className="text-muted-foreground">
              Gerez les comptes utilisateurs du portail
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchUsers} disabled={loading}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Actualiser
            </Button>

            <Dialog
              open={isAddDialogOpen}
              onOpenChange={(open) => {
                setIsAddDialogOpen(open);
                if (!open) resetForm();
              }}
            >
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Nouvel utilisateur
                </Button>
              </DialogTrigger>

              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Creer un utilisateur</DialogTitle>
                  <DialogDescription>
                    Ajoutez un nouvel utilisateur au portail
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nom">Nom</Label>
                      <Input
                        id="nom"
                        value={formData.nom}
                        onChange={(e) =>
                          setFormData({ ...formData, nom: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="prenom">Prenom</Label>
                      <Input
                        id="prenom"
                        value={formData.prenom}
                        onChange={(e) =>
                          setFormData({ ...formData, prenom: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select
                      value={formData.role}
                      onValueChange={(value) =>
                        setFormData({ ...formData, role: value as Role })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Administrateur</SelectItem>
                        <SelectItem value="chef_filiere">
                          Chef de Filiere
                        </SelectItem>
                        <SelectItem value="enseignant">Enseignant</SelectItem>
                        <SelectItem value="etudiant">Etudiant</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Mot de passe</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsAddDialogOpen(false)}
                    disabled={saving}
                  >
                    Annuler
                  </Button>
                  <Button onClick={handleAddUser} disabled={saving}>
                    Creer
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {error && (
          <Card className="border-destructive/40 bg-destructive/5">
            <CardContent className="p-4">
              <p className="text-sm text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Liste des utilisateurs</CardTitle>
                <CardDescription>
                  {filteredUsers.length} utilisateur(s)
                </CardDescription>
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

                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-[170px]">
                    <SelectValue placeholder="Filtrer par role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les roles</SelectItem>
                    <SelectItem value="admin">Administrateur</SelectItem>
                    <SelectItem value="chef_filiere">
                      Chef de Filiere
                    </SelectItem>
                    <SelectItem value="enseignant">Enseignant</SelectItem>
                    <SelectItem value="etudiant">Etudiant</SelectItem>
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
                    <SelectItem value="desc">Plus recent d&apos;abord</SelectItem>
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
                  <TableHead>Nom</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Date creation</TableHead>
                  <TableHead className="w-[50px]" />
                </TableRow>
              </TableHeader>

              <TableBody>
                {loading ? (
                  Array.from({ length: 6 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Skeleton className="h-5 w-36" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-48" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-6 w-28" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-6 w-16" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-8 w-8" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-10 text-center text-muted-foreground"
                    >
                      Aucun utilisateur trouve
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.first_name} {user.last_name}
                      </TableCell>

                      <TableCell>{user.email}</TableCell>

                      <TableCell>
                        <Badge
                          className={roleColors[user.role]}
                          variant="secondary"
                        >
                          {roleLabels[user.role]}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <Badge variant={user.is_active ? "default" : "secondary"}>
                          {user.is_active ? "Actif" : "Inactif"}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-muted-foreground">
                        {formatDate(getUserDate(user))}
                      </TableCell>

                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>

                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => openEditDialog(user)}
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Modifier
                            </DropdownMenuItem>

                            {user.is_active && (
                              <DropdownMenuItem
                                onClick={() => handleDeactivateUser(user)}
                                disabled={saving}
                              >
                                <UserX className="mr-2 h-4 w-4" />
                                Desactiver
                              </DropdownMenuItem>
                            )}

                            <DropdownMenuItem
                              onClick={() => handleDeactivateUser(user)}
                              className="text-destructive"
                              disabled={saving || !user.is_active}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog
          open={isEditDialogOpen}
          onOpenChange={(open) => {
            setIsEditDialogOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Modifier l&apos;utilisateur</DialogTitle>
              <DialogDescription>
                Modifiez les informations de l&apos;utilisateur
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-nom">Nom</Label>
                  <Input
                    id="edit-nom"
                    value={formData.nom}
                    onChange={(e) =>
                      setFormData({ ...formData, nom: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-prenom">Prenom</Label>
                  <Input
                    id="edit-prenom"
                    value={formData.prenom}
                    onChange={(e) =>
                      setFormData({ ...formData, prenom: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-role">Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) =>
                    setFormData({ ...formData, role: value as Role })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrateur</SelectItem>
                    <SelectItem value="chef_filiere">Chef de Filiere</SelectItem>
                    <SelectItem value="enseignant">Enseignant</SelectItem>
                    <SelectItem value="etudiant">Etudiant</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <p className="text-xs text-muted-foreground">
                Le changement de mot de passe n&apos;est pas modifie depuis ce
                formulaire pour l&apos;instant.
              </p>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                disabled={saving}
              >
                Annuler
              </Button>
              <Button onClick={handleEditUser} disabled={saving}>
                Enregistrer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}