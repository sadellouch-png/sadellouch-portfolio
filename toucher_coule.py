import random


TAILLE_GRILLE = 10
LETTRES = "ABCDEFGHIJ"
EAU_INCONNUE = "."
MANQUE = "O"
TOUCHE = "X"
BATEAU_VISIBLE = "B"

BATEAUX_A_PLACER = [
    ("Patrouilleur", 2),
    ("Sous-marin 1", 3),
    ("Sous-marin 2", 3),
    ("Croiseur", 4)
]


def afficher_titre(titre):
    largeur = 70
    print()
    print("=" * largeur)
    print(titre.center(largeur))
    print("=" * largeur)


def creer_grille(valeur):
    grille = []

    for _ in range(TAILLE_GRILLE):
        ligne = []

        for _ in range(TAILLE_GRILLE):
            ligne.append(valeur)

        grille.append(ligne)

    return grille


def afficher_regles():
    afficher_titre("REGLES DU JEU")
    print("Le but est de trouver et couler les 4 bateaux caches.")
    print("La grille fait 10 lignes par 10 colonnes.")
    print("Vous tirez avec une coordonnee comme A1, B7 ou J10.")
    print()
    print("Bateaux presents :")
    print("- 1 bateau de 2 cases")
    print("- 2 bateaux de 3 cases")
    print("- 1 bateau de 4 cases")
    print()
    print("Symboles :")
    print("- . : case inconnue")
    print("- O : tir dans l'eau")
    print("- X : bateau touche")
    print("- B : bateau visible en mode test ou sur votre grille")
    print()
    print("Mode contre l'IA :")
    print("- votre grille affiche vos bateaux et les tirs de l'IA")
    print("- la grille de l'IA affiche seulement vos tirs")
    print("- chaque tour alterne entre votre tir et le tir automatique de l'IA")
    print("- vous pouvez placer vos bateaux vous-meme ou laisser le programme le faire")


def afficher_grille(grille_tirs, grille_bateaux=None, mode_test=False):
    print()
    print("      1  2  3  4  5  6  7  8  9 10")
    print("   +" + "---" * TAILLE_GRILLE + "+")

    for ligne in range(TAILLE_GRILLE):
        affichage_ligne = LETTRES[ligne] + "  |"

        for colonne in range(TAILLE_GRILLE):
            symbole = grille_tirs[ligne][colonne]

            if (
                mode_test
                and symbole == EAU_INCONNUE
                and grille_bateaux is not None
                and grille_bateaux[ligne][colonne] is not None
            ):
                symbole = BATEAU_VISIBLE

            affichage_ligne += " " + symbole + " "

        affichage_ligne += "|"
        print(affichage_ligne)

    print("   +" + "---" * TAILLE_GRILLE + "+")
    print("Legende : . inconnu | O manque | X touche | B bateau visible")


def convertir_coordonnees(texte):
    propre = texte.strip().upper().replace(" ", "")

    if propre == "":
        raise ValueError("la coordonnee est vide")

    if propre in ("Q", "QUIT", "QUITTER"):
        return None

    ligne_texte = propre[0]
    colonne_texte = propre[1:]

    if ligne_texte not in LETTRES:
        raise ValueError("la ligne doit etre une lettre entre A et J")

    if not colonne_texte.isdigit():
        raise ValueError("la colonne doit etre un nombre entre 1 et 10")

    ligne = LETTRES.index(ligne_texte)
    colonne = int(colonne_texte) - 1

    if colonne < 0 or colonne >= TAILLE_GRILLE:
        raise ValueError("la colonne doit etre comprise entre 1 et 10")

    return ligne, colonne


def formater_coordonnees(coordonnees):
    ligne, colonne = coordonnees
    return LETTRES[ligne] + str(colonne + 1)


def demander_coordonnees():
    while True:
        reponse = input("Votre tir (ex : A1, J10 ou Q pour quitter) : ")

        try:
            return convertir_coordonnees(reponse)
        except ValueError as erreur:
            print("Erreur :", erreur)


def demander_coordonnees_placement(nom_bateau, taille):
    while True:
        question = "Case de depart pour " + nom_bateau + " (" + str(taille) + " cases, ex : A1) : "
        reponse = input(question)

        try:
            coordonnees = convertir_coordonnees(reponse)
        except ValueError as erreur:
            print("Erreur :", erreur)
            continue

        if coordonnees is None:
            print("Erreur : vous ne pouvez pas quitter pendant le placement.")
            continue

        return coordonnees


def demander_direction():
    while True:
        reponse = input("Direction horizontale ou verticale ? (H/V) ").strip().upper()

        if reponse in ("H", "HORIZONTAL", "HORIZONTALE"):
            return "H"

        if reponse in ("V", "VERTICAL", "VERTICALE"):
            return "V"

        print("Erreur : entrez H pour horizontal ou V pour vertical.")


def demander_oui_non(question):
    while True:
        reponse = input(question + " (o/n) ").strip().lower()

        if reponse in ("o", "oui"):
            return True

        if reponse in ("n", "non"):
            return False

        print("Erreur : repondez par o ou n.")


def cases_du_bateau(ligne, colonne, direction, taille):
    cases = []

    for decalage in range(taille):
        if direction == "H":
            nouvelle_ligne = ligne
            nouvelle_colonne = colonne + decalage
        else:
            nouvelle_ligne = ligne + decalage
            nouvelle_colonne = colonne

        if (
            nouvelle_ligne < 0
            or nouvelle_ligne >= TAILLE_GRILLE
            or nouvelle_colonne < 0
            or nouvelle_colonne >= TAILLE_GRILLE
        ):
            return None

        cases.append((nouvelle_ligne, nouvelle_colonne))

    return cases


def peut_placer_bateau(grille_bateaux, cases):
    if cases is None:
        return False

    for ligne, colonne in cases:
        if grille_bateaux[ligne][colonne] is not None:
            return False

    return True


def placer_bateaux_aleatoirement():
    grille_bateaux = creer_grille(None)
    bateaux = []

    for indice, modele in enumerate(BATEAUX_A_PLACER):
        nom, taille = modele
        place = False
        essais = 0

        while not place and essais < 1000:
            essais += 1
            ligne = random.randint(0, TAILLE_GRILLE - 1)
            colonne = random.randint(0, TAILLE_GRILLE - 1)
            direction = random.choice(("H", "V"))
            cases = cases_du_bateau(ligne, colonne, direction, taille)

            if peut_placer_bateau(grille_bateaux, cases):
                for case_ligne, case_colonne in cases:
                    grille_bateaux[case_ligne][case_colonne] = indice

                bateaux.append({
                    "nom": nom,
                    "taille": taille,
                    "cases": cases,
                    "touches": []
                })
                place = True

        if not place:
            raise RuntimeError("placement impossible des bateaux")

    return grille_bateaux, bateaux


def placer_bateaux_manuellement():
    grille_bateaux = creer_grille(None)
    bateaux = []

    afficher_titre("PLACEMENT DE VOS BATEAUX")
    print("Vous allez placer vos 4 bateaux sur votre grille.")
    print("Pour chaque bateau, donnez une case de depart puis une direction.")
    print("Exemple : A1 puis H place le bateau vers la droite.")
    print("Exemple : A1 puis V place le bateau vers le bas.")

    for indice, modele in enumerate(BATEAUX_A_PLACER):
        nom, taille = modele
        place = False

        while not place:
            print()
            print("Bateau a placer :", nom, "-", taille, "cases")
            afficher_grille(creer_grille(EAU_INCONNUE), grille_bateaux, True)

            coordonnees = demander_coordonnees_placement(nom, taille)
            direction = demander_direction()
            ligne, colonne = coordonnees
            cases = cases_du_bateau(ligne, colonne, direction, taille)

            if not peut_placer_bateau(grille_bateaux, cases):
                print("Placement impossible : le bateau sort de la grille ou chevauche un autre bateau.")
                print("Veuillez choisir une autre position.")
                continue

            for case_ligne, case_colonne in cases:
                grille_bateaux[case_ligne][case_colonne] = indice

            bateaux.append({
                "nom": nom,
                "taille": taille,
                "cases": cases,
                "touches": []
            })
            place = True
            print(nom, "place correctement.")

    afficher_titre("PLACEMENT TERMINE")
    afficher_grille(creer_grille(EAU_INCONNUE), grille_bateaux, True)
    return grille_bateaux, bateaux


def bateau_est_coule(bateau):
    return len(bateau["touches"]) == bateau["taille"]


def tous_les_bateaux_sont_coules(bateaux):
    for bateau in bateaux:
        if not bateau_est_coule(bateau):
            return False

    return True


def afficher_etat_bateaux(bateaux, titre="Etat des bateaux :"):
    print()
    print(titre)

    for bateau in bateaux:
        touches = len(bateau["touches"])
        taille = bateau["taille"]

        if bateau_est_coule(bateau):
            statut = "COULE"
        elif touches > 0:
            statut = "TOUCHE"
        else:
            statut = "CACHE"

        print("-", bateau["nom"], ":", str(touches) + "/" + str(taille), "-", statut)


def effectuer_tir(coordonnees, grille_tirs, grille_bateaux, bateaux):
    ligne, colonne = coordonnees

    if grille_tirs[ligne][colonne] != EAU_INCONNUE:
        return "deja_tire", None

    indice_bateau = grille_bateaux[ligne][colonne]

    if indice_bateau is None:
        grille_tirs[ligne][colonne] = MANQUE
        return "manque", None

    grille_tirs[ligne][colonne] = TOUCHE
    bateau = bateaux[indice_bateau]
    bateau["touches"].append((ligne, colonne))

    if bateau_est_coule(bateau):
        return "coule", bateau

    return "touche", bateau


def afficher_message_tir(resultat, bateau):
    if resultat == "deja_tire":
        print("Vous avez deja tire sur cette case. Le tir ne compte pas.")
    elif resultat == "manque":
        print("A l'eau ! Aucun bateau sur cette case.")
    elif resultat == "touche":
        print("Touche ! Vous avez touche le", bateau["nom"] + ".")
    elif resultat == "coule":
        print("Touche-coule ! Vous avez coule le", bateau["nom"] + ".")


def afficher_message_tir_ia(coordonnees, resultat, bateau):
    print("L'IA tire en", formater_coordonnees(coordonnees) + ".")

    if resultat == "manque":
        print("L'IA tire dans l'eau.")
    elif resultat == "touche":
        print("L'IA touche votre", bateau["nom"] + ".")
    elif resultat == "coule":
        print("L'IA coule votre", bateau["nom"] + ".")


def afficher_plateaux_duel(grille_tirs_joueur, grille_bateaux_ia, grille_tirs_ia, grille_bateaux_joueur):
    print()
    print("GRILLE DE L'IA - vos tirs")
    afficher_grille(grille_tirs_joueur, grille_bateaux_ia, False)
    print()
    print("VOTRE GRILLE - vos bateaux et les tirs de l'IA")
    afficher_grille(grille_tirs_ia, grille_bateaux_joueur, True)


def cases_voisines(coordonnees):
    ligne, colonne = coordonnees
    voisines = []
    directions = [(-1, 0), (1, 0), (0, -1), (0, 1)]

    for decalage_ligne, decalage_colonne in directions:
        nouvelle_ligne = ligne + decalage_ligne
        nouvelle_colonne = colonne + decalage_colonne

        if (
            nouvelle_ligne >= 0
            and nouvelle_ligne < TAILLE_GRILLE
            and nouvelle_colonne >= 0
            and nouvelle_colonne < TAILLE_GRILLE
        ):
            voisines.append((nouvelle_ligne, nouvelle_colonne))

    return voisines


def ajouter_cibles_ia(coordonnees, cibles_ia, grille_tirs_ia):
    for case in cases_voisines(coordonnees):
        ligne, colonne = case

        if grille_tirs_ia[ligne][colonne] == EAU_INCONNUE and case not in cibles_ia:
            cibles_ia.append(case)


def choisir_tir_ia(grille_tirs_ia, cibles_ia):
    while len(cibles_ia) > 0:
        cible = cibles_ia.pop(0)
        ligne, colonne = cible

        if grille_tirs_ia[ligne][colonne] == EAU_INCONNUE:
            return cible

    cases_disponibles = []

    for ligne in range(TAILLE_GRILLE):
        for colonne in range(TAILLE_GRILLE):
            if grille_tirs_ia[ligne][colonne] == EAU_INCONNUE:
                cases_disponibles.append((ligne, colonne))

    return random.choice(cases_disponibles)


def jouer_partie():
    grille_bateaux, bateaux = placer_bateaux_aleatoirement()
    grille_tirs = creer_grille(EAU_INCONNUE)
    mode_test = demander_oui_non("Voulez-vous activer le mode test pour afficher les bateaux ?")
    nombre_tirs = 0

    afficher_titre("NOUVELLE PARTIE")

    while not tous_les_bateaux_sont_coules(bateaux):
        afficher_grille(grille_tirs, grille_bateaux, mode_test)
        afficher_etat_bateaux(bateaux)
        coordonnees = demander_coordonnees()

        if coordonnees is None:
            afficher_titre("PARTIE ABANDONNEE")
            afficher_grille(grille_tirs, grille_bateaux, True)
            print("Vous avez quitte la partie apres", nombre_tirs, "tirs.")
            return

        resultat, bateau = effectuer_tir(coordonnees, grille_tirs, grille_bateaux, bateaux)

        if resultat != "deja_tire":
            nombre_tirs += 1

        afficher_message_tir(resultat, bateau)

    afficher_titre("VICTOIRE")
    afficher_grille(grille_tirs, grille_bateaux, True)
    print("Bravo, vous avez coule tous les bateaux en", nombre_tirs, "tirs.")


def jouer_contre_ia():
    afficher_titre("PREPARATION DE LA PARTIE")

    if demander_oui_non("Voulez-vous placer vos bateaux vous-meme ?"):
        grille_bateaux_joueur, bateaux_joueur = placer_bateaux_manuellement()
    else:
        grille_bateaux_joueur, bateaux_joueur = placer_bateaux_aleatoirement()

    grille_bateaux_ia, bateaux_ia = placer_bateaux_aleatoirement()
    grille_tirs_joueur = creer_grille(EAU_INCONNUE)
    grille_tirs_ia = creer_grille(EAU_INCONNUE)
    cibles_ia = []
    tour = 1

    afficher_titre("PARTIE CONTRE L'IA")
    print("Vos bateaux sont places, et les bateaux de l'IA ont ete places automatiquement.")
    print("La grille de l'IA est cachee. Votre grille affiche vos bateaux.")

    while True:
        afficher_titre("TOUR " + str(tour))
        afficher_plateaux_duel(
            grille_tirs_joueur,
            grille_bateaux_ia,
            grille_tirs_ia,
            grille_bateaux_joueur
        )
        afficher_etat_bateaux(bateaux_ia, "Etat de la flotte de l'IA :")
        afficher_etat_bateaux(bateaux_joueur, "Etat de votre flotte :")

        coordonnees = demander_coordonnees()

        if coordonnees is None:
            afficher_titre("PARTIE ABANDONNEE")
            afficher_plateaux_duel(
                grille_tirs_joueur,
                grille_bateaux_ia,
                grille_tirs_ia,
                grille_bateaux_joueur
            )
            print("Vous avez quitte la partie contre l'IA.")
            return

        resultat, bateau = effectuer_tir(
            coordonnees,
            grille_tirs_joueur,
            grille_bateaux_ia,
            bateaux_ia
        )

        afficher_titre("VOTRE TIR")
        print("Vous tirez en", formater_coordonnees(coordonnees) + ".")
        afficher_message_tir(resultat, bateau)

        afficher_plateaux_duel(
            grille_tirs_joueur,
            grille_bateaux_ia,
            grille_tirs_ia,
            grille_bateaux_joueur
        )

        if resultat == "deja_tire":
            print("Vous devez choisir une nouvelle case. L'IA ne joue pas encore.")
            continue

        if tous_les_bateaux_sont_coules(bateaux_ia):
            afficher_titre("VICTOIRE")
            print("Bravo, vous avez coule tous les bateaux de l'IA.")
            return

        coordonnees_ia = choisir_tir_ia(grille_tirs_ia, cibles_ia)
        resultat_ia, bateau_joueur = effectuer_tir(
            coordonnees_ia,
            grille_tirs_ia,
            grille_bateaux_joueur,
            bateaux_joueur
        )

        if resultat_ia in ("touche", "coule"):
            ajouter_cibles_ia(coordonnees_ia, cibles_ia, grille_tirs_ia)

        afficher_titre("TIR DE L'IA")
        afficher_message_tir_ia(coordonnees_ia, resultat_ia, bateau_joueur)
        afficher_plateaux_duel(
            grille_tirs_joueur,
            grille_bateaux_ia,
            grille_tirs_ia,
            grille_bateaux_joueur
        )

        if tous_les_bateaux_sont_coules(bateaux_joueur):
            afficher_titre("DEFAITE")
            print("L'IA a coule tous vos bateaux.")
            return

        tour += 1


def afficher_menu():
    afficher_titre("TOUCHER-COULE BATEAU EN PYTHON")
    print("1. Nouvelle partie solo")
    print("2. Jouer contre l'IA")
    print("3. Afficher les regles")
    print("4. Quitter")


def main():
    continuer = True

    while continuer:
        afficher_menu()
        choix = input("Votre choix : ").strip()

        if choix == "1":
            jouer_partie()
        elif choix == "2":
            jouer_contre_ia()
        elif choix == "3":
            afficher_regles()
        elif choix == "4":
            continuer = False
        else:
            print("Erreur : choix invalide.")

    afficher_titre("FIN DU PROGRAMME")
    print("Merci d'avoir joue.")


if __name__ == "__main__":
    main()
