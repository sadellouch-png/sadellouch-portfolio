(function () {
    var terminal = document.getElementById("rendu-monnaie");

    if (!terminal) {
        return;
    }

    var screen = document.getElementById("money-screen");
    var form = document.getElementById("money-form");
    var input = document.getElementById("money-input");
    var resetButton = document.getElementById("money-reset");
    var demoButton = document.getElementById("money-demo");

    var coupures = [
        ["Billet de 500 EUR", 50000],
        ["Billet de 200 EUR", 20000],
        ["Billet de 100 EUR", 10000],
        ["Billet de 50 EUR", 5000],
        ["Billet de 20 EUR", 2000],
        ["Billet de 10 EUR", 1000],
        ["Billet de 5 EUR", 500],
        ["Piece de 2 EUR", 200],
        ["Piece de 1 EUR", 100],
        ["Piece de 50 centimes", 50],
        ["Piece de 20 centimes", 20],
        ["Piece de 10 centimes", 10],
        ["Piece de 5 centimes", 5],
        ["Piece de 2 centimes", 2],
        ["Piece de 1 centime", 1]
    ];

    var caisse;
    var etape;
    var indexCoupure;
    var montantAPayer;
    var dernierResultat;

    function ajouterLigne(texte, classe) {
        var ligne = document.createElement("p");
        ligne.className = "money-line " + (classe || "normal");
        ligne.textContent = texte;
        screen.appendChild(ligne);
        screen.scrollTop = screen.scrollHeight;
    }

    function ajouterTitre(texte) {
        ajouterLigne("");
        ajouterLigne("=".repeat(64), "muted");
        ajouterLigne(texte, "title");
        ajouterLigne("=".repeat(64), "muted");
    }

    function poserQuestion(texte) {
        ajouterLigne(texte, "prompt");
        input.placeholder = texte;
        input.focus({ preventScroll: true });
    }

    function formaterEuros(centimes) {
        var signe = centimes < 0 ? "-" : "";
        var valeur = Math.abs(centimes);
        var euros = Math.floor(valeur / 100);
        var reste = String(valeur % 100).padStart(2, "0");
        return signe + euros + "," + reste + " EUR";
    }

    function convertirMontant(texte) {
        var propre = texte.trim().replace(/\s/g, "").replace(/eur/gi, "").replace(",", ".");

        if (propre === "") {
            throw new Error("le montant est obligatoire");
        }

        if (!/^\d+(\.\d{1,2})?$/.test(propre)) {
            throw new Error("le montant doit etre un nombre positif avec deux decimales maximum");
        }

        var parties = propre.split(".");
        var euros = Number(parties[0]);
        var centimes = parties[1] ? Number(parties[1].padEnd(2, "0")) : 0;
        return euros * 100 + centimes;
    }

    function convertirQuantite(texte) {
        var propre = texte.trim();

        if (propre === "") {
            return 0;
        }

        if (!/^\d+$/.test(propre)) {
            throw new Error("la quantite doit etre un nombre entier positif");
        }

        return Number(propre);
    }

    function creerCaisseVide() {
        var nouvelleCaisse = {};

        for (var i = 0; i < coupures.length; i += 1) {
            nouvelleCaisse[coupures[i][1]] = 0;
        }

        return nouvelleCaisse;
    }

    function totalCaisse() {
        var total = 0;

        for (var i = 0; i < coupures.length; i += 1) {
            var valeur = coupures[i][1];
            total += valeur * caisse[valeur];
        }

        return total;
    }

    function demarrer() {
        screen.textContent = "";
        input.disabled = false;
        input.value = "";
        caisse = creerCaisseVide();
        etape = "stock";
        indexCoupure = 0;
        montantAPayer = 0;
        dernierResultat = null;

        ajouterTitre("PROGRAMME DE RENDU DE MONNAIE");
        ajouterLigne("Bienvenue. Le programme va demander la caisse disponible.");
        ajouterLigne("Ensuite, il calculera le meilleur rendu possible.");
        demanderCoupure();
    }

    function demanderCoupure() {
        var coupure = coupures[indexCoupure];
        poserQuestion(coupure[0] + " (" + formaterEuros(coupure[1]) + ") - quantite disponible :");
    }

    function traiterStock(reponse) {
        try {
            caisse[coupures[indexCoupure][1]] = convertirQuantite(reponse);
            indexCoupure += 1;
        } catch (erreur) {
            ajouterLigne("Erreur : " + erreur.message, "error");
            demanderCoupure();
            return;
        }

        if (indexCoupure < coupures.length) {
            demanderCoupure();
            return;
        }

        ajouterLigne("Total disponible dans la caisse : " + formaterEuros(totalCaisse()));
        etape = "montant";
        ajouterTitre("NOUVELLE TRANSACTION");
        poserQuestion("Montant a payer :");
    }

    function traiterMontant(reponse) {
        try {
            montantAPayer = convertirMontant(reponse);
            etape = "somme";
            poserQuestion("Somme donnee par le client :");
        } catch (erreur) {
            ajouterLigne("Erreur : " + erreur.message, "error");
            poserQuestion("Montant a payer :");
        }
    }

    function traiterSomme(reponse) {
        var sommeDonnee;

        try {
            sommeDonnee = convertirMontant(reponse);
        } catch (erreur) {
            ajouterLigne("Erreur : " + erreur.message, "error");
            poserQuestion("Somme donnee par le client :");
            return;
        }

        ajouterLigne("Montant a payer : " + formaterEuros(montantAPayer));
        ajouterLigne("Somme donnee    : " + formaterEuros(sommeDonnee));

        try {
            dernierResultat = calculerRendu(montantAPayer, sommeDonnee);
            afficherResultat(dernierResultat);
        } catch (erreur) {
            ajouterLigne("Impossible de traiter ce cas : " + erreur.message, "error");
            etape = "continuer";
            poserQuestion("Voulez-vous faire une autre transaction ? (o/n)");
            return;
        }

        if (dernierResultat.total === 0) {
            etape = "continuer";
            poserQuestion("Voulez-vous faire une autre transaction ? (o/n)");
            return;
        }

        etape = "valider";
        poserQuestion("Voulez-vous valider cette transaction ? (o/n)");
    }

    function calculerRendu(montant, somme) {
        var montantARendre = somme - montant;

        if (somme < montant) {
            throw new Error("somme insuffisante, il manque " + formaterEuros(montant - somme));
        }

        if (montantARendre === 0) {
            return { total: 0, lignes: [] };
        }

        if (totalCaisse() < montantARendre) {
            throw new Error("la caisse ne contient pas assez d'argent pour rendre " + formaterEuros(montantARendre));
        }

        var meilleurs = new Array(montantARendre + 1).fill(null);
        meilleurs[0] = { nombre: 0, quantites: new Array(coupures.length).fill(0) };

        for (var index = 0; index < coupures.length; index += 1) {
            var valeur = coupures[index][1];
            var disponible = caisse[valeur] || 0;

            if (disponible === 0) {
                continue;
            }

            var anciensEtats = [];

            for (var montantActuel = 0; montantActuel < meilleurs.length; montantActuel += 1) {
                if (meilleurs[montantActuel] !== null) {
                    anciensEtats.push([montantActuel, meilleurs[montantActuel]]);
                }
            }

            for (var a = 0; a < anciensEtats.length; a += 1) {
                var etat = anciensEtats[a][1];
                var base = anciensEtats[a][0];

                for (var quantite = 1; quantite <= disponible; quantite += 1) {
                    var nouveauMontant = base + valeur * quantite;

                    if (nouveauMontant > montantARendre) {
                        break;
                    }

                    var nouvellesQuantites = etat.quantites.slice();
                    nouvellesQuantites[index] += quantite;
                    var candidat = {
                        nombre: etat.nombre + quantite,
                        quantites: nouvellesQuantites
                    };

                    if (estMeilleur(candidat, meilleurs[nouveauMontant])) {
                        meilleurs[nouveauMontant] = candidat;
                    }
                }
            }
        }

        var resultat = meilleurs[montantARendre];

        if (resultat === null) {
            throw new Error("les billets et pieces disponibles ne permettent pas de rendre exactement " + formaterEuros(montantARendre));
        }

        var lignes = [];

        for (var i = 0; i < coupures.length; i += 1) {
            if (resultat.quantites[i] > 0) {
                lignes.push({
                    nom: coupures[i][0],
                    valeur: coupures[i][1],
                    quantite: resultat.quantites[i]
                });
            }
        }

        return { total: montantARendre, lignes: lignes };
    }

    function estMeilleur(candidat, actuel) {
        if (actuel === null) {
            return true;
        }

        if (candidat.nombre !== actuel.nombre) {
            return candidat.nombre < actuel.nombre;
        }

        return candidat.quantites.join(",") > actuel.quantites.join(",");
    }

    function afficherResultat(resultat) {
        var nombre = 0;
        ajouterLigne("-".repeat(64), "muted");
        ajouterLigne("Monnaie a rendre : " + formaterEuros(resultat.total));

        for (var i = 0; i < resultat.lignes.length; i += 1) {
            nombre += resultat.lignes[i].quantite;
        }

        ajouterLigne("Nombre total de billets/pieces : " + nombre);
        ajouterLigne("-".repeat(64), "muted");

        if (resultat.total === 0) {
            ajouterLigne("Paiement exact : aucune monnaie a rendre.");
            return;
        }

        for (var j = 0; j < resultat.lignes.length; j += 1) {
            var ligne = resultat.lignes[j];
            ajouterLigne(ligne.quantite + " x " + ligne.nom + " = " + formaterEuros(ligne.valeur * ligne.quantite));
        }
    }

    function traiterValidation(reponse) {
        var choix = reponse.trim().toLowerCase();

        if (choix === "o" || choix === "oui") {
            for (var i = 0; i < dernierResultat.lignes.length; i += 1) {
                var ligne = dernierResultat.lignes[i];
                caisse[ligne.valeur] -= ligne.quantite;
            }

            ajouterLigne("Transaction validee.", "success");
            ajouterLigne("Nouveau total en caisse : " + formaterEuros(totalCaisse()));
            etape = "continuer";
            poserQuestion("Voulez-vous faire une autre transaction ? (o/n)");
            return;
        }

        if (choix === "n" || choix === "non") {
            ajouterLigne("Transaction annulee. La caisse n'a pas ete modifiee.");
            etape = "continuer";
            poserQuestion("Voulez-vous faire une autre transaction ? (o/n)");
            return;
        }

        ajouterLigne("Reponse invalide. Tapez o ou n.", "error");
        poserQuestion("Voulez-vous valider cette transaction ? (o/n)");
    }

    function traiterContinuer(reponse) {
        var choix = reponse.trim().toLowerCase();

        if (choix === "o" || choix === "oui") {
            etape = "montant";
            ajouterTitre("NOUVELLE TRANSACTION");
            ajouterLigne("Total actuel en caisse : " + formaterEuros(totalCaisse()));
            poserQuestion("Montant a payer :");
            return;
        }

        if (choix === "n" || choix === "non") {
            etape = "fin";
            ajouterTitre("FIN DU PROGRAMME");
            ajouterLigne("Merci d'avoir utilise le programme.");
            input.disabled = true;
            return;
        }

        ajouterLigne("Reponse invalide. Tapez o ou n.", "error");
        poserQuestion("Voulez-vous faire une autre transaction ? (o/n)");
    }

    function remplirStockExemple() {
        caisse = creerCaisseVide();
        caisse[100] = 5;
        caisse[50] = 5;
        caisse[20] = 5;
        caisse[10] = 5;
        caisse[5] = 5;
        caisse[2] = 5;
        caisse[1] = 5;
        etape = "montant";
        indexCoupure = coupures.length;

        ajouterLigne("Stock exemple charge pour tester rapidement.", "success");
        ajouterLigne("Total disponible dans la caisse : " + formaterEuros(totalCaisse()));
        ajouterTitre("NOUVELLE TRANSACTION");
        poserQuestion("Montant a payer :");
    }

    form.addEventListener("submit", function (event) {
        event.preventDefault();

        if (input.disabled) {
            return;
        }

        var reponse = input.value;
        ajouterLigne("> " + reponse, "answer");
        input.value = "";

        if (etape === "stock") {
            traiterStock(reponse);
        } else if (etape === "montant") {
            traiterMontant(reponse);
        } else if (etape === "somme") {
            traiterSomme(reponse);
        } else if (etape === "valider") {
            traiterValidation(reponse);
        } else if (etape === "continuer") {
            traiterContinuer(reponse);
        }
    });

    resetButton.addEventListener("click", demarrer);
    demoButton.addEventListener("click", remplirStockExemple);

    demarrer();
}());
