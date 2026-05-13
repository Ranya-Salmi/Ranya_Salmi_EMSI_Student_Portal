"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { useAuthStore, getRoleLabel } from "@/lib/store"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  User, 
  Mail, 
  Phone, 
  Building2, 
  Shield, 
  Bell, 
  Lock, 
  Save,
  Eye,
  EyeOff,
  CheckCircle2
} from "lucide-react"
import { toast } from "sonner"

export default function ProfilPage() {
  const { user } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  const [saving, setSaving] = useState(false)
  
  // Form states
  const [formData, setFormData] = useState({
    full_name: user?.full_name || "",
    email: user?.email || "",
    phone: "+212 6XX XX XX XX",
    department: "3IIR - Groupe 2"
  })

  const [notificationSettings, setNotificationSettings] = useState({
    email_alerts: true,
    browser_notifications: true,
    risk_alerts: true,
    absence_alerts: true,
    note_alerts: false,
    weekly_summary: true
  })

  const handleSaveProfile = async () => {
    setSaving(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    setSaving(false)
    toast.success("Profil mis à jour avec succès")
  }

  const handleSaveNotifications = async () => {
    setSaving(true)
    await new Promise(resolve => setTimeout(resolve, 500))
    setSaving(false)
    toast.success("Préférences de notification enregistrées")
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    setSaving(false)
    toast.success("Mot de passe modifié avec succès")
  }

  if (!user) return null

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mon Profil</h1>
          <p className="text-muted-foreground">Gérez vos informations personnelles et préférences</p>
        </div>

        {/* Profile Header */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-12 w-12 text-primary" />
              </div>
              <div className="text-center sm:text-left flex-1">
                <h2 className="text-xl font-semibold">{user.full_name}</h2>
                <p className="text-muted-foreground">{user.email}</p>
                <div className="flex flex-wrap gap-2 mt-2 justify-center sm:justify-start">
                  <Badge variant="secondary">
                    <Shield className="h-3 w-3 mr-1" />
                    {getRoleLabel(user.role)}
                  </Badge>
                  <Badge variant="outline" className="text-green-600 border-green-200">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Compte actif
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="informations" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="informations">Informations</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="securite">Sécurité</TabsTrigger>
          </TabsList>

          {/* Informations Tab */}
          <TabsContent value="informations">
            <Card>
              <CardHeader>
                <CardTitle>Informations personnelles</CardTitle>
                <CardDescription>
                  Mettez à jour vos informations de contact
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Nom complet</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="full_name"
                        value={formData.full_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        className="pl-10"
                        disabled
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      L&apos;email ne peut pas être modifié. Contactez l&apos;administrateur.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Téléphone</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">Département</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="department"
                        value={formData.department}
                        className="pl-10"
                        disabled
                      />
                    </div>
                  </div>
                </div>
                <Separator />
                <div className="flex justify-end">
                  <Button onClick={handleSaveProfile} disabled={saving}>
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? "Enregistrement..." : "Enregistrer"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Préférences de notification</CardTitle>
                <CardDescription>
                  Configurez comment vous souhaitez recevoir les alertes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Canaux de notification</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="email_alerts">Alertes par email</Label>
                        <p className="text-sm text-muted-foreground">
                          Recevoir les notifications importantes par email
                        </p>
                      </div>
                      <Switch
                        id="email_alerts"
                        checked={notificationSettings.email_alerts}
                        onCheckedChange={(checked) => 
                          setNotificationSettings(prev => ({ ...prev, email_alerts: checked }))
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="browser_notifications">Notifications navigateur</Label>
                        <p className="text-sm text-muted-foreground">
                          Afficher des notifications dans le navigateur
                        </p>
                      </div>
                      <Switch
                        id="browser_notifications"
                        checked={notificationSettings.browser_notifications}
                        onCheckedChange={(checked) => 
                          setNotificationSettings(prev => ({ ...prev, browser_notifications: checked }))
                        }
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Types d&apos;alertes</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="risk_alerts">Alertes de risque</Label>
                        <p className="text-sm text-muted-foreground">
                          Étudiants détectés à risque d&apos;échec
                        </p>
                      </div>
                      <Switch
                        id="risk_alerts"
                        checked={notificationSettings.risk_alerts}
                        onCheckedChange={(checked) => 
                          setNotificationSettings(prev => ({ ...prev, risk_alerts: checked }))
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="absence_alerts">Alertes d&apos;absence</Label>
                        <p className="text-sm text-muted-foreground">
                          Seuils d&apos;absence dépassés
                        </p>
                      </div>
                      <Switch
                        id="absence_alerts"
                        checked={notificationSettings.absence_alerts}
                        onCheckedChange={(checked) => 
                          setNotificationSettings(prev => ({ ...prev, absence_alerts: checked }))
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="note_alerts">Alertes de notes</Label>
                        <p className="text-sm text-muted-foreground">
                          Nouvelles notes saisies (enseignants uniquement)
                        </p>
                      </div>
                      <Switch
                        id="note_alerts"
                        checked={notificationSettings.note_alerts}
                        onCheckedChange={(checked) => 
                          setNotificationSettings(prev => ({ ...prev, note_alerts: checked }))
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="weekly_summary">Résumé hebdomadaire</Label>
                        <p className="text-sm text-muted-foreground">
                          Recevoir un récapitulatif chaque semaine
                        </p>
                      </div>
                      <Switch
                        id="weekly_summary"
                        checked={notificationSettings.weekly_summary}
                        onCheckedChange={(checked) => 
                          setNotificationSettings(prev => ({ ...prev, weekly_summary: checked }))
                        }
                      />
                    </div>
                  </div>
                </div>

                <Separator />
                <div className="flex justify-end">
                  <Button onClick={handleSaveNotifications} disabled={saving}>
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? "Enregistrement..." : "Enregistrer les préférences"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="securite">
            <Card>
              <CardHeader>
                <CardTitle>Sécurité du compte</CardTitle>
                <CardDescription>
                  Gérez votre mot de passe et la sécurité de votre compte
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current_password">Mot de passe actuel</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="current_password"
                        type={showPassword ? "text" : "password"}
                        className="pl-10 pr-10"
                        placeholder="Entrez votre mot de passe actuel"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new_password">Nouveau mot de passe</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="new_password"
                        type={showPassword ? "text" : "password"}
                        className="pl-10"
                        placeholder="Entrez un nouveau mot de passe"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm_password">Confirmer le mot de passe</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="confirm_password"
                        type={showPassword ? "text" : "password"}
                        className="pl-10"
                        placeholder="Confirmez le nouveau mot de passe"
                      />
                    </div>
                  </div>
                  
                  <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                    <p className="text-sm font-medium">Exigences du mot de passe :</p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>- Au moins 8 caractères</li>
                      <li>- Au moins une lettre majuscule</li>
                      <li>- Au moins un chiffre</li>
                      <li>- Au moins un caractère spécial (@, #, $, etc.)</li>
                    </ul>
                  </div>

                  <Separator />
                  <div className="flex justify-end">
                    <Button type="submit" disabled={saving}>
                      <Lock className="h-4 w-4 mr-2" />
                      {saving ? "Modification..." : "Changer le mot de passe"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
