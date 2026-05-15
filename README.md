# Portail EMSI — Suivi des Absences et Notes avec Détection IA des Profils à Risque

## Présentation

Ce projet est une application web full-stack destinée au suivi pédagogique des étudiants de l’EMSI Centre.

Elle permet de centraliser la gestion des absences, des notes, des alertes, des tableaux de bord et des procès-verbaux, avec une détection intelligente des étudiants à risque d’échec.

Le projet répond au cahier des charges du PFA : portail de suivi des absences et notes des étudiants avec détection intelligente des profils à risque d’échec.

## Fonctionnalités principales

### Authentification et rôles

L’application gère quatre espaces selon le rôle de l’utilisateur :

- Administrateur
- Chef de filière
- Enseignant
- Étudiant

Chaque espace possède ses propres pages et permissions.

### Administrateur

- Gestion des utilisateurs
- Création, modification et désactivation des comptes
- Attribution des rôles
- Consultation du journal d’audit
- Suivi des actions effectuées dans le système

### Chef de filière

- Consultation des étudiants à risque
- Visualisation des indicateurs pédagogiques
- Suivi des alertes
- Génération de rapports et de PV
- Consultation des statistiques de filière

### Enseignant

- Saisie des notes
- Modification des notes
- Saisie des absences
- Suivi des étudiants d’un module
- Déclenchement automatique des alertes après mise à jour des données

### Étudiant

- Consultation du tableau de bord personnel
- Consultation des notes
- Consultation des absences
- Consultation des alertes personnalisées
- Téléchargement du bulletin PDF

## Détection IA des profils à risque

Le système calcule un score de risque de 0 à 100 à partir de plusieurs indicateurs :

- moyenne générale ;
- notes par module ;
- évolution des résultats ;
- nombre d’absences ;
- taux d’absence ;
- nombre de modules sous le seuil ;
- proportion de notes manquantes.

Les niveaux de risque sont :

- faible ;
- modéré ;
- élevé.

Le module IA est implémenté côté backend en Python avec scikit-learn.

## Technologies utilisées

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- Radix UI
- Recharts

### Backend

- FastAPI
- SQLAlchemy
- Pydantic
- JWT authentication
- WeasyPrint pour la génération PDF
- scikit-learn pour le module IA

### Base de données

- PostgreSQL

### Services

- Redis
- Docker
- Docker Compose

## Architecture

Le projet est organisé en deux parties principales :

```text
frontend Next.js  →  backend FastAPI  →  PostgreSQL
                         │
                         ├── Redis
                         ├── Module IA
                         ├── Génération PDF
                         └── Journal d’audit