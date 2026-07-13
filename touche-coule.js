(function () {
    var terminal = document.getElementById("touche-coule");

    if (!terminal) {
        return;
    }

    var screen = document.getElementById("battle-screen");
    var form = document.getElementById("battle-form");
    var input = document.getElementById("battle-input");
    var resetButton = document.getElementById("battle-reset");
    var autoButton = document.getElementById("battle-auto");

    var tailleGrille = 10;
    var lettres = "ABCDEFGHIJ";
    var inconnu = ".";
    var manque = "O";
    var touche = "X";
    var bateauVisible = "B";
    var modelesBateaux = [
        ["Patrouilleur", 2],
        ["Sous-marin 1", 3],
        ["Sous-marin 2", 3],
        ["Croiseur", 4]
    ];

    var grilleBateauxJoueur;
    var grilleBateauxIA;
    var grilleTirsJoueur;
    var grilleTirsIA;
    var bateauxJoueur;
    var bateauxIA;
    var ciblesIA;
    var etape;
    var indexPlacement;
    var coordonneePlacement;
    var tour;

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

    function poserQuestion(texte) {
        ajouterLigne(texte, "prompt");
        input.placeholder = texte;
        input.focus({ preventScroll: true });
    }

    function creerGrille(valeur) {
        var grille = [];

        for (var ligne = 0; ligne < tailleGrille; ligne += 1) {
            var nouvelleLigne = [];

            for (var colonne = 0; colonne < tailleGrille; colonne += 1) {
                nouvelleLigne.push(valeur);
            }

            grille.push(nouvelleLigne);
        }

        return grille;
    }

    function coordonneeVersTexte(coordonnees) {
        return lettres[coordonnees[0]] + String(coordonnees[1] + 1);
    }

    function convertirCoordonnees(texte) {
        var propre = texte.trim().toUpperCase().replace(/\s/g, "");

        if (propre === "") {
            throw new Error("la coordonnee est vide");
        }

        if (propre === "Q" || propre === "QUIT" || propre === "QUITTER") {
            return null;
        }

        var ligneTexte = propre.charAt(0);
        var colonneTexte = propre.slice(1);

        if (lettres.indexOf(ligneTexte) === -1) {
            throw new Error("la ligne doit etre une lettre entre A et J");
        }

        if (!/^\d+$/.test(colonneTexte)) {
            throw new Error("la colonne doit etre un nombre entre 1 et 10");
        }

        var ligne = lettres.indexOf(ligneTexte);
        var colonne = Number(colonneTexte) - 1;

        if (colonne < 0 || colonne >= tailleGrille) {
            throw new Error("la colonne doit etre comprise entre 1 et 10");
        }

        return [ligne, colonne];
    }

    function casesDuBateau(ligne, colonne, direction, taille) {
        var cases = [];

        for (var decalage = 0; decalage < taille; decalage += 1) {
            var nouvelleLigne = direction === "H" ? ligne : ligne + decalage;
            var nouvelleColonne = direction === "H" ? colonne + decalage : colonne;

            if (
                nouvelleLigne < 0 ||
                nouvelleLigne >= tailleGrille ||
                nouvelleColonne < 0 ||
                nouvelleColonne >= tailleGrille
            ) {
                return null;
            }

            cases.push([nouvelleLigne, nouvelleColonne]);
        }

        return cases;
    }

    function peutPlacer(grilleBateaux, cases) {
        if (cases === null) {
            return false;
        }

        for (var i = 0; i < cases.length; i += 1) {
            if (grilleBateaux[cases[i][0]][cases[i][1]] !== null) {
                return false;
            }
        }

        return true;
    }

    function placerBateau(grilleBateaux, bateaux, indice, cases) {
        var modele = modelesBateaux[indice];

        for (var i = 0; i < cases.length; i += 1) {
            grilleBateaux[cases[i][0]][cases[i][1]] = indice;
        }

        bateaux.push({
            nom: modele[0],
            taille: modele[1],
            cases: cases,
            touches: []
        });
    }

    function placerBateauxAleatoirement() {
        var grilleBateaux = creerGrille(null);
        var bateaux = [];

        for (var indice = 0; indice < modelesBateaux.length; indice += 1) {
            var taille = modelesBateaux[indice][1];
            var place = false;

            while (!place) {
                var ligne = Math.floor(Math.random() * tailleGrille);
                var colonne = Math.floor(Math.random() * tailleGrille);
                var direction = Math.random() < 0.5 ? "H" : "V";
                var cases = casesDuBateau(ligne, colonne, direction, taille);

                if (peutPlacer(grilleBateaux, cases)) {
                    placerBateau(grilleBateaux, bateaux, indice, cases);
                    place = true;
                }
            }
        }

        return {
            grille: grilleBateaux,
            bateaux: bateaux
        };
    }

    function bateauEstCoule(bateau) {
        return bateau.touches.length === bateau.taille;
    }

    function tousCoules(bateaux) {
        for (var i = 0; i < bateaux.length; i += 1) {
            if (!bateauEstCoule(bateaux[i])) {
                return false;
            }
        }

        return true;
    }

    function effectuerTir(coordonnees, grilleTirs, grilleBateaux, bateaux) {
        var ligne = coordonnees[0];
        var colonne = coordonnees[1];

        if (grilleTirs[ligne][colonne] !== inconnu) {
            return { resultat: "deja_tire", bateau: null };
        }

        var indiceBateau = grilleBateaux[ligne][colonne];

        if (indiceBateau === null) {
            grilleTirs[ligne][colonne] = manque;
            return { resultat: "manque", bateau: null };
        }

        grilleTirs[ligne][colonne] = touche;
        var bateau = bateaux[indiceBateau];
        bateau.touches.push(coordonnees);

        if (bateauEstCoule(bateau)) {
            return { resultat: "coule", bateau: bateau };
        }

        return { resultat: "touche", bateau: bateau };
    }

    function messageTir(prefixe, resultat, bateau) {
        if (resultat === "deja_tire") {
            ajouterLigne(prefixe + "case deja visee.", "error");
        } else if (resultat === "manque") {
            ajouterLigne(prefixe + "a l'eau.");
        } else if (resultat === "touche") {
            ajouterLigne(prefixe + "touche le " + bateau.nom + ".", "success");
        } else if (resultat === "coule") {
            ajouterLigne(prefixe + "coule le " + bateau.nom + ".", "success");
        }
    }

    function lignesGrille(grilleTirs, grilleBateaux, reveler) {
        var lignes = [];
        lignes.push("      1  2  3  4  5  6  7  8  9 10");
        lignes.push("   +" + "---".repeat(tailleGrille) + "+");

        for (var ligne = 0; ligne < tailleGrille; ligne += 1) {
            var texte = lettres[ligne] + "  |";

            for (var colonne = 0; colonne < tailleGrille; colonne += 1) {
                var symbole = grilleTirs[ligne][colonne];

                if (reveler && symbole === inconnu && grilleBateaux[ligne][colonne] !== null) {
                    symbole = bateauVisible;
                }

                texte += " " + symbole + " ";
            }

            lignes.push(texte + "|");
        }

        lignes.push("   +" + "---".repeat(tailleGrille) + "+");
        return lignes;
    }

    function afficherGrille(titre, grilleTirs, grilleBateaux, reveler) {
        ajouterLigne("");
        ajouterLigne(titre, "title");
        var lignes = lignesGrille(grilleTirs, grilleBateaux, reveler);

        for (var i = 0; i < lignes.length; i += 1) {
            ajouterLigne(lignes[i]);
        }
    }

    function afficherEtat(titre, bateaux) {
        ajouterLigne("");
        ajouterLigne(titre, "title");

        for (var i = 0; i < bateaux.length; i += 1) {
            var bateau = bateaux[i];
            var statut = "CACHE";

            if (bateauEstCoule(bateau)) {
                statut = "COULE";
            } else if (bateau.touches.length > 0) {
                statut = "TOUCHE";
            }

            ajouterLigne("- " + bateau.nom + " : " + bateau.touches.length + "/" + bateau.taille + " - " + statut);
        }
    }

    function afficherPlateaux(revelerIA) {
        afficherGrille("GRILLE DE L'IA - vos tirs", grilleTirsJoueur, grilleBateauxIA, revelerIA);
        afficherGrille("VOTRE GRILLE - vos bateaux et les tirs de l'IA", grilleTirsIA, grilleBateauxJoueur, true);
        afficherEtat("Etat de la flotte de l'IA", bateauxIA);
        afficherEtat("Etat de votre flotte", bateauxJoueur);
    }

    function casesVoisines(coordonnees) {
        var ligne = coordonnees[0];
        var colonne = coordonnees[1];
        var voisines = [];
        var directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];

        for (var i = 0; i < directions.length; i += 1) {
            var nouvelleLigne = ligne + directions[i][0];
            var nouvelleColonne = colonne + directions[i][1];

            if (
                nouvelleLigne >= 0 &&
                nouvelleLigne < tailleGrille &&
                nouvelleColonne >= 0 &&
                nouvelleColonne < tailleGrille
            ) {
                voisines.push([nouvelleLigne, nouvelleColonne]);
            }
        }

        return voisines;
    }

    function ajouterCiblesIA(coordonnees) {
        var voisines = casesVoisines(coordonnees);

        for (var i = 0; i < voisines.length; i += 1) {
            var ligne = voisines[i][0];
            var colonne = voisines[i][1];
            var dejaPresente = false;

            for (var j = 0; j < ciblesIA.length; j += 1) {
                if (ciblesIA[j][0] === ligne && ciblesIA[j][1] === colonne) {
                    dejaPresente = true;
                }
            }

            if (!dejaPresente && grilleTirsIA[ligne][colonne] === inconnu) {
                ciblesIA.push(voisines[i]);
            }
        }
    }

    function choisirTirIA() {
        while (ciblesIA.length > 0) {
            var cible = ciblesIA.shift();

            if (grilleTirsIA[cible[0]][cible[1]] === inconnu) {
                return cible;
            }
        }

        var casesDisponibles = [];

        for (var ligne = 0; ligne < tailleGrille; ligne += 1) {
            for (var colonne = 0; colonne < tailleGrille; colonne += 1) {
                if (grilleTirsIA[ligne][colonne] === inconnu) {
                    casesDisponibles.push([ligne, colonne]);
                }
            }
        }

        return casesDisponibles[Math.floor(Math.random() * casesDisponibles.length)];
    }

    function demarrerPartie() {
        var ia = placerBateauxAleatoirement();
        grilleBateauxIA = ia.grille;
        bateauxIA = ia.bateaux;
        grilleTirsJoueur = creerGrille(inconnu);
        grilleTirsIA = creerGrille(inconnu);
        ciblesIA = [];
        tour = 1;
        etape = "tir";
        input.disabled = false;

        screen.textContent = "";
        afficherTitre("PARTIE CONTRE L'IA");
        ajouterLigne("La grille de l'IA est cachee. Votre grille affiche vos bateaux.");
        afficherPlateaux(false);
        poserQuestion("Votre tir (ex : A1, J10 ou Q pour quitter) :");
    }

    function demarrerPlacementAuto() {
        var joueur = placerBateauxAleatoirement();
        grilleBateauxJoueur = joueur.grille;
        bateauxJoueur = joueur.bateaux;
        demarrerPartie();
    }

    function demanderPlacement() {
        var modele = modelesBateaux[indexPlacement];
        afficherGrille("VOTRE GRILLE - placement des bateaux", creerGrille(inconnu), grilleBateauxJoueur, true);
        poserQuestion("Case de depart pour " + modele[0] + " (" + modele[1] + " cases) :");
    }

    function demarrer() {
        screen.textContent = "";
        input.disabled = false;
        input.value = "";
        etape = "choix_placement";
        indexPlacement = 0;
        coordonneePlacement = null;
        afficherTitre("TOUCHER-COULE BATEAU EN PYTHON");
        ajouterLigne("Mode disponible : joueur contre IA.");
        ajouterLigne("Vous pouvez placer vos bateaux manuellement ou utiliser le placement automatique.");
        poserQuestion("Voulez-vous placer vos bateaux vous-meme ? (o/n)");
    }

    function traiterChoixPlacement(reponse) {
        var choix = reponse.trim().toLowerCase();

        if (choix === "o" || choix === "oui") {
            grilleBateauxJoueur = creerGrille(null);
            bateauxJoueur = [];
            etape = "placement_case";
            afficherTitre("PLACEMENT DE VOS BATEAUX");
            demanderPlacement();
            return;
        }

        if (choix === "n" || choix === "non") {
            ajouterLigne("Placement automatique choisi.", "success");
            demarrerPlacementAuto();
            return;
        }

        ajouterLigne("Reponse invalide. Tapez o ou n.", "error");
        poserQuestion("Voulez-vous placer vos bateaux vous-meme ? (o/n)");
    }

    function traiterPlacementCase(reponse) {
        try {
            coordonneePlacement = convertirCoordonnees(reponse);
        } catch (erreur) {
            ajouterLigne("Erreur : " + erreur.message, "error");
            demanderPlacement();
            return;
        }

        if (coordonneePlacement === null) {
            ajouterLigne("Impossible de quitter pendant le placement.", "error");
            demanderPlacement();
            return;
        }

        etape = "placement_direction";
        poserQuestion("Direction horizontale ou verticale ? (H/V)");
    }

    function traiterPlacementDirection(reponse) {
        var direction = reponse.trim().toUpperCase();

        if (direction === "HORIZONTAL" || direction === "HORIZONTALE") {
            direction = "H";
        }

        if (direction === "VERTICAL" || direction === "VERTICALE") {
            direction = "V";
        }

        if (direction !== "H" && direction !== "V") {
            ajouterLigne("Erreur : entrez H ou V.", "error");
            poserQuestion("Direction horizontale ou verticale ? (H/V)");
            return;
        }

        var modele = modelesBateaux[indexPlacement];
        var cases = casesDuBateau(coordonneePlacement[0], coordonneePlacement[1], direction, modele[1]);

        if (!peutPlacer(grilleBateauxJoueur, cases)) {
            ajouterLigne("Placement impossible : le bateau sort de la grille ou chevauche un autre bateau.", "error");
            etape = "placement_case";
            demanderPlacement();
            return;
        }

        placerBateau(grilleBateauxJoueur, bateauxJoueur, indexPlacement, cases);
        ajouterLigne(modele[0] + " place correctement.", "success");
        indexPlacement += 1;

        if (indexPlacement >= modelesBateaux.length) {
            demarrerPartie();
            return;
        }

        etape = "placement_case";
        demanderPlacement();
    }

    function traiterTir(reponse) {
        var coordonnees;

        try {
            coordonnees = convertirCoordonnees(reponse);
        } catch (erreur) {
            ajouterLigne("Erreur : " + erreur.message, "error");
            poserQuestion("Votre tir (ex : A1, J10 ou Q pour quitter) :");
            return;
        }

        if (coordonnees === null) {
            afficherTitre("PARTIE ABANDONNEE");
            afficherPlateaux(true);
            input.disabled = true;
            return;
        }

        afficherTitre("TOUR " + tour + " - VOTRE TIR");
        ajouterLigne("Vous tirez en " + coordonneeVersTexte(coordonnees) + ".");
        var tirJoueur = effectuerTir(coordonnees, grilleTirsJoueur, grilleBateauxIA, bateauxIA);
        messageTir("", tirJoueur.resultat, tirJoueur.bateau);

        if (tirJoueur.resultat === "deja_tire") {
            afficherPlateaux(false);
            poserQuestion("Choisissez une autre case :");
            return;
        }

        if (tousCoules(bateauxIA)) {
            afficherTitre("VICTOIRE");
            afficherPlateaux(true);
            ajouterLigne("Bravo, vous avez coule tous les bateaux de l'IA.", "success");
            input.disabled = true;
            return;
        }

        var tirIA = choisirTirIA();
        var resultatIA = effectuerTir(tirIA, grilleTirsIA, grilleBateauxJoueur, bateauxJoueur);

        if (resultatIA.resultat === "touche" || resultatIA.resultat === "coule") {
            ajouterCiblesIA(tirIA);
        }

        afficherTitre("TOUR " + tour + " - TIR DE L'IA");
        ajouterLigne("L'IA tire en " + coordonneeVersTexte(tirIA) + ".");
        messageTir("L'IA ", resultatIA.resultat, resultatIA.bateau);
        afficherPlateaux(false);

        if (tousCoules(bateauxJoueur)) {
            afficherTitre("DEFAITE");
            afficherPlateaux(true);
            ajouterLigne("L'IA a coule tous vos bateaux.", "error");
            input.disabled = true;
            return;
        }

        tour += 1;
        poserQuestion("Votre tir (ex : A1, J10 ou Q pour quitter) :");
    }

    form.addEventListener("submit", function (event) {
        event.preventDefault();

        if (input.disabled) {
            return;
        }

        var reponse = input.value;
        ajouterLigne("> " + reponse, "answer");
        input.value = "";

        if (etape === "choix_placement") {
            traiterChoixPlacement(reponse);
        } else if (etape === "placement_case") {
            traiterPlacementCase(reponse);
        } else if (etape === "placement_direction") {
            traiterPlacementDirection(reponse);
        } else if (etape === "tir") {
            traiterTir(reponse);
        }
    });

    resetButton.addEventListener("click", demarrer);
    autoButton.addEventListener("click", demarrerPlacementAuto);

    demarrer();
}());
