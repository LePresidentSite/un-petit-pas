(function () {
  "use strict";

  const DATA = window.APP_DATA;
  const DB = window.AppDB;
  const ACCOUNT = window.UnPetitPasAccount;
  const ROUTE_TITLES = {
    home: "Aujourd'hui",
    zones: "Zones",
    routines: "Routines",
    history: "Progrès",
    settings: "Réglages",
    pro: "Découvrir PRO",
    about: "À propos"
  };
  const TIMER_CIRCUMFERENCE = 2 * Math.PI * 69;
  const DEFAULT_TIMER_STATE = {
    selectedMinutes: 5,
    durationMs: 5 * 60 * 1000,
    remainingMs: 5 * 60 * 1000,
    status: "idle",
    endAt: null,
    startedAt: null,
    completedAt: null
  };
  const DEFAULT_SETTINGS = {
    firstName: "",
    reduceMotion: false,
    missionReminder: false,
    missionTime: "09:00",
    tipReminder: false,
    tipTime: "12:30",
    zoneReminder: false,
    zoneTime: "18:00",
    lastMissionNotification: "",
    lastTipNotification: "",
    lastZoneNotification: "",
    timerState: Object.assign({}, DEFAULT_TIMER_STATE)
  };

  const state = {
    today: new Date(),
    route: "home",
    activeRoutine: "morning",
    settings: Object.assign({}, DEFAULT_SETTINGS),
    activities: new Map(),
    routineTasks: [],
    routineChecks: new Map(),
    zoneStates: new Map(),
    favorites: new Map(),
    selectedHistoryDate: "",
    calendarCursor: null,
    deferredInstallPrompt: null,
    serviceWorkerRegistration: null,
    notificationTimer: null,
    dailyRefreshTimer: null,
    toastTimer: null,
    timer: Object.assign({}, DEFAULT_TIMER_STATE),
    timerInterval: null,
    audioContext: null,
    accountMode: "signup",
    account: {
      ready: false,
      cloudEnabled: false,
      user: null,
      subscription: null,
      isPro: false,
      pricing: { founderActive: true, founderRemaining: 100, founderLimit: 100 },
      limits: { customRoutineTasks: 3, favorites: 3, historyDays: 7, zoneTasksPerSection: 6 }
    }
  };

  const elements = {};

  document.addEventListener("DOMContentLoaded", init);

  async function init() {
    cacheElements();
    bindEvents();

    try {
      await DB.open();
      await loadState();
      applyPreferences();
      renderAll();
      await restoreTimer();
      setupInstallPrompt();
      setupServiceWorker();
      startNotificationWatcher();
      scheduleDailyRefresh();
      showApp();
      initializeAccount();
      handlePaymentReturn();
    } catch (error) {
      console.error(error);
      showFatalError();
    }
  }

  function cacheElements() {
    [
      "app", "splash", "todayLabel", "pageTitle", "dailyQuote", "dailyProgressRing",
      "dailyProgressValue", "progressTitle", "progressCaption", "missionTitle",
      "missionTime", "missionDescription", "completeMissionButton", "tipNumber",
      "dailyTip", "markTipButton", "weeklyZoneVisual", "weeklyZoneTitle",
      "weeklyZoneDescription", "zonesList", "addRoutineTaskButton", "routineSummary",
      "routineTaskList", "totalSteps", "missionCount", "tipCount", "calendarMonth",
      "calendarGrid", "historyDayTitle", "historyDayCount", "historyList",
      "previousMonth", "nextMonth", "missionReminder", "missionTimeSetting",
      "tipReminder", "tipTimeSetting", "zoneReminder", "zoneTimeSetting",
      "enableNotificationsButton", "notificationStatus", "reduceMotionSetting",
      "firstNameSetting", "saveSettingsButton", "installButton",
      "installSettingsButton", "resetDataButton", "routineTaskDialog",
      "routineTaskForm", "routineDialogTitle", "routineTaskId", "routineTaskName",
      "routineTaskPeriod", "routineTaskDuration", "toast", "updateBanner",
      "reloadAppButton", "timerFab", "timerFabRing", "timerFabLabel",
      "timerFabTime", "timerPanel", "closeTimerButton", "timerMainView",
      "timerProgressCircle", "timerTimeRemaining", "timerStatusText",
      "timerResetButton", "timerPrimaryButton", "timerPrimaryIcon",
      "timerPrimaryLabel", "timerCompleteView", "timerDoneButton",
      "homeTimerButton", "missionTimerButton", "accountButton",
      "favoriteMissionButton", "favoritesList", "favoriteCount",
      "accountButtonLabel", "accountSettingsButton", "manageSubscriptionButton",
      "signOutButton", "accountPlanLabel", "accountSettingsStatus",
      "accountSettingsEmail", "createAccountButton", "loginAccountButton",
      "upgradeMonthlyButton", "upgradeYearlyButton", "upgradePrimaryButton",
      "upgradeLifetimeButton", "founderOfferPanel", "founderCounter",
      "founderOfferBadge", "lifetimePricingCard", "lifetimeRegularPrice",
      "lifetimePrice", "lifetimeDescription",
      "proPaymentNotice", "advancedStatsPanel", "advancedStatsContent",
      "historyAccessNote", "accountDialog", "accountForm", "accountDialogTitle",
      "accountDialogCopy", "accountError", "accountSuccess",
      "accountFirstNameField", "accountFirstName", "accountEmail",
      "accountPassword", "accountSubmitButton", "accountModeSwitch",
      "accountResetPassword", "accountCloudNotice", "closeAccountDialog"
    ].forEach(function (id) {
      elements[id] = document.getElementById(id);
    });
  }

  async function loadState() {
    const todayKey = formatDateKey(state.today);
    state.selectedHistoryDate = todayKey;
    state.calendarCursor = new Date(state.today.getFullYear(), state.today.getMonth(), 1);
    state.settings = await DB.getSettings(DEFAULT_SETTINGS);
    state.timer = normalizeTimerState(state.settings.timerState);
    state.settings.timerState = Object.assign({}, state.timer);
    state.routineTasks = await DB.seedRoutines(DATA.defaultRoutines);

    const results = await Promise.all([
      DB.getAll("activities"),
      DB.getAll("routineChecks"),
      DB.getAll("zoneTaskStates"),
      DB.getAll("favorites")
    ]);

    state.activities = new Map(results[0].map(function (item) { return [item.id, item]; }));
    state.routineChecks = new Map(results[1].map(function (item) { return [item.id, item]; }));
    state.zoneStates = new Map(results[2].map(function (item) { return [item.id, item]; }));
    state.favorites = new Map(results[3].map(function (item) { return [item.id, item]; }));
    await migrateLegacyZoneData();

    const hashRoute = window.location.hash.replace("#", "");
    if (Object.prototype.hasOwnProperty.call(ROUTE_TITLES, hashRoute)) {
      state.route = hashRoute;
    }
  }

  function bindEvents() {
    document.addEventListener("click", handleDocumentClick);
    elements.completeMissionButton.addEventListener("click", completeMission);
    elements.markTipButton.addEventListener("click", markTipRead);
    elements.zonesList.addEventListener("click", handleZoneClick);
    elements.routineTaskList.addEventListener("click", handleRoutineListClick);
    elements.addRoutineTaskButton.addEventListener("click", function () { openRoutineDialog(); });
    elements.routineTaskForm.addEventListener("submit", saveRoutineTask);
    elements.previousMonth.addEventListener("click", function () { changeMonth(-1); });
    elements.nextMonth.addEventListener("click", function () { changeMonth(1); });
    elements.calendarGrid.addEventListener("click", selectCalendarDay);
    elements.saveSettingsButton.addEventListener("click", saveSettings);
    elements.enableNotificationsButton.addEventListener("click", requestNotifications);
    elements.installButton.addEventListener("click", installApp);
    elements.installSettingsButton.addEventListener("click", installApp);
    elements.resetDataButton.addEventListener("click", resetData);
    elements.reloadAppButton.addEventListener("click", activateUpdate);
    elements.timerFab.addEventListener("click", toggleTimerPanel);
    elements.closeTimerButton.addEventListener("click", closeTimerPanel);
    elements.timerPrimaryButton.addEventListener("click", handleTimerPrimaryAction);
    elements.timerResetButton.addEventListener("click", resetTimer);
    elements.timerDoneButton.addEventListener("click", acknowledgeTimerCompletion);
    elements.homeTimerButton.addEventListener("click", openTimerPanel);
    elements.missionTimerButton.addEventListener("click", openMissionTimer);
    elements.favoriteMissionButton.addEventListener("click", toggleDailyMissionFavorite);
    elements.favoritesList.addEventListener("click", handleFavoriteClick);
    elements.accountButton.addEventListener("click", handleAccountButton);
    elements.accountSettingsButton.addEventListener("click", handleAccountSettingsButton);
    elements.manageSubscriptionButton.addEventListener("click", manageSubscription);
    elements.signOutButton.addEventListener("click", signOutAccount);
    elements.createAccountButton.addEventListener("click", function () { openAccountDialog("signup"); });
    elements.loginAccountButton.addEventListener("click", function () { openAccountDialog("login"); });
    elements.upgradeMonthlyButton.addEventListener("click", function () { startUpgrade("monthly"); });
    elements.upgradeYearlyButton.addEventListener("click", function () { startUpgrade("yearly"); });
    elements.upgradeLifetimeButton.addEventListener("click", function () { startUpgrade("lifetime"); });
    elements.upgradePrimaryButton.addEventListener("click", function () { startUpgrade("yearly"); });
    elements.accountForm.addEventListener("submit", submitAccountForm);
    elements.accountModeSwitch.addEventListener("click", toggleAccountMode);
    elements.accountResetPassword.addEventListener("click", resetAccountPassword);
    elements.closeAccountDialog.addEventListener("click", function () { elements.accountDialog.close(); });
    window.addEventListener("unpetitpas:account-change", handleAccountChange);
    document.querySelectorAll("[data-timer-minutes]").forEach(function (button) {
      button.addEventListener("click", selectTimerPreset);
    });
    document.addEventListener("visibilitychange", handleAppResume);
    window.addEventListener("pageshow", handleAppResume);
    window.addEventListener("hashchange", navigateFromHash);
  }

  function handleDocumentClick(event) {
    const routeButton = event.target.closest("[data-route]");
    if (routeButton) {
      event.preventDefault();
      navigate(routeButton.dataset.route);
      return;
    }

    const routineTab = event.target.closest("[data-routine]");
    if (routineTab) {
      state.activeRoutine = routineTab.dataset.routine;
      renderRoutines();
      return;
    }

    if (event.target.closest("[data-close-dialog]")) {
      elements.routineTaskDialog.close();
    }
  }

  function navigate(route, updateHash) {
    if (!ROUTE_TITLES[route]) route = "home";
    state.route = route;
    document.body.dataset.activeRoute = route;

    document.querySelectorAll("[data-page]").forEach(function (page) {
      page.classList.toggle("active", page.dataset.page === route);
    });
    document.querySelectorAll(".nav-item[data-route]").forEach(function (button) {
      const active = button.dataset.route === route;
      button.classList.toggle("active", active);
      if (active) button.setAttribute("aria-current", "page");
      else button.removeAttribute("aria-current");
    });

    renderHeader(route);
    document.title = (route === "home" ? "Un Petit Pas" : ROUTE_TITLES[route] + " · Un Petit Pas");

    if (updateHash !== false && window.location.hash !== "#" + route) {
      history.replaceState(null, "", "#" + route);
    }

    if (route === "history") renderHistory();
    if (route === "pro") renderAccountUi();
    window.scrollTo({ top: 0, behavior: state.settings.reduceMotion ? "auto" : "smooth" });
  }

  function navigateFromHash() {
    navigate(window.location.hash.replace("#", "") || "home", false);
  }

  function renderAll() {
    renderHeader();
    renderHome();
    renderZones();
    renderRoutines();
    renderHistory();
    renderSettings();
    renderAccountUi();
    renderTimer();
    navigate(state.route, false);
  }

  function renderHeader(route) {
    const activeRoute = route || state.route;
    elements.todayLabel.textContent = new Intl.DateTimeFormat("fr-CA", {
      weekday: "long",
      day: "numeric",
      month: "long"
    }).format(state.today);
    elements.pageTitle.textContent = ROUTE_TITLES[activeRoute] || ROUTE_TITLES.home;
  }

  function getDailyContent(date) {
    const contentDate = date || state.today;
    const dayNumber = daysSinceReference(contentDate);
    const weekNumber = getISOWeek(contentDate);
    const tipSelection = getDailyTip(contentDate);
    return {
      quote: DATA.quotes[dayNumber % DATA.quotes.length],
      mission: DATA.missions[dayNumber % DATA.missions.length],
      missionIndex: dayNumber % DATA.missions.length,
      tip: tipSelection.tip,
      tipIndex: tipSelection.index,
      tipLabel: tipSelection.label,
      weeklyZone: DATA.weeklyZones[(weekNumber - 1) % DATA.weeklyZones.length],
      weeklyIndex: (weekNumber - 1) % DATA.weeklyZones.length
    };
  }

  function renderHome() {
    const daily = getDailyContent();
    const todayKey = formatDateKey(state.today);
    const missionRef = "mission-" + daily.missionIndex;
    const missionDone = hasActivity("mission", todayKey, missionRef);
    const tipDone = hasActivity("tip", todayKey, daily.tip.id);
    const missionFavoriteId = "mission-" + daily.missionIndex;
    const missionFavorite = state.favorites.has(missionFavoriteId);
    const otherStepDone = Array.from(state.activities.values()).some(function (activity) {
      return activity.date === todayKey && activity.type !== "mission" && activity.type !== "tip";
    });
    const progress = Math.round(([missionDone, tipDone, otherStepDone].filter(Boolean).length / 3) * 100);

    elements.dailyQuote.textContent = daily.quote;
    elements.missionTitle.textContent = daily.mission.title;
    elements.missionTime.textContent = daily.mission.minutes + " min";
    elements.missionDescription.textContent = daily.mission.description;
    elements.tipNumber.textContent = daily.tipLabel;
    elements.dailyTip.textContent = daily.tip.text;
    elements.weeklyZoneTitle.textContent = daily.weeklyZone.name;
    elements.weeklyZoneDescription.textContent = daily.weeklyZone.description;
    elements.weeklyZoneVisual.style.background = daily.weeklyZone.color;

    elements.completeMissionButton.classList.toggle("completed", missionDone);
    elements.completeMissionButton.disabled = missionDone;
    elements.completeMissionButton.querySelector("span").textContent = missionDone ? "Mission terminée" : "J'ai terminé";

    elements.markTipButton.classList.toggle("completed", tipDone);
    elements.markTipButton.disabled = tipDone;
    elements.markTipButton.firstChild.textContent = tipDone ? "Conseil lu " : "Marquer comme lu ";
    elements.favoriteMissionButton.classList.toggle("completed", missionFavorite);
    elements.favoriteMissionButton.setAttribute("aria-pressed", String(missionFavorite));
    elements.favoriteMissionButton.querySelector("span").textContent = missionFavorite ? "Dans mes favoris" : "Ajouter aux favoris";

    elements.dailyProgressRing.style.setProperty("--progress", String(progress));
    elements.dailyProgressValue.textContent = progress + "%";

    if (progress === 100) {
      elements.progressTitle.textContent = "C'est assez pour aujourd'hui";
      elements.progressCaption.textContent = "Tu peux être fière ou fier de ce pas.";
    } else if (progress >= 66) {
      elements.progressTitle.textContent = "Tu avances déjà";
      elements.progressCaption.textContent = "Chaque geste compte.";
    } else if (progress >= 33) {
      elements.progressTitle.textContent = "Un beau début";
      elements.progressCaption.textContent = "La suite peut attendre.";
    } else {
      elements.progressTitle.textContent = "Un pas à la fois";
      elements.progressCaption.textContent = "Rien ne presse.";
    }
  }

  async function completeMission() {
    const daily = getDailyContent();
    const refId = "mission-" + daily.missionIndex;
    const todayKey = formatDateKey(state.today);
    await addActivity("mission", todayKey, refId, daily.mission.title);
    renderHome();
    renderHistory();
    showToast("C'est fait. Ce petit pas compte vraiment.");
  }

  async function markTipRead() {
    const daily = getDailyContent();
    const todayKey = formatDateKey(state.today);
    await addActivity("tip", todayKey, daily.tip.id, "Conseil du jour lu");
    renderHome();
    renderHistory();
    showToast("Conseil gardé pour aujourd'hui.");
  }

  async function toggleDailyMissionFavorite() {
    const daily = getDailyContent();
    const id = "mission-" + daily.missionIndex;
    if (state.favorites.has(id)) {
      await DB.remove("favorites", id);
      state.favorites.delete(id);
      renderHome();
      renderFavorites();
      showToast("Mission retirée des favoris.");
      return;
    }

    if (!canUse("unlimitedFavorites") && state.favorites.size >= state.account.limits.favorites) {
      navigate("pro");
      showToast("La version gratuite permet de garder trois missions favorites.");
      return;
    }

    const favorite = {
      id: id,
      type: "mission",
      title: daily.mission.title,
      description: daily.mission.description,
      minutes: daily.mission.minutes,
      savedAt: new Date().toISOString()
    };
    await DB.put("favorites", favorite);
    state.favorites.set(id, favorite);
    renderHome();
    renderFavorites();
    showToast("Mission ajoutée aux favoris.");
  }

  function renderZones() {
    const currentWeeklyZone = getDailyContent().weeklyZone;
    const hasCompleteZones = canUse("completeZones");
    const freeTaskLimit = state.account.limits.zoneTasksPerSection;
    elements.zonesList.innerHTML = DATA.zones.map(function (zone) {
      const availableTasks = zone.tasks.filter(function (task) {
        if (hasCompleteZones) return true;
        const sectionTasks = zone.tasks.filter(function (row) { return row.categorie === task.categorie; });
        return sectionTasks.indexOf(task) < freeTaskLimit;
      });
      const doneCount = availableTasks.filter(function (task) {
        return isZoneTaskDone(task.id);
      }).length;
      const percent = Math.round((doneCount / availableTasks.length) * 100);
      const sections = zone.sections.map(function (section, sectionIndex) {
        const sectionTasks = zone.tasks.filter(function (task) { return task.categorie === section; });
        const visibleTasks = hasCompleteZones ? sectionTasks : sectionTasks.slice(0, freeTaskLimit);
        const hiddenTaskCount = Math.max(0, sectionTasks.length - visibleTasks.length);
        const sectionDone = visibleTasks.filter(function (task) { return isZoneTaskDone(task.id); }).length;
        const tasks = visibleTasks.map(function (task) {
          const done = isZoneTaskDone(task.id);
          return [
            '<button class="check-row zone-task-row', done ? " done" : "",
            '" data-zone-id="', zone.id, '" data-zone-task-id="', task.id,
            '" aria-pressed="', String(done), '">',
            '<span class="custom-check"><svg><use href="#icon-check"></use></svg></span>',
            '<span class="zone-task-copy"><span class="task-label">', escapeHtml(task.titre), "</span>",
            '<span class="zone-task-meta"><span>', escapeHtml(task.categorie), '</span><span class="zone-duration"><svg><use href="#icon-clock"></use></svg>', task.duree, " min</span></span></span>",
            "</button>"
          ].join("");
        }).join("");

        return [
          '<details class="zone-subsection"', currentWeeklyZone.id === zone.id && sectionIndex === 0 ? " open" : "", ">",
          '<summary><span>', escapeHtml(section), '</span><span class="zone-section-count">', sectionDone, "/", visibleTasks.length,
          '</span><svg><use href="#icon-chevron"></use></svg></summary>',
          '<div class="mini-task-list">', tasks,
          hiddenTaskCount ? '<button class="zone-pro-teaser" type="button" data-route="pro"><svg><use href="#icon-lock"></use></svg><span>' + hiddenTaskCount + ' autres mini-tâches avec PRO</span><svg><use href="#icon-chevron"></use></svg></button>' : "",
          "</div>",
          "</details>"
        ].join("");
      }).join("");

      return [
        '<article class="card zone-card', currentWeeklyZone.id === zone.id ? " current-zone" : "", '">',
        '<div class="zone-card-header">',
        '<span class="zone-icon">', zone.short, "</span>",
        "<div><h3>", escapeHtml(zone.name), "</h3><p>", doneCount, " sur ", availableTasks.length, " terminées", hasCompleteZones ? "" : " · essentiel gratuit", "</p></div>",
        '<span class="zone-percent">', percent, "%</span>",
        "</div>",
        '<div class="zone-progress-track"><span style="--width:', percent, '%"></span></div>',
        '<p class="zone-description">', escapeHtml(zone.description), "</p>",
        '<div class="zone-subsections">', sections, "</div>",
        "</article>"
      ].join("");
    }).join("");
  }

  function isZoneTaskDone(taskId) {
    const row = state.zoneStates.get(taskId);
    return Boolean(row && row.completed);
  }

  async function handleZoneClick(event) {
    const taskButton = event.target.closest("[data-zone-task-id]");
    if (!taskButton) return;

    const zoneId = taskButton.dataset.zoneId;
    const taskId = taskButton.dataset.zoneTaskId;
    const zone = DATA.zones.find(function (item) { return item.id === zoneId; });
    const task = zone && zone.tasks.find(function (item) { return item.id === taskId; });
    if (!zone || !task) return;

    const current = state.zoneStates.get(task.id);
    const completed = !(current && current.completed);

    if (completed) {
      const completedDate = formatDateKey(new Date());
      const row = { id: task.id, completed: true, completedDate: completedDate };
      await DB.put("zoneTaskStates", row);
      state.zoneStates.set(task.id, row);
      await addActivity("zone", completedDate, task.id, task.categorie + " · " + task.titre);
      showToast("Un petit pas de plus.");
    } else {
      const completedDate = current.completedDate || formatDateKey(new Date());
      await DB.remove("zoneTaskStates", task.id);
      state.zoneStates.delete(task.id);
      await removeActivity("zone", completedDate, task.id);
    }

    renderZones();
    renderHome();
    renderHistory();
  }

  async function migrateLegacyZoneData() {
    for (const zone of DATA.zones) {
      for (let index = 0; index < zone.tasks.length; index += 1) {
        const task = zone.tasks[index];
        const legacyId = zone.id + ":" + index;
        const legacyState = state.zoneStates.get(legacyId);

        if (legacyState) {
          if (!state.zoneStates.has(task.id)) {
            const migratedState = Object.assign({}, legacyState, { id: task.id });
            await DB.put("zoneTaskStates", migratedState);
            state.zoneStates.set(task.id, migratedState);
          }
          await DB.remove("zoneTaskStates", legacyId);
          state.zoneStates.delete(legacyId);
        }

        const legacyActivities = Array.from(state.activities.values()).filter(function (activity) {
          return activity.type === "zone" && activity.refId === legacyId;
        });

        for (const activity of legacyActivities) {
          const migratedId = activityId("zone", activity.date, task.id);
          if (!state.activities.has(migratedId)) {
            const migratedActivity = Object.assign({}, activity, {
              id: migratedId,
              refId: task.id,
              title: task.categorie + " · " + task.titre
            });
            await DB.put("activities", migratedActivity);
            state.activities.set(migratedId, migratedActivity);
          }
          await DB.remove("activities", activity.id);
          state.activities.delete(activity.id);
        }
      }
    }
  }

  function renderRoutines() {
    document.querySelectorAll(".routine-tab").forEach(function (button) {
      const active = button.dataset.routine === state.activeRoutine;
      button.classList.toggle("active", active);
      button.setAttribute("aria-selected", String(active));
    });

    const tasks = getRoutineTasks(state.activeRoutine);
    const todayKey = formatDateKey(state.today);
    const completed = tasks.filter(function (task) {
      return state.routineChecks.has(todayKey + ":" + task.id);
    }).length;
    const names = { morning: "du matin", afternoon: "de l'après-midi", evening: "du soir" };
    const percent = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;
    const routineIcons = {
      morning: "#icon-spark",
      afternoon: "#icon-clock",
      evening: "#icon-moon"
    };

    elements.routineSummary.innerHTML = [
      '<div class="routine-summary-card">',
      "<strong>", completed, " sur ", tasks.length, " aujourd'hui</strong>",
      "<p>Routine ", names[state.activeRoutine], " · avance à ton rythme</p>",
      '<div class="routine-progress-track"><span style="--width:', percent, '%"></span></div>',
      !canUse("unlimitedRoutines")
        ? '<p class="routine-plan-note"><svg><use href="#icon-lock"></use></svg>' + getCustomRoutineCount() + " sur " + state.account.limits.customRoutineTasks + ' tâches personnalisées gratuites</p>'
        : "",
      "</div>"
    ].join("");

    if (!tasks.length) {
      elements.routineTaskList.innerHTML = '<div class="empty-state"><h3>Une routine toute légère</h3><p>Ajoute une première tâche quand tu es prête ou prêt.</p></div>';
      return;
    }

    elements.routineTaskList.innerHTML = tasks.map(function (task, index) {
      const done = state.routineChecks.has(todayKey + ":" + task.id);
      return [
        '<article class="routine-item', done ? " done" : "", '" data-task-id="', task.id, '">',
        '<button class="routine-check" data-routine-action="toggle" aria-label="', done ? "Marquer comme non terminée" : "Marquer comme terminée", '">',
        '<span class="custom-check"><svg><use href="#icon-check"></use></svg></span>',
        "</button>",
        '<span class="routine-item-icon"><svg><use href="', routineIcons[task.routine], '"></use></svg></span>',
        "<div><p class=\"routine-name\">", escapeHtml(task.title), '</p><span class="routine-duration">', escapeHtml(task.duration || "Quelques minutes"), "</span></div>",
        '<div class="routine-actions">',
        '<button class="small-action" data-routine-action="up" aria-label="Monter la tâche"', index === 0 ? " disabled" : "", '><svg><use href="#icon-arrow"></use></svg></button>',
        '<button class="small-action down" data-routine-action="down" aria-label="Descendre la tâche"', index === tasks.length - 1 ? " disabled" : "", '><svg><use href="#icon-arrow"></use></svg></button>',
        '<button class="small-action" data-routine-action="edit" aria-label="Modifier la tâche"><svg><use href="#icon-edit"></use></svg></button>',
        '<button class="small-action" data-routine-action="delete" aria-label="Supprimer la tâche"><svg><use href="#icon-trash"></use></svg></button>',
        "</div></article>"
      ].join("");
    }).join("");
  }

  function getRoutineTasks(routine) {
    return state.routineTasks
      .filter(function (task) { return task.routine === routine; })
      .sort(function (a, b) { return a.order - b.order; });
  }

  function getCustomRoutineCount() {
    return state.routineTasks.filter(function (task) {
      return !String(task.id).startsWith("default-");
    }).length;
  }

  function canAddCustomRoutineTask() {
    return canUse("unlimitedRoutines") ||
      getCustomRoutineCount() < state.account.limits.customRoutineTasks;
  }

  function canUse(feature) {
    return ACCOUNT ? ACCOUNT.can(feature) : false;
  }

  async function handleRoutineListClick(event) {
    const actionButton = event.target.closest("[data-routine-action]");
    const item = event.target.closest("[data-task-id]");
    if (!actionButton || !item) return;

    const task = state.routineTasks.find(function (row) { return row.id === item.dataset.taskId; });
    if (!task) return;

    const action = actionButton.dataset.routineAction;
    if (action === "toggle") await toggleRoutineTask(task);
    if (action === "edit") openRoutineDialog(task);
    if (action === "delete") await deleteRoutineTask(task);
    if (action === "up" || action === "down") await moveRoutineTask(task, action);
  }

  async function toggleRoutineTask(task) {
    const todayKey = formatDateKey(state.today);
    const checkId = todayKey + ":" + task.id;

    if (state.routineChecks.has(checkId)) {
      await DB.remove("routineChecks", checkId);
      state.routineChecks.delete(checkId);
      await removeActivity("routine", todayKey, task.id);
    } else {
      const row = { id: checkId, date: todayKey, taskId: task.id, routine: task.routine };
      await DB.put("routineChecks", row);
      state.routineChecks.set(checkId, row);
      await addActivity("routine", todayKey, task.id, task.title);
      showToast("Bien joué. Tu peux t'arrêter là.");
    }

    renderRoutines();
    renderHome();
    renderHistory();
  }

  function openRoutineDialog(task) {
    const editing = Boolean(task);
    if (!editing && !canAddCustomRoutineTask()) {
      navigate("pro");
      showToast("PRO permet d'ajouter des tâches de routine sans limite.");
      return;
    }
    elements.routineDialogTitle.textContent = editing ? "Modifier la tâche" : "Ajouter une tâche";
    elements.routineTaskId.value = editing ? task.id : "";
    elements.routineTaskName.value = editing ? task.title : "";
    elements.routineTaskPeriod.value = editing ? task.routine : state.activeRoutine;
    elements.routineTaskDuration.value = editing ? task.duration : "";
    elements.routineTaskDialog.showModal();
    window.setTimeout(function () { elements.routineTaskName.focus(); }, 50);
  }

  async function saveRoutineTask(event) {
    event.preventDefault();
    if (!elements.routineTaskForm.reportValidity()) return;

    const id = elements.routineTaskId.value || createId();
    const existing = state.routineTasks.find(function (task) { return task.id === id; });
    if (!existing && !canAddCustomRoutineTask()) {
      elements.routineTaskDialog.close();
      navigate("pro");
      showToast("La limite gratuite de trois tâches personnalisées est atteinte.");
      return;
    }
    const routine = elements.routineTaskPeriod.value;
    const order = existing && existing.routine === routine
      ? existing.order
      : getRoutineTasks(routine).length;
    const task = {
      id: id,
      title: elements.routineTaskName.value.trim(),
      routine: routine,
      duration: elements.routineTaskDuration.value.trim() || "Quelques minutes",
      order: order
    };

    await DB.put("routineTasks", task);
    if (existing) {
      state.routineTasks = state.routineTasks.map(function (row) { return row.id === id ? task : row; });
    } else {
      state.routineTasks.push(task);
    }
    state.activeRoutine = routine;
    elements.routineTaskDialog.close();
    renderRoutines();
    showToast(existing ? "Tâche mise à jour." : "Tâche ajoutée.");
  }

  async function deleteRoutineTask(task) {
    if (!window.confirm("Supprimer « " + task.title + " » de cette routine ?")) return;
    await DB.remove("routineTasks", task.id);
    state.routineTasks = state.routineTasks.filter(function (row) { return row.id !== task.id; });
    renderRoutines();
    showToast("Tâche supprimée.");
  }

  async function moveRoutineTask(task, direction) {
    const tasks = getRoutineTasks(task.routine);
    const index = tasks.findIndex(function (row) { return row.id === task.id; });
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= tasks.length) return;

    const other = tasks[targetIndex];
    const originalOrder = task.order;
    task.order = other.order;
    other.order = originalOrder;
    await Promise.all([DB.put("routineTasks", task), DB.put("routineTasks", other)]);
    renderRoutines();
  }

  function renderHistory() {
    const activities = Array.from(state.activities.values());
    elements.totalSteps.textContent = String(activities.length);
    elements.missionCount.textContent = String(activities.filter(function (item) { return item.type === "mission"; }).length);
    elements.tipCount.textContent = String(activities.filter(function (item) { return item.type === "tip"; }).length);
    renderCalendar(activities);
    renderHistoryDay(activities);
    renderFavorites();
    renderAdvancedStats(activities);
  }

  function renderFavorites() {
    const favorites = Array.from(state.favorites.values()).sort(function (a, b) {
      return b.savedAt.localeCompare(a.savedAt);
    });
    elements.favoriteCount.textContent = favorites.length + " favori" + (favorites.length > 1 ? "s" : "");
    if (!favorites.length) {
      elements.favoritesList.innerHTML = '<div class="empty-state"><h3>Aucune mission favorite</h3><p>Ajoute une mission depuis l\'accueil pour la retrouver ici.</p></div>';
      return;
    }

    elements.favoritesList.innerHTML = favorites.map(function (favorite) {
      return [
        '<article class="favorite-item" data-favorite-id="', favorite.id, '">',
        '<span class="favorite-item-icon"><svg><use href="#icon-heart"></use></svg></span>',
        '<div><strong>', escapeHtml(favorite.title), '</strong><p>', escapeHtml(favorite.description), '</p><small><svg><use href="#icon-clock"></use></svg>', favorite.minutes, ' min</small></div>',
        '<button class="small-action favorite-remove" type="button" data-favorite-action="remove" aria-label="Retirer ', escapeHtml(favorite.title), ' des favoris"><svg><use href="#icon-trash"></use></svg></button>',
        "</article>"
      ].join("");
    }).join("");
  }

  async function handleFavoriteClick(event) {
    const button = event.target.closest("[data-favorite-action]");
    const item = event.target.closest("[data-favorite-id]");
    if (!button || !item) return;
    await DB.remove("favorites", item.dataset.favoriteId);
    state.favorites.delete(item.dataset.favoriteId);
    renderFavorites();
    renderHome();
    showToast("Mission retirée des favoris.");
  }

  function renderCalendar(activities) {
    const year = state.calendarCursor.getFullYear();
    const month = state.calendarCursor.getMonth();
    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startOffset = (firstDay.getDay() + 6) % 7;
    const activityDates = new Set(activities.map(function (item) { return item.date; }));
    const todayKey = formatDateKey(state.today);

    elements.calendarMonth.textContent = new Intl.DateTimeFormat("fr-CA", {
      month: "long",
      year: "numeric"
    }).format(firstDay);

    const cells = [];
    for (let i = 0; i < startOffset; i += 1) {
      cells.push('<span class="calendar-day outside"></span>');
    }
    for (let day = 1; day <= daysInMonth; day += 1) {
      const dateKey = formatDateKey(new Date(year, month, day));
      const allowed = isHistoryDateAllowed(dateKey);
      const classes = [
        "calendar-day",
        dateKey === todayKey ? "today" : "",
        dateKey === state.selectedHistoryDate ? "selected" : "",
        activityDates.has(dateKey) ? "has-steps" : "",
        allowed ? "" : "pro-locked"
      ].filter(Boolean).join(" ");
      cells.push('<button class="' + classes + '"' + (allowed ? ' data-date="' + dateKey + '"' : ' disabled title="Historique complet avec PRO"') + ' aria-label="' + dateKey + '">' + day + "</button>");
    }
    elements.calendarGrid.innerHTML = cells.join("");
  }

  function renderHistoryDay(activities) {
    const selectedDate = parseDateKey(state.selectedHistoryDate);
    const todayKey = formatDateKey(state.today);
    const dayActivities = activities
      .filter(function (item) { return item.date === state.selectedHistoryDate; })
      .sort(function (a, b) { return b.completedAt.localeCompare(a.completedAt); });

    elements.historyDayTitle.textContent = state.selectedHistoryDate === todayKey
      ? "Aujourd'hui"
      : capitalize(new Intl.DateTimeFormat("fr-CA", { weekday: "long", day: "numeric", month: "long" }).format(selectedDate));
    elements.historyDayCount.textContent = dayActivities.length + (dayActivities.length > 1 ? " petits pas" : " petit pas");
    elements.historyAccessNote.hidden = true;

    if (!isHistoryDateAllowed(state.selectedHistoryDate)) {
      elements.historyDayCount.textContent = "PRO";
      elements.historyList.innerHTML = "";
      elements.historyAccessNote.hidden = false;
      elements.historyAccessNote.innerHTML = '<svg><use href="#icon-lock"></use></svg><div><strong>Ton historique détaillé gratuit couvre les 7 derniers jours.</strong><p>PRO conserve l\'accès à tout ton parcours.</p></div><button class="secondary-button" type="button" data-route="pro">Découvrir PRO</button>';
      return;
    }

    if (!dayActivities.length) {
      elements.historyList.innerHTML = '<div class="empty-state"><h3>Aucun pas enregistré</h3><p>Cette journée peut rester douce et vide.</p></div>';
      return;
    }

    const labels = {
      mission: "Mission du jour",
      tip: "Conseil lu",
      zone: "Mini-tâche",
      routine: "Routine",
      timer: "Minuterie"
    };
    elements.historyList.innerHTML = dayActivities.map(function (activity) {
      const time = new Intl.DateTimeFormat("fr-CA", { hour: "2-digit", minute: "2-digit" }).format(new Date(activity.completedAt));
      return [
        '<article class="history-item">',
        '<span class="history-dot"><svg><use href="#icon-check"></use></svg></span>',
        "<div><strong>", escapeHtml(activity.title), "</strong><span>", labels[activity.type] || "Petit pas", " · ", time, "</span></div>",
        "</article>"
      ].join("");
    }).join("");
  }

  function isHistoryDateAllowed(dateKey) {
    if (canUse("fullHistory")) return true;
    const selected = parseDateKey(dateKey);
    const today = new Date(state.today.getFullYear(), state.today.getMonth(), state.today.getDate());
    const difference = Math.floor((today.getTime() - selected.getTime()) / 86400000);
    return difference >= 0 && difference < state.account.limits.historyDays;
  }

  function renderAdvancedStats(activities) {
    if (!canUse("advancedStats")) {
      elements.advancedStatsContent.innerHTML = '<div class="advanced-stats-locked"><span><svg><use href="#icon-lock"></use></svg></span><div><strong>Une vue plus complète avec PRO</strong><p>Découvre tes journées actives, ta série actuelle et le temps consacré à la minuterie.</p></div><button class="secondary-button" type="button" data-route="pro">Voir les avantages</button></div>';
      return;
    }

    const activeDates = new Set(activities.map(function (activity) { return activity.date; }));
    const timerMinutes = activities
      .filter(function (activity) { return activity.type === "timer"; })
      .reduce(function (total, activity) {
        const match = activity.title.match(/(\d+)\s+minutes?/i);
        return total + (match ? Number(match[1]) : 0);
      }, 0);
    const streak = getCurrentStreak(activeDates);
    elements.advancedStatsContent.innerHTML = [
      '<div class="advanced-stats-grid">',
      '<article><span><svg><use href="#icon-spark"></use></svg></span><strong>', streak, '</strong><p>jours dans ta série actuelle</p></article>',
      '<article><span><svg><use href="#icon-timer"></use></svg></span><strong>', timerMinutes, '</strong><p>minutes de petits pas</p></article>',
      '<article><span><svg><use href="#icon-history"></use></svg></span><strong>', activeDates.size, '</strong><p>journées actives</p></article>',
      "</div>"
    ].join("");
  }

  function getCurrentStreak(activeDates) {
    let cursor = new Date(state.today.getFullYear(), state.today.getMonth(), state.today.getDate());
    let streak = 0;
    while (activeDates.has(formatDateKey(cursor))) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
  }

  function changeMonth(offset) {
    state.calendarCursor = new Date(
      state.calendarCursor.getFullYear(),
      state.calendarCursor.getMonth() + offset,
      1
    );
    renderHistory();
  }

  function selectCalendarDay(event) {
    const day = event.target.closest("[data-date]");
    if (!day) return;
    state.selectedHistoryDate = day.dataset.date;
    renderHistory();
  }

  function renderSettings() {
    elements.missionReminder.checked = Boolean(state.settings.missionReminder);
    elements.missionTimeSetting.value = state.settings.missionTime;
    elements.tipReminder.checked = Boolean(state.settings.tipReminder);
    elements.tipTimeSetting.value = state.settings.tipTime;
    elements.zoneReminder.checked = Boolean(state.settings.zoneReminder);
    elements.zoneTimeSetting.value = state.settings.zoneTime;
    elements.reduceMotionSetting.checked = Boolean(state.settings.reduceMotion);
    elements.firstNameSetting.value = state.settings.firstName || "";
    const customTimesEnabled = canUse("customReminderTimes");
    [elements.missionTimeSetting, elements.tipTimeSetting, elements.zoneTimeSetting].forEach(function (input) {
      input.disabled = !customTimesEnabled;
      input.title = customTimesEnabled ? "" : "Les heures personnalisées sont incluses avec PRO.";
    });
    document.querySelectorAll(".pro-mini").forEach(function (badge) {
      badge.hidden = customTimesEnabled;
    });
    renderNotificationStatus();
  }

  async function initializeAccount() {
    if (!ACCOUNT) {
      renderAccountUi();
      return;
    }

    try {
      const snapshot = await ACCOUNT.init();
      applyAccountSnapshot(snapshot);
    } catch (error) {
      console.warn("Initialisation du compte impossible :", error);
      renderAccountUi();
    }
  }

  function handleAccountChange(event) {
    applyAccountSnapshot(event.detail);
  }

  function applyAccountSnapshot(snapshot) {
    if (!snapshot) return;
    state.account = Object.assign({}, state.account, snapshot, {
      limits: Object.assign({}, state.account.limits, snapshot.limits || {})
    });
    renderAccountUi();
    renderZones();
    renderRoutines();
    renderHistory();
    renderSettings();
  }

  function renderAccountUi() {
    const user = state.account.user;
    const isPro = Boolean(state.account.isPro);
    const cloudEnabled = Boolean(state.account.cloudEnabled);
    const hasLifetimeAccess = state.account.subscription && state.account.subscription.plan === "lifetime";
    elements.accountButton.classList.toggle("pro", isPro);
    elements.accountButtonLabel.textContent = isPro ? "PRO" : user ? "Mon compte" : "Connexion";
    elements.accountPlanLabel.textContent = hasLifetimeAccess ? "Accès PRO à vie" : isPro ? "Abonnement PRO actif" : user ? "Forfait gratuit" : "Mode local gratuit";
    elements.accountSettingsStatus.textContent = user ? (isPro ? "Un Petit Pas PRO" : "Mon compte gratuit") : "Mon compte";
    elements.accountSettingsEmail.textContent = user
      ? user.email
      : cloudEnabled ? "Crée un compte gratuitement pour préparer ton accès PRO." : "Tes données restent sur cet appareil.";
    elements.accountSettingsButton.textContent = user ? (isPro ? "Voir les avantages PRO" : "Découvrir PRO") : "Créer un compte";
    elements.manageSubscriptionButton.hidden = !isPro || hasLifetimeAccess;
    elements.signOutButton.hidden = !user;
    elements.createAccountButton.hidden = Boolean(user);
    elements.loginAccountButton.hidden = Boolean(user);

    [elements.upgradeMonthlyButton, elements.upgradeYearlyButton, elements.upgradeLifetimeButton, elements.upgradePrimaryButton].forEach(function (button) {
      button.disabled = isPro;
    });
    elements.upgradeMonthlyButton.textContent = isPro ? "PRO est actif" : "Essayer PRO 45 jours";
    elements.upgradeYearlyButton.textContent = isPro ? "PRO est actif" : "Essayer PRO 45 jours";
    elements.upgradeLifetimeButton.textContent = isPro ? "PRO est actif" : "Obtenir l'accès à vie";
    elements.upgradePrimaryButton.textContent = isPro ? "Ton accès PRO est actif" : "Essayer l'annuel 45 jours";
    renderFounderOffer();

    if (elements.accountDialog.open) renderAccountDialog();
  }

  function renderFounderOffer() {
    const pricing = state.account.pricing || {};
    const active = Boolean(pricing.founderActive) && Number(pricing.founderRemaining) > 0;
    const remaining = Math.max(0, Number(pricing.founderRemaining) || 0);
    const limit = Math.max(1, Number(pricing.founderLimit) || 100);
    elements.founderOfferPanel.hidden = !active;
    elements.founderOfferBadge.hidden = !active;
    elements.lifetimePricingCard.classList.toggle("founder-active", active);
    elements.lifetimeRegularPrice.hidden = !active;
    elements.lifetimePrice.textContent = active ? "39,99 $" : "99,00 $";
    elements.lifetimeDescription.textContent = active
      ? "Un seul paiement. Réservé aux " + limit + " premiers membres."
      : "Un seul paiement pour conserver PRO sans renouvellement.";
    elements.founderCounter.textContent = remaining + " place" + (remaining === 1 ? "" : "s") + " restante" + (remaining === 1 ? "" : "s") + " sur " + limit;
  }

  function handleAccountButton() {
    if (state.account.user) {
      navigate("settings");
      return;
    }
    openAccountDialog("login");
  }

  function handleAccountSettingsButton() {
    if (state.account.user) {
      navigate("pro");
      return;
    }
    openAccountDialog("signup");
  }

  function openAccountDialog(mode) {
    state.accountMode = mode === "login" ? "login" : "signup";
    elements.accountForm.reset();
    elements.accountError.hidden = true;
    elements.accountSuccess.hidden = true;
    renderAccountDialog();
    elements.accountDialog.showModal();
    window.setTimeout(function () {
      (state.accountMode === "signup" ? elements.accountFirstName : elements.accountEmail).focus();
    }, 50);
  }

  function renderAccountDialog() {
    const isLogin = state.accountMode === "login";
    elements.accountDialogTitle.textContent = isLogin ? "Heureuse de te revoir" : "Créer mon compte";
    elements.accountDialogCopy.textContent = isLogin
      ? "Connecte-toi pour retrouver ton statut et gérer ton abonnement."
      : "Le compte gratuit permet de préparer ton accès PRO sans retirer le mode local.";
    elements.accountFirstNameField.hidden = isLogin;
    elements.accountPassword.autocomplete = isLogin ? "current-password" : "new-password";
    elements.accountSubmitButton.textContent = isLogin ? "Me connecter" : "Créer mon compte";
    elements.accountModeSwitch.textContent = isLogin ? "Je veux créer un compte" : "J'ai déjà un compte";
    elements.accountResetPassword.hidden = !isLogin;
    elements.accountCloudNotice.hidden = Boolean(state.account.cloudEnabled);
    elements.accountSubmitButton.disabled = !state.account.cloudEnabled;
  }

  function toggleAccountMode() {
    state.accountMode = state.accountMode === "login" ? "signup" : "login";
    elements.accountError.hidden = true;
    elements.accountSuccess.hidden = true;
    renderAccountDialog();
  }

  async function submitAccountForm(event) {
    event.preventDefault();
    if (!ACCOUNT || !state.account.cloudEnabled) return;
    elements.accountError.hidden = true;
    elements.accountSuccess.hidden = true;
    elements.accountSubmitButton.disabled = true;

    try {
      if (state.accountMode === "login") {
        await ACCOUNT.signIn(elements.accountEmail.value, elements.accountPassword.value);
        elements.accountDialog.close();
        showToast("Connexion réussie. Bon retour.");
      } else {
        const result = await ACCOUNT.signUp(
          elements.accountEmail.value,
          elements.accountPassword.value,
          elements.accountFirstName.value
        );
        if (result.session) {
          elements.accountDialog.close();
          showToast("Ton compte gratuit est prêt.");
        } else {
          elements.accountSuccess.textContent = "Compte créé. Vérifie ton courriel pour confirmer ton adresse.";
          elements.accountSuccess.hidden = false;
        }
      }
    } catch (error) {
      elements.accountError.textContent = friendlyAccountError(error);
      elements.accountError.hidden = false;
    } finally {
      elements.accountSubmitButton.disabled = !state.account.cloudEnabled;
    }
  }

  async function resetAccountPassword() {
    if (!ACCOUNT || !state.account.cloudEnabled) return;
    elements.accountError.hidden = true;
    elements.accountSuccess.hidden = true;
    try {
      await ACCOUNT.resetPassword(elements.accountEmail.value);
      elements.accountSuccess.textContent = "Le courriel de réinitialisation a été envoyé.";
      elements.accountSuccess.hidden = false;
    } catch (error) {
      elements.accountError.textContent = friendlyAccountError(error);
      elements.accountError.hidden = false;
    }
  }

  async function signOutAccount() {
    if (!ACCOUNT) return;
    try {
      await ACCOUNT.signOut();
      showToast("Tu es maintenant déconnectée ou déconnecté.");
    } catch (error) {
      showToast(friendlyAccountError(error));
    }
  }

  async function startUpgrade(plan) {
    if (!ACCOUNT || !state.account.cloudEnabled) {
      openAccountDialog("signup");
      showToast("La connexion sécurisée doit d'abord être configurée.");
      return;
    }
    if (!state.account.user) {
      openAccountDialog("signup");
      showToast("Crée ton compte gratuit avant de passer à PRO.");
      return;
    }
    if (state.account.isPro) {
      manageSubscription();
      return;
    }

    const buttons = [elements.upgradeMonthlyButton, elements.upgradeYearlyButton, elements.upgradeLifetimeButton, elements.upgradePrimaryButton];
    buttons.forEach(function (button) { button.disabled = true; });
    try {
      await ACCOUNT.startCheckout(plan);
    } catch (error) {
      showToast(friendlyAccountError(error));
      renderAccountUi();
    }
  }

  async function manageSubscription() {
    if (!ACCOUNT || !state.account.cloudEnabled) return;
    try {
      await ACCOUNT.openCustomerPortal();
    } catch (error) {
      showToast(friendlyAccountError(error));
    }
  }

  function handlePaymentReturn() {
    const url = new URL(window.location.href);
    const payment = url.searchParams.get("payment");
    if (!payment) return;
    url.searchParams.delete("payment");
    history.replaceState(null, "", url.pathname + (url.search ? url.search : "") + "#pro");
    state.route = "pro";
    navigate("pro", false);

    elements.proPaymentNotice.hidden = false;
    elements.proPaymentNotice.textContent = payment === "success"
      ? "Merci. Stripe confirme ton abonnement; ton accès PRO va s'activer dans quelques instants."
      : "Le paiement a été annulé. Aucun montant n'a été prélevé.";

    if (payment === "success" && ACCOUNT) {
      window.setTimeout(async function () {
        await ACCOUNT.loadSubscription();
        applyAccountSnapshot(ACCOUNT.getSnapshot());
      }, 2500);
    }
  }

  function friendlyAccountError(error) {
    const message = error && error.message ? error.message : "Une erreur est survenue.";
    if (/invalid login credentials/i.test(message)) return "Courriel ou mot de passe incorrect.";
    if (/user already registered/i.test(message)) return "Un compte existe déjà avec cette adresse.";
    if (/email not confirmed/i.test(message)) return "Confirme d'abord ton adresse courriel.";
    return message;
  }

  function normalizeTimerState(savedState) {
    const saved = savedState && typeof savedState === "object" ? savedState : {};
    const selectedMinutes = [2, 5, 10, 15, 30].includes(Number(saved.selectedMinutes))
      ? Number(saved.selectedMinutes)
      : DEFAULT_TIMER_STATE.selectedMinutes;
    const durationMs = Number(saved.durationMs) > 0
      ? Number(saved.durationMs)
      : selectedMinutes * 60 * 1000;
    const statuses = ["idle", "running", "paused", "complete"];
    const status = statuses.includes(saved.status) ? saved.status : "idle";
    const remainingMs = Math.max(0, Math.min(
      Number.isFinite(Number(saved.remainingMs)) ? Number(saved.remainingMs) : durationMs,
      durationMs
    ));

    return {
      selectedMinutes: selectedMinutes,
      durationMs: durationMs,
      remainingMs: remainingMs,
      status: status,
      endAt: status === "running" && Number(saved.endAt) > 0 ? Number(saved.endAt) : null,
      startedAt: typeof saved.startedAt === "string" ? saved.startedAt : null,
      completedAt: typeof saved.completedAt === "string" ? saved.completedAt : null
    };
  }

  async function restoreTimer() {
    if (state.timer.status === "running") {
      const remainingMs = getTimerRemaining();
      if (remainingMs <= 0) {
        await completeTimer(false);
        openTimerPanel();
        return;
      }
      state.timer.remainingMs = remainingMs;
      startTimerTicker();
    }
    renderTimer();
  }

  function toggleTimerPanel() {
    if (elements.timerPanel.hidden) openTimerPanel();
    else closeTimerPanel();
  }

  function openTimerPanel() {
    elements.timerPanel.hidden = false;
    elements.timerFab.setAttribute("aria-expanded", "true");
  }

  function closeTimerPanel() {
    elements.timerPanel.hidden = true;
    elements.timerFab.setAttribute("aria-expanded", "false");
  }

  function selectTimerPreset(event) {
    if (state.timer.status === "running" || state.timer.status === "paused") return;
    setTimerPreset(Number(event.currentTarget.dataset.timerMinutes));
  }

  function setTimerPreset(selectedMinutes) {
    state.timer = {
      selectedMinutes: selectedMinutes,
      durationMs: selectedMinutes * 60 * 1000,
      remainingMs: selectedMinutes * 60 * 1000,
      status: "idle",
      endAt: null,
      startedAt: null,
      completedAt: null
    };
    persistTimer();
    renderTimer();
  }

  function openMissionTimer() {
    const missionMinutes = getDailyContent().mission.minutes;
    const presets = [2, 5, 10, 15, 30];
    const nearestPreset = presets.reduce(function (closest, value) {
      return Math.abs(value - missionMinutes) < Math.abs(closest - missionMinutes) ? value : closest;
    }, presets[0]);

    if (state.timer.status !== "running" && state.timer.status !== "paused") {
      setTimerPreset(nearestPreset);
    }
    openTimerPanel();
  }

  async function handleTimerPrimaryAction() {
    primeTimerAudio();
    if (state.timer.status === "running") {
      await pauseTimer();
      return;
    }
    await startTimer();
  }

  async function startTimer() {
    const isResuming = state.timer.status === "paused";
    const remainingMs = isResuming && state.timer.remainingMs > 0
      ? state.timer.remainingMs
      : state.timer.durationMs;

    state.timer.remainingMs = remainingMs;
    state.timer.endAt = Date.now() + remainingMs;
    state.timer.status = "running";
    state.timer.completedAt = null;
    if (!isResuming || !state.timer.startedAt) {
      state.timer.startedAt = new Date().toISOString();
    }

    await persistTimer();
    startTimerTicker();
    renderTimer();
  }

  async function pauseTimer() {
    state.timer.remainingMs = getTimerRemaining();
    state.timer.endAt = null;
    state.timer.status = "paused";
    stopTimerTicker();
    await persistTimer();
    renderTimer();
  }

  async function resetTimer() {
    stopTimerTicker();
    state.timer = {
      selectedMinutes: state.timer.selectedMinutes,
      durationMs: state.timer.durationMs,
      remainingMs: state.timer.durationMs,
      status: "idle",
      endAt: null,
      startedAt: null,
      completedAt: null
    };
    await persistTimer();
    renderTimer();
  }

  async function acknowledgeTimerCompletion() {
    await resetTimer();
    closeTimerPanel();
  }

  function startTimerTicker() {
    stopTimerTicker();
    state.timerInterval = window.setInterval(updateTimer, 250);
  }

  function stopTimerTicker() {
    if (!state.timerInterval) return;
    window.clearInterval(state.timerInterval);
    state.timerInterval = null;
  }

  async function updateTimer() {
    if (state.timer.status !== "running") return;
    const remainingMs = getTimerRemaining();
    state.timer.remainingMs = remainingMs;
    if (remainingMs <= 0) {
      await completeTimer(true);
      return;
    }
    renderTimer();
  }

  function getTimerRemaining() {
    if (state.timer.status === "running" && state.timer.endAt) {
      return Math.max(0, state.timer.endAt - Date.now());
    }
    return Math.max(0, state.timer.remainingMs);
  }

  async function completeTimer(playSound) {
    if (state.timer.status === "complete") return;
    stopTimerTicker();
    state.timer.remainingMs = 0;
    state.timer.endAt = null;
    state.timer.status = "complete";
    state.timer.completedAt = new Date().toISOString();
    await persistTimer();

    const completionDate = formatDateKey(new Date());
    const timerReference = state.timer.startedAt || state.timer.completedAt;
    await addActivity(
      "timer",
      completionDate,
      timerReference,
      "Minuterie de " + state.timer.selectedMinutes + " minutes"
    );

    if (playSound) playTimerChime();
    if (document.hidden) showTimerNotification();
    openTimerPanel();
    renderTimer();
    renderHome();
    renderHistory();
  }

  async function persistTimer() {
    const savedTimer = Object.assign({}, state.timer);
    state.settings.timerState = savedTimer;
    await DB.saveSettings({ timerState: savedTimer });
  }

  function renderTimer() {
    const remainingMs = getTimerRemaining();
    const ratio = state.timer.durationMs > 0
      ? Math.max(0, Math.min(1, remainingMs / state.timer.durationMs))
      : 0;
    const status = state.timer.status;
    const isActive = status === "running" || status === "paused";
    const displayTime = formatTimerTime(remainingMs);

    elements.timerTimeRemaining.textContent = displayTime;
    elements.timerFabTime.textContent = status === "idle"
      ? "Je fais un petit pas"
      : status === "complete" ? "C'est fait" : displayTime;
    elements.timerProgressCircle.style.strokeDashoffset = String(TIMER_CIRCUMFERENCE * (1 - ratio));
    elements.timerFabRing.style.setProperty("--timer-fab-progress", (ratio * 360) + "deg");
    elements.timerFab.classList.toggle("running", status === "running");
    elements.timerFab.classList.toggle("complete", status === "complete");
    elements.timerMainView.hidden = status === "complete";
    elements.timerCompleteView.hidden = status !== "complete";

    document.querySelectorAll("[data-timer-minutes]").forEach(function (button) {
      button.classList.toggle("active", Number(button.dataset.timerMinutes) === state.timer.selectedMinutes);
      button.disabled = isActive;
    });

    const statusCopy = {
      idle: "Prête quand tu l'es",
      running: "Un petit pas est en cours",
      paused: "En pause, sans culpabilité",
      complete: "Petit pas terminé"
    };
    const fabCopy = {
      idle: "Minuterie",
      running: "En cours",
      paused: "En pause",
      complete: "Bravo"
    };
    elements.timerStatusText.textContent = statusCopy[status];
    elements.timerFabLabel.textContent = fabCopy[status];

    if (status === "running") {
      elements.timerPrimaryIcon.setAttribute("href", "#icon-pause");
      elements.timerPrimaryLabel.textContent = "Pause";
    } else if (status === "paused") {
      elements.timerPrimaryIcon.setAttribute("href", "#icon-play");
      elements.timerPrimaryLabel.textContent = "Reprendre";
    } else {
      elements.timerPrimaryIcon.setAttribute("href", "#icon-play");
      elements.timerPrimaryLabel.textContent = "Démarrer";
    }
    elements.timerResetButton.disabled = status === "idle";
  }

  function formatTimerTime(milliseconds) {
    const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return String(minutes).padStart(2, "0") + ":" + String(seconds).padStart(2, "0");
  }

  async function primeTimerAudio() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    if (!state.audioContext) state.audioContext = new AudioContextClass();
    if (state.audioContext.state === "suspended") {
      try {
        await state.audioContext.resume();
      } catch (error) {
        console.warn("Le son de la minuterie n'a pas pu être préparé.", error);
      }
    }
  }

  function playTimerChime() {
    if (!state.audioContext || state.audioContext.state !== "running") return;
    const context = state.audioContext;
    const startAt = context.currentTime;
    [
      { frequency: 523.25, offset: 0, duration: 0.65 },
      { frequency: 659.25, offset: 0.22, duration: 0.85 }
    ].forEach(function (tone) {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(tone.frequency, startAt + tone.offset);
      gain.gain.setValueAtTime(0.0001, startAt + tone.offset);
      gain.gain.exponentialRampToValueAtTime(0.12, startAt + tone.offset + 0.06);
      gain.gain.exponentialRampToValueAtTime(0.0001, startAt + tone.offset + tone.duration);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(startAt + tone.offset);
      oscillator.stop(startAt + tone.offset + tone.duration + 0.05);
    });
  }

  function showTimerNotification() {
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    showNotification(
      "Bravo. Tu as fait un petit pas.",
      "Ta minuterie de " + state.timer.selectedMinutes + " minutes est terminée.",
      "timer-" + (state.timer.completedAt || Date.now())
    );
  }

  async function saveSettings() {
    const nextSettings = {
      firstName: elements.firstNameSetting.value.trim(),
      reduceMotion: elements.reduceMotionSetting.checked,
      missionReminder: elements.missionReminder.checked,
      missionTime: elements.missionTimeSetting.value,
      tipReminder: elements.tipReminder.checked,
      tipTime: elements.tipTimeSetting.value,
      zoneReminder: elements.zoneReminder.checked,
      zoneTime: elements.zoneTimeSetting.value
    };

    Object.assign(state.settings, nextSettings);
    await DB.saveSettings(nextSettings);
    applyPreferences();
    navigate(state.route, false);
    renderNotificationStatus();
    startNotificationWatcher();
    showToast("Préférences enregistrées.");
  }

  function applyPreferences() {
    document.body.classList.toggle("reduce-motion", Boolean(state.settings.reduceMotion));
  }

  async function requestNotifications() {
    if (!("Notification" in window)) {
      showToast("Les notifications ne sont pas disponibles dans ce navigateur.");
      return;
    }

    const permission = await Notification.requestPermission();
    renderNotificationStatus();
    if (permission === "granted") {
      showToast("Les rappels doux sont autorisés.");
      startNotificationWatcher();
    } else if (permission === "denied") {
      showToast("Les notifications sont bloquées dans les réglages du navigateur.");
    }
  }

  function renderNotificationStatus() {
    if (!("Notification" in window)) {
      elements.notificationStatus.textContent = "Les notifications ne sont pas prises en charge ici.";
      elements.enableNotificationsButton.disabled = true;
      return;
    }

    const permission = Notification.permission;
    elements.enableNotificationsButton.hidden = permission === "granted";
    if (permission === "granted") {
      elements.notificationStatus.textContent = "Notifications autorisées. Les rappels sont vérifiés lorsque l'application est ouverte ou active en arrière-plan selon ton appareil.";
    } else if (permission === "denied") {
      elements.notificationStatus.textContent = "Notifications bloquées. Tu peux les réactiver dans les réglages du navigateur.";
    } else {
      elements.notificationStatus.textContent = "Autorise les notifications pour recevoir les rappels aux heures choisies.";
    }
  }

  function startNotificationWatcher() {
    if (state.notificationTimer) window.clearInterval(state.notificationTimer);
    checkNotifications();
    state.notificationTimer = window.setInterval(checkNotifications, 30000);
  }

  async function checkNotifications() {
    if (!("Notification" in window) || Notification.permission !== "granted") return;

    const now = new Date();
    const todayKey = formatDateKey(now);
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const daily = getDailyContent(now);
    const notifications = [
      {
        enabled: state.settings.missionReminder,
        time: state.settings.missionTime,
        lastKey: "lastMissionNotification",
        title: "Ton petit pas du jour",
        body: daily.mission.title + " · " + daily.mission.minutes + " minutes",
        tag: "mission-" + todayKey,
        allowed: true
      },
      {
        enabled: state.settings.tipReminder,
        time: state.settings.tipTime,
        lastKey: "lastTipNotification",
        title: "Une idée douce pour aujourd'hui",
        body: daily.tip.text,
        tag: "tip-" + todayKey,
        allowed: true
      },
      {
        enabled: state.settings.zoneReminder,
        time: state.settings.zoneTime,
        lastKey: "lastZoneNotification",
        title: "Zone de la semaine",
        body: daily.weeklyZone.name + " · un seul geste suffit.",
        tag: "zone-" + todayKey,
        allowed: now.getDay() === 1
      }
    ];

    for (const reminder of notifications) {
      if (!reminder.enabled || !reminder.allowed || state.settings[reminder.lastKey] === todayKey) continue;
      const targetMinutes = timeToMinutes(reminder.time);
      if (currentMinutes < targetMinutes || currentMinutes > targetMinutes + 2) continue;

      await showNotification(reminder.title, reminder.body, reminder.tag);
      state.settings[reminder.lastKey] = todayKey;
      await DB.saveSettings({ [reminder.lastKey]: todayKey });
    }
  }

  async function showNotification(title, body, tag) {
    const options = {
      body: body,
      icon: "./icons/icon-192.png",
      badge: "./icons/badge-96.png",
      tag: tag,
      renotify: false,
      data: { url: "./#home" }
    };

    if (state.serviceWorkerRegistration && state.serviceWorkerRegistration.showNotification) {
      await state.serviceWorkerRegistration.showNotification(title, options);
    } else {
      new Notification(title, options);
    }
  }

  function setupInstallPrompt() {
    window.addEventListener("beforeinstallprompt", function (event) {
      event.preventDefault();
      state.deferredInstallPrompt = event;
      elements.installButton.hidden = false;
      elements.installSettingsButton.hidden = false;
    });

    window.addEventListener("appinstalled", function () {
      state.deferredInstallPrompt = null;
      elements.installButton.hidden = true;
      showToast("Un Petit Pas est installé.");
    });
  }

  async function installApp() {
    if (state.deferredInstallPrompt) {
      state.deferredInstallPrompt.prompt();
      await state.deferredInstallPrompt.userChoice;
      state.deferredInstallPrompt = null;
      elements.installButton.hidden = true;
      return;
    }

    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    if (isIOS) {
      showToast("Dans Safari, touche Partager puis « Sur l'écran d'accueil ».");
    } else if (window.matchMedia("(display-mode: standalone)").matches) {
      showToast("L'application est déjà installée.");
    } else {
      showToast("Ouvre le menu du navigateur puis choisis « Installer l'application ».");
    }
  }

  async function setupServiceWorker() {
    if (!("serviceWorker" in navigator)) return;

    try {
      const registration = await navigator.serviceWorker.register("./sw.js");
      state.serviceWorkerRegistration = registration;

      registration.addEventListener("updatefound", function () {
        const worker = registration.installing;
        if (!worker) return;
        worker.addEventListener("statechange", function () {
          if (worker.state === "installed" && navigator.serviceWorker.controller) {
            elements.updateBanner.hidden = false;
          }
        });
      });
    } catch (error) {
      console.warn("Service worker non enregistré :", error);
    }
  }

  function activateUpdate() {
    if (state.serviceWorkerRegistration && state.serviceWorkerRegistration.waiting) {
      navigator.serviceWorker.addEventListener("controllerchange", function () {
        window.location.reload();
      }, { once: true });
      state.serviceWorkerRegistration.waiting.postMessage({ type: "SKIP_WAITING" });
      return;
    }
    window.location.reload();
  }

  async function resetData() {
    const confirmed = window.confirm("Réinitialiser toutes les routines, progressions et préférences enregistrées sur cet appareil ?");
    if (!confirmed) return;
    await DB.clearUserData();
    window.location.reload();
  }

  async function addActivity(type, date, refId, title) {
    const id = activityId(type, date, refId);
    const activity = {
      id: id,
      type: type,
      date: date,
      refId: refId,
      title: title,
      completedAt: new Date().toISOString()
    };
    await DB.put("activities", activity);
    state.activities.set(id, activity);
    return activity;
  }

  async function removeActivity(type, date, refId) {
    const id = activityId(type, date, refId);
    await DB.remove("activities", id);
    state.activities.delete(id);
  }

  function hasActivity(type, date, refId) {
    return state.activities.has(activityId(type, date, refId));
  }

  function activityId(type, date, refId) {
    return [type, date, refId].join(":");
  }

  function showToast(message) {
    window.clearTimeout(state.toastTimer);
    elements.toast.textContent = message;
    elements.toast.classList.add("show");
    state.toastTimer = window.setTimeout(function () {
      elements.toast.classList.remove("show");
    }, 2800);
  }

  function showApp() {
    elements.app.hidden = false;
    window.setTimeout(function () {
      elements.splash.classList.add("hidden");
      window.setTimeout(function () { elements.splash.hidden = true; }, 400);
    }, 350);
  }

  function showFatalError() {
    elements.splash.innerHTML = "<p>Impossible d'ouvrir les données locales.</p><small>Recharge la page ou vérifie que la navigation privée est désactivée.</small>";
  }

  function getDailyTip(date) {
    if (date.getMonth() === 1 && date.getDate() === 29 && DATA.leapDayTip) {
      return {
        tip: DATA.leapDayTip,
        index: null,
        label: "Jour bonus"
      };
    }

    const index = getCalendarDayIndex(date) % DATA.tips.length;
    return {
      tip: DATA.tips[index],
      index: index,
      label: (index + 1) + "/" + DATA.tips.length
    };
  }

  function getCalendarDayIndex(date) {
    const year = date.getFullYear();
    const start = Date.UTC(year, 0, 1);
    const current = Date.UTC(year, date.getMonth(), date.getDate());
    let index = Math.floor((current - start) / 86400000);

    if (isLeapYear(year) && index > 59) index -= 1;
    return index;
  }

  function isLeapYear(year) {
    return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  }

  function handleAppResume() {
    updateTimer();
    if (document.visibilityState === "visible") syncCurrentDay();
  }

  function syncCurrentDay() {
    const now = new Date();
    const dateChanged = formatDateKey(now) !== formatDateKey(state.today);
    state.today = now;

    if (dateChanged) {
      state.selectedHistoryDate = formatDateKey(now);
      state.calendarCursor = new Date(now.getFullYear(), now.getMonth(), 1);
      renderHeader();
      renderHome();
      renderZones();
      renderRoutines();
      renderHistory();
    }

    scheduleDailyRefresh();
  }

  function scheduleDailyRefresh() {
    if (state.dailyRefreshTimer) window.clearTimeout(state.dailyRefreshTimer);
    const now = new Date();
    const nextDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 2);
    state.dailyRefreshTimer = window.setTimeout(syncCurrentDay, Math.max(1000, nextDay.getTime() - now.getTime()));
  }

  function daysSinceReference(date) {
    const reference = Date.UTC(2025, 0, 1);
    const current = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
    return Math.floor((current - reference) / 86400000);
  }

  function getISOWeek(date) {
    const value = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNumber = value.getUTCDay() || 7;
    value.setUTCDate(value.getUTCDate() + 4 - dayNumber);
    const yearStart = new Date(Date.UTC(value.getUTCFullYear(), 0, 1));
    return Math.ceil((((value - yearStart) / 86400000) + 1) / 7);
  }

  function formatDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return year + "-" + month + "-" + day;
  }

  function parseDateKey(key) {
    const parts = key.split("-").map(Number);
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }

  function timeToMinutes(value) {
    const parts = (value || "00:00").split(":").map(Number);
    return parts[0] * 60 + parts[1];
  }

  function createId() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return "task-" + Date.now() + "-" + Math.random().toString(16).slice(2);
  }

  function capitalize(value) {
    return value ? value.charAt(0).toUpperCase() + value.slice(1) : "";
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
})();
