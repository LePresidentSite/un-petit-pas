(function () {
  "use strict";

  const DATA = window.APP_DATA;
  const DB = window.AppDB;
  const ACCOUNT = window.UnPetitPasAccount;
  const ROUTE_TITLES = {
    home: "Aujourd'hui",
    zones: "Zones",
    principles: "Principes",
    routines: "Routines",
    ambiance: "Ambiance", // NOUVEAU: Ambiance
    history: "Progrès",
    settings: "Réglages",
    pro: "Découvrir PRO",
    about: "À propos"
  };

  const RADIO_CATEGORIES = {
    "quebec-pop": { name: "Pop québécoise", icon: "🎵" },
    "retro-souvenirs": { name: "Rétro Souvenirs", icon: "💙", meta: "Succès rétro francophones du Québec" },
    classical: { name: "Musique classique", icon: "🎼", meta: "Classique et instrumental" },
    relax: { name: "Détente", icon: "🎵" },
    hits: { name: "Hits du moment", icon: "🎵" },
    "80s": { name: "Années 80", icon: "🎵" },
    "rock-detente": { name: "Pop québécoise", icon: "🎵", meta: "Pop francophone du Québec" },
    instrumental: { name: "Instrumentale", icon: "🎵" }
  };
  const MUSIC_SERVICES = {
    spotify: {
      name: "Spotify",
      icon: "🎧",
      webUrl: "https://open.spotify.com/",
      androidUrl: "spotify:"
    },
    apple: {
      name: "Apple Music",
      icon: "🎧",
      webUrl: "https://music.apple.com/ca/browse"
    },
    tunein: {
      name: "TuneIn",
      icon: "🎧",
      webUrl: "https://tunein.com/radio/"
    },
    amazon: {
      name: "Amazon Music",
      icon: "🎧",
      webUrl: "https://music.amazon.ca/"
    }
  };
  const RADIO_CACHE_KEY = "un-petit-pas-radio-cache-v6";
  const RADIO_CACHE_MAX_AGE = 24 * 60 * 60 * 1000;
  const RADIO_RECONNECT_INITIAL_DELAY = 1000;
  const RADIO_RECONNECT_MAX_DELAY = 30000;
  const FREE_RADIO_CATEGORIES = new Set(["quebec-pop", "retro-souvenirs", "classical", "relax"]);
  const FREE_REMINDER_TIMES = Object.freeze({
    missionTime: "09:00",
    tipTime: "12:30",
    zoneTime: "18:00"
  });
  const WEEKDAY_NAMES = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
  const FREE_DAY_PROGRAM = Object.freeze({
    id: "free-day",
    title: "Journée libre",
    shortTitle: "Journée libre",
    description: "Aucune catégorie n'est prévue aujourd'hui. Tu peux te reposer ou ajouter une tâche qui t'aiderait.",
    duration: "Sans obligation",
    tasks: []
  });
  const DAILY_DECLUTTER_REF = "daily-declutter-15";
  const DAILY_DECLUTTER_TITLE = "Désencombrement 15 minutes";

  const TIMER_CIRCUMFERENCE = 2 * Math.PI * 69;
  const DEFAULT_TIMER_STATE = {
    selectedMinutes: 15,
    durationMs: 15 * 60 * 1000,
    remainingMs: 15 * 60 * 1000,
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
    smallStepProgress: { currentIndex: 0, cycle: 1, finished: false },
    zoneVisits: {},
    weeklyProgramSchedule: Object.assign({}, DATA.defaultWeeklyProgramSchedule),
    weeklyProgramOverrides: {},
    weeklyProgramChecks: {},
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
    ambiancePlaying: false,
    ambianceLoading: false,
    ambianceCategory: null,
    ambianceCandidates: [],
    ambianceCandidateIndex: -1,
    ambianceAttemptToken: 0,
    ambiancePlaybackTimer: null,
    ambianceReconnectTimer: null,
    ambianceRetryAttempt: 0,
    ambianceWantsPlayback: false,
    ambianceActiveService: null,
    cloudSyncReady: false,
    cloudSyncInProgress: false,
    cloudSyncTimer: null,
    cloudSyncUserId: null,
    cloudSyncStatus: "local",
    account: {
      ready: false,
      cloudEnabled: false,
      user: null,
      subscription: null,
      isPro: false,
      pricing: { founderActive: true, founderRemaining: 100, founderLimit: 100 },
      limits: { customRoutineTasks: 3, favorites: 3, historyDays: 7, activeReminders: 1, freeRadioCategories: 4 }
    }
  };

  const elements = {};

  document.addEventListener("DOMContentLoaded", init);

  async function init() {
    cacheElements();
    bindEvents();
    setupAmbianceMediaSession();

    try {
      await DB.open();
      await loadState();
      applyPreferences();
      renderAll();
      await restoreTimer();
      setupInstallPrompt();
      setupServiceWorker();
      await initializeAccount();
      startNotificationWatcher();
      scheduleDailyRefresh();
      showApp();
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
      "missionTime", "missionDescription", "weeklyProgramTaskList", "weeklyTaskForm",
      "weeklyTaskInput", "weeklyScheduleList", "weeklyFreeDayNote",
      "resetWeeklyScheduleButton", "smallStepNumber",
      "smallStepTitle", "smallStepDescription", "smallStepDetails", "smallStepDetailsPanel",
      "completeSmallStepButton", "favoriteSmallStepButton",
      "smallStepRestartButton", "weeklyZoneVisual", "weeklyZoneTitle",
      "weeklyZoneDescription", "zonesList", "principlesList", "addRoutineTaskButton", "routineSummary",
      "routineTaskList", "totalSteps", "missionCount", "smallStepCount", "calendarMonth",
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
      "accountButton", "favoritesList", "favoriteCount",
      "accountButtonLabel", "accountSettingsButton", "manageSubscriptionButton",
      "signOutButton", "deleteAccountLink", "accountPlanLabel", "accountSettingsStatus",
      "accountSettingsEmail", "cloudSyncStatus", "createAccountButton", "loginAccountButton",
      "upgradeMonthlyButton", "upgradeYearlyButton", "upgradePrimaryButton",
      "upgradeLifetimeButton", "founderOfferPanel", "founderCounter",
      "founderOfferBadge", "lifetimePricingCard", "lifetimeRegularPrice",
      "lifetimePrice", "lifetimeDescription",
      "proPaymentNotice", "advancedStatsPanel", "advancedStatsContent",
      "historyAccessNote", "accountDialog", "accountForm", "accountDialogTitle",
      "accountDialogCopy", "accountError", "accountSuccess",
      "accountFirstNameField", "accountFirstName", "accountEmail",
      "accountPassword", "accountSubmitButton", "accountModeSwitch",
      "accountResetPassword", "accountCloudNotice", "closeAccountDialog",
      "global-audio-player", "mini-player", "mp-title", "mp-subtitle", "mp-icon",
      "mp-playpause", "mp-close", "mp-play-icon-use", "ambiance-status",
      "ambiance-active-name", "ambiance-active-meta", "ambiance-play-ready",
      "ambiance-retry"
    ].forEach(function (id) {
      elements[id] = document.getElementById(id);
    });
  }

  async function loadState() {
    const todayKey = formatDateKey(state.today);
    state.selectedHistoryDate = todayKey;
    state.calendarCursor = new Date(state.today.getFullYear(), state.today.getMonth(), 1);
    state.settings = await DB.getSettings(DEFAULT_SETTINGS);
    state.settings.smallStepProgress = normalizeSmallStepProgress(state.settings.smallStepProgress);
    state.settings.zoneVisits = normalizeZoneVisits(state.settings.zoneVisits);
    state.settings.weeklyProgramSchedule = normalizeWeeklyProgramSchedule(state.settings.weeklyProgramSchedule);
    state.settings.weeklyProgramOverrides = normalizeWeeklyProgramOverrides(state.settings.weeklyProgramOverrides);
    state.settings.weeklyProgramChecks = normalizeWeeklyProgramChecks(state.settings.weeklyProgramChecks);
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

    const hashRoute = window.location.hash.replace("#", "");
    if (Object.prototype.hasOwnProperty.call(ROUTE_TITLES, hashRoute)) {
      state.route = hashRoute;
    }
  }

  function bindEvents() {
    document.addEventListener("click", handleDocumentClick);
    elements.weeklyProgramTaskList.addEventListener("change", handleWeeklyProgramTaskToggle);
    elements.weeklyProgramTaskList.addEventListener("click", handleWeeklyProgramTaskClick);
    elements.weeklyTaskForm.addEventListener("submit", addWeeklyProgramTask);
    elements.weeklyScheduleList.addEventListener("change", changeWeeklyProgramDay);
    elements.resetWeeklyScheduleButton.addEventListener("click", resetWeeklyProgramSchedule);
    elements.completeSmallStepButton.addEventListener("click", completeCurrentSmallStep);
    elements.favoriteSmallStepButton.addEventListener("click", toggleCurrentSmallStepFavorite);
    elements.smallStepRestartButton.addEventListener("click", restartSmallStepJourney);
    elements.zonesList.addEventListener("click", handleZoneClick);
    elements.zonesList.addEventListener("change", handleZoneTaskChange);
    [elements.missionReminder, elements.tipReminder, elements.zoneReminder].forEach(function (input) {
      input.addEventListener("change", handleReminderToggle);
    });
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
    window.addEventListener("unpetitpas:local-data-change", scheduleCloudBackup);
    document.addEventListener("visibilitychange", handleAppResume);
    window.addEventListener("pageshow", handleAppResume);
    window.addEventListener("online", handleAmbianceNetworkAvailable);
    window.addEventListener("offline", handleAmbianceNetworkLost);
    window.addEventListener("hashchange", navigateFromHash);

    elements["mp-playpause"].addEventListener("click", toggleAmbiance);
    elements["mp-close"].addEventListener("click", stopAmbiance);
    elements["global-audio-player"].addEventListener("playing", handleAmbiancePlaying);
    elements["global-audio-player"].addEventListener("pause", handleAmbiancePause);
    elements["global-audio-player"].addEventListener("error", handleAmbiancePlaybackError);
    elements["global-audio-player"].addEventListener("stalled", handleAmbianceStalled);
    elements["global-audio-player"].addEventListener("waiting", handleAmbianceStalled);
    elements["global-audio-player"].addEventListener("ended", handleAmbiancePlaybackError);
  }

  function handleDocumentClick(event) {
    const radioCategory = event.target.closest("[data-radio-category]");
    if (radioCategory) {
      selectRadioCategory(radioCategory.dataset.radioCategory);
      return;
    }

    const musicService = event.target.closest("[data-music-service]");
    if (musicService) {
      openMusicService(musicService.dataset.musicService);
      return;
    }

    if (event.target.closest("#ambiance-retry")) {
      if (state.ambianceCategory) {
        selectRadioCategory(state.ambianceCategory, true);
      }
      return;
    }

    if (event.target.closest("#ambiance-play-ready")) {
      toggleAmbiance();
      return;
    }

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
    renderPrinciples();
    renderRoutines();
    renderHistory();
    renderSettings();
    renderAccountUi();
    renderAmbianceSelection();
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

  function normalizeSmallStepProgress(savedProgress) {
    const saved = savedProgress && typeof savedProgress === "object" ? savedProgress : {};
    const currentIndex = Math.max(0, Math.min(
      Number.isInteger(Number(saved.currentIndex)) ? Number(saved.currentIndex) : 0,
      DATA.smallSteps.length
    ));
    return {
      currentIndex: currentIndex,
      cycle: Math.max(1, Number.isInteger(Number(saved.cycle)) ? Number(saved.cycle) : 1),
      finished: Boolean(saved.finished) || currentIndex >= DATA.smallSteps.length
    };
  }

  function normalizeZoneVisits(savedVisits) {
    if (!savedVisits || typeof savedVisits !== "object" || Array.isArray(savedVisits)) return {};
    return Object.keys(savedVisits).reduce(function (visits, zoneId) {
      if (typeof savedVisits[zoneId] === "string" && !Number.isNaN(Date.parse(savedVisits[zoneId]))) {
        visits[zoneId] = savedVisits[zoneId];
      }
      return visits;
    }, {});
  }

  function normalizeWeeklyProgramSchedule(savedSchedule) {
    const defaults = Object.assign({}, DATA.defaultWeeklyProgramSchedule);
    if (!savedSchedule || typeof savedSchedule !== "object" || Array.isArray(savedSchedule)) return defaults;

    const normalized = {};
    const usedDays = new Set();
    DATA.weeklyPrograms.forEach(function (program) {
      const day = Number(savedSchedule[program.id]);
      if (Number.isInteger(day) && day >= 0 && day <= 6 && !usedDays.has(day)) {
        normalized[program.id] = day;
        usedDays.add(day);
      }
    });

    DATA.weeklyPrograms.forEach(function (program) {
      if (Object.prototype.hasOwnProperty.call(normalized, program.id)) return;
      const preferredDay = defaults[program.id];
      if (!usedDays.has(preferredDay)) {
        normalized[program.id] = preferredDay;
        usedDays.add(preferredDay);
        return;
      }
      const availableDay = WEEKDAY_NAMES.findIndex(function (_name, day) { return !usedDays.has(day); });
      normalized[program.id] = availableDay;
      usedDays.add(availableDay);
    });
    return normalized;
  }

  function normalizeWeeklyProgramOverrides(savedOverrides) {
    if (!savedOverrides || typeof savedOverrides !== "object" || Array.isArray(savedOverrides)) return {};
    return Object.keys(savedOverrides).reduce(function (result, dateKey) {
      const value = savedOverrides[dateKey];
      if (!value || typeof value !== "object") return result;
      result[dateKey] = {
        removed: Array.isArray(value.removed) ? value.removed.filter(Boolean) : [],
        custom: Array.isArray(value.custom)
          ? value.custom.filter(function (task) { return task && task.id && task.title; })
          : []
      };
      return result;
    }, {});
  }

  function normalizeWeeklyProgramChecks(savedChecks) {
    if (!savedChecks || typeof savedChecks !== "object" || Array.isArray(savedChecks)) return {};
    return Object.keys(savedChecks).reduce(function (result, dateKey) {
      const value = savedChecks[dateKey];
      if (!value || typeof value !== "object") return result;
      result[dateKey] = Object.keys(value).reduce(function (checks, taskId) {
        if (value[taskId]) checks[taskId] = true;
        return checks;
      }, {});
      return result;
    }, {});
  }

  function getWeeklyProgramForDate(date) {
    const day = date.getDay();
    return DATA.weeklyPrograms.find(function (program) {
      return state.settings.weeklyProgramSchedule[program.id] === day;
    }) || FREE_DAY_PROGRAM;
  }

  function getWeeklyProgramTasks(date) {
    const dateKey = formatDateKey(date);
    const program = getWeeklyProgramForDate(date);
    const override = state.settings.weeklyProgramOverrides[dateKey] || { removed: [], custom: [] };
    const removed = new Set(override.removed || []);
    return program.tasks
      .filter(function (task) { return !removed.has(task.id); })
      .map(function (task) { return Object.assign({ custom: false }, task); })
      .concat((override.custom || []).map(function (task) {
        return Object.assign({ custom: true }, task);
      }));
  }

  function isWeeklyProgramComplete(date) {
    const dateKey = formatDateKey(date);
    const tasks = getWeeklyProgramTasks(date);
    const checks = state.settings.weeklyProgramChecks[dateKey] || {};
    return tasks.length > 0 && tasks.every(function (task) { return Boolean(checks[task.id]); });
  }

  function getCurrentSmallStep() {
    const journey = state.settings.smallStepProgress;
    if (!journey || journey.finished) return null;
    return DATA.smallSteps[journey.currentIndex] || null;
  }

  function renderTextParagraphs(value) {
    return String(value || "")
      .split(/\n\s*\n/)
      .filter(Boolean)
      .map(function (paragraph) { return "<p>" + escapeHtml(paragraph) + "</p>"; })
      .join("");
  }

  function formatZoneVisitLabel(visitedAt) {
    if (!visitedAt) return "Pas encore visitée";
    const visited = new Date(visitedAt);
    if (Number.isNaN(visited.getTime())) return "Pas encore visitée";
    const today = new Date(state.today.getFullYear(), state.today.getMonth(), state.today.getDate());
    const visitDay = new Date(visited.getFullYear(), visited.getMonth(), visited.getDate());
    const days = Math.max(0, Math.floor((today.getTime() - visitDay.getTime()) / 86400000));
    if (days === 0) return "Visitée aujourd'hui";
    if (days === 1) return "Dernière visite : hier";
    return "Dernière visite : il y a " + days + " jours";
  }

  function getDailyContent(date) {
    const contentDate = date || state.today;
    const dayNumber = daysSinceReference(contentDate);
    const weekNumber = getISOWeek(contentDate);
    const tipSelection = getDailyTip(contentDate);
    return {
      quote: DATA.quotes[dayNumber % DATA.quotes.length],
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
    const weeklyProgram = getWeeklyProgramForDate(state.today);
    const weeklyTasks = getWeeklyProgramTasks(state.today);
    const missionDone = isWeeklyProgramComplete(state.today);
    const smallStepDone = Array.from(state.activities.values()).some(function (activity) {
      return activity.date === todayKey && activity.type === "small-step";
    });
    const otherStepDone = Array.from(state.activities.values()).some(function (activity) {
      return activity.date === todayKey && !["mission", "tip", "small-step", "declutter"].includes(activity.type);
    });
    const progress = Math.round(([missionDone, smallStepDone, otherStepDone].filter(Boolean).length / 3) * 100);
    const journey = state.settings.smallStepProgress;
    const currentStep = getCurrentSmallStep();

    elements.dailyQuote.textContent = daily.quote;
    elements.missionTitle.textContent = weeklyProgram.title;
    elements.missionTime.textContent = weeklyProgram.duration;
    elements.missionDescription.textContent = weeklyProgram.description;
    renderWeeklyProgramTasks(weeklyTasks, todayKey);
    elements.weeklyZoneTitle.textContent = daily.weeklyZone.name;
    elements.weeklyZoneDescription.textContent = daily.weeklyZone.description;
    elements.weeklyZoneVisual.style.background = daily.weeklyZone.color;

    if (currentStep) {
      const favoriteId = "small-step:" + currentStep.id;
      const isFavorite = state.favorites.has(favoriteId);
      elements.smallStepNumber.textContent = (journey.currentIndex + 1) + "/" + DATA.smallSteps.length;
      elements.smallStepTitle.textContent = currentStep.title;
      elements.smallStepDescription.textContent = currentStep.description;
      elements.smallStepDetails.innerHTML = renderTextParagraphs(currentStep.details);
      elements.completeSmallStepButton.hidden = false;
      elements.completeSmallStepButton.disabled = false;
      elements.favoriteSmallStepButton.hidden = false;
      elements.favoriteSmallStepButton.classList.toggle("completed", isFavorite);
      elements.favoriteSmallStepButton.setAttribute("aria-pressed", String(isFavorite));
      elements.favoriteSmallStepButton.querySelector("span").textContent = isFavorite ? "Dans mes favoris" : "Ajouter aux favoris";
      elements.smallStepRestartButton.hidden = true;
      elements.smallStepDetailsPanel.hidden = false;
    } else {
      elements.smallStepNumber.textContent = DATA.smallSteps.length + "/" + DATA.smallSteps.length;
      elements.smallStepTitle.textContent = "Ton parcours est complété";
      elements.smallStepDescription.textContent = "Tu as parcouru les 31 Petits pas. Prends un moment pour reconnaître tout ce chemin.";
      elements.smallStepDetails.innerHTML = renderTextParagraphs("Tu peux continuer à utiliser les zones, les principes et la minuterie à ton rythme.\n\nLorsque tu seras prête ou prêt, le parcours pourra recommencer au Petit pas 1 sans effacer ton historique.");
      elements.completeSmallStepButton.hidden = true;
      elements.favoriteSmallStepButton.hidden = true;
      elements.smallStepRestartButton.hidden = false;
      elements.smallStepDetailsPanel.hidden = false;
    }

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

  async function openDailyDeclutterTimer() {
    if (state.timer.status === "complete") {
      await resetTimer();
    }
    openTimerPanel();
    showToast("Minuterie de 15 minutes prête pour ton désencombrement.");
  }

  function renderWeeklyProgramTasks(tasks, dateKey) {
    const checks = state.settings.weeklyProgramChecks[dateKey] || {};
    if (!tasks.length) {
      elements.weeklyProgramTaskList.innerHTML = '<div class="weekly-program-empty"><strong>Une journée sans liste imposée</strong><p>Ajoute seulement une tâche si cela peut vraiment t’aider aujourd’hui.</p></div>';
      return;
    }

    elements.weeklyProgramTaskList.innerHTML = tasks.map(function (task) {
      const checked = Boolean(checks[task.id]);
      return [
        '<div class="weekly-program-task', checked ? " completed" : "", '" data-weekly-task-id="', escapeHtml(task.id), '">',
        '<label class="weekly-program-check">',
        '<input type="checkbox" data-weekly-task-check="', escapeHtml(task.id), '"', checked ? " checked" : "", ">",
        '<span class="weekly-program-checkmark"><svg><use href="#icon-check"></use></svg></span>',
        '<span>', escapeHtml(task.title), "</span>",
        "</label>",
        '<button class="weekly-program-remove" type="button" data-weekly-task-remove="', escapeHtml(task.id), '" aria-label="Retirer ', escapeHtml(task.title), ' pour aujourd\'hui"><svg><use href="#icon-trash"></use></svg></button>',
        "</div>"
      ].join("");
    }).join("");
  }

  async function handleWeeklyProgramTaskToggle(event) {
    const checkbox = event.target.closest("[data-weekly-task-check]");
    if (!checkbox) return;
    const dateKey = formatDateKey(state.today);
    const checks = Object.assign({}, state.settings.weeklyProgramChecks[dateKey] || {});
    if (checkbox.checked) checks[checkbox.dataset.weeklyTaskCheck] = true;
    else delete checks[checkbox.dataset.weeklyTaskCheck];
    state.settings.weeklyProgramChecks = Object.assign({}, state.settings.weeklyProgramChecks, {
      [dateKey]: checks
    });
    await DB.saveSettings({ weeklyProgramChecks: state.settings.weeklyProgramChecks });
    await syncWeeklyProgramActivity();
    renderHome();
    renderHistory();
  }

  async function handleWeeklyProgramTaskClick(event) {
    const button = event.target.closest("[data-weekly-task-remove]");
    if (!button) return;
    const taskId = button.dataset.weeklyTaskRemove;
    const dateKey = formatDateKey(state.today);
    const override = state.settings.weeklyProgramOverrides[dateKey] || { removed: [], custom: [] };
    const isCustom = (override.custom || []).some(function (task) { return task.id === taskId; });
    const nextOverride = {
      removed: isCustom
        ? (override.removed || []).slice()
        : Array.from(new Set((override.removed || []).concat(taskId))),
      custom: (override.custom || []).filter(function (task) { return task.id !== taskId; })
    };
    state.settings.weeklyProgramOverrides = Object.assign({}, state.settings.weeklyProgramOverrides, {
      [dateKey]: nextOverride
    });
    const checks = Object.assign({}, state.settings.weeklyProgramChecks[dateKey] || {});
    delete checks[taskId];
    state.settings.weeklyProgramChecks = Object.assign({}, state.settings.weeklyProgramChecks, {
      [dateKey]: checks
    });
    await DB.saveSettings({
      weeklyProgramOverrides: state.settings.weeklyProgramOverrides,
      weeklyProgramChecks: state.settings.weeklyProgramChecks
    });
    await syncWeeklyProgramActivity();
    renderHome();
    renderHistory();
    showToast("Tâche retirée pour aujourd'hui.");
  }

  async function addWeeklyProgramTask(event) {
    event.preventDefault();
    const title = elements.weeklyTaskInput.value.trim();
    if (!title) return;
    const dateKey = formatDateKey(state.today);
    const override = state.settings.weeklyProgramOverrides[dateKey] || { removed: [], custom: [] };
    const task = { id: "weekly-custom-" + createId(), title: title };
    state.settings.weeklyProgramOverrides = Object.assign({}, state.settings.weeklyProgramOverrides, {
      [dateKey]: {
        removed: (override.removed || []).slice(),
        custom: (override.custom || []).concat(task)
      }
    });
    elements.weeklyTaskInput.value = "";
    await DB.saveSettings({ weeklyProgramOverrides: state.settings.weeklyProgramOverrides });
    await syncWeeklyProgramActivity();
    renderHome();
    renderHistory();
    showToast("Tâche ajoutée pour aujourd'hui.");
  }

  async function syncWeeklyProgramActivity() {
    const dateKey = formatDateKey(state.today);
    const program = getWeeklyProgramForDate(state.today);
    const refId = "weekly-program-" + program.id;
    const obsoleteActivities = Array.from(state.activities.values()).filter(function (activity) {
      return activity.type === "mission" &&
        activity.date === dateKey &&
        String(activity.refId).startsWith("weekly-program-") &&
        activity.refId !== refId;
    });
    await Promise.all(obsoleteActivities.map(function (activity) {
      return removeActivity(activity.type, activity.date, activity.refId);
    }));
    if (isWeeklyProgramComplete(state.today)) {
      if (!hasActivity("mission", dateKey, refId)) {
        await addActivity("mission", dateKey, refId, program.title);
      }
    } else if (hasActivity("mission", dateKey, refId)) {
      await removeActivity("mission", dateKey, refId);
    }
  }

  async function completeCurrentSmallStep() {
    const step = getCurrentSmallStep();
    if (!step) return;
    const journey = state.settings.smallStepProgress;
    const todayKey = formatDateKey(state.today);
    const reference = step.id + "-cycle-" + journey.cycle;
    await addActivity("small-step", todayKey, reference, step.title);

    const nextIndex = journey.currentIndex + 1;
    state.settings.smallStepProgress = {
      currentIndex: Math.min(nextIndex, DATA.smallSteps.length),
      cycle: journey.cycle,
      finished: nextIndex >= DATA.smallSteps.length
    };
    await DB.saveSettings({ smallStepProgress: state.settings.smallStepProgress });
    elements.smallStepDetailsPanel.open = false;
    renderHome();
    renderHistory();
    showToast(DATA.quotes[(journey.currentIndex + journey.cycle) % DATA.quotes.length]);
  }

  async function restartSmallStepJourney() {
    const journey = state.settings.smallStepProgress;
    state.settings.smallStepProgress = {
      currentIndex: 0,
      cycle: journey.cycle + 1,
      finished: false
    };
    await DB.saveSettings({ smallStepProgress: state.settings.smallStepProgress });
    elements.smallStepDetailsPanel.open = false;
    renderHome();
    showToast("Un nouveau parcours commence, un petit pas à la fois.");
  }

  async function toggleCurrentSmallStepFavorite() {
    const step = getCurrentSmallStep();
    if (!step) return;
    const id = "small-step:" + step.id;

    if (state.favorites.has(id)) {
      await DB.remove("favorites", id);
      state.favorites.delete(id);
      renderHome();
      renderFavorites();
      showToast("Petit pas retiré des favoris.");
      return;
    }

    if (!canUse("unlimitedFavorites") && state.favorites.size >= state.account.limits.favorites) {
      navigate("pro");
      showToast("La version gratuite permet de garder trois favoris au total.");
      return;
    }

    const favorite = {
      id: id,
      type: "small-step",
      title: step.title,
      description: step.description,
      details: step.details,
      savedAt: new Date().toISOString()
    };
    await DB.put("favorites", favorite);
    state.favorites.set(id, favorite);
    renderHome();
    renderFavorites();
    showToast("Petit pas ajouté aux favoris.");
  }

  function renderZones() {
    const currentWeeklyZone = getDailyContent().weeklyZone;
    elements.zonesList.innerHTML = DATA.zones.map(function (zone) {
      const isCurrent = currentWeeklyZone.id === zone.id;
      const isAvailable = isCurrent || canUse("allZones");
      if (!isAvailable) {
        return [
          '<article class="card zone-card zone-overview zone-locked">',
          '<button class="zone-overview-summary zone-locked-button" type="button" data-zone-locked="', zone.id, '">',
          '<span class="zone-icon">', zone.short, "</span>",
          "<div><h3>", escapeHtml(zone.name), "</h3>",
          '<p class="zone-visit-label">Disponible avec PRO</p></div>',
          '<span class="zone-pro-badge"><svg><use href="#icon-lock"></use></svg>PRO</span>',
          '<svg class="zone-overview-chevron"><use href="#icon-chevron"></use></svg>',
          "</button>",
          "</article>"
        ].join("");
      }
      const sections = zone.sections.map(function (section) {
        const sectionTasks = zone.tasks.filter(function (task) { return task.categorie === section; });
        const tasks = sectionTasks.map(function (task) {
          const done = isZoneTaskDone(task.id);
          return [
            '<li class="zone-reference-item', done ? " done" : "", '">',
            '<label class="zone-reference-check">',
            '<input type="checkbox" data-zone-task-id="', task.id, '"', done ? " checked" : "",
            ' aria-label="', done ? "Décocher " : "Cocher ", escapeHtml(task.titre), '">',
            '<span class="zone-reference-checkmark" aria-hidden="true"><svg><use href="#icon-check"></use></svg></span>',
            '<span class="zone-reference-task-title">', escapeHtml(task.titre), "</span>",
            "</label>",
            "</li>"
          ].join("");
        }).join("");

        return [
          '<details class="zone-subsection">',
          '<summary><span>', escapeHtml(section), '</span><span class="zone-section-count">', sectionTasks.length,
          '</span><svg><use href="#icon-chevron"></use></svg></summary>',
          '<ul class="zone-reference-list">', tasks, "</ul>",
          "</details>"
        ].join("");
      }).join("");

      return [
        '<details class="card zone-card zone-overview', isCurrent ? " current-zone" : "", '" name="house-zones" data-zone-id="', zone.id, '"', isCurrent ? " open" : "", ">",
        '<summary class="zone-overview-summary" data-zone-summary="', zone.id, '">',
        '<span class="zone-icon">', zone.short, "</span>",
        "<div><h3>", escapeHtml(zone.name), "</h3>",
        '<p class="zone-visit-label" data-zone-last-visit="', zone.id, '">', formatZoneVisitLabel(state.settings.zoneVisits[zone.id]), "</p></div>",
        isCurrent ? '<span class="zone-active-badge">Zone active cette semaine</span>' : "",
        '<svg class="zone-overview-chevron"><use href="#icon-chevron"></use></svg>',
        "</summary>",
        '<p class="zone-description">', escapeHtml(zone.description), "</p>",
        '<p class="zone-reference-note">Liste de référence : choisis seulement ce qui est utile aujourd\'hui.</p>',
        '<div class="zone-subsections">', sections, "</div>",
        "</details>"
      ].join("");
    }).join("");
  }

  function isZoneTaskDone(taskId) {
    const row = state.zoneStates.get(taskId);
    return Boolean(row && row.completed);
  }

  async function handleZoneTaskChange(event) {
    const checkbox = event.target.closest("[data-zone-task-id]");
    if (!checkbox) return;

    const taskId = checkbox.dataset.zoneTaskId;
    const task = DATA.zones
      .flatMap(function (zone) { return zone.tasks; })
      .find(function (item) { return item.id === taskId; });
    if (!task) return;

    const completed = checkbox.checked;
    const item = checkbox.closest(".zone-reference-item");
    checkbox.disabled = true;

    try {
      if (completed) {
        const row = {
          id: taskId,
          completed: true,
          updatedAt: new Date().toISOString()
        };
        await DB.put("zoneTaskStates", row);
        state.zoneStates.set(taskId, row);
      } else {
        await DB.remove("zoneTaskStates", taskId);
        state.zoneStates.delete(taskId);
      }

      item.classList.toggle("done", completed);
      checkbox.setAttribute("aria-label", (completed ? "Décocher " : "Cocher ") + task.titre);
    } catch (error) {
      checkbox.checked = !completed;
      item.classList.toggle("done", !completed);
      console.error("Impossible d'enregistrer la case de zone :", error);
      showToast("La case n'a pas pu être enregistrée.");
    } finally {
      checkbox.disabled = false;
    }
  }

  async function handleZoneClick(event) {
    const lockedZone = event.target.closest("[data-zone-locked]");
    if (lockedZone) {
      navigate("pro");
      showToast("La version gratuite donne accès à la zone active de la semaine.");
      return;
    }
    const summary = event.target.closest("[data-zone-summary]");
    if (!summary) return;
    const zoneId = summary.dataset.zoneSummary;
    const visitedAt = new Date().toISOString();
    state.settings.zoneVisits = Object.assign({}, state.settings.zoneVisits, { [zoneId]: visitedAt });
    await DB.saveSettings({ zoneVisits: state.settings.zoneVisits });
    const label = elements.zonesList.querySelector('[data-zone-last-visit="' + zoneId + '"]');
    if (label) label.textContent = formatZoneVisitLabel(visitedAt);
  }

  function renderPrinciples() {
    elements.principlesList.innerHTML = DATA.principles.map(function (principle, index) {
      return [
        '<article class="card principle-card', principle.featured ? " featured" : "", '">',
        '<span class="principle-number">', String(index + 1).padStart(2, "0"), "</span>",
        '<div><p class="card-kicker">Principe ', index + 1, "</p>",
        "<h3>", escapeHtml(principle.title), "</h3>",
        "<p>", escapeHtml(principle.description), "</p></div>",
        principle.featured ? '<span class="principle-featured-badge"><svg><use href="#icon-spark"></use></svg>La philosophie centrale</span>' : "",
        "</article>"
      ].join("");
    }).join("");
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
    const names = { daily: "quotidienne", morning: "du matin", afternoon: "de l'après-midi", evening: "du soir" };
    const percent = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;
    const routineIcons = {
      daily: "#icon-routines",
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

    if (!tasks.length && state.activeRoutine !== "daily") {
      elements.routineTaskList.innerHTML = '<div class="empty-state"><h3>Une routine toute légère</h3><p>Ajoute une première tâche quand tu es prête ou prêt.</p></div>';
      return;
    }

    const taskItems = tasks.map(function (task, index) {
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

    const declutterDone = hasActivity("declutter", todayKey, DAILY_DECLUTTER_REF);
    const dailyDeclutter = state.activeRoutine === "daily"
      ? [
        '<article class="routine-declutter-card', declutterDone ? " done" : "", '">',
        '<div><p class="card-kicker">Désencombrement quotidien</p>',
        '<h3>Désencombrement 15 minutes</h3>',
        "<p>Choisis une petite zone. Lorsque le minuteur sonne, arrête-toi : l'objectif est d'avancer, pas de finir.</p></div>",
        '<div class="routine-declutter-actions">',
        '<button class="primary-button" type="button" data-routine-declutter-action="toggle">',
        declutterDone ? "Fait aujourd'hui" : "Cocher",
        "</button>",
        '<button class="secondary-button" type="button" data-routine-declutter-action="timer"><svg><use href="#icon-timer"></use></svg>15 minutes</button>',
        "</div></article>"
      ].join("")
      : "";

    const detailItems = tasks.filter(function (task) {
      return task.description;
    }).map(function (task) {
      const steps = Array.isArray(task.steps)
        ? '<ul>' + task.steps.map(function (step) { return "<li>" + escapeHtml(step) + "</li>"; }).join("") + "</ul>"
        : "";
      return [
        '<article class="routine-detail-card">',
        '<p class="card-kicker">Détail de routine</p>',
        "<h3>", escapeHtml(task.title), "</h3>",
        "<p>", escapeHtml(task.description), "</p>",
        steps,
        task.closingMessage ? '<strong class="routine-closing-message">' + escapeHtml(task.closingMessage) + "</strong>" : "",
        "</article>"
      ].join("");
    }).join("");

    elements.routineTaskList.innerHTML = taskItems + dailyDeclutter + detailItems;
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
    const declutterAction = event.target.closest("[data-routine-declutter-action]");
    if (declutterAction) {
      if (declutterAction.dataset.routineDeclutterAction === "timer") {
        await openDailyDeclutterTimer();
      } else {
        await toggleRoutineDeclutter();
      }
      return;
    }

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

  async function toggleRoutineDeclutter() {
    const todayKey = formatDateKey(state.today);
    if (hasActivity("declutter", todayKey, DAILY_DECLUTTER_REF)) {
      await removeActivity("declutter", todayKey, DAILY_DECLUTTER_REF);
      showToast("C'est décoché pour aujourd'hui.");
    } else {
      await addActivity("declutter", todayKey, DAILY_DECLUTTER_REF, DAILY_DECLUTTER_TITLE);
      showToast("C'est noté. Un petit espace de plus.");
    }
    renderHome();
    renderRoutines();
    renderHistory();
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
    elements.smallStepCount.textContent = String(activities.filter(function (item) { return item.type === "small-step"; }).length);
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
      elements.favoritesList.innerHTML = '<div class="empty-state"><h3>Aucun favori pour le moment</h3><p>Ajoute un Petit pas depuis l\'accueil pour le retrouver ici.</p></div>';
      return;
    }

    elements.favoritesList.innerHTML = favorites.map(function (favorite) {
      const isSmallStep = favorite.type === "small-step";
      const meta = isSmallStep
        ? '<small class="favorite-kind"><svg><use href="#icon-spark"></use></svg>Petit pas du parcours</small>'
        : '<small><svg><use href="#icon-clock"></use></svg>' + escapeHtml(favorite.minutes || "") + ' min</small>';
      return [
        '<article class="favorite-item', isSmallStep ? " small-step-favorite" : "", '" data-favorite-id="', favorite.id, '">',
        '<span class="favorite-item-icon"><svg><use href="#icon-heart"></use></svg></span>',
        '<div><strong>', escapeHtml(favorite.title), '</strong><p>', escapeHtml(favorite.description), "</p>", meta, "</div>",
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
    showToast("Favori retiré.");
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
      mission: "Programme hebdomadaire",
      tip: "Conseil lu",
      "small-step": "Petit pas du parcours",
      declutter: "Désencombrement quotidien",
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
    applyFreeReminderLimits(false);
    renderWeeklyProgramSchedule();
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

  function renderWeeklyProgramSchedule() {
    elements.weeklyScheduleList.innerHTML = DATA.weeklyPrograms.map(function (program) {
      const selectedDay = state.settings.weeklyProgramSchedule[program.id];
      const options = WEEKDAY_NAMES.map(function (name, day) {
        return '<option value="' + day + '"' + (day === selectedDay ? " selected" : "") + ">" + name + "</option>";
      }).join("");
      return [
        '<label class="weekly-schedule-row">',
        '<span><strong>', escapeHtml(program.shortTitle), '</strong><small>', escapeHtml(program.description), "</small></span>",
        '<select class="weekly-day-select" data-weekly-program-day="', program.id, '">', options, "</select>",
        "</label>"
      ].join("");
    }).join("");

    const assignedDays = new Set(Object.values(state.settings.weeklyProgramSchedule));
    const freeDay = WEEKDAY_NAMES.find(function (_name, day) { return !assignedDays.has(day); });
    elements.weeklyFreeDayNote.textContent = freeDay
      ? freeDay + " reste une journée libre, sans liste imposée."
      : "";
  }

  async function changeWeeklyProgramDay(event) {
    const select = event.target.closest("[data-weekly-program-day]");
    if (!select) return;
    const programId = select.dataset.weeklyProgramDay;
    const newDay = Number(select.value);
    const previousDay = state.settings.weeklyProgramSchedule[programId];
    const occupyingProgramId = Object.keys(state.settings.weeklyProgramSchedule).find(function (id) {
      return id !== programId && state.settings.weeklyProgramSchedule[id] === newDay;
    });
    const nextSchedule = Object.assign({}, state.settings.weeklyProgramSchedule, {
      [programId]: newDay
    });
    if (occupyingProgramId) nextSchedule[occupyingProgramId] = previousDay;
    state.settings.weeklyProgramSchedule = normalizeWeeklyProgramSchedule(nextSchedule);
    await DB.saveSettings({ weeklyProgramSchedule: state.settings.weeklyProgramSchedule });
    await syncWeeklyProgramActivity();
    renderWeeklyProgramSchedule();
    renderHome();
    renderHistory();
    showToast("Programme hebdomadaire mis à jour.");
  }

  async function resetWeeklyProgramSchedule() {
    state.settings.weeklyProgramSchedule = Object.assign({}, DATA.defaultWeeklyProgramSchedule);
    await DB.saveSettings({ weeklyProgramSchedule: state.settings.weeklyProgramSchedule });
    await syncWeeklyProgramActivity();
    renderWeeklyProgramSchedule();
    renderHome();
    renderHistory();
    showToast("Configuration par défaut restaurée.");
  }

  function handleReminderToggle(event) {
    if (canUse("multipleReminders") || !event.target.checked) return;
    [elements.missionReminder, elements.tipReminder, elements.zoneReminder].forEach(function (input) {
      if (input !== event.target) input.checked = false;
    });
    showToast("La version gratuite permet un rappel actif à la fois.");
  }

  function applyFreeReminderLimits(persist) {
    if (canUse("multipleReminders")) return false;
    const enabledKeys = ["missionReminder", "tipReminder", "zoneReminder"];
    const firstEnabled = enabledKeys.find(function (key) { return Boolean(state.settings[key]); });
    let changed = false;

    enabledKeys.forEach(function (key) {
      const nextValue = key === firstEnabled;
      if (state.settings[key] !== nextValue) {
        state.settings[key] = nextValue;
        changed = true;
      }
    });
    Object.keys(FREE_REMINDER_TIMES).forEach(function (key) {
      if (state.settings[key] !== FREE_REMINDER_TIMES[key]) {
        state.settings[key] = FREE_REMINDER_TIMES[key];
        changed = true;
      }
    });

    if (changed && persist) {
      DB.saveSettings({
        missionReminder: state.settings.missionReminder,
        missionTime: state.settings.missionTime,
        tipReminder: state.settings.tipReminder,
        tipTime: state.settings.tipTime,
        zoneReminder: state.settings.zoneReminder,
        zoneTime: state.settings.zoneTime
      }).catch(function (error) {
        console.warn("Limites de rappel impossibles à enregistrer :", error);
      });
    }
    return changed;
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
    if (state.ambianceCategory && !isRadioCategoryAvailable(state.ambianceCategory)) {
      stopAmbiance();
    }
    applyFreeReminderLimits(true);
    renderAccountUi();
    renderZones();
    renderRoutines();
    renderHistory();
    renderSettings();
    renderAmbianceSelection();
    initializeCloudSync();
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
    if (elements.cloudSyncStatus) {
      elements.cloudSyncStatus.textContent = isPro
        ? cloudSyncStatusText()
        : "Sauvegarde locale uniquement. La synchronisation entre appareils est incluse avec PRO.";
    }
    elements.accountSettingsButton.textContent = user ? (isPro ? "Voir les avantages PRO" : "Découvrir PRO") : "Créer un compte";
    elements.manageSubscriptionButton.hidden = !isPro || hasLifetimeAccess;
    elements.signOutButton.hidden = !user;
    elements.deleteAccountLink.hidden = !user;
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

  function cloudSyncStatusText() {
    if (state.cloudSyncStatus === "syncing") return "Synchronisation infonuagique en cours…";
    if (state.cloudSyncStatus === "synced") return "Sauvegarde infonuagique active sur tes appareils.";
    if (state.cloudSyncStatus === "error") return "Sauvegarde infonuagique à configurer dans Supabase.";
    return "Préparation de la sauvegarde infonuagique…";
  }

  async function initializeCloudSync() {
    const user = state.account.user;
    if (!state.account.isPro || !user || !ACCOUNT || !ACCOUNT.loadCloudBackup) {
      state.cloudSyncReady = false;
      state.cloudSyncUserId = null;
      state.cloudSyncStatus = "local";
      if (state.cloudSyncTimer) window.clearTimeout(state.cloudSyncTimer);
      return;
    }
    if (state.cloudSyncInProgress || state.cloudSyncUserId === user.id && state.cloudSyncReady) return;

    state.cloudSyncInProgress = true;
    state.cloudSyncReady = false;
    state.cloudSyncUserId = user.id;
    state.cloudSyncStatus = "syncing";
    renderAccountUi();

    try {
      const [remoteBackup, localPayload] = await Promise.all([
        ACCOUNT.loadCloudBackup(),
        DB.exportData()
      ]);
      let payload = localPayload;

      if (remoteBackup && remoteBackup.payload) {
        const localHasUnsavedChanges = Boolean(localPayload.settings.cloudDirty);
        const firstSyncWithLocalData = !localPayload.settings.cloudLastSyncedAt &&
          hasMeaningfulLocalData(localPayload);
        if (localHasUnsavedChanges) {
          payload = localPayload;
        } else {
          payload = firstSyncWithLocalData
            ? mergeBackupPayload(remoteBackup.payload, localPayload)
            : remoteBackup.payload;
          await DB.importData(payload);
          await loadState();
          renderAll();
        }
      }

      const saved = await ACCOUNT.saveCloudBackup(payload);
      state.settings.cloudLastSyncedAt = saved.updated_at;
      state.settings.cloudDirty = false;
      await DB.saveSettings({ cloudLastSyncedAt: saved.updated_at, cloudDirty: false });
      state.cloudSyncReady = true;
      state.cloudSyncStatus = "synced";
    } catch (error) {
      console.warn("Synchronisation infonuagique indisponible :", error);
      state.cloudSyncReady = false;
      state.cloudSyncStatus = "error";
    } finally {
      state.cloudSyncInProgress = false;
      renderAccountUi();
    }
  }

  function scheduleCloudBackup() {
    if (state.cloudSyncInProgress || !state.account.isPro) return;
    if (!state.settings.cloudDirty) {
      state.settings.cloudDirty = true;
      DB.saveSettings({ cloudDirty: true }).catch(function (error) {
        console.warn("État de sauvegarde impossible à enregistrer :", error);
      });
    }
    if (!state.cloudSyncReady) return;
    state.cloudSyncStatus = "syncing";
    renderAccountUi();
    if (state.cloudSyncTimer) window.clearTimeout(state.cloudSyncTimer);
    state.cloudSyncTimer = window.setTimeout(uploadCloudBackup, 1200);
  }

  async function uploadCloudBackup() {
    if (!state.cloudSyncReady || state.cloudSyncInProgress || !state.account.isPro) return;
    state.cloudSyncInProgress = true;
    try {
      const payload = await DB.exportData();
      const saved = await ACCOUNT.saveCloudBackup(payload);
      state.settings.cloudLastSyncedAt = saved.updated_at;
      state.settings.cloudDirty = false;
      await DB.saveSettings({ cloudLastSyncedAt: saved.updated_at, cloudDirty: false });
      state.cloudSyncStatus = "synced";
    } catch (error) {
      console.warn("Sauvegarde infonuagique impossible :", error);
      state.cloudSyncStatus = "error";
    } finally {
      state.cloudSyncInProgress = false;
      renderAccountUi();
    }
  }

  function hasMeaningfulLocalData(payload) {
    const settings = payload.settings || {};
    return Boolean(
      (payload.activities || []).length ||
      (payload.routineChecks || []).length ||
      (payload.zoneTaskStates || []).length ||
      (payload.favorites || []).length ||
      (payload.routineTasks || []).some(function (task) { return !String(task.id).startsWith("default-"); }) ||
      settings.firstName ||
      settings.smallStepProgress && Number(settings.smallStepProgress.currentIndex) > 0
    );
  }

  function mergeBackupPayload(remotePayload, localPayload) {
    const merged = {
      version: 1,
      settings: Object.assign({}, remotePayload.settings || {}, localPayload.settings || {})
    };
    ["activities", "routineTasks", "zoneTaskStates", "routineChecks", "favorites"].forEach(function (name) {
      const rows = new Map();
      (remotePayload[name] || []).forEach(function (row) { rows.set(row.id, row); });
      (localPayload[name] || []).forEach(function (row) { rows.set(row.id, row); });
      merged[name] = Array.from(rows.values());
    });
    return merged;
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
    const statuses = ["idle", "running", "paused", "complete"];
    const status = statuses.includes(saved.status) ? saved.status : "idle";
    const preserveExistingSession = status === "running" || status === "paused" || status === "complete";
    const selectedMinutes = preserveExistingSession && Number(saved.selectedMinutes) > 0
      ? Number(saved.selectedMinutes)
      : 15;
    const durationMs = preserveExistingSession && Number(saved.durationMs) > 0
      ? Number(saved.durationMs)
      : 15 * 60 * 1000;
    const remainingMs = preserveExistingSession
      ? Math.max(0, Math.min(
        Number.isFinite(Number(saved.remainingMs)) ? Number(saved.remainingMs) : durationMs,
        durationMs
      ))
      : durationMs;

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
      selectedMinutes: 15,
      durationMs: 15 * 60 * 1000,
      remainingMs: 15 * 60 * 1000,
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
    const reminderInputs = [
      { enabled: elements.missionReminder.checked, reminderKey: "missionReminder", timeKey: "missionTime", value: elements.missionTimeSetting.value },
      { enabled: elements.tipReminder.checked, reminderKey: "tipReminder", timeKey: "tipTime", value: elements.tipTimeSetting.value },
      { enabled: elements.zoneReminder.checked, reminderKey: "zoneReminder", timeKey: "zoneTime", value: elements.zoneTimeSetting.value }
    ];
    if (!canUse("multipleReminders")) {
      const firstEnabledIndex = reminderInputs.findIndex(function (item) { return item.enabled; });
      reminderInputs.forEach(function (item, index) {
        item.enabled = index === firstEnabledIndex;
        item.value = FREE_REMINDER_TIMES[item.timeKey];
      });
    }
    const nextSettings = {
      firstName: elements.firstNameSetting.value.trim(),
      reduceMotion: elements.reduceMotionSetting.checked,
      missionReminder: reminderInputs[0].enabled,
      missionTime: reminderInputs[0].value,
      tipReminder: reminderInputs[1].enabled,
      tipTime: reminderInputs[1].value,
      zoneReminder: reminderInputs[2].enabled,
      zoneTime: reminderInputs[2].value
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
    const weeklyProgram = getWeeklyProgramForDate(now);
    const currentSmallStep = getCurrentSmallStep();
    const notifications = [
      {
        enabled: state.settings.missionReminder,
        time: state.settings.missionTime,
        lastKey: "lastMissionNotification",
        title: "Ton programme du jour",
        body: weeklyProgram.title + " · avance à ton rythme.",
        tag: "weekly-program-" + todayKey,
        allowed: true
      },
      {
        enabled: state.settings.tipReminder,
        time: state.settings.tipTime,
        lastKey: "lastTipNotification",
        title: "Ton Petit pas t'attend",
        body: currentSmallStep ? currentSmallStep.title : "Ton parcours est complété. Prends le temps de reconnaître le chemin.",
        tag: "small-step-" + todayKey,
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
    if (document.visibilityState === "visible") {
      syncCurrentDay();
      resumeAmbianceAfterBackground();
    }
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

  async function selectRadioCategory(categoryId, forceRefresh) {
    const category = RADIO_CATEGORIES[categoryId];
    if (!category) return;
    if (!isRadioCategoryAvailable(categoryId)) {
      navigate("pro");
      showToast("Cette ambiance est incluse avec PRO.");
      return;
    }

    resetAmbiancePlayback();
    state.ambianceWantsPlayback = true;
    state.ambianceRetryAttempt = 0;
    state.ambianceCategory = categoryId;
    state.ambianceActiveService = null;
    state.ambianceLoading = true;
    renderAmbianceSelection();
    setAmbianceStatus("Recherche d'une station…", category.name, "loading");

    try {
      state.ambianceCandidates = await loadRadioCandidates(categoryId, forceRefresh);
      state.ambianceCandidateIndex = -1;
      if (!state.ambianceCandidates.length) throw new Error("Aucune station compatible");
      tryRadioCandidate(0);
    } catch (error) {
      console.warn("Radio unavailable:", error);
      scheduleAmbianceReconnect();
    }
  }

  function toggleAmbiance() {
    const player = elements["global-audio-player"];
    if (state.ambianceWantsPlayback && (state.ambiancePlaying || state.ambianceLoading)) {
      state.ambianceWantsPlayback = false;
      state.ambianceLoading = false;
      clearAmbiancePlaybackTimer();
      clearAmbianceReconnectTimer();
      player.pause();
      handleAmbiancePause();
      return;
    }

    if (!state.ambianceCategory) return;
    state.ambianceWantsPlayback = true;
    if (!player.src || player.error) {
      scheduleAmbianceReconnect(true);
      return;
    }

    clearAmbianceReconnectTimer();
    state.ambianceLoading = true;
    updateMiniPlayer();
    scheduleAmbianceFailover(state.ambianceAttemptToken, 10000);
    player.play().catch(function (error) {
      handleAmbiancePlayRejection(error, state.ambianceAttemptToken);
    });
  }

  function stopAmbiance() {
    resetAmbiancePlayback();
    state.ambianceCategory = null;
    state.ambianceCandidates = [];
    state.ambianceCandidateIndex = -1;
    state.ambianceActiveService = null;
    setAmbianceStatus(
      "Choisis ce qui te ferait du bien",
      "Une station apparaîtra ici dès que tu l'auras lancée.",
      "idle"
    );
    renderAmbianceSelection();
  }

  async function loadRadioCandidates(categoryId, forceRefresh) {
    const cache = readRadioCache();
    const cached = cache[categoryId];
    const fresh = cached && Date.now() - cached.savedAt < RADIO_CACHE_MAX_AGE;
    if (!forceRefresh && fresh && Array.isArray(cached.stations) && cached.stations.length) {
      return cached.stations;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(function () {
      controller.abort();
    }, 18000);

    try {
      const response = await fetch("/api/radio-stations?category=" + encodeURIComponent(categoryId), {
        headers: { Accept: "application/json" },
        signal: controller.signal
      });
      const payload = await response.json().catch(function () { return {}; });
      if (!response.ok || !Array.isArray(payload.stations)) {
        throw new Error(payload.error || "Radio Browser indisponible");
      }

      cache[categoryId] = { savedAt: Date.now(), stations: payload.stations };
      writeRadioCache(cache);
      return payload.stations;
    } catch (error) {
      if (cached && Array.isArray(cached.stations) && cached.stations.length) {
        return cached.stations;
      }
      throw error;
    } finally {
      window.clearTimeout(timeout);
    }
  }

  function tryRadioCandidate(index) {
    const station = state.ambianceCandidates[index];
    if (!station) {
      state.ambiancePlaying = false;
      scheduleAmbianceReconnect();
      return;
    }

    const player = elements["global-audio-player"];
    const token = ++state.ambianceAttemptToken;
    clearAmbiancePlaybackTimer();
    state.ambianceCandidateIndex = index;
    state.ambianceLoading = true;
    state.ambiancePlaying = false;

    player.pause();
    player.removeAttribute("src");
    player.load();
    player.src = station.url;

    setAmbianceStatus("Connexion à " + station.name + "…", radioCategoryMeta(), "loading");
    elements["mp-title"].textContent = station.name;
    elements["mp-subtitle"].textContent = "Connexion en cours";
    elements["mp-icon"].textContent = RADIO_CATEGORIES[state.ambianceCategory].icon;
    elements["mini-player"].classList.remove("hidden");
    updateMiniPlayer();
    updateAmbianceMediaSession();
    scheduleAmbianceFailover(token, 10000);

    if (state.ambianceWantsPlayback) {
      player.play().catch(function (error) {
        handleAmbiancePlayRejection(error, token);
      });
    }
  }

  function handleAmbiancePlayRejection(error, token) {
    if (token !== state.ambianceAttemptToken || !state.ambianceCategory) return;
    if (error && error.name === "NotAllowedError") {
      clearAmbiancePlaybackTimer();
      clearAmbianceReconnectTimer();
      state.ambianceWantsPlayback = false;
      state.ambianceLoading = false;
      state.ambiancePlaying = false;
      const station = currentAmbianceStation();
      setAmbianceStatus(
        station ? station.name : "Station prête",
        radioCategoryMeta() + " · Appuie sur Écouter",
        "paused"
      );
      renderAmbianceSelection();
      updateMiniPlayer();
      return;
    }
    advanceToNextStation(token);
  }

  function handleAmbiancePlaying() {
    if (!state.ambianceCategory) return;
    clearAmbiancePlaybackTimer();
    clearAmbianceReconnectTimer();
    state.ambianceRetryAttempt = 0;
    state.ambianceLoading = false;
    state.ambiancePlaying = true;
    const station = currentAmbianceStation();
    setAmbianceStatus(station ? station.name : "Station en lecture", radioCategoryMeta(), "playing");
    renderAmbianceSelection();
    updateMiniPlayer();
    updateAmbianceMediaSession();
    if (station && station.stationuuid) registerRadioClick(station.stationuuid);
  }

  function handleAmbiancePause() {
    if (!state.ambianceCategory || state.ambianceLoading) return;
    state.ambiancePlaying = false;
    const station = currentAmbianceStation();
    const category = RADIO_CATEGORIES[state.ambianceCategory];
    setAmbianceStatus(
      station ? station.name : category.name,
      radioCategoryMeta() + " · En pause",
      "paused"
    );
    updateMiniPlayer();
    updateAmbianceMediaSession();
  }

  function handleAmbiancePlaybackError() {
    if (!state.ambianceCategory || !state.ambianceWantsPlayback) return;
    advanceToNextStation(state.ambianceAttemptToken);
  }

  function handleAmbianceStalled() {
    if (!state.ambianceCategory || !state.ambianceWantsPlayback) return;
    if (!state.ambianceLoading && !state.ambiancePlaying) return;
    scheduleAmbianceFailover(state.ambianceAttemptToken, 8000);
  }

  function scheduleAmbianceFailover(token, delay) {
    if (!state.ambianceWantsPlayback) return;
    clearAmbiancePlaybackTimer();
    state.ambiancePlaybackTimer = window.setTimeout(function () {
      advanceToNextStation(token);
    }, delay);
  }

  function advanceToNextStation(token) {
    if (token !== state.ambianceAttemptToken || !state.ambianceCategory || !state.ambianceWantsPlayback) return;
    clearAmbiancePlaybackTimer();
    tryRadioCandidate(state.ambianceCandidateIndex + 1);
  }

  function resetAmbiancePlayback() {
    const player = elements["global-audio-player"];
    ++state.ambianceAttemptToken;
    clearAmbiancePlaybackTimer();
    clearAmbianceReconnectTimer();
    state.ambianceWantsPlayback = false;
    state.ambianceRetryAttempt = 0;
    state.ambianceLoading = false;
    state.ambiancePlaying = false;
    player.pause();
    player.removeAttribute("src");
    player.load();
    elements["mini-player"].classList.add("hidden");
    elements["mp-play-icon-use"].setAttribute("href", "#icon-play");
    updateAmbianceMediaSession();
  }

  function clearAmbiancePlaybackTimer() {
    if (state.ambiancePlaybackTimer) {
      window.clearTimeout(state.ambiancePlaybackTimer);
      state.ambiancePlaybackTimer = null;
    }
  }

  function scheduleAmbianceReconnect(immediate) {
    if (!state.ambianceCategory || !state.ambianceWantsPlayback) return;

    ++state.ambianceAttemptToken;
    clearAmbiancePlaybackTimer();
    clearAmbianceReconnectTimer();
    state.ambianceLoading = true;
    state.ambiancePlaying = false;

    const delay = immediate
      ? 0
      : Math.min(
        RADIO_RECONNECT_INITIAL_DELAY * Math.pow(2, Math.min(state.ambianceRetryAttempt, 5)),
        RADIO_RECONNECT_MAX_DELAY
      );
    state.ambianceRetryAttempt = Math.min(state.ambianceRetryAttempt + 1, 6);

    const offline = navigator.onLine === false;
    setAmbianceStatus(
      offline ? "Connexion interrompue" : "Reconnexion automatique…",
      offline
        ? "La lecture reprendra dès que le réseau sera disponible."
        : "Nouvelle tentative dans " + Math.max(1, Math.ceil(delay / 1000)) + " s.",
      "loading"
    );
    elements["mini-player"].classList.remove("hidden");
    renderAmbianceSelection();
    updateMiniPlayer();
    updateAmbianceMediaSession();

    const categoryId = state.ambianceCategory;
    const token = state.ambianceAttemptToken;
    state.ambianceReconnectTimer = window.setTimeout(async function () {
      state.ambianceReconnectTimer = null;
      if (
        token !== state.ambianceAttemptToken ||
        categoryId !== state.ambianceCategory ||
        !state.ambianceWantsPlayback
      ) {
        return;
      }

      if (navigator.onLine === false) {
        scheduleAmbianceReconnect();
        return;
      }

      try {
        const candidates = await loadRadioCandidates(categoryId, true);
        if (
          token !== state.ambianceAttemptToken ||
          categoryId !== state.ambianceCategory ||
          !state.ambianceWantsPlayback
        ) {
          return;
        }
        state.ambianceCandidates = candidates;
        state.ambianceCandidateIndex = -1;
        if (!candidates.length) throw new Error("Aucune station compatible");
        tryRadioCandidate(0);
      } catch (error) {
        console.warn("Radio reconnect failed:", error);
        if (token === state.ambianceAttemptToken && state.ambianceWantsPlayback) {
          scheduleAmbianceReconnect();
        }
      }
    }, delay);
  }

  function clearAmbianceReconnectTimer() {
    if (state.ambianceReconnectTimer) {
      window.clearTimeout(state.ambianceReconnectTimer);
      state.ambianceReconnectTimer = null;
    }
  }

  function handleAmbianceNetworkLost() {
    if (!state.ambianceCategory || !state.ambianceWantsPlayback) return;
    scheduleAmbianceReconnect();
  }

  function handleAmbianceNetworkAvailable() {
    if (!state.ambianceCategory || !state.ambianceWantsPlayback || state.ambiancePlaying) return;
    scheduleAmbianceReconnect(true);
  }

  function resumeAmbianceAfterBackground() {
    if (!state.ambianceCategory || !state.ambianceWantsPlayback || state.ambiancePlaying) return;
    const player = elements["global-audio-player"];
    if (!player.src || player.error) {
      scheduleAmbianceReconnect(true);
      return;
    }

    state.ambianceLoading = true;
    updateMiniPlayer();
    scheduleAmbianceFailover(state.ambianceAttemptToken, 10000);
    player.play().catch(function (error) {
      handleAmbiancePlayRejection(error, state.ambianceAttemptToken);
    });
  }

  function currentAmbianceStation() {
    return state.ambianceCandidates[state.ambianceCandidateIndex] || null;
  }

  function radioCategoryName() {
    const category = RADIO_CATEGORIES[state.ambianceCategory];
    return category ? category.name : "Radio";
  }

  function radioCategoryMeta() {
    const category = RADIO_CATEGORIES[state.ambianceCategory];
    return category ? category.meta || category.name : "Radio";
  }

  function setAmbianceStatus(name, meta, tone) {
    elements["ambiance-active-name"].textContent = name;
    elements["ambiance-active-meta"].textContent = meta;
    elements["ambiance-status"].dataset.tone = tone;
    elements["ambiance-play-ready"].hidden = tone !== "paused";
    elements["ambiance-retry"].hidden = tone !== "error";
  }

  function renderAmbianceSelection() {
    document.querySelectorAll("[data-radio-category]").forEach(function (button) {
      const active = button.dataset.radioCategory === state.ambianceCategory;
      const available = isRadioCategoryAvailable(button.dataset.radioCategory);
      button.classList.toggle("active", active);
      button.classList.toggle("loading", active && state.ambianceLoading);
      button.classList.toggle("pro-locked", !available);
      button.setAttribute("aria-pressed", String(active));
      button.setAttribute(
        "aria-label",
        RADIO_CATEGORIES[button.dataset.radioCategory].name + (available ? "" : " — inclus avec PRO")
      );
      button.title = available ? "" : "Cette ambiance est incluse avec PRO.";
    });
    document.querySelectorAll("[data-music-service]").forEach(function (button) {
      button.classList.toggle("active", button.dataset.musicService === state.ambianceActiveService);
    });
  }

  function isRadioCategoryAvailable(categoryId) {
    return FREE_RADIO_CATEGORIES.has(categoryId) || canUse("premiumAmbiance");
  }

  function updateMiniPlayer() {
    const station = currentAmbianceStation();
    if (station) {
      elements["mp-title"].textContent = station.name;
      elements["mp-subtitle"].textContent = state.ambianceLoading
        ? "Connexion en cours"
        : radioCategoryMeta();
    }
    const playbackActive = state.ambiancePlaying ||
      (state.ambianceLoading && state.ambianceWantsPlayback);
    elements["mp-play-icon-use"].setAttribute("href", playbackActive ? "#icon-pause" : "#icon-play");
    elements["mp-playpause"].setAttribute(
      "aria-label",
      playbackActive ? "Mettre la radio en pause" : "Reprendre la radio"
    );
    elements["mp-playpause"].disabled = !state.ambianceCategory;
  }

  function setupAmbianceMediaSession() {
    if (!("mediaSession" in navigator)) return;
    const actions = {
      play: function () {
        if (!state.ambianceWantsPlayback) toggleAmbiance();
      },
      pause: function () {
        if (state.ambianceWantsPlayback) toggleAmbiance();
      },
      stop: stopAmbiance
    };

    Object.keys(actions).forEach(function (action) {
      try {
        navigator.mediaSession.setActionHandler(action, actions[action]);
      } catch (error) {
        // Certains navigateurs n'exposent qu'une partie des actions Media Session.
      }
    });
  }

  function updateAmbianceMediaSession() {
    if (!("mediaSession" in navigator)) return;
    if (!state.ambianceCategory) {
      navigator.mediaSession.metadata = null;
      navigator.mediaSession.playbackState = "none";
      return;
    }

    const station = currentAmbianceStation();
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: station ? station.name : radioCategoryName(),
        artist: radioCategoryMeta(),
        album: "Un Petit Pas",
        artwork: [
          { src: "./icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "./icons/icon-512.png", sizes: "512x512", type: "image/png" }
        ]
      });
      navigator.mediaSession.playbackState = state.ambiancePlaying ? "playing" : "paused";
    } catch (error) {
      // La lecture continue même si les métadonnées système ne sont pas disponibles.
    }
  }

  function registerRadioClick(stationuuid) {
    fetch("/api/radio-stations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stationuuid: stationuuid }),
      keepalive: true
    }).catch(function () {});
  }

  function readRadioCache() {
    try {
      return JSON.parse(localStorage.getItem(RADIO_CACHE_KEY) || "{}");
    } catch (error) {
      return {};
    }
  }

  function writeRadioCache(cache) {
    try {
      localStorage.setItem(RADIO_CACHE_KEY, JSON.stringify(cache));
    } catch (error) {
      // La radio reste disponible même si le stockage local est plein ou désactivé.
    }
  }

  function openMusicService(serviceId) {
    const service = MUSIC_SERVICES[serviceId];
    if (!service) return;

    resetAmbiancePlayback();
    state.ambianceCategory = null;
    state.ambianceCandidates = [];
    state.ambianceCandidateIndex = -1;
    state.ambianceActiveService = serviceId;
    setAmbianceStatus(service.name, "Ouverture du service musical…", "service");
    renderAmbianceSelection();

    const isAndroid = /Android/i.test(navigator.userAgent);
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    if (!isMobile) {
      window.open(service.webUrl, "_blank", "noopener,noreferrer");
      return;
    }

    if (isAndroid && service.androidUrl) {
      openNativeWithFallback(service.androidUrl, service.webUrl);
      return;
    }

    // Ces liens universels ouvrent l'application installée, sinon leur version web.
    window.location.assign(service.webUrl);
  }

  function openNativeWithFallback(nativeUrl, webUrl) {
    let fallbackTimer = window.setTimeout(function () {
      window.location.assign(webUrl);
    }, 1100);

    function cancelFallback() {
      if (document.hidden && fallbackTimer) {
        window.clearTimeout(fallbackTimer);
        fallbackTimer = null;
      }
    }

    document.addEventListener("visibilitychange", cancelFallback, { once: true });
    window.addEventListener("pagehide", cancelFallback, { once: true });
    window.location.assign(nativeUrl);
  }

})();
