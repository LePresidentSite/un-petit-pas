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
    "Respire. Choisis une chose. C'est tout.",

    // TDAH et fonctionnement du quotidien
    "Ton cerveau mérite des systèmes simples, pas plus de pression.",
    "Oublier n'est pas échouer. Un rappel peut simplement t'aider.",
    "Rendre une tâche visible peut la rendre plus légère.",
    "Si commencer semble difficile, réduis encore la première étape.",
    "Tu peux emprunter de l'élan à un minuteur de deux minutes.",
    "Une minuterie peut décider du départ à ta place.",
    "Ton attention fluctue. Ta valeur, elle, ne change pas.",
    "Le bon système est celui qui fonctionne avec toi.",
    "Tu n'as pas besoin de retenir ce que tu peux noter.",
    "Simplifier une étape est une vraie stratégie.",
    "Ce qui est visible est souvent plus facile à retrouver.",
    "Un rappel bien placé peut remplacer beaucoup d'effort.",
    "Ta façon de t'organiser peut être différente et valable.",
    "Revenir à une tâche compte autant que la commencer.",
    "Tu peux changer de méthode sans avoir échoué.",
    "Quand tout semble urgent, choisis seulement ce qui aide maintenant.",
    "Une tâche commencée en douceur reste une tâche commencée.",
    "Ton cerveau n'a pas besoin de reproches pour avancer.",
    "Un environnement plus simple peut alléger les décisions.",
    "Tu peux laisser les outils utiles là où tu les utilises.",

    // Bienveillance envers soi-même
    "Parle-toi comme tu parlerais à quelqu'un que tu aimes.",
    "La fatigue est une information, pas un défaut.",
    "Tu n'as rien à prouver en prenant soin de ton espace.",
    "Ton rythme mérite une place dans ton organisation.",
    "Une journée difficile n'efface pas tes progrès.",
    "Faire moins peut être la décision la plus bienveillante.",
    "Le repos fait aussi partie de ce qui te soutient.",
    "Tu mérites un espace qui t'aide sans te juger.",
    "Ce n'est pas de la paresse si ton énergie est basse.",
    "Tu peux recommencer sans te faire de reproches.",
    "La douceur peut être une méthode efficace.",
    "Ton mieux d'aujourd'hui peut être très différent d'hier.",
    "Aucune maison ne mérite ton épuisement.",
    "Tes besoins comptent autant que la liste des tâches.",
    "Tu as le droit de choisir une version plus facile.",
    "L'ordre n'est pas une mesure de ta valeur.",
    "La honte ne range rien. La douceur peut aider.",
    "Ta valeur ne dépend pas de ce qui reste à faire.",
    "Tu peux célébrer un effort que personne d'autre ne voit.",
    "Aujourd'hui, sois aussi douce avec toi qu'avec ton espace.",

    // Progrès par petits pas
    "Le progrès peut être calme, lent et bien réel.",
    "Un objet rangé est déjà un peu moins à porter.",
    "Une petite action peut changer la sensation d'une pièce.",
    "Ce qui prend deux minutes mérite aussi d'être célébré.",
    "Tu n'as pas besoin de finir pour avoir avancé.",
    "Le mouvement compte, même sans grand résultat.",
    "Chaque retour crée un chemin plus facile à reprendre.",
    "Une tâche partielle peut quand même te faciliter la vie.",
    "Le résultat n'a pas besoin d'être spectaculaire pour aider.",
    "Quelques minutes répétées peuvent créer beaucoup d'espace.",
    "Tu construis quelque chose, même quand le changement est discret.",
    "Les petits gestes s'additionnent sans faire de bruit.",
    "Un espace plus calme peut commencer par cinq objets.",
    "La répétition douce transforme plus que la pression.",
    "Un pas visible peut donner envie au suivant de venir.",
    "Ce que tu fais aujourd'hui soutient déjà demain.",
    "L'élan peut commencer avec une action presque trop facile.",
    "Un début imparfait vaut mieux qu'une attente épuisante.",
    "Tu peux mesurer le progrès par le soulagement ressenti.",
    "La prochaine petite action suffit pour continuer.",

    // Motivation douce
    "Choisis ce qui te donnera un peu plus d'air.",
    "Mets le minuteur et laisse le temps porter la tâche.",
    "Commence par ce qui demande le moins de décisions.",
    "Fais seulement la partie qui te semble accessible.",
    "Autorise-toi à choisir la tâche la plus douce.",
    "Une chanson peut être toute la durée nécessaire.",
    "Ton futur toi appréciera même ce minuscule geste.",
    "Le plus simple est souvent un excellent point de départ.",
    "Commence petit pour garder de l'énergie pour toi.",
    "Ouvre un peu d'espace, pas toute la pièce.",
    "Choisis une tâche que tu peux voir se terminer.",
    "Tu peux faire équipe avec la version actuelle de ton énergie.",
    "Laisse la motivation arriver après le premier geste.",
    "Deux minutes maintenant peuvent alléger la suite.",
    "Fais une pause avant de choisir un autre petit pas.",
    "Une seule décision peut suffire pour aujourd'hui.",
    "Prends un panier et laisse-le simplifier le mouvement.",
    "Aujourd'hui, vise utile plutôt qu'idéal.",
    "Cherche le geste qui rendra le prochain plus facile.",
    "Tu peux t'arrêter pendant que tu te sens encore bien.",

    // Calme, nature et nouveau départ
    "Comme une plante, le changement pousse à son propre rythme.",
    "Le calme pousse dans les espaces qu'on libère doucement.",
    "Une maison vivante n'a pas besoin d'être parfaite.",
    "L'espace revient petit à petit, comme la lumière.",
    "Chaque geste ouvre une petite fenêtre de respiration.",
    "Tu peux créer du calme sans tout transformer.",
    "La lumière entre aussi par les plus petites ouvertures.",
    "Un coin paisible peut devenir ton point de départ.",
    "L'espoir peut ressembler à une surface un peu plus légère.",
    "Avancer doucement reste une façon d'avancer."
  ];

  const missions = [
    { title: "Libérer un tiroir", description: "Choisis un seul tiroir. Garde ce qui est utile, puis arrête-toi quand le minuteur sonne.", minutes: 10 },
    { title: "Faire briller l'évier", description: "Vide l'évier, rince-le et essuie rapidement le contour. Pas besoin de toucher au reste.", minutes: 8 },
    { title: "Dégager une tablette", description: "Retire ce qui n'a plus sa place sur une tablette visible et remets seulement l'essentiel.", minutes: 10 },
    { title: "Ramasser le salon", description: "Prends un panier et rassemble les objets qui appartiennent à une autre pièce.", minutes: 7 },
    { title: "Rafraîchir le réfrigérateur", description: "Jette un aliment périmé et essuie une seule tablette. Cette petite victoire suffit.", minutes: 10 },
    { title: "Sauvetage express d'une pièce", description: "Choisis la pièce qui te pèse le plus et range seulement ce qui est évident.", minutes: 5 },
    { title: "Dégager une chaise", description: "Retire tout ce qui s'est accumulé sur une chaise et redonne-lui sa fonction.", minutes: 5 },
    { title: "Trier le courrier", description: "Fais trois piles : agir, garder, recycler. Ne traite rien d'autre pour l'instant.", minutes: 8 },
    { title: "Nettoyer un miroir", description: "Choisis le miroir le plus utilisé et essuie-le, sans ajouter d'autre tâche.", minutes: 5 },
    { title: "Rassembler les tasses", description: "Fais un petit tour et rapporte seulement les verres et les tasses à la cuisine.", minutes: 4 },
    { title: "Alléger un point d'accumulation", description: "Choisis une petite surface où les objets s'accumulent et replace cinq choses.", minutes: 5 },
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
    "Allège un point d'accumulation pendant seulement deux minutes.",
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
  for (let dayIndex = 0; dayIndex < 365; dayIndex += 1) {
    const actionIndex = (dayIndex * 29) % tipActions.length;
    const endingIndex = dayIndex % tipEndings.length;
    tips.push({
      id: "tip-" + String(actionIndex + 1).padStart(2, "0") + "-" + (endingIndex + 1),
      text: tipActions[actionIndex] + " " + tipEndings[endingIndex]
    });
  }

  const leapDayTip = {
    id: "tip-leap-day",
    text: "Cette journée en plus n'a rien à prouver. Choisis un geste doux qui te fera du bien."
  };

  const smallSteps = [
    {
      id: "small-step-01",
      title: "Faire briller son évier",
      description: "Choisis l'évier comme premier point calme de la maison.",
      details: "Vide l'évier, rince-le et essuie-le simplement. Il n'a pas besoin d'être parfait. Ce petit espace dégagé devient un repère visuel rassurant pour la suite.",
      principleId: "principle-01"
    },
    {
      id: "small-step-02",
      title: "S'habiller de la tête aux pieds",
      description: "Prépare-toi comme pour une journée qui mérite ton attention.",
      details: "Choisis des vêtements confortables et termine ta préparation, chaussures comprises si cela t'aide. L'objectif est seulement d'envoyer à ton cerveau le signal que la journée peut commencer.",
      principleId: "principle-02"
    },
    {
      id: "small-step-03",
      title: "Lire 10 minutes",
      description: "Accorde dix minutes à une lecture qui te fait du bien.",
      details: "Choisis quelques pages utiles, apaisantes ou inspirantes. Arrête-toi après dix minutes, même si tu n'as pas terminé. La régularité compte davantage que la quantité.",
      principleId: "principle-06"
    },
    {
      id: "small-step-04",
      title: "Créer le post-it de la journée",
      description: "Note une seule priorité visible pour aujourd'hui.",
      details: "Écris l'action qui allégera le plus ta journée. Garde le post-it à un endroit facile à voir et considère tout le reste comme facultatif.",
      principleId: "principle-04"
    },
    {
      id: "small-step-05",
      title: "Positiver",
      description: "Remplace une critique par une phrase plus juste et plus douce.",
      details: "Observe une pensée exigeante et reformule-la comme tu le ferais pour une personne que tu aimes. Tu n'as pas à tout réussir pour reconnaître ce que tu fais déjà.",
      principleId: "principle-10"
    },
    {
      id: "small-step-06",
      title: "Apaiser un point d'accumulation pendant 2 minutes",
      description: "Choisis un petit endroit où les objets s'accumulent.",
      details: "Règle deux minutes et retire seulement ce qui est évident : déchets, vaisselle ou objets faciles à replacer. Lorsque le temps est écoulé, arrête-toi.",
      principleId: "principle-09"
    },
    {
      id: "small-step-07",
      title: "Préparer les vêtements de demain",
      description: "Enlève une décision à la journée de demain.",
      details: "Choisis une tenue complète et place-la au même endroit. Une préparation imparfaite vaut mieux qu'une décision de plus à prendre au réveil.",
      principleId: "principle-04"
    },
    {
      id: "small-step-08",
      title: "Débuter le journal de bord",
      description: "Crée un endroit simple pour garder tes repères.",
      details: "Utilise un cahier ou une note numérique. Inscris seulement ce que tu veux retrouver facilement : routines, idées utiles et petites victoires.",
      principleId: "principle-06"
    },
    {
      id: "small-step-09",
      title: "Faire un sauvetage express d'une pièce",
      description: "Redonne un peu d'air à une seule pièce.",
      details: "Prends un panier, rassemble les objets qui appartiennent ailleurs et dégage un passage ou une surface. Il n'est pas nécessaire de tout replacer maintenant.",
      principleId: "principle-09"
    },
    {
      id: "small-step-10",
      title: "Désencombrer 15 minutes",
      description: "L'objectif n'est pas de terminer. L'objectif est d'avancer.",
      details: "Le désordre ne s'est pas installé en une journée.\n\nRègle simplement la minuterie sur 15 minutes et choisis une petite zone.\n\nJette, donne ou range ce que tu peux pendant ces 15 minutes. Lorsque la minuterie sonne, arrête-toi.\n\nChaque séance est un petit pas vers une maison plus facile à entretenir.",
      principleId: "principle-06",
      timerMinutes: 15
    },
    {
      id: "small-step-11",
      title: "Continuer le journal de bord",
      description: "Ajoute seulement une information qui pourra t'aider plus tard.",
      details: "Complète ton journal avec une routine, une liste courte ou une observation. Il doit rester un outil vivant, pas un autre projet à réussir.",
      principleId: "principle-06"
    },
    {
      id: "small-step-12",
      title: "Trier les courriels, magazines et courrier",
      description: "Réduis une petite pile physique ou numérique.",
      details: "Choisis un seul type de courrier et traite quelques éléments évidents. Supprime, recycle ou classe sans chercher à vider toute la pile.",
      principleId: "principle-07"
    },
    {
      id: "small-step-13",
      title: "Visiter la zone en cours",
      description: "Consulte la zone active et choisis ce qui te paraît utile.",
      details: "Ouvre la zone de la semaine et parcours sa liste de référence. Tu peux choisir une seule idée, ou simplement prendre connaissance de la zone.",
      principleId: "principle-06"
    },
    {
      id: "small-step-14",
      title: "Utiliser un calendrier",
      description: "Dépose une information importante hors de ta mémoire.",
      details: "Note un rendez-vous, une échéance ou un rappel dans ton calendrier. Un système extérieur peut alléger la charge mentale.",
      principleId: "principle-04"
    },
    {
      id: "small-step-15",
      title: "Faire son lit",
      description: "Crée une surface calme en quelques gestes.",
      details: "Remonte simplement la couverture et replace les oreillers. Une version rapide suffit pour donner une sensation de départ.",
      principleId: "principle-05"
    },
    {
      id: "small-step-16",
      title: "Lire un témoignage inspirant",
      description: "Rappelle-toi que le changement peut être progressif.",
      details: "Lis une histoire, une note ou un souvenir qui te redonne confiance. Garde seulement l'idée qui te semble réaliste pour toi.",
      principleId: "principle-10"
    },
    {
      id: "small-step-17",
      title: "Se coucher à une heure raisonnable",
      description: "Protège doucement l'énergie de demain.",
      details: "Choisis une heure réaliste pour commencer à ralentir. Prépare une transition simple plutôt qu'une routine parfaite.",
      principleId: "principle-08"
    },
    {
      id: "small-step-18",
      title: "Découvrir un principe Un Petit Pas",
      description: "Choisis un principe et observe comment il peut t'aider.",
      details: "Parcours la bibliothèque des principes. Tu n'as rien à appliquer immédiatement : laisse simplement une idée faire son chemin.",
      principleId: "principle-06"
    },
    {
      id: "small-step-19",
      title: "Lire un autre témoignage inspirant",
      description: "Cherche une preuve que les petits changements comptent.",
      details: "Choisis un témoignage différent ou relis une ancienne réussite personnelle. Compare-toi seulement à ton propre chemin.",
      principleId: "principle-10"
    },
    {
      id: "small-step-20",
      title: "Faire une brassée de lessive",
      description: "Fais avancer une seule étape du linge.",
      details: "Démarre, transfère, plie ou range une brassée. Une seule étape terminée est déjà une vraie avancée.",
      principleId: "principle-05"
    },
    {
      id: "small-step-21",
      title: "Réfléchir à ce qui fonctionne pour moi",
      description: "Observe ce qui t'aide réellement, sans jugement.",
      details: "Note une habitude, un outil ou un moment de la journée qui facilite l'action. Ton système peut être différent de celui des autres.",
      principleId: "principle-08"
    },
    {
      id: "small-step-22",
      title: "Faire le point sur mes habitudes",
      description: "Regarde tes habitudes avec curiosité plutôt qu'avec pression.",
      details: "Choisis une habitude qui t'aide et une autre qui pourrait être simplifiée. Aucun grand changement n'est requis aujourd'hui.",
      principleId: "principle-06"
    },
    {
      id: "small-step-23",
      title: "Préparer le repas du lendemain",
      description: "Facilite une décision alimentaire de demain.",
      details: "Choisis le repas, sors un ingrédient ou écris une idée. Cette petite préparation peut suffire à réduire la fatigue décisionnelle.",
      principleId: "principle-04"
    },
    {
      id: "small-step-24",
      title: "Garder les sanitaires frais",
      description: "Fais un entretien rapide sans viser le grand ménage.",
      details: "Essuie le lavabo, rafraîchis la toilette ou remplace une serviette. Choisis un seul geste visible.",
      principleId: "principle-05"
    },
    {
      id: "small-step-25",
      title: "Être fière de moi",
      description: "Reconnais consciemment un effort que tu as fait.",
      details: "Nomme une action, même très petite, que tu as accomplie récemment. La fierté n'a pas besoin d'attendre un résultat parfait.",
      principleId: "principle-10"
    },
    {
      id: "small-step-26",
      title: "Profiter de 15 minutes pour moi",
      description: "Réserve quinze minutes à quelque chose qui te recharge.",
      details: "Assieds-toi, marche, écoute de la musique ou ne fais rien. Ce temps n'a pas besoin d'être productif pour être utile.",
      principleId: "principle-08",
      timerMinutes: 15
    },
    {
      id: "small-step-27",
      title: "Planifier les repas",
      description: "Prévois seulement quelques repères pour les prochains jours.",
      details: "Choisis deux ou trois repas simples et vérifie ce que tu as déjà. Une liste incomplète peut tout de même beaucoup aider.",
      principleId: "principle-04"
    },
    {
      id: "small-step-28",
      title: "Prendre soin de moi",
      description: "Choisis un geste de soin accessible aujourd'hui.",
      details: "Bois de l'eau, prends une douche, mange quelque chose ou repose-toi. Prendre soin de toi fait partie de l'entretien de la maison.",
      principleId: "principle-08"
    },
    {
      id: "small-step-29",
      title: "M'accorder une heure pour moi",
      description: "Crée un espace plus long pour souffler ou te retrouver.",
      details: "Choisis une activité qui t'apaise et protège ce moment autant que possible. Tu peux aussi diviser cette heure en plusieurs petits moments.",
      principleId: "principle-08"
    },
    {
      id: "small-step-30",
      title: "Planifier à l'avance",
      description: "Prépare un seul détail qui facilitera la suite.",
      details: "Regarde les prochains jours et choisis une chose à anticiper. Le but est de réduire une future friction, pas de tout prévoir.",
      principleId: "principle-04"
    },
    {
      id: "small-step-31",
      title: "Faire le bilan et penser globalement",
      description: "Regarde le chemin parcouru avec douceur.",
      details: "Observe ce qui a changé, ce que tu veux garder et ce qui mérite d'être simplifié. Le parcours peut recommencer autrement, à ton rythme.",
      principleId: "principle-06"
    }
  ];

  const principles = [
    { id: "principle-01", title: "Faire briller son évier", description: "Créer un petit point de calme visible qui aide à recommencer." },
    { id: "principle-02", title: "S'habiller de la tête aux pieds", description: "Préparer son corps et son esprit à entrer doucement dans la journée." },
    { id: "principle-03", title: "Faire ses routines", description: "S'appuyer sur quelques repères simples plutôt que sur la motivation." },
    { id: "principle-04", title: "Se concentrer sur l'essentiel", description: "Choisir ce qui compte maintenant et laisser le reste attendre." },
    { id: "principle-05", title: "Ranger au fur et à mesure", description: "Profiter des petits moments pour éviter qu'une tâche devienne trop lourde." },
    { id: "principle-06", title: "Un pas à la fois", description: "Avancer par une seule action réaliste, sans exiger de tout terminer.", featured: true },
    { id: "principle-07", title: "Ne pas accumuler", description: "Laisser partir ce qui ne sert plus afin de préserver de l'espace." },
    { id: "principle-08", title: "Prendre soin de soi", description: "Considérer son énergie et son bien-être comme une priorité légitime." },
    { id: "principle-09", title: "Travailler rapidement", description: "Utiliser un temps court pour commencer sans transformer l'action en marathon." },
    { id: "principle-10", title: "Sourire", description: "Inviter un peu de douceur dans les gestes ordinaires." },
    { id: "principle-11", title: "Rire de soi et de la vie", description: "Relâcher la perfection et garder de la légèreté lorsque tout ne se passe pas comme prévu." }
  ];

  function zoneTask(id, titre, duree, categorie) {
    return { id: id, titre: titre, duree: duree, categorie: categorie };
  }

  const zones = [
    {
      id: "entry",
      number: 1,
      name: "Entrée et salle à manger",
      short: "Z1",
      description: "Faciliter les arrivées, les départs et les repas.",
      sections: ["Entrée", "Salle à manger"],
      tasks: [
        zoneTask("zone1_001", "Ranger les chaussures visibles", 5, "Entrée"),
        zoneTask("zone1_002", "Créer une place fixe pour les clés", 5, "Entrée"),
        zoneTask("zone1_003", "Trier le courrier accumulé", 10, "Entrée"),
        zoneTask("zone1_004", "Secouer ou aspirer le tapis", 5, "Entrée"),
        zoneTask("zone1_005", "Dégager le passage", 5, "Entrée"),
        zoneTask("zone1_006", "Préparer un panier pour les objets à sortir", 5, "Entrée"),
        zoneTask("zone1_007", "Nettoyer la poignée de la porte d'entrée", 2, "Entrée"),
        zoneTask("zone1_008", "Essuyer l'interrupteur de l'entrée", 2, "Entrée"),
        zoneTask("zone1_009", "Nettoyer la sonnette ou l'interphone", 5, "Entrée"),
        zoneTask("zone1_010", "Essuyer l'intérieur de la porte d'entrée", 5, "Entrée"),
        zoneTask("zone1_011", "Nettoyer le seuil de la porte", 5, "Entrée"),
        zoneTask("zone1_012", "Trier les manteaux hors saison", 15, "Entrée"),
        zoneTask("zone1_013", "Ranger les accessoires saisonniers", 10, "Entrée"),
        zoneTask("zone1_014", "Vider les pochettes des sacs accrochés", 10, "Entrée"),
        zoneTask("zone1_015", "Vérifier le contenu du sac de sortie", 5, "Entrée"),
        zoneTask("zone1_016", "Désencombrer la console d'entrée", 10, "Entrée"),
        zoneTask("zone1_017", "Essuyer la console d'entrée", 5, "Entrée"),
        zoneTask("zone1_018", "Nettoyer le miroir de l'entrée", 5, "Entrée"),
        zoneTask("zone1_019", "Regrouper les parapluies", 5, "Entrée"),
        zoneTask("zone1_020", "Réorganiser les crochets et les patères", 10, "Entrée"),
        zoneTask("zone1_021", "Retirer les papiers de la table à manger", 5, "Salle à manger"),
        zoneTask("zone1_022", "Essuyer la surface de la table à manger", 5, "Salle à manger"),
        zoneTask("zone1_023", "Nettoyer le dessous de la table", 10, "Salle à manger"),
        zoneTask("zone1_024", "Essuyer les dossiers et les assises des chaises", 10, "Salle à manger"),
        zoneTask("zone1_025", "Aspirer les miettes sur les chaises", 5, "Salle à manger"),
        zoneTask("zone1_026", "Aligner les chaises autour de la table", 2, "Salle à manger"),
        zoneTask("zone1_027", "Trier les nappes et les napperons", 10, "Salle à manger"),
        zoneTask("zone1_028", "Ranger la vaisselle utilisée pour les occasions", 15, "Salle à manger"),
        zoneTask("zone1_029", "Dépoussiérer le luminaire au-dessus de la table", 10, "Salle à manger"),
        zoneTask("zone1_030", "Essuyer la surface du buffet", 5, "Salle à manger"),
        zoneTask("zone1_031", "Désencombrer le dessus du buffet", 15, "Salle à manger"),
        zoneTask("zone1_032", "Trier un tiroir du buffet", 10, "Salle à manger"),
        zoneTask("zone1_033", "Nettoyer les poignées du buffet", 2, "Salle à manger"),
        zoneTask("zone1_034", "Dépoussiérer les objets décoratifs", 10, "Salle à manger"),
        zoneTask("zone1_035", "Nettoyer les plinthes de la salle à manger", 10, "Salle à manger"),
        zoneTask("zone1_036", "Essuyer le rebord de la fenêtre", 5, "Salle à manger"),
        zoneTask("zone1_037", "Nettoyer une vitre accessible", 10, "Salle à manger"),
        zoneTask("zone1_038", "Regrouper les bougies et les accessoires de table", 5, "Salle à manger"),
        zoneTask("zone1_039", "Préparer un centre de table simple", 5, "Salle à manger"),
        zoneTask("zone1_040", "Balayer sous la table à manger", 10, "Salle à manger")
      ]
    },
    {
      id: "kitchen",
      number: 2,
      name: "Cuisine",
      short: "Z2",
      description: "Retrouver un espace simple pour cuisiner et respirer.",
      sections: ["Cuisine"],
      tasks: [
        zoneTask("zone2_001", "Vider et rincer l'évier", 5, "Cuisine"),
        zoneTask("zone2_002", "Essuyer une section de comptoir", 5, "Cuisine"),
        zoneTask("zone2_003", "Vérifier cinq aliments dans le frigo", 5, "Cuisine"),
        zoneTask("zone2_004", "Nettoyer les poignées", 5, "Cuisine"),
        zoneTask("zone2_005", "Ranger les objets sans place sur la table", 10, "Cuisine"),
        zoneTask("zone2_006", "Balayer la zone la plus utilisée", 10, "Cuisine"),
        zoneTask("zone2_007", "Vider le lave-vaisselle", 10, "Cuisine"),
        zoneTask("zone2_008", "Ranger la vaisselle de l'égouttoir", 5, "Cuisine"),
        zoneTask("zone2_009", "Essuyer la plaque de cuisson", 10, "Cuisine"),
        zoneTask("zone2_010", "Nettoyer les boutons de la cuisinière", 5, "Cuisine"),
        zoneTask("zone2_011", "Essuyer le devant du réfrigérateur", 5, "Cuisine"),
        zoneTask("zone2_012", "Nettoyer l'intérieur du micro-ondes", 10, "Cuisine"),
        zoneTask("zone2_013", "Essuyer l'extérieur du micro-ondes", 5, "Cuisine"),
        zoneTask("zone2_014", "Trier une tablette du garde-manger", 10, "Cuisine"),
        zoneTask("zone2_015", "Regrouper les épices", 10, "Cuisine"),
        zoneTask("zone2_016", "Vérifier les dates des condiments", 10, "Cuisine"),
        zoneTask("zone2_017", "Essuyer une tablette du réfrigérateur", 10, "Cuisine"),
        zoneTask("zone2_018", "Nettoyer le bac à légumes", 15, "Cuisine"),
        zoneTask("zone2_019", "Retirer les aliments périmés du congélateur", 15, "Cuisine"),
        zoneTask("zone2_020", "Regrouper les aliments du congélateur", 10, "Cuisine"),
        zoneTask("zone2_021", "Essuyer les portes des armoires", 15, "Cuisine"),
        zoneTask("zone2_022", "Trier un tiroir d'ustensiles", 10, "Cuisine"),
        zoneTask("zone2_023", "Réorganiser le contenant d'ustensiles", 10, "Cuisine"),
        zoneTask("zone2_024", "Regrouper les contenants réutilisables", 15, "Cuisine"),
        zoneTask("zone2_025", "Associer les contenants à leurs couvercles", 10, "Cuisine"),
        zoneTask("zone2_026", "Ranger les sacs réutilisables", 5, "Cuisine"),
        zoneTask("zone2_027", "Nettoyer le couvercle de la poubelle", 5, "Cuisine"),
        zoneTask("zone2_028", "Essuyer le fond du bac à déchets", 10, "Cuisine"),
        zoneTask("zone2_029", "Nettoyer une section du dosseret", 10, "Cuisine"),
        zoneTask("zone2_030", "Faire briller le robinet", 5, "Cuisine"),
        zoneTask("zone2_031", "Détartrer la bouilloire", 15, "Cuisine"),
        zoneTask("zone2_032", "Nettoyer le filtre de la hotte", 15, "Cuisine"),
        zoneTask("zone2_033", "Essuyer les petits électroménagers", 10, "Cuisine"),
        zoneTask("zone2_034", "Désencombrer une armoire", 15, "Cuisine"),
        zoneTask("zone2_035", "Essuyer une tablette d'armoire", 10, "Cuisine"),
        zoneTask("zone2_036", "Regrouper les ingrédients de pâtisserie", 15, "Cuisine"),
        zoneTask("zone2_037", "Vider les miettes du grille-pain", 5, "Cuisine"),
        zoneTask("zone2_038", "Essuyer l'extérieur de la cafetière", 5, "Cuisine"),
        zoneTask("zone2_039", "Préparer une liste d'épicerie à partir des réserves", 10, "Cuisine"),
        zoneTask("zone2_040", "Laver une petite section du plancher", 15, "Cuisine")
      ]
    },
    {
      id: "bathroom",
      number: 3,
      name: "Salle de bain, buanderie et bureau",
      short: "Z3",
      description: "Créer de la fraîcheur dans les espaces de soin, de linge et de travail.",
      sections: ["Salle de bain", "Buanderie", "Bureau ou pièce supplémentaire"],
      tasks: [
        zoneTask("zone3_001", "Nettoyer le miroir", 5, "Salle de bain"),
        zoneTask("zone3_002", "Rafraîchir la toilette", 10, "Salle de bain"),
        zoneTask("zone3_003", "Changer les serviettes", 5, "Salle de bain"),
        zoneTask("zone3_004", "Jeter les contenants vides", 5, "Salle de bain"),
        zoneTask("zone3_005", "Essuyer le lavabo", 5, "Salle de bain"),
        zoneTask("zone3_006", "Regrouper les produits quotidiens", 10, "Salle de bain"),
        zoneTask("zone3_007", "Nettoyer la paroi ou le rideau de douche", 10, "Salle de bain"),
        zoneTask("zone3_008", "Rincer une tablette de douche", 5, "Salle de bain"),
        zoneTask("zone3_009", "Faire briller les robinets", 5, "Salle de bain"),
        zoneTask("zone3_010", "Dégager le comptoir de la salle de bain", 5, "Salle de bain"),
        zoneTask("zone3_011", "Trier un tiroir de produits de soin", 15, "Salle de bain"),
        zoneTask("zone3_012", "Laver le porte-brosses à dents", 5, "Salle de bain"),
        zoneTask("zone3_013", "Vider la petite poubelle", 5, "Salle de bain"),
        zoneTask("zone3_014", "Essuyer l'interrupteur et la poignée de porte", 2, "Salle de bain"),
        zoneTask("zone3_015", "Nettoyer le plancher autour de la toilette", 10, "Salle de bain"),
        zoneTask("zone3_016", "Rassembler le linge sale", 5, "Buanderie"),
        zoneTask("zone3_017", "Démarrer une brassée de lavage", 5, "Buanderie"),
        zoneTask("zone3_018", "Transférer une brassée dans la sécheuse", 5, "Buanderie"),
        zoneTask("zone3_019", "Plier les serviettes propres", 10, "Buanderie"),
        zoneTask("zone3_020", "Associer les chaussettes propres", 10, "Buanderie"),
        zoneTask("zone3_021", "Ranger le contenu d'un panier de linge", 15, "Buanderie"),
        zoneTask("zone3_022", "Nettoyer le joint de la laveuse", 10, "Buanderie"),
        zoneTask("zone3_023", "Essuyer la laveuse et la sécheuse", 5, "Buanderie"),
        zoneTask("zone3_024", "Vider le filtre à charpie", 2, "Buanderie"),
        zoneTask("zone3_025", "Trier les produits de lessive", 10, "Buanderie"),
        zoneTask("zone3_026", "Essuyer les bouchons des produits de lessive", 5, "Buanderie"),
        zoneTask("zone3_027", "Nettoyer le lavabo de la buanderie", 10, "Buanderie"),
        zoneTask("zone3_028", "Balayer le plancher de la buanderie", 10, "Buanderie"),
        zoneTask("zone3_029", "Ranger les cintres et le séchoir", 5, "Buanderie"),
        zoneTask("zone3_030", "Vérifier les poches avant le lavage", 5, "Buanderie"),
        zoneTask("zone3_031", "Dégager la surface du bureau", 10, "Bureau ou pièce supplémentaire"),
        zoneTask("zone3_032", "Classer cinq papiers", 5, "Bureau ou pièce supplémentaire"),
        zoneTask("zone3_033", "Recycler les papiers devenus inutiles", 10, "Bureau ou pièce supplémentaire"),
        zoneTask("zone3_034", "Regrouper les crayons et les fournitures", 5, "Bureau ou pièce supplémentaire"),
        zoneTask("zone3_035", "Trier un tiroir de bureau", 10, "Bureau ou pièce supplémentaire"),
        zoneTask("zone3_036", "Nettoyer le clavier et la souris", 5, "Bureau ou pièce supplémentaire"),
        zoneTask("zone3_037", "Essuyer l'écran d'ordinateur", 5, "Bureau ou pièce supplémentaire"),
        zoneTask("zone3_038", "Regrouper les câbles de recharge", 10, "Bureau ou pièce supplémentaire"),
        zoneTask("zone3_039", "Classer cinq documents numériques", 10, "Bureau ou pièce supplémentaire"),
        zoneTask("zone3_040", "Vider la poubelle du bureau", 5, "Bureau ou pièce supplémentaire"),
        zoneTask("zone3_041", "Dépoussiérer la lampe de bureau", 5, "Bureau ou pièce supplémentaire"),
        zoneTask("zone3_042", "Libérer la chaise du bureau", 5, "Bureau ou pièce supplémentaire"),
        zoneTask("zone3_043", "Trier une section de bibliothèque", 15, "Bureau ou pièce supplémentaire"),
        zoneTask("zone3_044", "Créer un plateau pour les papiers à traiter", 10, "Bureau ou pièce supplémentaire"),
        zoneTask("zone3_045", "Remettre en ordre le lit ou le canapé d'appoint", 10, "Bureau ou pièce supplémentaire")
      ]
    },
    {
      id: "bedroom",
      number: 4,
      name: "Chambre principale",
      short: "Z4",
      description: "Protéger un espace calme qui soutient le repos.",
      sections: ["Chambre principale"],
      tasks: [
        zoneTask("zone4_001", "Faire le lit simplement", 5, "Chambre principale"),
        zoneTask("zone4_002", "Dégager une table de chevet", 10, "Chambre principale"),
        zoneTask("zone4_003", "Ramasser les vêtements au sol", 5, "Chambre principale"),
        zoneTask("zone4_004", "Plier ou suspendre dix morceaux", 10, "Chambre principale"),
        zoneTask("zone4_005", "Libérer une chaise", 5, "Chambre principale"),
        zoneTask("zone4_006", "Préparer les vêtements de demain", 5, "Chambre principale"),
        zoneTask("zone4_007", "Ouvrir les rideaux", 2, "Chambre principale"),
        zoneTask("zone4_008", "Aérer la chambre", 5, "Chambre principale"),
        zoneTask("zone4_009", "Mettre le linge sale dans le panier", 5, "Chambre principale"),
        zoneTask("zone4_010", "Ranger une petite pile de vêtements propres", 10, "Chambre principale"),
        zoneTask("zone4_011", "Trier un tiroir de commode", 15, "Chambre principale"),
        zoneTask("zone4_012", "Réorganiser le tiroir de chaussettes", 10, "Chambre principale"),
        zoneTask("zone4_013", "Choisir cinq vêtements à donner", 10, "Chambre principale"),
        zoneTask("zone4_014", "Aligner les cintres dans la penderie", 5, "Chambre principale"),
        zoneTask("zone4_015", "Dégager le plancher du placard", 10, "Chambre principale"),
        zoneTask("zone4_016", "Trier une tablette du placard", 15, "Chambre principale"),
        zoneTask("zone4_017", "Dépoussiérer la tête de lit", 5, "Chambre principale"),
        zoneTask("zone4_018", "Essuyer la lampe de chevet", 5, "Chambre principale"),
        zoneTask("zone4_019", "Nettoyer les interrupteurs et les poignées", 2, "Chambre principale"),
        zoneTask("zone4_020", "Changer les taies d'oreiller", 5, "Chambre principale"),
        zoneTask("zone4_021", "Changer les draps", 15, "Chambre principale"),
        zoneTask("zone4_022", "Faire pivoter le matelas", 15, "Chambre principale"),
        zoneTask("zone4_023", "Aspirer sous une partie accessible du lit", 15, "Chambre principale"),
        zoneTask("zone4_024", "Retirer les objets alimentaires de la chambre", 5, "Chambre principale"),
        zoneTask("zone4_025", "Regrouper les câbles de la table de chevet", 5, "Chambre principale"),
        zoneTask("zone4_026", "Retirer les produits périmés de la table de chevet", 5, "Chambre principale"),
        zoneTask("zone4_027", "Trier les bijoux et les accessoires", 10, "Chambre principale"),
        zoneTask("zone4_028", "Regrouper les parfums et les produits de soin", 10, "Chambre principale"),
        zoneTask("zone4_029", "Essuyer le dessus de la commode", 5, "Chambre principale"),
        zoneTask("zone4_030", "Dépoussiérer les cadres et les décorations", 5, "Chambre principale"),
        zoneTask("zone4_031", "Nettoyer le miroir de la chambre", 5, "Chambre principale"),
        zoneTask("zone4_032", "Nettoyer les plinthes d'un mur", 10, "Chambre principale"),
        zoneTask("zone4_033", "Aspirer une petite section du plancher", 10, "Chambre principale"),
        zoneTask("zone4_034", "Laver une section accessible du plancher", 15, "Chambre principale"),
        zoneTask("zone4_035", "Ranger les pantoufles et les chaussures", 5, "Chambre principale"),
        zoneTask("zone4_036", "Créer un vide-poche pour les petits objets", 5, "Chambre principale"),
        zoneTask("zone4_037", "Trier les livres près du lit", 10, "Chambre principale"),
        zoneTask("zone4_038", "Retirer un objet qui nuit au repos", 2, "Chambre principale"),
        zoneTask("zone4_039", "Préparer les essentiels de la routine du soir", 5, "Chambre principale"),
        zoneTask("zone4_040", "Adoucir ou repositionner l'éclairage", 5, "Chambre principale")
      ]
    },
    {
      id: "living",
      number: 5,
      name: "Salon",
      short: "Z5",
      description: "Rendre la pièce accueillante sans viser la perfection.",
      sections: ["Salon"],
      tasks: [
        zoneTask("zone5_001", "Ramasser les objets qui appartiennent ailleurs", 10, "Salon"),
        zoneTask("zone5_002", "Replacer les coussins", 2, "Salon"),
        zoneTask("zone5_003", "Plier une couverture", 2, "Salon"),
        zoneTask("zone5_004", "Dégager la table basse", 5, "Salon"),
        zoneTask("zone5_005", "Rassembler les tasses et les verres", 5, "Salon"),
        zoneTask("zone5_006", "Libérer le passage au sol", 5, "Salon"),
        zoneTask("zone5_007", "Nettoyer sous les coussins du canapé", 10, "Salon"),
        zoneTask("zone5_008", "Essuyer les accoudoirs du canapé", 5, "Salon"),
        zoneTask("zone5_009", "Dépoussiérer l'écran du téléviseur", 5, "Salon"),
        zoneTask("zone5_010", "Essuyer les télécommandes", 2, "Salon"),
        zoneTask("zone5_011", "Regrouper les télécommandes au même endroit", 2, "Salon"),
        zoneTask("zone5_012", "Organiser les câbles du meuble multimédia", 10, "Salon"),
        zoneTask("zone5_013", "Dépoussiérer le meuble du téléviseur", 10, "Salon"),
        zoneTask("zone5_014", "Trier une tablette du meuble multimédia", 15, "Salon"),
        zoneTask("zone5_015", "Retirer les vieux magazines", 10, "Salon"),
        zoneTask("zone5_016", "Ranger les livres de la table basse", 5, "Salon"),
        zoneTask("zone5_017", "Essuyer une table d'appoint", 5, "Salon"),
        zoneTask("zone5_018", "Dépoussiérer les lampes du salon", 5, "Salon"),
        zoneTask("zone5_019", "Dépoussiérer une grille de ventilation", 5, "Salon"),
        zoneTask("zone5_020", "Dépoussiérer le cadre d'une fenêtre", 10, "Salon"),
        zoneTask("zone5_021", "Vérifier l'ouverture et le verrou d'une fenêtre", 5, "Salon"),
        zoneTask("zone5_022", "Dépoussiérer une section de stores ou de rideaux", 10, "Salon"),
        zoneTask("zone5_023", "Arroser les plantes du salon", 5, "Salon"),
        zoneTask("zone5_024", "Retirer les feuilles mortes des plantes", 5, "Salon"),
        zoneTask("zone5_025", "Dépoussiérer les feuilles d'une plante", 10, "Salon"),
        zoneTask("zone5_026", "Regrouper les objets décoratifs", 5, "Salon"),
        zoneTask("zone5_027", "Retirer un objet décoratif devenu inutile", 2, "Salon"),
        zoneTask("zone5_028", "Dépoussiérer les cadres du salon", 5, "Salon"),
        zoneTask("zone5_029", "Dégager une tablette", 10, "Salon"),
        zoneTask("zone5_030", "Dépoussiérer une tablette", 5, "Salon"),
        zoneTask("zone5_031", "Trier un panier de jeux ou de casse-têtes", 15, "Salon"),
        zoneTask("zone5_032", "Regrouper les jouets dans un panier", 10, "Salon"),
        zoneTask("zone5_033", "Trier les accessoires des animaux", 10, "Salon"),
        zoneTask("zone5_034", "Dégager le sol près du canapé", 5, "Salon"),
        zoneTask("zone5_035", "Aspirer la zone la plus fréquentée", 10, "Salon"),
        zoneTask("zone5_036", "Aspirer sous la table basse", 10, "Salon"),
        zoneTask("zone5_037", "Passer une vadrouille autour du canapé", 15, "Salon"),
        zoneTask("zone5_038", "Vider la poubelle du salon", 5, "Salon"),
        zoneTask("zone5_039", "Préparer un panier de lecture ou de détente", 5, "Salon"),
        zoneTask("zone5_040", "Remettre le salon à zéro avant la nuit", 5, "Salon")
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

  function referenceTask(id, titre, categorie) {
    return { id: id, titre: titre, categorie: categorie };
  }

  const referenceZones = [
    {
      id: "entry",
      number: 1,
      name: "Entrées et salle à manger",
      short: "Z1",
      description: "Des repères pour rendre les arrivées, les départs et les repas plus légers.",
      sections: ["Entrée principale", "Entrée secondaire", "Salle à manger"],
      tasks: [
        referenceTask("zone1_ref_001", "Balayer le porche", "Entrée principale"),
        referenceTask("zone1_ref_002", "Vider les mangeoires à oiseaux", "Entrée principale"),
        referenceTask("zone1_ref_003", "Essuyer les chaises", "Entrée principale"),
        referenceTask("zone1_ref_004", "Essuyer la table", "Entrée principale"),
        referenceTask("zone1_ref_005", "Rempoter les plantes", "Entrée principale"),
        referenceTask("zone1_ref_006", "Se départir de ce que l'on ne veut plus", "Entrée principale"),
        referenceTask("zone1_ref_007", "Balayer le porche", "Entrée secondaire"),
        referenceTask("zone1_ref_008", "Nettoyer la table de rempotage", "Entrée secondaire"),
        referenceTask("zone1_ref_009", "Nettoyer la table de pique-nique", "Entrée secondaire"),
        referenceTask("zone1_ref_010", "Jeter les déchets", "Entrée secondaire"),
        referenceTask("zone1_ref_011", "Sortir la récupération", "Entrée secondaire"),
        referenceTask("zone1_ref_012", "Vérifier et nettoyer le BBQ", "Entrée secondaire"),
        referenceTask("zone1_ref_013", "Nettoyer les bols du chien", "Entrée secondaire"),
        referenceTask("zone1_ref_014", "Épousseter le rebord des fenêtres", "Salle à manger"),
        referenceTask("zone1_ref_015", "Recycler les magazines devenus inutiles", "Salle à manger"),
        referenceTask("zone1_ref_016", "Nettoyer la rampe", "Salle à manger"),
        referenceTask("zone1_ref_017", "Épousseter la porte avant", "Salle à manger"),
        referenceTask("zone1_ref_018", "Remplir les mangeoires à oiseaux", "Salle à manger"),
        referenceTask("zone1_ref_019", "Rempoter les plantes", "Salle à manger"),
        referenceTask("zone1_ref_020", "Ranger le vaisselier ou nettoyer les verres", "Salle à manger"),
        referenceTask("zone1_ref_021", "Épousseter le ventilateur de plafond", "Salle à manger")
      ]
    },
    {
      id: "kitchen",
      number: 2,
      name: "Cuisine",
      short: "Z2",
      description: "Une liste de référence pour entretenir la pièce la plus sollicitée.",
      sections: ["Cuisine"],
      tasks: [
        referenceTask("zone2_ref_001", "Vider le réfrigérateur et le nettoyer à fond", "Cuisine"),
        referenceTask("zone2_ref_002", "Nettoyer le micro-ondes à l'intérieur et à l'extérieur", "Cuisine"),
        referenceTask("zone2_ref_003", "Nettoyer la cuisinière et le four", "Cuisine"),
        referenceTask("zone2_ref_004", "Laver les contenants de farine et de sucre ainsi que les petits objets décoratifs", "Cuisine"),
        referenceTask("zone2_ref_005", "Ranger les tiroirs et les armoires", "Cuisine"),
        referenceTask("zone2_ref_006", "Effacer les marques de doigts sur les murs", "Cuisine"),
        referenceTask("zone2_ref_007", "Laver l'intérieur des fenêtres", "Cuisine"),
        referenceTask("zone2_ref_008", "Nettoyer le ventilateur", "Cuisine"),
        referenceTask("zone2_ref_009", "Laver les portes d'armoires", "Cuisine"),
        referenceTask("zone2_ref_010", "Laver les luminaires", "Cuisine"),
        referenceTask("zone2_ref_011", "Nettoyer l'égouttoir sous le réfrigérateur", "Cuisine"),
        referenceTask("zone2_ref_012", "Nettoyer sous l'évier et retirer les vieux chiffons", "Cuisine")
      ]
    },
    {
      id: "bathroom",
      number: 3,
      name: "Salle de bains et autre pièce",
      short: "Z3",
      description: "Des idées pour les espaces de soin et une pièce supplémentaire de la maison.",
      sections: ["Salle de bains", "Autre pièce"],
      tasks: [
        referenceTask("zone3_ref_001", "Laver les tapis de bain", "Salle de bains"),
        referenceTask("zone3_ref_002", "Récurer ou cirer le plancher", "Salle de bains"),
        referenceTask("zone3_ref_003", "Ranger les tiroirs et les armoires", "Salle de bains"),
        referenceTask("zone3_ref_004", "Nettoyer la douche et enlever les moisissures", "Salle de bains"),
        referenceTask("zone3_ref_005", "Laver la porte de douche", "Salle de bains"),
        referenceTask("zone3_ref_006", "Nettoyer la pharmacie et vérifier les médicaments", "Salle de bains"),
        referenceTask("zone3_ref_007", "Nettoyer le pèse-personne", "Salle de bains"),
        referenceTask("zone3_ref_008", "Jeter les bouteilles vides", "Salle de bains"),
        referenceTask("zone3_ref_009", "Polir les meubles", "Autre pièce"),
        referenceTask("zone3_ref_010", "Ranger les tiroirs et les garde-robes", "Autre pièce"),
        referenceTask("zone3_ref_011", "Enlever les toiles d'araignée", "Autre pièce"),
        referenceTask("zone3_ref_012", "Laver le couvre-matelas", "Autre pièce"),
        referenceTask("zone3_ref_013", "Retourner le matelas", "Autre pièce"),
        referenceTask("zone3_ref_014", "Laver les rideaux", "Autre pièce"),
        referenceTask("zone3_ref_015", "Laver la fenêtre", "Autre pièce"),
        referenceTask("zone3_ref_016", "Nettoyer la fenêtre en saillie", "Autre pièce"),
        referenceTask("zone3_ref_017", "Laver le bain", "Autre pièce"),
        referenceTask("zone3_ref_018", "Nettoyer le dessus de la machine à coudre", "Autre pièce"),
        referenceTask("zone3_ref_019", "Ranger la bibliothèque", "Autre pièce"),
        referenceTask("zone3_ref_020", "Ranger le meuble d'ordinateur", "Autre pièce"),
        referenceTask("zone3_ref_021", "Ranger la garde-robe", "Autre pièce"),
        referenceTask("zone3_ref_022", "Retirer les objets qui ne vont pas dans cette pièce", "Autre pièce"),
        referenceTask("zone3_ref_023", "Fertiliser les plantes", "Autre pièce")
      ]
    },
    {
      id: "bedroom",
      number: 4,
      name: "Chambre parentale",
      short: "Z4",
      description: "Des repères pour protéger le repos et alléger l'espace personnel.",
      sections: ["Chambre", "Armoire, penderie ou dressing"],
      tasks: [
        referenceTask("zone4_ref_001", "Laver les tapis", "Chambre"),
        referenceTask("zone4_ref_002", "Polir les meubles", "Chambre"),
        referenceTask("zone4_ref_003", "Nettoyer le bureau", "Chambre"),
        referenceTask("zone4_ref_004", "Enlever les toiles d'araignée", "Chambre"),
        referenceTask("zone4_ref_005", "Laver le couvre-matelas", "Chambre"),
        referenceTask("zone4_ref_006", "Retourner le matelas", "Chambre"),
        referenceTask("zone4_ref_007", "Vider les poubelles", "Chambre"),
        referenceTask("zone4_ref_008", "Laver les fenêtres", "Chambre"),
        referenceTask("zone4_ref_009", "Retirer quelques livres de la bibliothèque", "Chambre"),
        referenceTask("zone4_ref_010", "Ranger les tiroirs", "Chambre"),
        referenceTask("zone4_ref_011", "Nettoyer sous le lit", "Chambre"),
        referenceTask("zone4_ref_012", "Ranger les étagères du haut", "Armoire, penderie ou dressing"),
        referenceTask("zone4_ref_013", "Ranger les souliers", "Armoire, penderie ou dressing"),
        referenceTask("zone4_ref_014", "Descendre les valises au sous-sol", "Armoire, penderie ou dressing"),
        referenceTask("zone4_ref_015", "Épousseter les casiers à souliers", "Armoire, penderie ou dressing")
      ]
    },
    {
      id: "living",
      number: 5,
      name: "Salon",
      short: "Z5",
      description: "Des idées pour garder la pièce commune accueillante et respirable.",
      sections: ["Salon"],
      tasks: [
        referenceTask("zone5_ref_001", "Nettoyer sous les coussins", "Salon"),
        referenceTask("zone5_ref_002", "Polir les meubles", "Salon"),
        referenceTask("zone5_ref_003", "Ranger les garde-robes et les tiroirs", "Salon"),
        referenceTask("zone5_ref_004", "Nettoyer les objets décoratifs et les étagères", "Salon"),
        referenceTask("zone5_ref_005", "Enlever les toiles d'araignée", "Salon"),
        referenceTask("zone5_ref_006", "Effacer les marques de doigts sur les murs", "Salon"),
        referenceTask("zone5_ref_007", "Déplacer les meubles et passer l'aspirateur", "Salon"),
        referenceTask("zone5_ref_008", "Laver les fenêtres", "Salon"),
        referenceTask("zone5_ref_009", "Nettoyer le téléphone", "Salon"),
        referenceTask("zone5_ref_010", "Laver le tapis", "Salon"),
        referenceTask("zone5_ref_011", "Nettoyer le foyer", "Salon"),
        referenceTask("zone5_ref_012", "Ranger la bibliothèque", "Salon"),
        referenceTask("zone5_ref_013", "Nettoyer les tables de bout", "Salon"),
        referenceTask("zone5_ref_014", "Fertiliser les plantes", "Salon"),
        referenceTask("zone5_ref_015", "Retoucher la peinture sur les portes françaises", "Salon")
      ]
    }
  ];

  const referenceWeeklyZones = [
    { id: "entry", name: "Entrées et salle à manger", description: "On facilite les arrivées, les départs et les repas.", color: "#dce9df" },
    { id: "kitchen", name: "Cuisine", description: "On redonne un peu d'air aux surfaces les plus utilisées.", color: "#f3e2cf" },
    { id: "bathroom", name: "Salle de bains et autre pièce", description: "On crée de la fraîcheur dans les espaces de soin et la pièce supplémentaire.", color: "#dfe9ed" },
    { id: "bedroom", name: "Chambre parentale", description: "On protège le repos avec quelques gestes simples.", color: "#e7e1ee" },
    { id: "living", name: "Salon", description: "On apaise la pièce où la vie se rassemble.", color: "#eee4d4" }
  ];

  const weeklyPrograms = [
    {
      id: "blessing",
      title: "Bénédiction hebdomadaire",
      shortTitle: "Bénédiction",
      description: "Un rafraîchissement rapide de la maison, sans chercher le grand ménage.",
      duration: "Environ 1 h",
      tasks: [
        { id: "blessing-01", title: "Trier et jeter les vieux magazines et catalogues" },
        { id: "blessing-02", title: "Changer les draps" },
        { id: "blessing-03", title: "Vider toutes les poubelles de la maison" },
        { id: "blessing-04", title: "Passer l'aspirateur dans les chambres et les pièces de vie" },
        { id: "blessing-05", title: "Passer la serpillière dans la cuisine et la salle de bain" },
        { id: "blessing-06", title: "Nettoyer les miroirs" },
        { id: "blessing-07", title: "Nettoyer les portes" }
      ]
    },
    {
      id: "personal",
      title: "Journée personnelle",
      shortTitle: "Personnelle",
      description: "Une journée pour les besoins personnels et ce qui te fait du bien.",
      duration: "À ton rythme",
      tasks: [
        { id: "personal-01", title: "Faire les courses" },
        { id: "personal-02", title: "Arroser les plantes" },
        { id: "personal-03", title: "Prendre du temps pour soi" },
        { id: "personal-04", title: "Effectuer des rendez-vous personnels" }
      ]
    },
    {
      id: "zone",
      title: "Journée zone et organisation",
      shortTitle: "Zone et organisation",
      description: "Un moment pour la zone active et les repères qui allègent la maison.",
      duration: "À ton rythme",
      tasks: [
        { id: "zone-day-01", title: "Travailler dans la zone active" },
        { id: "zone-day-02", title: "Trier et classer les papiers" },
        { id: "zone-day-03", title: "Mettre à jour le journal de bord" },
        { id: "zone-day-04", title: "Organiser les documents importants" }
      ]
    },
    {
      id: "daily-management",
      title: "Journée gestion du quotidien",
      shortTitle: "Gestion du quotidien",
      description: "Quelques tâches pratiques pour soutenir le reste de la semaine.",
      duration: "À ton rythme",
      tasks: [
        { id: "daily-management-01", title: "Faire les courses" },
        { id: "daily-management-02", title: "Faire le repassage" },
        { id: "daily-management-03", title: "S'occuper de la gestion de la maison" },
        { id: "daily-management-04", title: "Faire de petites tâches administratives" }
      ]
    },
    {
      id: "administrative",
      title: "Journée administrative",
      shortTitle: "Administrative",
      description: "Rassembler les décisions et les papiers pour libérer l'esprit.",
      duration: "À ton rythme",
      tasks: [
        { id: "administrative-01", title: "Traiter le courrier" },
        { id: "administrative-02", title: "Vérifier le budget" },
        { id: "administrative-03", title: "Classer les documents" },
        { id: "administrative-04", title: "Faire la gestion administrative" },
        { id: "administrative-05", title: "Nettoyer et vider le réfrigérateur" }
      ]
    },
    {
      id: "family",
      title: "Journée famille et plaisir",
      shortTitle: "Famille et plaisir",
      description: "Une journée pour les liens, le repos et les moments agréables.",
      duration: "À ton rythme",
      tasks: [
        { id: "family-01", title: "Prévoir une activité familiale" },
        { id: "family-02", title: "Profiter d'un loisir" },
        { id: "family-03", title: "Faire une sortie" },
        { id: "family-04", title: "Prendre du repos" },
        { id: "family-05", title: "Créer un moment agréable" }
      ]
    }
  ];

  const defaultWeeklyProgramSchedule = {
    blessing: 1,
    personal: 2,
    zone: 3,
    "daily-management": 4,
    administrative: 5,
    family: 6
  };

  const defaultRoutines = [
    { id: "default-v2-morning-1", routine: "morning", title: "S'habiller et se chausser", duration: "5 min", order: 0 },
    { id: "default-v2-morning-2", routine: "morning", title: "Faire le lit", duration: "3 min", order: 1 },
    { id: "default-v2-morning-3", routine: "morning", title: "Prendre 5 minutes pour ranger", duration: "5 min", order: 2 },
    { id: "default-v2-evening-1", routine: "evening", title: "Préparer ses vêtements pour le lendemain", duration: "5 min", order: 0 },
    { id: "default-v2-evening-2", routine: "evening", title: "Nettoyer et faire briller l'évier", duration: "5 min", order: 1 },
    { id: "default-v2-evening-3", routine: "evening", title: "Ranger ce qui traîne", duration: "5 min", order: 2 }
  ];

  window.APP_DATA = {
    quotes: quotes,
    missions: missions,
    tips: tips,
    leapDayTip: leapDayTip,
    smallSteps: smallSteps,
    principles: principles,
    zones: referenceZones,
    weeklyZones: referenceWeeklyZones,
    weeklyPrograms: weeklyPrograms,
    defaultWeeklyProgramSchedule: defaultWeeklyProgramSchedule,
    defaultRoutines: defaultRoutines
  };
})();
