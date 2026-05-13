# Portail EMSI — Suivi des Absences et Notes

## Présentation

Ce projet est une application web destinée au suivi pédagogique des étudiants de l’EMSI. Elle permet de centraliser la consultation des absences, des notes, des alertes et des tableaux de bord selon le rôle de l’utilisateur.

Le portail prévoit quatre espaces principaux :

- Administrateur
- Chef de filière
- Enseignant
- Étudiant

## Objectifs du projet

L’objectif général est de concevoir une plateforme web claire, moderne et évolutive permettant :

- la gestion des comptes utilisateurs ;
- le suivi des absences ;
- la consultation et la gestion des notes ;
- la visualisation d’indicateurs pédagogiques ;
- la détection des profils à risque ;
- la génération future de rapports et procès-verbaux.

## Technologies utilisées

- Next.js
- React
- TypeScript
- Tailwind CSS
- Radix UI
- Recharts

## Installation

Installer les dépendances :

~~~bash
pnpm install
~~~

Lancer le serveur de développement :

~~~bash
pnpm dev
~~~

Ouvrir l’application dans le navigateur :

~~~text
http://localhost:3000
~~~

## État actuel

La version actuelle correspond à une interface web fonctionnelle avec données de démonstration.

L’intégration de la base de données, de l’authentification réelle et des API sera ajoutée dans les prochaines étapes.

## Structure du projet

~~~text
app/          Pages et routes de l’application
components/   Composants réutilisables
hooks/        Hooks React
lib/          Fonctions utilitaires
public/       Ressources statiques
styles/       Styles globaux
~~~

## Auteurs

Projet réalisé dans le cadre du Projet de Fin d’Année — EMSI.
