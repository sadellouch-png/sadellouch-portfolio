(function () {
    var liens = document.querySelectorAll("[data-download]");

    function telechargerFichier(lien, contenu) {
        var nomFichier = lien.getAttribute("download") || lien.getAttribute("href");
        var blob = new Blob([contenu], { type: "application/octet-stream" });
        var url = URL.createObjectURL(blob);
        var telechargement = document.createElement("a");

        telechargement.href = url;
        telechargement.download = nomFichier;
        document.body.appendChild(telechargement);
        telechargement.click();
        telechargement.remove();
        URL.revokeObjectURL(url);
    }

    for (var i = 0; i < liens.length; i += 1) {
        liens[i].addEventListener("click", function (event) {
            var lien = event.currentTarget;
            var chemin = lien.getAttribute("href");

            event.preventDefault();

            fetch(chemin)
                .then(function (reponse) {
                    if (!reponse.ok) {
                        throw new Error("telechargement impossible");
                    }

                    return reponse.text();
                })
                .then(function (contenu) {
                    telechargerFichier(lien, contenu);
                })
                .catch(function () {
                    window.location.href = chemin;
                });
        });
    }
}());
