# AC - Dashboard - Traiter les demandes d’action

## Objectif

Permettre au dashboard HTML hébergé dans SharePoint de demander une action sans déclencheur HTTP Premium. Le dashboard crée un élément dans `AssistantCommercial_DashboardActions`; ce flux standard le traite.

## Déclencheur

1. SharePoint : **Lors de la création d’un élément**.
2. Site : `Equipe Commerciale Zone A`.
3. Liste : `AssistantCommercial_DashboardActions`.

## Garde-fous d’entrée

1. Vérifier que `MessageId` est renseigné.
2. Accepter uniquement `ignore`, `classify` et `regenerate`.
3. Refuser toute autre valeur avec `Status = Rejected` et journaliser la raison.
4. Refuser une demande déjà traitée (`Status` différent de `Requested`).
5. Passer l’élément à `Processing` avant toute action métier.

## Routage

### `ignore`

- Ne pas supprimer et ne pas déplacer directement depuis le dashboard.
- Journaliser la demande et mettre `Status = Completed`.
- Si un classement Outlook est nécessaire, le workflow métier existant doit l’appliquer après validation de ses règles.

### `classify`

- Vérifier la catégorie autorisée et le `MessageId`.
- Appeler le workflow de classement existant, sans créer d’action d’envoi.
- Journaliser la réponse et mettre `Status = Completed` ou `Error`.

### `regenerate`

- Récupérer le message et le contexte de conversation via le workflow existant.
- Appeler `AC - Rédaction`.
- Créer uniquement un nouveau brouillon dans le fil Outlook.
- Mettre à jour `DraftLog` et la colonne `Result` avec le lien du brouillon.
- Ne jamais envoyer le brouillon.

## Réponse au dashboard

Le dashboard n’attend pas une réponse HTTP immédiate. Il affiche `Demandé` après la création de l’élément et retrouve le résultat au prochain rafraîchissement des journaux.

## Déploiement

1. Créer la liste avec le schéma `sharepoint/schema/AssistantCommercial_DashboardActions.md`.
2. Créer ce flux avec le connecteur SharePoint standard.
3. Tester `regenerate` avec un email de test et vérifier le brouillon, `DraftLog` et `EmailLog2`.
4. Tester `ignore` et `classify` sans autoriser d’envoi ni de suppression.
5. Publier le dashboard HTML dans `Site Assets` du même site SharePoint.
