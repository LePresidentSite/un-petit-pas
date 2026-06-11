(function () {
  "use strict";

  const quotes = [
    "Tu n'as pas besoin de tout faire aujourd'hui. Un petit pas suffit.",
    "Chaque petit pas compte.",
    "Tu avances déjà.",
    "La perfection n'est pas nécessaire.",
    "Une maison plus légère commence par une seule action.",
    "Quinze minutes peuvent changer une journée.",
    "Faire un peu, c'est déjà faire.",
    "Ton énergie mérite d'être respectée.",
    "Choisis le plus petit geste possible.",
    "Le calme se construit doucement.",
    "Tu peux t'arrêter après ce petit pas.",
    "Aujourd'hui n'a pas besoin d'être parfait.",
    "Une surface dégagée peut offrir un peu d'air.",
    "Le progrès discret reste du progrès.",
    "Commence là où tes yeux se posent.",
    "Moins de pression, plus de douceur.",
    "Tu n'es pas en retard. Tu recommences simplement.",
    "Ton espace peut évoluer à ton rythme.",
    "Même deux minutes ont de la valeur.",
    "Ce que tu fais maintenant est suffisant.",
    "Avance avec ton énergie, pas contre elle.",
    "Une chose à la fois, puis une pause.",
    "Tu peux choisir la facilité aujourd'hui.",
    "Petit ne veut pas dire insignifiant.",
    "Prendre soin de ton espace, c'est aussi prendre soin de toi.",
    "La constance douce vaut mieux que l'effort parfait.",
    "Il n'y a rien à rattraper.",
    "Tu as le droit de simplifier.",
    "Un coin apaisé suffit pour commencer.",
    "Respire. Choisis une chose. C'est tout."
  ];

  const missions = [
    { title: "Libérer un tiroir", description: "Choisis un seul tiroir. Garde ce qui est utile, puis arrête-toi quand le minuteur sonne.", minutes: 10 },
    { title: "Faire briller l'évier", description: "Vide l'évier, rince-le et essuie rapidement le contour. Pas besoin de toucher au reste.", minutes: 8 },
    { title: "Dégager une tablette", description: "Retire ce qui n'a plus sa place sur une tablette visible et remets seulement l'essentiel.", minutes: 10 },
    { title: "Ramasser le salon", description: "Prends un panier et rassemble les objets qui appartiennent à une autre pièce.", minutes: 7 },
    { title: "Rafraîchir le réfrigérateur", description: "Jette un aliment périmé et essuie une seule tablette. Cette petite victoire suffit.", minutes: 10 },
    { title: "Room Rescue express", description: "Choisis la pièce qui te pèse le plus et range seulement ce qui est évident.", minutes: 5 },
    { title: "Dégager une chaise", description: "Retire tout ce qui s'est accumulé sur une chaise et redonne-lui sa fonction.", minutes: 5 },
    { title: "Trier le courrier", description: "Fais trois piles : agir, garder, recycler. Ne traite rien d'autre pour l'instant.", minutes: 8 },
    { title: "Nettoyer un miroir", description: "Choisis le miroir le plus utilisé et essuie-le, sans ajouter d'autre tâche.", minutes: 5 },
    { title: "Rassembler les tasses", description: "Fais un petit tour et rapporte seulement les verres et les tasses à la cuisine.", minutes: 4 },
    { title: "Dompter un Hot Spot", description: "Choisis une petite surface où les objets s'accumulent et replace cinq choses.", minutes: 5 },
    { title: "Préparer demain", description: "Dépose tes vêtements ou les essentiels de demain au même endroit.", minutes: 6 },
    { title: "Vider une poubelle", description: "Choisis une seule petite poubelle, vide-la et remets un sac propre.", minutes: 4 },
    { title: "Plier dix morceaux", description: "Plie ou suspends exactement dix vêtements, puis autorise-toi à arrêter.", minutes: 8 },
    { title: "Nettoyer une poignée", description: "Essuie les poignées les plus touchées dans une seule pièce.", minutes: 5 },
    { title: "Créer un panier de départ", description: "Rassemble les objets à donner dans un sac ou un panier clairement identifié.", minutes: 8 },
    { title: "Dégager la table", description: "Libère juste assez d'espace pour y déposer un repas ou une tasse.", minutes: 7 },
    { title: "Balayer une zone", description: "Choisis un petit passage très fréquenté et balaie seulement cet endroit.", minutes: 6 },
    { title: "Ranger les chaussures", description: "Aligne ou range les chaussures près de l'entrée. Ignore le reste de la pièce.", minutes: 5 },
    { title: "Faire le tour des déchets", description: "Avec un sac, ramasse uniquement ce qui est clairement à jeter.", minutes: 6 },
    { title: "Rafraîchir la toilette", description: "Nettoie rapidement le siège et la cuvette. Une version simple est parfaite.", minutes: 8 },
    { title: "Réunir les produits", description: "Regroupe les produits de soin qui traînent dans un seul contenant.", minutes: 6 },
    { title: "Changer les serviettes", description: "Remplace les serviettes de la salle de bain et mets les autres au lavage.", minutes: 5 },
    { title: "Faire le lit simplement", description: "Remonte la couverture et place les oreillers. Pas besoin d'un résultat parfait.", minutes: 3 },
    { title: "Sauver la table de chevet", description: "Jette les déchets et garde seulement trois objets utiles sur la surface.", minutes: 7 },
    { title: "Trier un sac", description: "Vide un sac à main, un sac à dos ou un sac réutilisable, puis replace l'essentiel.", minutes: 10 },
    { title: "Ranger cinq objets", description: "Choisis cinq objets visibles et ramène-les à leur place.", minutes: 4 },
    { title: "Essuyer le comptoir", description: "Dégage et essuie une section de comptoir, même si le reste attend.", minutes: 6 },
    { title: "Vérifier les restes", description: "Regarde les contenants au frigo et décide simplement : garder, congeler ou jeter.", minutes: 8 },
    { title: "Préparer une station d'eau", description: "Place une bouteille ou un verre d'eau à un endroit où tu le verras.", minutes: 3 },
    { title: "Nettoyer la télécommande", description: "Essuie les télécommandes et replace-les dans un endroit facile à retrouver.", minutes: 4 },
    { title: "Libérer le sol", description: "Ramasse seulement ce qui bloque le passage dans une pièce.", minutes: 6 },
    { title: "Choisir une boîte", description: "Ouvre une seule petite boîte et décide du sort de cinq objets.", minutes: 10 },
    { title: "Rassembler les câbles", description: "Regroupe les câbles visibles et retire ceux qui ne servent plus.", minutes: 8 },
    { title: "Rafraîchir l'entrée", description: "Secoue le tapis ou essuie rapidement le seuil de la porte.", minutes: 5 },
    { title: "Classer cinq papiers", description: "Traite cinq papiers seulement : recycler, archiver ou mettre à l'action.", minutes: 6 },
    { title: "Créer un coin calme", description: "Dégage un petit espace où poser une boisson, un livre ou simplement tes mains.", minutes: 8 },
    { title: "Lancer une machine", description: "Rassemble une brassée simple et démarre-la. La suite pourra attendre.", minutes: 7 },
    { title: "Remettre les coussins", description: "Replace les coussins et plie une couverture pour apaiser visuellement le salon.", minutes: 4 },
    { title: "Nettoyer une étagère de douche", description: "Retire les contenants vides et rince une seule tablette.", minutes: 7 },
    { title: "Faire une pause panier", description: "Pendant cinq minutes, remplis un panier avec les objets qui n'ont pas leur place ici.", minutes: 5 },
    { title: "Préparer une sortie facile", description: "Place clés, portefeuille et sac près de la porte pour alléger demain.", minutes: 4 }
  ];

  const tipActions = [
    "Prépare les vêtements du lendemain avant de te coucher.",
    "Fais briller l'évier pour créer un point de départ visuel.",
    "Gère un Hot Spot pendant seulement deux minutes.",
    "Utilise un minuteur visible plutôt que ta motivation.",
    "Désencombre avant d'acheter des contenants.",
    "Garde un panier pour les objets qui appartiennent ailleurs.",
    "Place les objets à l'endroit où tu les utilises vraiment.",
    "Commence par les déchets : la décision est plus facile.",
    "Choisis une surface de la taille d'une feuille de papier.",
    "Laisse les produits de nettoyage près de leur zone d'usage.",
    "Crée une maison simple pour tes clés.",
    "Range les objets fréquents entre la taille et les yeux.",
    "Limite-toi à cinq objets quand l'énergie est basse.",
    "Associe une mini-tâche à une habitude déjà installée.",
    "Prends une photo avant de commencer pour voir le progrès.",
    "Utilise des bacs ouverts si les couvercles deviennent un obstacle.",
    "Étiquette avec des mots simples et visibles.",
    "Mets un petit sac à déchets dans chaque zone utile.",
    "Garde un chiffon accessible pour les nettoyages spontanés.",
    "Décide à l'avance de ce que signifie « assez propre ».",
    "Réduis le nombre d'étapes entre utiliser et ranger.",
    "Fais une tournée des tasses une fois par jour.",
    "Transforme l'attente du micro-ondes en minute de rangement.",
    "Laisse un espace vide dans chaque tiroir.",
    "Choisis un seul type d'objet à trier à la fois.",
    "Range d'abord ce qui a déjà une place.",
    "Utilise une liste de trois tâches maximum.",
    "Commence par la pièce qui te rendrait la vie plus facile.",
    "Pose un panier de dons à un endroit accessible.",
    "Prends la décision la plus simple, pas la plus parfaite.",
    "Ferme la cuisine avec un rituel de cinq minutes.",
    "Prépare les produits avant de lancer le minuteur.",
    "Fais le lit dans sa version la plus simple.",
    "Garde les surfaces visibles aussi libres que possible.",
    "Regroupe les objets similaires avant de les organiser.",
    "Mets les choses importantes dans ton champ de vision.",
    "Utilise des rappels positifs plutôt que des reproches.",
    "Fais une pause avant d'ajouter une nouvelle tâche.",
    "Choisis une catégorie facile pour créer de l'élan.",
    "Nettoie de haut en bas pour éviter de recommencer.",
    "Garde une boîte « à décider » avec une date limite.",
    "Prévois un endroit pour les vêtements portés mais encore propres.",
    "Mets les sacs réutilisables près de la porte.",
    "Simplifie un rangement qui t'agace souvent.",
    "Range pendant la durée d'une seule chanson.",
    "Commence dans le coin le plus visible de la pièce.",
    "Laisse les outils utiles visibles s'ils sont beaux et pratiques.",
    "Choisis des contenants faciles à ouvrir d'une seule main.",
    "Fais une remise à zéro de deux minutes avant de quitter une pièce.",
    "Réserve une petite zone aux objets en transition.",
    "Mets un rappel près de l'action, pas loin dans ton téléphone.",
    "Évite de vider tout un placard en une fois.",
    "Travaille avec une boîte « garder », une boîte « donner » et un sac « jeter ».",
    "Célèbre la fin d'une tâche avant d'en choisir une autre.",
    "Garde un nombre réaliste de serviettes et de draps.",
    "Place une corbeille là où le papier s'accumule.",
    "Nettoie une tablette du frigo avant l'épicerie.",
    "Attribue une couleur à chaque membre de la maison.",
    "Utilise des crochets quand plier ou suspendre est trop exigeant.",
    "Prépare un petit kit de nettoyage transportable.",
    "Traite le courrier près du bac de recyclage.",
    "Laisse les doubles seulement là où ils sont vraiment utiles.",
    "Écris la prochaine action concrète, pas un grand projet.",
    "Découpe les tâches en blocs de cinq à dix minutes.",
    "Arrête-toi volontairement avant l'épuisement.",
    "Fais une vérification rapide du sol avant de passer l'aspirateur.",
    "Garde un plateau pour contenir les petits objets d'une surface.",
    "Réinitialise une seule zone chaque soir.",
    "Adapte ton système à tes gestes naturels.",
    "Utilise la règle « un entre, un sort » seulement si elle t'aide.",
    "Crée une liste « pas aujourd'hui » pour libérer ta tête.",
    "Mets la tâche la plus douce en premier.",
    "Préfère un rangement imparfait que tu utilises à un système parfait que tu évites."
  ];

  const tipEndings = [
    "Fais-en un essai sans chercher la perfection.",
    "Une version très simple est déjà utile.",
    "Adapte cette idée à ton énergie du jour.",
    "Tu peux t'arrêter après ce seul geste.",
    "Le meilleur système est celui que tu peux réellement utiliser."
  ];

  const tips = [];
  tipActions.forEach(function (action, actionIndex) {
    tipEndings.forEach(function (ending, endingIndex) {
      tips.push({
        id: "tip-" + String(actionIndex + 1).padStart(2, "0") + "-" + (endingIndex + 1),
        text: action + " " + ending
      });
    });
  });

  const zones = [
    {
      id: "entry",
      name: "Entrée",
      short: "EN",
      description: "Alléger les arrivées et les départs.",
      tasks: [
        "Ranger les chaussures visibles",
        "Créer une place fixe pour les clés",
        "Trier le courrier accumulé",
        "Secouer ou aspirer le tapis",
        "Dégager le passage",
        "Préparer un panier pour les objets à sortir"
      ]
    },
    {
      id: "kitchen",
      name: "Cuisine",
      short: "CU",
      description: "Retrouver un espace simple pour cuisiner et respirer.",
      tasks: [
        "Vider et rincer l'évier",
        "Essuyer une section de comptoir",
        "Vérifier cinq aliments dans le frigo",
        "Nettoyer les poignées",
        "Ranger les objets sans place sur la table",
        "Balayer la zone la plus utilisée"
      ]
    },
    {
      id: "bathroom",
      name: "Salle de bain",
      short: "SB",
      description: "Créer une petite sensation de fraîcheur.",
      tasks: [
        "Nettoyer le miroir",
        "Rafraîchir la toilette",
        "Changer les serviettes",
        "Jeter les contenants vides",
        "Essuyer le lavabo",
        "Regrouper les produits quotidiens"
      ]
    },
    {
      id: "bedroom",
      name: "Chambre",
      short: "CH",
      description: "Protéger un coin de repos calme et accessible.",
      tasks: [
        "Faire le lit simplement",
        "Dégager une table de chevet",
        "Ramasser les vêtements au sol",
        "Plier ou suspendre dix morceaux",
        "Libérer une chaise",
        "Préparer les vêtements de demain"
      ]
    },
    {
      id: "living",
      name: "Salon",
      short: "SA",
      description: "Rendre la pièce accueillante sans viser la perfection.",
      tasks: [
        "Ramasser les objets qui appartiennent ailleurs",
        "Replacer les coussins",
        "Plier une couverture",
        "Dégager la table basse",
        "Rassembler les tasses et les verres",
        "Libérer le passage au sol"
      ]
    }
  ];

  const weeklyZones = [
    { id: "entry", name: "Entrée et salle à manger", description: "On facilite les arrivées, les départs et les repas.", color: "#dce9df" },
    { id: "kitchen", name: "Cuisine", description: "On redonne un peu d'air aux surfaces les plus utilisées.", color: "#f3e2cf" },
    { id: "bathroom", name: "Salle de bain et buanderie", description: "On crée une sensation de fraîcheur, une étape à la fois.", color: "#dfe9ed" },
    { id: "bedroom", name: "Chambre principale", description: "On protège le repos avec quelques gestes simples.", color: "#e7e1ee" },
    { id: "living", name: "Salon", description: "On apaise la pièce où la vie se rassemble.", color: "#eee4d4" }
  ];

  const defaultRoutines = [
    { id: "default-morning-1", routine: "morning", title: "Boire un verre d'eau", duration: "1 min", order: 0 },
    { id: "default-morning-2", routine: "morning", title: "Faire le lit simplement", duration: "3 min", order: 1 },
    { id: "default-morning-3", routine: "morning", title: "Dégager l'évier", duration: "5 min", order: 2 },
    { id: "default-afternoon-1", routine: "afternoon", title: "Faire un Room Rescue", duration: "5 min", order: 0 },
    { id: "default-afternoon-2", routine: "afternoon", title: "Ranger cinq objets", duration: "3 min", order: 1 },
    { id: "default-afternoon-3", routine: "afternoon", title: "Vérifier le panier de linge", duration: "2 min", order: 2 },
    { id: "default-evening-1", routine: "evening", title: "Préparer les vêtements de demain", duration: "4 min", order: 0 },
    { id: "default-evening-2", routine: "evening", title: "Faire une tournée des tasses", duration: "3 min", order: 1 },
    { id: "default-evening-3", routine: "evening", title: "Fermer la cuisine", duration: "5 min", order: 2 }
  ];

  window.APP_DATA = {
    quotes: quotes,
    missions: missions,
    tips: tips.slice(0, 365),
    zones: zones,
    weeklyZones: weeklyZones,
    defaultRoutines: defaultRoutines
  };
})();
