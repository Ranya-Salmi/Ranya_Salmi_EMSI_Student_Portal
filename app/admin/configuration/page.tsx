"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Settings, 
  Bell, 
  Brain, 
  Mail,
  Database,
  Shield,
  Save,
  RefreshCw
} from "lucide-react"
import { toast } from "sonner"

export default function ConfigurationPage() {
  const [isSaving, setIsSaving] = useState(false)
  
  const [alertConfig, setAlertConfig] = useState({
    seuilAbsences: 8,
    seuilNotesBas: 10,
    seuilBaisseNotes: 3,
    notifEmail: true,
    notifPlateforme: true,
    frequenceVerification: "daily"
  })

  const [iaConfig, setIaConfig] = useState({
    enabled: true,
    seuilRisqueAlerte: 50,
    facteurAbsences: 40,
    facteurNotes: 35,
    facteurTendance: 25,
    analyseAutomatique: true,
    frequenceAnalyse: "weekly"
  })

  const [emailConfig, setEmailConfig] = useState({
    smtpHost: "smtp.emsi.ma",
    smtpPort: "587",
    smtpUser: "noreply@emsi.ma",
    senderName: "Portail EMSI",
    templateAlerte: "Bonjour {nom},\n\nUne alerte a été détectée concernant votre parcours...",
  })

  const handleSave = async () => {
    setIsSaving(true)
    await new Promise(resolve => setTimeout(resolve, 1500))
    setIsSaving(false)
    toast.success("Configuration enregistrée avec succès")
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Configuration</h1>
            <p className="text-muted-foreground">
              Paramètres du système de suivi pédagogique
            </p>
          </div>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Enregistrer
              </>
            )}
          </Button>
        </div>

        <Tabs defaultValue="alertes" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="alertes">
              <Bell className="mr-2 h-4 w-4" />
              Alertes
            </TabsTrigger>
            <TabsTrigger value="ia">
              <Brain className="mr-2 h-4 w-4" />
              Module IA
            </TabsTrigger>
            <TabsTrigger value="email">
              <Mail className="mr-2 h-4 w-4" />
              Emails
            </TabsTrigger>
            <TabsTrigger value="systeme">
              <Settings className="mr-2 h-4 w-4" />
              Système
            </TabsTrigger>
          </TabsList>

          {/* Alertes Configuration */}
          <TabsContent value="alertes">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Configuration des Alertes
                </CardTitle>
                <CardDescription>
                  Définissez les seuils et conditions de déclenchement des alertes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Seuil d&apos;absences (heures/mois)</Label>
                      <div className="flex items-center gap-4">
                        <Slider
                          value={[alertConfig.seuilAbsences]}
                          onValueChange={([v]) => setAlertConfig({ ...alertConfig, seuilAbsences: v })}
                          max={20}
                          min={1}
                          step={1}
                          className="flex-1"
                        />
                        <span className="w-12 text-center font-mono">
                          {alertConfig.seuilAbsences}h
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Alerte déclenchée si l&apos;étudiant dépasse ce nombre d&apos;heures d&apos;absences
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>Seuil note basse (/20)</Label>
                      <div className="flex items-center gap-4">
                        <Slider
                          value={[alertConfig.seuilNotesBas]}
                          onValueChange={([v]) => setAlertConfig({ ...alertConfig, seuilNotesBas: v })}
                          max={15}
                          min={5}
                          step={0.5}
                          className="flex-1"
                        />
                        <span className="w-12 text-center font-mono">
                          {alertConfig.seuilNotesBas}/20
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Seuil baisse significative (points)</Label>
                      <div className="flex items-center gap-4">
                        <Slider
                          value={[alertConfig.seuilBaisseNotes]}
                          onValueChange={([v]) => setAlertConfig({ ...alertConfig, seuilBaisseNotes: v })}
                          max={8}
                          min={1}
                          step={0.5}
                          className="flex-1"
                        />
                        <span className="w-12 text-center font-mono">
                          -{alertConfig.seuilBaisseNotes}pts
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <Label>Notifications par email</Label>
                        <p className="text-xs text-muted-foreground">
                          Envoyer les alertes par email aux concernés
                        </p>
                      </div>
                      <Switch
                        checked={alertConfig.notifEmail}
                        onCheckedChange={(c) => setAlertConfig({ ...alertConfig, notifEmail: c })}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <Label>Notifications plateforme</Label>
                        <p className="text-xs text-muted-foreground">
                          Afficher les alertes dans le portail
                        </p>
                      </div>
                      <Switch
                        checked={alertConfig.notifPlateforme}
                        onCheckedChange={(c) => setAlertConfig({ ...alertConfig, notifPlateforme: c })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Fréquence de vérification</Label>
                      <Select
                        value={alertConfig.frequenceVerification}
                        onValueChange={(v) => setAlertConfig({ ...alertConfig, frequenceVerification: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="realtime">Temps réel</SelectItem>
                          <SelectItem value="hourly">Toutes les heures</SelectItem>
                          <SelectItem value="daily">Quotidien</SelectItem>
                          <SelectItem value="weekly">Hebdomadaire</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* IA Configuration */}
          <TabsContent value="ia">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Module d&apos;Intelligence Artificielle
                </CardTitle>
                <CardDescription>
                  Configuration du système de détection des profils à risque
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                  <div>
                    <Label className="text-base">Activer le module IA</Label>
                    <p className="text-sm text-muted-foreground">
                      Analyse prédictive des profils étudiants à risque
                    </p>
                  </div>
                  <Switch
                    checked={iaConfig.enabled}
                    onCheckedChange={(c) => setIaConfig({ ...iaConfig, enabled: c })}
                  />
                </div>

                {iaConfig.enabled && (
                  <>
                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-4">
                        <h4 className="font-medium">Seuils de risque</h4>
                        <div className="space-y-2">
                          <Label>Seuil d&apos;alerte (%)</Label>
                          <div className="flex items-center gap-4">
                            <Slider
                              value={[iaConfig.seuilRisqueAlerte]}
                              onValueChange={([v]) => setIaConfig({ ...iaConfig, seuilRisqueAlerte: v })}
                              max={90}
                              min={20}
                              step={5}
                              className="flex-1"
                            />
                            <span className="w-12 text-center font-mono">
                              {iaConfig.seuilRisqueAlerte}%
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Score minimum pour déclencher une alerte IA
                          </p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-medium">Pondération des facteurs</h4>
                        <div className="space-y-3">
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Absences</span>
                              <span className="font-mono">{iaConfig.facteurAbsences}%</span>
                            </div>
                            <Slider
                              value={[iaConfig.facteurAbsences]}
                              onValueChange={([v]) => setIaConfig({ ...iaConfig, facteurAbsences: v })}
                              max={60}
                              min={10}
                              step={5}
                            />
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Notes</span>
                              <span className="font-mono">{iaConfig.facteurNotes}%</span>
                            </div>
                            <Slider
                              value={[iaConfig.facteurNotes]}
                              onValueChange={([v]) => setIaConfig({ ...iaConfig, facteurNotes: v })}
                              max={60}
                              min={10}
                              step={5}
                            />
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Tendance</span>
                              <span className="font-mono">{iaConfig.facteurTendance}%</span>
                            </div>
                            <Slider
                              value={[iaConfig.facteurTendance]}
                              onValueChange={([v]) => setIaConfig({ ...iaConfig, facteurTendance: v })}
                              max={60}
                              min={10}
                              step={5}
                            />
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Total: {iaConfig.facteurAbsences + iaConfig.facteurNotes + iaConfig.facteurTendance}% 
                          (devrait être 100%)
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <Label>Analyse automatique</Label>
                          <p className="text-xs text-muted-foreground">
                            Exécuter l&apos;analyse sans intervention
                          </p>
                        </div>
                        <Switch
                          checked={iaConfig.analyseAutomatique}
                          onCheckedChange={(c) => setIaConfig({ ...iaConfig, analyseAutomatique: c })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Fréquence d&apos;analyse</Label>
                        <Select
                          value={iaConfig.frequenceAnalyse}
                          onValueChange={(v) => setIaConfig({ ...iaConfig, frequenceAnalyse: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Quotidienne</SelectItem>
                            <SelectItem value="weekly">Hebdomadaire</SelectItem>
                            <SelectItem value="biweekly">Bi-hebdomadaire</SelectItem>
                            <SelectItem value="monthly">Mensuelle</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Email Configuration */}
          <TabsContent value="email">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Configuration Email (SMTP)
                </CardTitle>
                <CardDescription>
                  Paramètres du serveur d&apos;envoi d&apos;emails
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Serveur SMTP</Label>
                    <Input
                      value={emailConfig.smtpHost}
                      onChange={(e) => setEmailConfig({ ...emailConfig, smtpHost: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Port</Label>
                    <Input
                      value={emailConfig.smtpPort}
                      onChange={(e) => setEmailConfig({ ...emailConfig, smtpPort: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Utilisateur SMTP</Label>
                    <Input
                      value={emailConfig.smtpUser}
                      onChange={(e) => setEmailConfig({ ...emailConfig, smtpUser: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Nom expéditeur</Label>
                    <Input
                      value={emailConfig.senderName}
                      onChange={(e) => setEmailConfig({ ...emailConfig, senderName: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Template email d&apos;alerte</Label>
                  <Textarea
                    value={emailConfig.templateAlerte}
                    onChange={(e) => setEmailConfig({ ...emailConfig, templateAlerte: e.target.value })}
                    rows={6}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Variables disponibles: {"{nom}"}, {"{prenom}"}, {"{type_alerte}"}, {"{details}"}, {"{date}"}
                  </p>
                </div>

                <Button variant="outline">
                  <Mail className="mr-2 h-4 w-4" />
                  Envoyer un email de test
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Configuration */}
          <TabsContent value="systeme">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Base de données
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">État</span>
                    <Badge className="bg-green-100 text-green-800">Connecté</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Type</span>
                    <span className="text-sm font-mono">SQLite</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Taille</span>
                    <span className="text-sm font-mono">24.5 MB</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Dernière sauvegarde</span>
                    <span className="text-sm">15/03/2024 02:00</span>
                  </div>
                  <Button variant="outline" className="w-full">
                    <Database className="mr-2 h-4 w-4" />
                    Sauvegarder maintenant
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Sécurité
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Sessions actives</Label>
                      <p className="text-xs text-muted-foreground">Durée max: 24h</p>
                    </div>
                    <span className="font-mono">12</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Double authentification</Label>
                      <p className="text-xs text-muted-foreground">Pour les admins</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Journalisation complète</Label>
                      <p className="text-xs text-muted-foreground">Audit trail</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <Button variant="outline" className="w-full text-destructive">
                    Déconnecter toutes les sessions
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
