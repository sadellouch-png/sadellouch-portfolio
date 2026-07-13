"""Programme de rendu de monnaie en Python.

Ce fichier est autonome : il contient l'interface console et toute la logique
de calcul du rendu de monnaie. Il utilise uniquement la bibliotheque standard
de Python et fonctionne avec des questions posees par input().

Version avec des structures simples : les donnees sont stockees avec des
tuples et des dictionnaires, ce qui reste simple a comprendre en L1.
"""

from decimal import Decimal, InvalidOperation, ROUND_HALF_UP


CENT = Decimal("0.01")


# Chaque coupure est representee par un tuple : (nom, valeur_en_centimes).
COUPURES = (
    ("Billet de 500 EUR", 50000),
    ("Billet de 200 EUR", 20000),
    ("Billet de 100 EUR", 10000),
    ("Billet de 50 EUR", 5000),
    ("Billet de 20 EUR", 2000),
    ("Billet de 10 EUR", 1000),
    ("Billet de 5 EUR", 500),
    ("Piece de 2 EUR", 200),
    ("Piece de 1 EUR", 100),
    ("Piece de 50 centimes", 50),
    ("Piece de 20 centimes", 20),
    ("Piece de 10 centimes", 10),
    ("Piece de 5 centimes", 5),
    ("Piece de 2 centimes", 2),
    ("Piece de 1 centime", 1),
)


def convertir_montant_en_centimes(texte):
    """Convertit une saisie comme '18,70' en centimes."""

    texte_nettoye = (
        texte.strip()
        .replace(" ", "")
        .replace(",", ".")
        .replace("EUR", "")
        .replace("eur", "")
    )

    if texte_nettoye == "":
        raise ValueError("le montant est obligatoire")

    try:
        montant = Decimal(texte_nettoye)
    except InvalidOperation:
        raise ValueError("le montant doit etre un nombre")

    if montant < 0:
        raise ValueError("le montant ne peut pas etre negatif")

    if montant.as_tuple().exponent < -2:
        raise ValueError("le montant ne peut pas avoir plus de deux decimales")

    montant_arrondi = montant.quantize(CENT, rounding=ROUND_HALF_UP)
    return int((montant_arrondi * 100).to_integral_value())


def convertir_quantite(texte):
    """Convertit une saisie de quantite en entier positif."""

    texte_nettoye = texte.strip()

    if texte_nettoye == "":
        return 0

    try:
        quantite = int(texte_nettoye)
    except ValueError:
        raise ValueError("la quantite doit etre un nombre entier")

    if quantite < 0:
        raise ValueError("la quantite ne peut pas etre negative")

    return quantite


def formater_euros(centimes):
    """Transforme un montant en centimes en affichage lisible."""

    euros = abs(centimes) // 100
    reste = abs(centimes) % 100
    signe = "-" if centimes < 0 else ""
    return f"{signe}{euros},{reste:02d} EUR"


def creer_caisse_vide():
    """Cree une caisse avec 0 pour chaque coupure."""

    caisse = {}

    for nom, valeur_centimes in COUPURES:
        caisse[valeur_centimes] = 0

    return caisse


def calculer_total_caisse(caisse):
    """Calcule le total d'argent disponible dans la caisse."""

    total = 0

    for valeur_centimes, quantite in caisse.items():
        total += valeur_centimes * quantite

    return total


def creer_ligne_rendu(nom, valeur_centimes, quantite):
    """Cree une ligne de rendu sous forme de dictionnaire."""

    return {
        "nom": nom,
        "valeur_centimes": valeur_centimes,
        "quantite": quantite,
    }


def creer_resultat_rendu(total_centimes, lignes):
    """Cree le resultat du rendu sous forme de dictionnaire."""

    return {
        "total_centimes": total_centimes,
        "lignes": tuple(lignes),
    }


def calculer_nombre_elements(resultat):
    """Compte le nombre total de billets et pieces rendus."""

    total = 0

    for ligne in resultat["lignes"]:
        total += ligne["quantite"]

    return total


def demander_montant(question):
    """Pose une question jusqu'a obtenir un montant valide."""

    while True:
        saisie = input(question)

        try:
            return convertir_montant_en_centimes(saisie)
        except ValueError as erreur:
            print("Erreur :", erreur)


def demander_quantite(question):
    """Pose une question jusqu'a obtenir une quantite valide."""

    while True:
        saisie = input(question)

        try:
            return convertir_quantite(saisie)
        except ValueError as erreur:
            print("Erreur :", erreur)


def demander_oui_non(question):
    """Pose une question oui/non."""

    while True:
        reponse = input(question + " (o/n) : ").strip().lower()

        if reponse in ("o", "oui"):
            return True

        if reponse in ("n", "non"):
            return False

        print("Reponse invalide. Tapez o pour oui ou n pour non.")


def afficher_titre(titre):
    print()
    print("=" * 72)
    print(titre.center(72))
    print("=" * 72)


def demander_caisse():
    """Demande a l'utilisateur les quantites disponibles en caisse."""

    afficher_titre("CONFIGURATION DE LA CAISSE")
    print("Indiquez la quantite disponible pour chaque billet ou piece.")
    print("Si vous n'avez pas une coupure, tapez 0 ou appuyez sur Entree.")
    print()

    caisse = creer_caisse_vide()

    for nom, valeur_centimes in COUPURES:
        question = f"{nom:<24} ({formater_euros(valeur_centimes):>10}) : "
        caisse[valeur_centimes] = demander_quantite(question)

    print()
    print("Total disponible dans la caisse :", formater_euros(calculer_total_caisse(caisse)))
    return caisse


def afficher_caisse(caisse):
    """Affiche le contenu de la caisse."""

    afficher_titre("ETAT ACTUEL DE LA CAISSE")
    print(f"{'Coupure':<28}{'Valeur':>12}{'Quantite':>12}{'Total':>16}")
    print("-" * 72)

    for nom, valeur_centimes in COUPURES:
        quantite = caisse.get(valeur_centimes, 0)
        total = valeur_centimes * quantite
        print(
            f"{nom:<28}"
            f"{formater_euros(valeur_centimes):>12}"
            f"{quantite:>12}"
            f"{formater_euros(total):>16}"
        )

    print("-" * 72)
    print(f"{'Total en caisse':<52}{formater_euros(calculer_total_caisse(caisse)):>16}")


def calculer_rendu(montant_a_payer, somme_donnee, caisse):
    """Calcule le rendu exact avec le moins de billets/pieces possible."""

    if somme_donnee < montant_a_payer:
        manque = montant_a_payer - somme_donnee
        raise ValueError("somme insuffisante, il manque " + formater_euros(manque))

    montant_a_rendre = somme_donnee - montant_a_payer

    if montant_a_rendre == 0:
        return creer_resultat_rendu(0, [])

    if calculer_total_caisse(caisse) < montant_a_rendre:
        raise ValueError(
            "la caisse ne contient pas assez d'argent pour rendre "
            + formater_euros(montant_a_rendre)
        )

    nombre_coupures = len(COUPURES)
    meilleurs = [None] * (montant_a_rendre + 1)
    meilleurs[0] = (0, (0,) * nombre_coupures)

    for index, coupure in enumerate(COUPURES):
        nom, valeur_centimes = coupure
        quantite_disponible = caisse.get(valeur_centimes, 0)

        if quantite_disponible == 0:
            continue

        anciens_etats = []

        for montant, etat in enumerate(meilleurs):
            if etat is not None:
                anciens_etats.append((montant, etat))

        for montant, etat in anciens_etats:
            nombre_utilise, quantites = etat

            for quantite in range(1, quantite_disponible + 1):
                nouveau_montant = montant + valeur_centimes * quantite

                if nouveau_montant > montant_a_rendre:
                    break

                nouvelles_quantites = list(quantites)
                nouvelles_quantites[index] += quantite
                candidat = (nombre_utilise + quantite, tuple(nouvelles_quantites))

                if est_meilleur(candidat, meilleurs[nouveau_montant]):
                    meilleurs[nouveau_montant] = candidat

    resultat = meilleurs[montant_a_rendre]

    if resultat is None:
        raise ValueError(
            "les billets et pieces disponibles ne permettent pas de rendre exactement "
            + formater_euros(montant_a_rendre)
        )

    lignes = []
    quantites_finales = resultat[1]

    for coupure, quantite in zip(COUPURES, quantites_finales):
        nom, valeur_centimes = coupure

        if quantite > 0:
            ligne = creer_ligne_rendu(nom, valeur_centimes, quantite)
            lignes.append(ligne)

    return creer_resultat_rendu(montant_a_rendre, lignes)


def est_meilleur(candidat, actuel):
    """Compare deux solutions possibles pour garder la meilleure."""

    if actuel is None:
        return True

    nombre_candidat = candidat[0]
    nombre_actuel = actuel[0]

    if nombre_candidat != nombre_actuel:
        return nombre_candidat < nombre_actuel

    return candidat[1] > actuel[1]


def retirer_rendu_de_la_caisse(caisse, resultat):
    """Retire les billets/pieces rendus de la caisse."""

    nouvelle_caisse = dict(caisse)

    for ligne in resultat["lignes"]:
        valeur_centimes = ligne["valeur_centimes"]
        quantite = ligne["quantite"]
        nouvelle_caisse[valeur_centimes] -= quantite

    return nouvelle_caisse


def afficher_resultat(resultat):
    """Affiche le resultat du calcul dans la console."""

    print()
    print("-" * 72)
    print("Monnaie a rendre :", formater_euros(resultat["total_centimes"]))
    print("Nombre total de billets/pieces :", calculer_nombre_elements(resultat))
    print("-" * 72)

    if resultat["total_centimes"] == 0:
        print("Paiement exact : aucune monnaie a rendre.")
        return

    print(f"{'Coupure':<28}{'Valeur':>12}{'Quantite':>12}{'Total':>16}")
    print("-" * 72)

    for ligne in resultat["lignes"]:
        nom = ligne["nom"]
        valeur_centimes = ligne["valeur_centimes"]
        quantite = ligne["quantite"]
        total = valeur_centimes * quantite
        print(
            f"{nom:<28}"
            f"{formater_euros(valeur_centimes):>12}"
            f"{quantite:>12}"
            f"{formater_euros(total):>16}"
        )


def faire_transaction(caisse):
    """Demande les montants puis traite une transaction."""

    afficher_titre("NOUVELLE TRANSACTION")
    print("Exemples de saisie : 18,70 ou 18.70 ou 20")
    print("Total actuel en caisse :", formater_euros(calculer_total_caisse(caisse)))
    print()

    montant_a_payer = demander_montant("Montant a payer : ")
    somme_donnee = demander_montant("Somme donnee par le client : ")

    print()
    print("Montant a payer :", formater_euros(montant_a_payer))
    print("Somme donnee    :", formater_euros(somme_donnee))

    try:
        resultat = calculer_rendu(montant_a_payer, somme_donnee, caisse)
    except ValueError as erreur:
        print()
        print("Impossible de traiter ce cas :", erreur)
        return caisse

    afficher_resultat(resultat)

    if resultat["total_centimes"] == 0:
        return caisse

    if demander_oui_non("Voulez-vous valider cette transaction"):
        caisse = retirer_rendu_de_la_caisse(caisse, resultat)
        print("Transaction validee.")
        print("Nouveau total en caisse :", formater_euros(calculer_total_caisse(caisse)))
    else:
        print("Transaction annulee. La caisse n'a pas ete modifiee.")

    return caisse


def main():
    afficher_titre("PROGRAMME DE RENDU DE MONNAIE")
    print("Ce programme calcule la monnaie a rendre selon la caisse disponible.")

    caisse = demander_caisse()

    continuer = True

    while continuer:
        caisse = faire_transaction(caisse)
        continuer = demander_oui_non("Voulez-vous faire une autre transaction")

        if continuer:
            if demander_oui_non("Voulez-vous afficher l'etat de la caisse"):
                afficher_caisse(caisse)

    afficher_titre("FIN DU PROGRAMME")
    print("Merci d'avoir utilise le programme.")


if __name__ == "__main__":
    main()
