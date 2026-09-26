# Tableau de bord Assistant Commercial

Ce dossier contient une première interface web statique pour piloter les emails traités par l'Assistant Commercial.

Le schéma d'architecture est disponible dans [`docs/assistant-commercial-architecture.svg`](../docs/assistant-commercial-architecture.svg). Il rappelle que Power Apps est une interface au-dessus des agents, des workflows et des journaux ; il ne recrée pas la logique métier.

## Ouvrir

Ouvrir `index.html` dans un navigateur. Aucun serveur ni dépendance supplémentaire n'est nécessaire pour la maquette.

## Ce qui est déjà couvert

- Compteurs du jour : emails analysés, spams écartés, traitements automatiques et validations attendues.
- Liste filtrable et recherchable des emails traités.
- Vue détaillée : expéditeur, destinataires, objet, contenu original, résumé IA, classification, confiance et brouillon proposé.
- Actions de démonstration : sélection, recherche, filtres, ignorer, classer, re-générer et ouverture du brouillon dans Outlook.
- Responsive desktop, tablette et mobile.
- Garde-fou visible : l'ouverture Outlook est proposée, mais l'envoi reste manuel.

## Instance Power Apps publiée

- Nom : `Assistant Commercial - Dashboard`
- Environnement : `I'CAR SYSTEMS` (`Default-5bc7adc6-fdce-46af-ab42-b2f503dc84c4`)
- Site SharePoint : `https://onenextlane.sharepoint.com/sites/EquipeCommercialeZoneA`
- Sources connectées : `AssistantCommercial_EmailLog2`, `AssistantCommercial_DraftLog` et `AssistantCommercial_Settings`
- Lien utilisateur : [ouvrir le dashboard publié](https://apps.powerapps.com/play/e/Default-5bc7adc6-fdce-46af-ab42-b2f503dc84c4/a/5506743f-784c-4292-b924-eeadfb7cbabf)

La première version publiée est générée depuis `AssistantCommercial_EmailLog2`. Elle fournit la lecture réelle du journal et les détails de ses colonnes. Les commandes métier avancées doivent appeler les flows Power Automate existants ; elles ne doivent pas être réimplémentées dans Power Apps.

## Branchement Microsoft 365 à réaliser

La maquette utilise `dashboard/app.js` comme adaptateur temporaire avec des données locales. En production, remplacer cet adaptateur par :

1. une lecture des lignes récentes de `AssistantCommercial_EmailLog2` ou de la table Dataverse équivalente ;
2. une lecture contrôlée de `DraftLog` pour les brouillons ;
3. les liens Outlook `webLink` et brouillon produits par Graph ;
4. un déclenchement Power Automate pour classer, ignorer ou régénérer ;
5. un rafraîchissement périodique ou un signal temps réel.

Le dashboard ne doit jamais ajouter d'action d'envoi direct, de suppression directe ou d'accès aux conversations Teams privées. Toute action doit être validée par le workflow, journalisée et soumise aux garde-fous du cahier des charges.

## Contrat de données minimal

Chaque ligne affichée doit pouvoir être alimentée avec : `MessageId`, `ConversationId`, expéditeur, adresse, objet, résumé, date/heure, statut, domaine, produit, score de priorité, niveau de confiance, contenu original, brouillon, `LienEmail` et `LienBrouillon`.
