# Plan de test

## Commande

```powershell
npm test
```

Les tests utilisent le moteur `node:test` et un loader local minimal pour exécuter les fichiers `.ts` sans dépendance externe.

## Scénarios couverts

1. Une newsletter est classée non importante ou quarantaine.
2. Une publicité ancienne est classée en quarantaine historique.
3. Une demande de devis client crée un brouillon et alerte Teams.
4. Un litige demande validation et ne produit pas de réponse définitive.
5. Un email avec domaine client connu n’est jamais envoyé en quarantaine automatiquement.
6. Un email avec confiance < 80 va en “À surveiller”.
7. Une demande urgente `CFN / Business Planner` identifie le produit `CFN`, crée un brouillon et alerte Teams.
8. L’historique en mode simulation ne déplace aucun email.
9. Le workflow ne retraite pas un `MessageId` déjà présent dans les logs.
10. Aucun artefact ne contient la permission Graph d’envoi direct en clair.
11. Aucune opération Graph ou workflow ne définit une action d’envoi d’email.

## Tests manuels Power Automate

Temps réel :
- Envoyer une demande de devis depuis un domaine client connu.
- Vérifier la création du brouillon.
- Vérifier la carte Teams.
- Vérifier le déplacement vers `01 - À traiter`.
- Vérifier la ligne de log.

Validation produit CFN :
- Envoyer un email de test mentionnant `CFN`, `CF` et `Business Planner`, avec une demande de devis explicite et une échéance.
- Vérifier que `05 - Rechercher connaissances produit` est exécuté avant `06 - Rediger brouillon contextualise`.
- Vérifier que le brouillon reste dans le fil Outlook et qu’aucun envoi automatique n’est effectué.
- Vérifier `EmailLog2`, `DraftLog` et l’éventuelle notification Teams.

Idempotence en conditions réelles :
- Relever le `MessageId` du dernier email de test dans `EmailLog2` avant toute nouvelle action.
- Vérifier qu’une ligne unique existe pour ce `MessageId` et qu’un brouillon associé est déjà journalisé si le scénario le prévoyait.
- Ne pas renvoyer le message ni relancer le workflow tant que le contrôle n’est pas préparé ; le résultat attendu est l’ignorance du doublon avec le statut `Déjà traité` ou équivalent.
- Vérifier qu’aucun second brouillon, déplacement ou doublon de journalisation n’est créé.

Historique simulation :
- Lancer un lot de 10 emails.
- Vérifier qu’aucun email n’est déplacé.
- Vérifier le rapport Teams.
- Vérifier les lignes `Statut = Simulation`.

Historique production contrôlée :
- Lancer un lot de 5 emails.
- Désactiver la création de brouillons.
- Vérifier les déplacements.
- Vérifier l’absence de suppression directe.

Quarantaine :
- Créer une entrée de test ancienne.
- Lancer le flow expiration.
- Vérifier que seul un rapport Teams est produit.

## Critères de réussite

- JSON Adaptive Cards valide.
- Prompts copiables sans modification.
- Flows reconstruisibles par un administrateur Power Platform.
- Aucun secret dans les fichiers.
- Mode historique en simulation par défaut.
- Brouillons uniquement, validation humaine obligatoire avant usage.
