"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import {
  GraduationCap,
  Eye,
  EyeOff,
  Loader2,
  BookOpen,
  Users,
  BarChart3,
  Shield,
  ChevronRight,
  Sparkles,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, user, isLoading: authLoading, checkAuth } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (isAuthenticated && user && mounted) {
      const routes: Record<string, string> = {
        admin: "/admin",
        chef_filiere: "/chef",
        enseignant: "/enseignant",
        etudiant: "/etudiant",
      };
      router.push(routes[user.role] || "/");
    }
  }, [isAuthenticated, user, router, mounted]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    setIsLoading(true);
    try {
      await login(email, password);
      toast.success("Connexion reussie");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur de connexion");
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    {
      icon: BookOpen,
      title: "Suivi academique",
      description: "Notes et moyennes en temps reel",
    },
    {
      icon: Users,
      title: "Gestion des absences",
      description: "Historique complet et justificatifs",
    },
    {
      icon: BarChart3,
      title: "Statistiques avancees",
      description: "Tableaux de bord personnalises",
    },
    {
      icon: Sparkles,
      title: "Detection IA",
      description: "Identification des profils a risque",
    },
  ];

  const testAccounts = [
    { role: "Admin", email: "admin@emsi.ma", password: "admin2026" },
    { role: "Chef de Filiere", email: "chef.iir@emsi.ma", password: "chef2026" },
    { role: "Enseignant", email: "prof.analyse@emsi.ma", password: "prof2026" },
    { role: "Etudiant", email: "etudiant1@emsi.ma", password: "etu2026" },
  ];

  if (authLoading || !mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Panel - Branding & Features */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-background" />
        
        {/* Grid pattern overlay */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }}
        />

        {/* Floating orbs */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-32 right-20 w-96 h-96 bg-chart-2/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 w-full">
          {/* Logo & Title */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
                <GraduationCap className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">EMSI Centre</h1>
                <p className="text-sm text-muted-foreground">Portail Pedagogique</p>
              </div>
            </div>
          </div>

          {/* Main Headline */}
          <div className="flex-1 flex flex-col justify-center max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6 w-fit">
              <Sparkles className="h-4 w-4" />
              Propulse par Intelligence Artificielle
            </div>
            
            <h2 className="text-4xl xl:text-5xl font-bold text-foreground leading-tight mb-6">
              Suivez votre parcours
              <span className="block gradient-text">academique</span>
            </h2>
            
            <p className="text-lg text-muted-foreground mb-10 leading-relaxed">
              Une plateforme moderne pour le suivi des notes, absences et la detection 
              intelligente des etudiants a risque academique.
            </p>

            {/* Features Grid */}
            <div className="grid grid-cols-2 gap-4">
              {features.map((feature, index) => (
                <div 
                  key={index}
                  className="group p-4 rounded-xl bg-card/50 border border-border/50 hover:border-primary/30 hover:bg-card transition-all duration-300"
                >
                  <div className="p-2 rounded-lg bg-primary/10 w-fit mb-3 group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <p>PFA 2025/2026</p>
            <p>Ecole Marocaine des Sciences de l&apos;Ingenieur</p>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 xl:w-2/5 flex flex-col">
        {/* Mobile Header */}
        <div className="lg:hidden p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
              <GraduationCap className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">EMSI Centre</h1>
              <p className="text-xs text-muted-foreground">Portail Pedagogique</p>
            </div>
          </div>
        </div>

        {/* Login Form Container */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-md">
            {/* Form Header */}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Bienvenue
              </h2>
              <p className="text-muted-foreground">
                Connectez-vous pour acceder a votre espace
              </p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-foreground">
                  Adresse email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="exemple@emsi.ma"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 bg-secondary/50 border-border focus:border-primary focus:ring-primary/20"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-foreground">
                  Mot de passe
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Entrez votre mot de passe"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 bg-secondary/50 border-border focus:border-primary focus:ring-primary/20 pr-12"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground glow-primary"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Connexion en cours...
                  </>
                ) : (
                  <>
                    Se connecter
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-3 text-muted-foreground">
                  Comptes de demonstration
                </span>
              </div>
            </div>

            {/* Test Accounts */}
            <Card className="bg-card/50 border-border">
              <CardContent className="p-4">
                <div className="space-y-3">
                  {testAccounts.map((account, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => {
                        setEmail(account.email);
                        setPassword(account.password);
                      }}
                      className="w-full flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary border border-transparent hover:border-primary/20 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 rounded-md bg-primary/10">
                          <Shield className="h-4 w-4 text-primary" />
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-medium text-foreground">{account.role}</p>
                          <p className="text-xs text-muted-foreground">{account.email}</p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Footer */}
            <p className="text-center text-xs text-muted-foreground mt-8">
              En vous connectant, vous acceptez les conditions d&apos;utilisation
              et la politique de confidentialite de l&apos;EMSI.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
