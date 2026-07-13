import base64
import json
import os
import secrets
import string
import sys
from getpass import getpass
from pathlib import Path

try:
    from cryptography.fernet import Fernet, InvalidToken
    from cryptography.hazmat.primitives import hashes
    from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
except ImportError:
    print("La bibliotheque 'cryptography' est manquante.")
    print("Installez-la avec : py -m pip install cryptography")
    sys.exit(1)


FICHIER_COFFRE = Path(__file__).with_name("coffre_mdp.json")
VERSION_COFFRE = 1
ITERATIONS_PBKDF2 = 600000


def afficher_titre(titre):
    largeur = 72
    print()
    print("=" * largeur)
    print(titre.center(largeur))
    print("=" * largeur)


def pause():
    input("\nAppuyez sur Entree pour continuer...")


def lire_texte(message):
    return input(message).strip()


def lire_texte_obligatoire(message):
    valeur = ""
    while valeur == "":
        valeur = lire_texte(message)
        if valeur == "":
            print("Cette valeur ne peut pas etre vide.")
    return valeur


def lire_secret(message):
    if "SPYDER_KERNEL_ID" in os.environ:
        print("Info Spyder : le mot de passe sera visible dans cette console.")
        return input(message)

    try:
        return getpass(message)
    except Exception:
        return input(message)


def demander_oui_non(message):
    while True:
        reponse = lire_texte(message + " (o/n) ").lower()
        if reponse in ("o", "oui"):
            return True
        if reponse in ("n", "non"):
            return False
        print("Reponse attendue : o ou n.")


def deriver_cle(mot_de_passe_maitre, sel, iterations):
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=sel,
        iterations=iterations,
    )
    cle = kdf.derive(mot_de_passe_maitre.encode("utf-8"))
    return base64.urlsafe_b64encode(cle)


def chiffrer_donnees(fernet, entrees):
    donnees_json = json.dumps(entrees, ensure_ascii=False, indent=2)
    return fernet.encrypt(donnees_json.encode("utf-8")).decode("utf-8")


def dechiffrer_donnees(fernet, texte_chiffre):
    donnees = fernet.decrypt(texte_chiffre.encode("utf-8"))
    return json.loads(donnees.decode("utf-8"))


def sauvegarder_coffre(coffre, fernet, entrees):
    coffre["donnees"] = chiffrer_donnees(fernet, entrees)
    with open(FICHIER_COFFRE, "w", encoding="utf-8") as fichier:
        json.dump(coffre, fichier, ensure_ascii=False, indent=2)


def verifier_force_mdp(mot_de_passe):
    erreurs = []

    if len(mot_de_passe) < 10:
        erreurs.append("- au moins 10 caracteres")
    if not any(caractere.islower() for caractere in mot_de_passe):
        erreurs.append("- une lettre minuscule")
    if not any(caractere.isupper() for caractere in mot_de_passe):
        erreurs.append("- une lettre majuscule")
    if not any(caractere.isdigit() for caractere in mot_de_passe):
        erreurs.append("- un chiffre")
    if not any(caractere in "!@#$%&*()-_=+?" for caractere in mot_de_passe):
        erreurs.append("- un caractere special parmi !@#$%&*()-_=+?")

    return erreurs


def creer_mot_de_passe_maitre():
    while True:
        print("\nCreation du mot de passe maitre.")
        print("Conseil : utilisez une phrase longue que vous pouvez retenir.")
        mot_de_passe = lire_secret("Nouveau mot de passe maitre : ")
        confirmation = lire_secret("Confirmez le mot de passe maitre : ")

        if mot_de_passe != confirmation:
            print("Les deux mots de passe ne correspondent pas.")
            continue

        erreurs = verifier_force_mdp(mot_de_passe)
        if erreurs:
            print("\nLe mot de passe maitre est faible. Il manque :")
            for erreur in erreurs:
                print(erreur)
            if not demander_oui_non("Voulez-vous quand meme l'utiliser"):
                continue

        return mot_de_passe


def creer_coffre():
    afficher_titre("CREATION DU COFFRE-FORT")
    print("Aucun coffre n'a ete trouve.")
    print("Le programme va creer un coffre local chiffre.")

    mot_de_passe_maitre = creer_mot_de_passe_maitre()
    sel = secrets.token_bytes(16)
    cle = deriver_cle(mot_de_passe_maitre, sel, ITERATIONS_PBKDF2)
    fernet = Fernet(cle)

    coffre = {
        "version": VERSION_COFFRE,
        "algorithme": "Fernet + PBKDF2-HMAC-SHA256",
        "iterations": ITERATIONS_PBKDF2,
        "sel": base64.b64encode(sel).decode("utf-8"),
        "verificateur": fernet.encrypt(b"mot_de_passe_correct").decode("utf-8"),
        "donnees": "",
    }

    entrees = []
    sauvegarder_coffre(coffre, fernet, entrees)
    print("\nCoffre cree avec succes.")
    return coffre, fernet, entrees


def charger_fichier_coffre():
    with open(FICHIER_COFFRE, "r", encoding="utf-8") as fichier:
        return json.load(fichier)


def ouvrir_coffre_existant():
    afficher_titre("OUVERTURE DU COFFRE-FORT")
    coffre = charger_fichier_coffre()
    sel = base64.b64decode(coffre["sel"])
    iterations = int(coffre.get("iterations", ITERATIONS_PBKDF2))

    for tentative in range(1, 4):
        mot_de_passe_maitre = lire_secret("Mot de passe maitre : ")
        cle = deriver_cle(mot_de_passe_maitre, sel, iterations)
        fernet = Fernet(cle)

        try:
            fernet.decrypt(coffre["verificateur"].encode("utf-8"))
            entrees = dechiffrer_donnees(fernet, coffre["donnees"])
            print("\nCoffre ouvert avec succes.")
            return coffre, fernet, entrees
        except InvalidToken:
            print("Mot de passe maitre incorrect.")
            print("Tentative", tentative, "sur 3.")

    print("\nAcces refuse. Le coffre reste chiffre.")
    sys.exit(1)


def ouvrir_ou_creer_coffre():
    if FICHIER_COFFRE.exists():
        return ouvrir_coffre_existant()
    return creer_coffre()


def generer_mot_de_passe(longueur):
    minuscules = string.ascii_lowercase
    majuscules = string.ascii_uppercase
    chiffres = string.digits
    speciaux = "!@#$%&*()-_=+?"
    alphabet = minuscules + majuscules + chiffres + speciaux

    longueur = max(longueur, 8)
    caracteres = [
        secrets.choice(minuscules),
        secrets.choice(majuscules),
        secrets.choice(chiffres),
        secrets.choice(speciaux),
    ]

    while len(caracteres) < longueur:
        caracteres.append(secrets.choice(alphabet))

    melangeur = secrets.SystemRandom()
    melangeur.shuffle(caracteres)
    return "".join(caracteres)


def afficher_resume_entree(entree, numero):
    print(str(numero) + ".", entree["service"], "-", entree["identifiant"])


def trouver_entrees(entrees, terme):
    terme = terme.lower()
    resultats = []

    for index, entree in enumerate(entrees):
        service = entree["service"].lower()
        identifiant = entree["identifiant"].lower()
        if terme in service or terme in identifiant:
            resultats.append(index)

    return resultats


def choisir_entree(entrees, message):
    if not entrees:
        print("Le coffre ne contient aucune entree.")
        return None

    terme = lire_texte_obligatoire(message)
    resultats = trouver_entrees(entrees, terme)

    if not resultats:
        print("Aucun resultat trouve.")
        return None

    print("\nResultats :")
    for position, index in enumerate(resultats, start=1):
        afficher_resume_entree(entrees[index], position)

    while True:
        choix = lire_texte("Numero de l'entree a selectionner : ")
        if choix.isdigit():
            position = int(choix)
            if 1 <= position <= len(resultats):
                return resultats[position - 1]
        print("Choix invalide.")


def ajouter_entree(entrees):
    afficher_titre("AJOUTER UN MOT DE PASSE")
    service = lire_texte_obligatoire("Service ou site : ")
    identifiant = lire_texte_obligatoire("Identifiant ou email : ")

    if demander_oui_non("Voulez-vous generer un mot de passe fort"):
        longueur_texte = lire_texte("Longueur souhaitee (16 par defaut) : ")
        longueur = 16
        if longueur_texte.isdigit():
            longueur = int(longueur_texte)
        mot_de_passe = generer_mot_de_passe(longueur)
        print("Mot de passe genere :", mot_de_passe)
    else:
        mot_de_passe = lire_secret("Mot de passe a enregistrer : ")
        while mot_de_passe == "":
            print("Le mot de passe ne peut pas etre vide.")
            mot_de_passe = lire_secret("Mot de passe a enregistrer : ")

    note = lire_texte("Note facultative : ")

    entrees.append(
        {
            "service": service,
            "identifiant": identifiant,
            "mot_de_passe": mot_de_passe,
            "note": note,
        }
    )

    print("\nEntree ajoutee.")


def lister_services(entrees):
    afficher_titre("LISTE DES SERVICES")

    if not entrees:
        print("Le coffre est vide.")
        return

    for index, entree in enumerate(entrees, start=1):
        afficher_resume_entree(entree, index)


def rechercher_entree(entrees):
    afficher_titre("RECHERCHER UNE ENTREE")
    index = choisir_entree(entrees, "Recherche par service ou identifiant : ")
    if index is None:
        return

    entree = entrees[index]
    print("\nService      :", entree["service"])
    print("Identifiant  :", entree["identifiant"])
    print("Note         :", entree["note"] if entree["note"] else "Aucune")

    if demander_oui_non("Afficher le mot de passe"):
        print("Mot de passe :", entree["mot_de_passe"])
    else:
        print("Mot de passe : ********")


def modifier_entree(entrees):
    afficher_titre("MODIFIER UNE ENTREE")
    index = choisir_entree(entrees, "Entree a modifier : ")
    if index is None:
        return False

    entree = entrees[index]
    print("\nLaissez vide pour conserver la valeur actuelle.")

    nouveau_service = lire_texte("Nouveau service [" + entree["service"] + "] : ")
    nouvel_identifiant = lire_texte("Nouvel identifiant [" + entree["identifiant"] + "] : ")
    nouvelle_note = lire_texte("Nouvelle note [" + entree["note"] + "] : ")

    if nouveau_service:
        entree["service"] = nouveau_service
    if nouvel_identifiant:
        entree["identifiant"] = nouvel_identifiant
    if nouvelle_note:
        entree["note"] = nouvelle_note

    if demander_oui_non("Changer le mot de passe"):
        if demander_oui_non("Generer un nouveau mot de passe fort"):
            longueur_texte = lire_texte("Longueur souhaitee (16 par defaut) : ")
            longueur = 16
            if longueur_texte.isdigit():
                longueur = int(longueur_texte)
            entree["mot_de_passe"] = generer_mot_de_passe(longueur)
            print("Nouveau mot de passe :", entree["mot_de_passe"])
        else:
            nouveau_mdp = lire_secret("Nouveau mot de passe : ")
            if nouveau_mdp:
                entree["mot_de_passe"] = nouveau_mdp

    print("\nEntree modifiee.")
    return True


def supprimer_entree(entrees):
    afficher_titre("SUPPRIMER UNE ENTREE")
    index = choisir_entree(entrees, "Entree a supprimer : ")
    if index is None:
        return False

    entree = entrees[index]
    print("\nSelection :", entree["service"], "-", entree["identifiant"])
    if demander_oui_non("Confirmer la suppression"):
        del entrees[index]
        print("Entree supprimee.")
        return True

    print("Suppression annulee.")
    return False


def outil_generation():
    afficher_titre("GENERATEUR DE MOTS DE PASSE")
    longueur_texte = lire_texte("Longueur souhaitee (16 par defaut) : ")
    longueur = 16

    if longueur_texte.isdigit():
        longueur = int(longueur_texte)

    mot_de_passe = generer_mot_de_passe(longueur)
    print("\nMot de passe genere :", mot_de_passe)
    print("Vous pouvez l'utiliser lors de l'ajout d'une entree.")


def afficher_menu():
    afficher_titre("GESTIONNAIRE DE MOTS DE PASSE")
    print("1. Ajouter un mot de passe")
    print("2. Rechercher une entree")
    print("3. Lister les services")
    print("4. Modifier une entree")
    print("5. Supprimer une entree")
    print("6. Generer un mot de passe fort")
    print("7. Sauvegarder et quitter")
    print("Choisissez uniquement un nombre entre 1 et 7.")
    print()


def main():
    print("Projet educatif : gestionnaire de mots de passe local.")
    print("Le fichier du coffre reste chiffre sur le disque.")

    coffre, fernet, entrees = ouvrir_ou_creer_coffre()

    while True:
        afficher_menu()
        choix = lire_texte("Votre choix (1 a 7) : ")

        if choix == "1":
            ajouter_entree(entrees)
            sauvegarder_coffre(coffre, fernet, entrees)
            pause()
        elif choix == "2":
            rechercher_entree(entrees)
            pause()
        elif choix == "3":
            lister_services(entrees)
            pause()
        elif choix == "4":
            if modifier_entree(entrees):
                sauvegarder_coffre(coffre, fernet, entrees)
            pause()
        elif choix == "5":
            if supprimer_entree(entrees):
                sauvegarder_coffre(coffre, fernet, entrees)
            pause()
        elif choix == "6":
            outil_generation()
            pause()
        elif choix == "7":
            sauvegarder_coffre(coffre, fernet, entrees)
            print("\nCoffre sauvegarde. A bientot.")
            break
        else:
            print("Choix invalide. Entrez uniquement un nombre entre 1 et 7.")
            pause()


if __name__ == "__main__":
    main()
