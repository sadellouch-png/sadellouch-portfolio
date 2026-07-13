(function () {
    var terminal = document.getElementById("gestionnaire-mdp");

    if (!terminal) {
        return;
    }

    var screen = document.getElementById("password-screen");
    var form = document.getElementById("password-form");
    var input = document.getElementById("password-input");
    var toggleButton = document.getElementById("password-toggle");
    var resetButton = document.getElementById("password-reset");
    var demoButton = document.getElementById("password-demo");

    var coffre;
    var etape;
    var motDePasseMaitre;
    var entreeTemporaire;
    var resultatsRecherche;
    var indexSelectionne;
    var champSecret;
    var secretVisible;

    function ajouterLigne(texte, classe) {
        var ligne = document.createElement("p");
        ligne.className = "money-line " + (classe || "normal");
        ligne.textContent = texte;
        screen.appendChild(ligne);
        screen.scrollTop = screen.scrollHeight;
    }

    function afficherTitre(titre) {
        ajouterLigne("");
        ajouterLigne("=".repeat(64), "muted");
        ajouterLigne(titre, "title");
        ajouterLigne("=".repeat(64), "muted");
    }

    function poserQuestion(texte, secret) {
        ajouterLigne(texte, "prompt");
        input.placeholder = texte;
        definirChampSecret(secret);
        input.focus({ preventScroll: true });
    }

    function definirChampSecret(secret) {
        champSecret = !!secret;
        secretVisible = false;
        input.type = champSecret ? "password" : "text";

        if (toggleButton) {
            toggleButton.hidden = !champSecret;
            toggleButton.textContent = "Afficher";
            toggleButton.setAttribute("aria-pressed", "false");
        }
    }

    function texteOuiNon(texte) {
        var valeur = texte.trim().toLowerCase();
        if (valeur === "o" || valeur === "oui") {
            return true;
        }
        if (valeur === "n" || valeur === "non") {
            return false;
        }
        return null;
    }

    function nombreAleatoire(maximum) {
        var tableau;

        if (window.crypto && window.crypto.getRandomValues) {
            tableau = new Uint32Array(1);
            window.crypto.getRandomValues(tableau);
            return tableau[0] % maximum;
        }

        return Math.floor(Math.random() * maximum);
    }

    function genererMotDePasse(longueur) {
        var minuscules = "abcdefghijklmnopqrstuvwxyz";
        var majuscules = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        var chiffres = "0123456789";
        var speciaux = "!@#$%&*()-_=+?";
        var alphabet = minuscules + majuscules + chiffres + speciaux;
        var caracteres = [
            minuscules[nombreAleatoire(minuscules.length)],
            majuscules[nombreAleatoire(majuscules.length)],
            chiffres[nombreAleatoire(chiffres.length)],
            speciaux[nombreAleatoire(speciaux.length)]
        ];
        var i;
        var j;
        var temporaire;

        longueur = Math.max(longueur || 16, 8);

        while (caracteres.length < longueur) {
            caracteres.push(alphabet[nombreAleatoire(alphabet.length)]);
        }

        for (i = caracteres.length - 1; i > 0; i -= 1) {
            j = nombreAleatoire(i + 1);
            temporaire = caracteres[i];
            caracteres[i] = caracteres[j];
            caracteres[j] = temporaire;
        }

        return caracteres.join("");
    }

    function afficherMenu() {
        afficherTitre("MENU DU COFFRE-FORT");
        ajouterLigne("1. Ajouter un mot de passe");
        ajouterLigne("2. Rechercher une entree");
        ajouterLigne("3. Lister les services");
        ajouterLigne("4. Modifier une entree");
        ajouterLigne("5. Supprimer une entree");
        ajouterLigne("6. Generer un mot de passe fort");
        ajouterLigne("7. Sauvegarder et quitter");
        ajouterLigne("Choisissez uniquement un nombre entre 1 et 7.", "muted");
        etape = "menu";
        poserQuestion("Votre choix (1 a 7) :");
    }

    function afficherEntree(entree, afficherMotDePasse) {
        ajouterLigne("Service     : " + entree.service);
        ajouterLigne("Identifiant : " + entree.identifiant);
        ajouterLigne("Note        : " + (entree.note || "Aucune"));
        ajouterLigne("Mot de passe: " + (afficherMotDePasse ? entree.motDePasse : "********"));
    }

    function rechercher(terme) {
        var valeur = terme.trim().toLowerCase();
        var resultats = [];
        var i;
        var entree;

        for (i = 0; i < coffre.length; i += 1) {
            entree = coffre[i];
            if (
                entree.service.toLowerCase().indexOf(valeur) !== -1 ||
                entree.identifiant.toLowerCase().indexOf(valeur) !== -1
            ) {
                resultats.push(i);
            }
        }

        return resultats;
    }

    function demanderSelection(resultats, prochaineEtape) {
        var i;
        var entree;

        if (resultats.length === 0) {
            ajouterLigne("Aucun resultat trouve.", "error");
            afficherMenu();
            return;
        }

        resultatsRecherche = resultats;
        ajouterLigne("");
        ajouterLigne("Resultats :", "title");

        for (i = 0; i < resultats.length; i += 1) {
            entree = coffre[resultats[i]];
            ajouterLigne((i + 1) + ". " + entree.service + " - " + entree.identifiant);
        }

        etape = prochaineEtape;
        poserQuestion("Numero de l'entree a selectionner ou n pour revenir :");
    }

    function lireSelection(reponse) {
        var choix = reponse.trim().toLowerCase();
        var numero;

        if (choix === "n" || choix === "non") {
            afficherMenu();
            return null;
        }

        if (!/^\d+$/.test(choix)) {
            ajouterLigne("Choix invalide.", "error");
            poserQuestion("Numero de l'entree a selectionner ou n pour revenir :");
            return null;
        }

        numero = Number(choix);

        if (numero < 1 || numero > resultatsRecherche.length) {
            ajouterLigne("Numero inexistant.", "error");
            poserQuestion("Numero de l'entree a selectionner ou n pour revenir :");
            return null;
        }

        return resultatsRecherche[numero - 1];
    }

    function demarrer() {
        screen.textContent = "";
        input.disabled = false;
        input.value = "";
        definirChampSecret(false);
        coffre = [];
        motDePasseMaitre = "";
        entreeTemporaire = null;
        resultatsRecherche = [];
        indexSelectionne = null;
        etape = "creation_mdp";

        afficherTitre("GESTIONNAIRE DE MOTS DE PASSE");
        ajouterLigne("Demo web du projet Python.");
        ajouterLigne("La vraie version cree un fichier coffre_mdp.json chiffre sur le disque.");
        ajouterLigne("Ici, les donnees restent seulement dans cette page.");
        poserQuestion("Creez un mot de passe maitre :", true);
    }

    function chargerExemple() {
        screen.textContent = "";
        coffre = [
            {
                service: "Gmail",
                identifiant: "samy@gmail.com",
                motDePasse: "Gm!82pQa#2026",
                note: "Compte personnel"
            },
            {
                service: "GitHub",
                identifiant: "AdellouchSamy",
                motDePasse: "Gh#47LmP!91",
                note: "Depot des projets Python"
            }
        ];
        input.disabled = false;
        definirChampSecret(false);
        motDePasseMaitre = "demo";
        afficherTitre("COFFRE EXEMPLE CHARGE");
        ajouterLigne("Deux entrees de demonstration ont ete ajoutees.", "success");
        afficherMenu();
    }

    function traiterMenu(reponse) {
        var choix = reponse.trim();

        if (choix === "1") {
            entreeTemporaire = {};
            etape = "ajout_service";
            afficherTitre("AJOUTER UN MOT DE PASSE");
            poserQuestion("Service ou site :");
        } else if (choix === "2") {
            if (coffre.length === 0) {
                ajouterLigne("Le coffre est vide.", "error");
                afficherMenu();
                return;
            }
            etape = "recherche_terme";
            afficherTitre("RECHERCHER UNE ENTREE");
            poserQuestion("Recherche par service ou identifiant :");
        } else if (choix === "3") {
            afficherTitre("LISTE DES SERVICES");
            if (coffre.length === 0) {
                ajouterLigne("Le coffre est vide.");
            } else {
                coffre.forEach(function (entree, index) {
                    ajouterLigne((index + 1) + ". " + entree.service + " - " + entree.identifiant);
                });
            }
            afficherMenu();
        } else if (choix === "4") {
            if (coffre.length === 0) {
                ajouterLigne("Le coffre est vide.", "error");
                afficherMenu();
                return;
            }
            etape = "modifier_terme";
            afficherTitre("MODIFIER UNE ENTREE");
            poserQuestion("Entree a modifier :");
        } else if (choix === "5") {
            if (coffre.length === 0) {
                ajouterLigne("Le coffre est vide.", "error");
                afficherMenu();
                return;
            }
            etape = "supprimer_terme";
            afficherTitre("SUPPRIMER UNE ENTREE");
            poserQuestion("Entree a supprimer :");
        } else if (choix === "6") {
            etape = "generer_longueur";
            afficherTitre("GENERATEUR DE MOTS DE PASSE");
            poserQuestion("Longueur souhaitee (16 par defaut) :");
        } else if (choix === "7") {
            afficherTitre("FIN DU PROGRAMME");
            ajouterLigne("Coffre sauvegarde dans la version Python.", "success");
            ajouterLigne("Merci d'avoir utilise le gestionnaire de mots de passe.");
            input.disabled = true;
        } else {
            ajouterLigne("Choix invalide. Entrez uniquement un nombre entre 1 et 7.", "error");
            poserQuestion("Votre choix (1 a 7) :");
        }
    }

    function traiterAjout(reponse) {
        var choix;
        var longueur;

        if (etape === "ajout_service") {
            if (reponse.trim() === "") {
                ajouterLigne("Le service ne peut pas etre vide.", "error");
                poserQuestion("Service ou site :");
                return;
            }
            entreeTemporaire.service = reponse.trim();
            etape = "ajout_identifiant";
            poserQuestion("Identifiant ou email :");
        } else if (etape === "ajout_identifiant") {
            if (reponse.trim() === "") {
                ajouterLigne("L'identifiant ne peut pas etre vide.", "error");
                poserQuestion("Identifiant ou email :");
                return;
            }
            entreeTemporaire.identifiant = reponse.trim();
            etape = "ajout_generation";
            poserQuestion("Generer un mot de passe fort ? (o/n)");
        } else if (etape === "ajout_generation") {
            choix = texteOuiNon(reponse);
            if (choix === null) {
                ajouterLigne("Tapez o ou n.", "error");
                poserQuestion("Generer un mot de passe fort ? (o/n)");
                return;
            }
            if (choix) {
                entreeTemporaire.motDePasse = genererMotDePasse(16);
                ajouterLigne("Mot de passe genere : " + entreeTemporaire.motDePasse, "success");
                etape = "ajout_note";
                poserQuestion("Note facultative :");
            } else {
                etape = "ajout_mdp";
                poserQuestion("Mot de passe a enregistrer :", true);
            }
        } else if (etape === "ajout_mdp") {
            if (reponse.trim() === "") {
                ajouterLigne("Le mot de passe ne peut pas etre vide.", "error");
                poserQuestion("Mot de passe a enregistrer :", true);
                return;
            }
            entreeTemporaire.motDePasse = reponse;
            etape = "ajout_note";
            poserQuestion("Note facultative :");
        } else if (etape === "ajout_note") {
            entreeTemporaire.note = reponse.trim();
            coffre.push(entreeTemporaire);
            entreeTemporaire = null;
            ajouterLigne("Entree ajoutee au coffre.", "success");
            afficherMenu();
        } else if (etape === "generer_longueur") {
            longueur = 16;
            if (/^\d+$/.test(reponse.trim())) {
                longueur = Number(reponse.trim());
            }
            ajouterLigne("Mot de passe genere : " + genererMotDePasse(longueur), "success");
            afficherMenu();
        }
    }

    function traiterRecherche(reponse) {
        var index;

        if (etape === "recherche_terme") {
            demanderSelection(rechercher(reponse), "recherche_selection");
        } else if (etape === "recherche_selection") {
            index = lireSelection(reponse);
            if (index === null) {
                return;
            }
            afficherTitre("ENTREE TROUVEE");
            afficherEntree(coffre[index], true);
            afficherMenu();
        }
    }

    function traiterModification(reponse) {
        var index;

        if (etape === "modifier_terme") {
            demanderSelection(rechercher(reponse), "modifier_selection");
        } else if (etape === "modifier_selection") {
            index = lireSelection(reponse);
            if (index === null) {
                return;
            }
            indexSelectionne = index;
            etape = "modifier_mdp";
            ajouterLigne("Entree selectionnee : " + coffre[index].service + " - " + coffre[index].identifiant);
            poserQuestion("Nouveau mot de passe, AUTO pour generer, ou vide pour conserver :", false);
        } else if (etape === "modifier_mdp") {
            if (reponse.trim().toUpperCase() === "AUTO") {
                coffre[indexSelectionne].motDePasse = genererMotDePasse(16);
                ajouterLigne("Nouveau mot de passe genere : " + coffre[indexSelectionne].motDePasse, "success");
            } else if (reponse.trim() !== "") {
                coffre[indexSelectionne].motDePasse = reponse;
                ajouterLigne("Mot de passe modifie.", "success");
            } else {
                ajouterLigne("Mot de passe conserve.");
            }
            etape = "modifier_note";
            poserQuestion("Nouvelle note ou vide pour conserver :");
        } else if (etape === "modifier_note") {
            if (reponse.trim() !== "") {
                coffre[indexSelectionne].note = reponse.trim();
                ajouterLigne("Note modifiee.", "success");
            }
            indexSelectionne = null;
            afficherMenu();
        }
    }

    function traiterSuppression(reponse) {
        var index;
        var choix;

        if (etape === "supprimer_terme") {
            demanderSelection(rechercher(reponse), "supprimer_selection");
        } else if (etape === "supprimer_selection") {
            index = lireSelection(reponse);
            if (index === null) {
                return;
            }
            indexSelectionne = index;
            ajouterLigne("Selection : " + coffre[index].service + " - " + coffre[index].identifiant);
            etape = "supprimer_confirmation";
            poserQuestion("Confirmer la suppression ? (o/n)");
        } else if (etape === "supprimer_confirmation") {
            choix = texteOuiNon(reponse);
            if (choix === null) {
                ajouterLigne("Tapez o ou n.", "error");
                poserQuestion("Confirmer la suppression ? (o/n)");
                return;
            }
            if (choix) {
                coffre.splice(indexSelectionne, 1);
                ajouterLigne("Entree supprimee.", "success");
            } else {
                ajouterLigne("Suppression annulee.");
            }
            indexSelectionne = null;
            afficherMenu();
        }
    }

    form.addEventListener("submit", function (event) {
        var reponse;
        var affichage;

        event.preventDefault();

        if (input.disabled) {
            return;
        }

        reponse = input.value;
        affichage = champSecret && reponse !== "" ? "********" : reponse;
        ajouterLigne("> " + affichage, "answer");
        input.value = "";
        definirChampSecret(false);

        if (etape === "creation_mdp") {
            if (reponse.length < 8) {
                ajouterLigne("Le mot de passe maitre doit contenir au moins 8 caracteres.", "error");
                poserQuestion("Creez un mot de passe maitre :", true);
                return;
            }
            motDePasseMaitre = reponse;
            etape = "confirmation_mdp";
            poserQuestion("Confirmez le mot de passe maitre :", true);
        } else if (etape === "confirmation_mdp") {
            if (reponse !== motDePasseMaitre) {
                ajouterLigne("Les deux mots de passe ne correspondent pas.", "error");
                etape = "creation_mdp";
                poserQuestion("Creez un mot de passe maitre :", true);
                return;
            }
            ajouterLigne("Coffre cree avec succes.", "success");
            afficherMenu();
        } else if (etape === "menu") {
            traiterMenu(reponse);
        } else if (
            etape === "ajout_service" ||
            etape === "ajout_identifiant" ||
            etape === "ajout_generation" ||
            etape === "ajout_mdp" ||
            etape === "ajout_note" ||
            etape === "generer_longueur"
        ) {
            traiterAjout(reponse);
        } else if (etape === "recherche_terme" || etape === "recherche_selection") {
            traiterRecherche(reponse);
        } else if (
            etape === "modifier_terme" ||
            etape === "modifier_selection" ||
            etape === "modifier_mdp" ||
            etape === "modifier_note"
        ) {
            traiterModification(reponse);
        } else if (
            etape === "supprimer_terme" ||
            etape === "supprimer_selection" ||
            etape === "supprimer_confirmation"
        ) {
            traiterSuppression(reponse);
        }
    });

    if (toggleButton) {
        toggleButton.addEventListener("click", function () {
            if (!champSecret) {
                return;
            }

            secretVisible = !secretVisible;
            input.type = secretVisible ? "text" : "password";
            toggleButton.textContent = secretVisible ? "Masquer" : "Afficher";
            toggleButton.setAttribute("aria-pressed", secretVisible ? "true" : "false");
            input.focus({ preventScroll: true });
        });
    }

    resetButton.addEventListener("click", demarrer);
    demoButton.addEventListener("click", chargerExemple);

    demarrer();
}());
