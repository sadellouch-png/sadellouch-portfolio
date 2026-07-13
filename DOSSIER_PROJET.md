# Dossier de projet - Programme de rendu de monnaie

## 1. Contexte

Ce projet consiste a developper une application Python permettant de calculer 
automatiquement la monnaie a rendre lors d'un paiement. Contrairement a un 
simple calcul de difference, le programme prend en compte les billets et les 
pieces reellement disponibles dans la caisse afin de determiner un rendu de 
monnaie realisable.



## 2. Problematique

Dans un commerce, il ne suffit pas de connaitre le montant a rendre. Il faut
aussi savoir si la caisse possede les bonnes coupures.

Exemple :

- Le client doit payer 18,70 EUR.
- Il donne 20,00 EUR.
- Il faut rendre 1,30 EUR.

Avec une caisse complete, le rendu peut etre :

- 1 piece de 1 EUR
- 1 piece de 20 centimes
- 1 piece de 10 centimes

Mais si la caisse ne contient pas de piece de 1 EUR, le programme doit chercher
une autre solution possible, par exemple :

- 2 pieces de 50 centimes
- 1 piece de 20 centimes
- 1 piece de 10 centimes

## 3. Objectifs

- Creer une interface utilisable dans le terminal.
- Demander le stock de monnaie disponible au demarrage.
- Demander le montant a payer.
- Demander la somme donnee par le client.
- Calculer le rendu exact si possible.
- Minimiser le nombre de billets et pieces rendus.
- Refuser proprement une transaction impossible.
- Mettre a jour la caisse apres validation.
- Tester la logique independamment de l'interface.

## 4. Public vise

L'utilisateur vise est une personne qui veut simuler une caisse de commerce. 

Le programme est volontairement lance dans le terminal avec des questions
`input()` afin d'etre facile a executer dans Visual Studio Code sans
bibliotheque externe.

## 5. Structure technique

Le projet est divise en plusieurs fichiers :

- `app.py` : interface console, menus et saisies utilisateur.
- `change.py` : logique metier et calcul algorithmique.
- `tests/test_change.py` : tests unitaires.

Cette separation est importante : elle permet de tester les calculs sans
dependre de l'affichage.

## 6. Representation des donnees

Les montants sont stockes en centimes sous forme d'entiers.

Exemples :

- 18,70 EUR devient `1870`
- 20,00 EUR devient `2000`
- 1,30 EUR devient `130`

Ce choix evite les erreurs d'arrondi souvent presentes avec les nombres
decimaux flottants.

La caisse est representee par un dictionnaire :

```python
{
    100: 3,
    50: 2,
    20: 5,
}
```

Cela signifie :

- 3 pieces de 1 EUR
- 2 pieces de 50 centimes
- 5 pieces de 20 centimes

## 7. Algorithme utilise

Sans contrainte de stock, on peut rendre la monnaie avec une strategie simple :
prendre la plus grande coupure possible, puis continuer avec le reste.

Avec un stock limite, cette strategie peut echouer. Le programme utilise donc
une programmation dynamique.

Principe :

1. On part du montant `0`.
2. On teste les billets et pieces disponibles.
3. On memorise les meilleures combinaisons pour chaque montant atteignable.
4. On garde la combinaison avec le moins de billets et pieces.
5. A la fin, on regarde si le montant exact a rendre est atteignable.

Cette approche est plus fiable qu'un simple algorithme glouton lorsque la
caisse ne contient pas toutes les coupures.

## 8. Gestion des erreurs

Le programme verifie :

- les montants vides 
- les montants negatifs 
- les montants avec plus de deux decimales 
- les quantites negatives 
- les paiements insuffisants 
- les rendus impossibles avec la caisse actuelle.

Les erreurs sont affichees clairement dans le terminal.

## 9. Planning possible sur 4 sequences

Sequence 1 :

- Analyse du sujet.
- Choix des fonctionnalites.
- Creation de la structure du projet.
- Premiere version du calcul sans stock.

Sequence 2 :

- Ajout de la gestion de caisse.
- Mise en place des saisies utilisateur.
- Creation du menu terminal.
- Validation des erreurs de saisie.

Sequence 3 :

- Amelioration de l'algorithme avec programmation dynamique.
- Ajout des tests unitaires.
- Tests avec differents scenarios.
- Correction des cas limites.

Sequence 4 :

- Nettoyage du code.
- Redaction de la documentation.
- Preparation de la demonstration.
- Verification finale et presentation.

## 10. Ameliorations possibles

- Sauvegarder la caisse dans un fichier JSON.
- Ajouter un historique des transactions.
- Exporter un ticket de caisse.
- Creer une interface web plus complete.
- Ajouter une authentification administrateur.
- Gerer plusieurs devises.

## 11. Conclusion

Ce projet montre qu'un probleme simple en apparence peut demander une vraie
reflexion algorithmique. Le programme doit calculer un montant, mais aussi
tenir compte des contraintes reelles de la caisse. C'est ce qui rend le sujet
interessant pour un projet de premiere annee en informatique.

