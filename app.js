(function () {
  "use strict";

  const DATA = window.APP_DATA;
  const DB = window.AppDB;
  const ROUTE_TITLES = {
    home: "Bonjour",
    zones: "Les zones",
    routines: "Mes routines",
    history: "Mes progrès",
    settings: "Réglages"
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
    lastZoneNotification: ""
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
    selectedHistoryDate: "",
    calendarCursor: null,
    deferredInstallPrompt: null,
    serviceWorkerRegistration: null,
    notificationTimer: null,
    toastTimer: null
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
      setupInstallPrompt();
      setupServiceWorker();
      startNotificationWatcher();
      showApp();
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
      "reloadAppButton"
    ].forEach(function (id) {
      elements[id] = document.getElementById(id);
    });
  }

  async function loadState() {
    const todayKey = formatDateKey(state.today);
    state.selectedHistoryDate = todayKey;
    state.calendarCursor = new Date(state.today.getFullYear(), state.today.getMonth(), 1);
    state.settings = await DB.getSettings(DEFAULT_SETTINGS);
    state.routineTasks = await DB.seedRoutines(DATA.defaultRoutines);

    const results = await Promise.all([
      DB.getAll("activities"),
      DB.getAll("routineChecks"),
      DB.getAll("zoneTaskStates")
    ]);

    state.activities = new Map(results[0].map(function (item) { return [item.id, item]; }));
    state.routineChecks = new Map(results[1].map(function (item) { return [item.id, item]; }));
    state.zoneStates = new Map(results[2].map(function (item) { return [item.id, item]; }));

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

    document.querySelectorAll("[data-page]").forEach(function (page) {
      page.classList.toggle("active", page.dataset.page === route);
    });
    document.querySelectorAll(".nav-item[data-route]").forEach(function (button) {
      const active = button.dataset.route === route;
      button.classList.toggle("active", active);
      if (active) button.setAttribute("aria-current", "page");
      else button.removeAttribute("aria-current");
    });

    const name = state.settings.firstName.trim();
    elements.pageTitle.textContent = route === "home" && name ? "Bonjour, " + name : ROUTE_TITLES[route];
    document.title = (route === "home" ? "Un Petit Pas" : ROUTE_TITLES[route] + " · Un Petit Pas");

    if (updateHash !== false && window.location.hash !== "#" + route) {
      history.replaceState(null, "", "#" + route);
    }

    if (route === "history") renderHistory();
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
    navigate(state.route, false);
  }

  function renderHeader() {
    elements.todayLabel.textContent = new Intl.DateTimeFormat("fr-CA", {
      weekday: "long",
      day: "numeric",
      month: "long"
    }).format(state.today);
  }

  function getDailyContent() {
    const dayNumber = daysSinceReference(state.today);
    const weekNumber = getISOWeek(state.today);
    return {
      quote: DATA.quotes[dayNumber % DATA.quotes.length],
      mission: DATA.missions[dayNumber % DATA.missions.length],
      missionIndex: dayNumber % DATA.missions.length,
      tip: DATA.tips[dayNumber % DATA.tips.length],
      tipIndex: dayNumber % DATA.tips.length,
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
    const otherStepDone = Array.from(state.activities.values()).some(function (activity) {
      return activity.date === todayKey && activity.type !== "mission" && activity.type !== "tip";
    });
    const progress = Math.round(([missionDone, tipDone, otherStepDone].filter(Boolean).length / 3) * 100);

    elements.dailyQuote.textContent = daily.quote;
    elements.missionTitle.textContent = daily.mission.title;
    elements.missionTime.textContent = daily.mission.minutes + " min";
    elements.missionDescription.textContent = daily.mission.description;
    elements.tipNumber.textContent = (daily.tipIndex + 1) + "/365";
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

  function renderZones() {
    const currentWeeklyZone = getDailyContent().weeklyZone;
    elements.zonesList.innerHTML = DATA.zones.map(function (zone) {
      const doneCount = zone.tasks.filter(function (_, index) {
        return isZoneTaskDone(zone.id, index);
      }).length;
      const percent = Math.round((doneCount / zone.tasks.length) * 100);
      const tasks = zone.tasks.map(function (task, index) {
        const done = isZoneTaskDone(zone.id, index);
        return [
          '<button class="check-row', done ? " done" : "", '" data-zone-id="', zone.id,
          '" data-zone-task="', index, '" aria-pressed="', String(done), '">',
          '<span class="custom-check"><svg><use href="#icon-check"></use></svg></span>',
          '<span class="task-label">', escapeHtml(task), "</span>",
          "</button>"
        ].join("");
      }).join("");

      return [
        '<article class="card zone-card', currentWeeklyZone.id === zone.id ? " current-zone" : "", '">',
        '<div class="zone-card-header">',
        '<span class="zone-icon">', zone.short, "</span>",
        "<div><h3>", escapeHtml(zone.name), "</h3><p>", doneCount, " sur ", zone.tasks.length, " terminées</p></div>",
        '<span class="zone-percent">', percent, "%</span>",
        "</div>",
        '<div class="zone-progress-track"><span style="--width:', percent, '%"></span></div>',
        '<p class="zone-description">', escapeHtml(zone.description), "</p>",
        '<div class="mini-task-list">', tasks, "</div>",
        "</article>"
      ].join("");
    }).join("");
  }

  function isZoneTaskDone(zoneId, taskIndex) {
    const row = state.zoneStates.get(zoneId + ":" + taskIndex);
    return Boolean(row && row.completed);
  }

  async function handleZoneClick(event) {
    const taskButton = event.target.closest("[data-zone-task]");
    if (!taskButton) return;

    const zoneId = taskButton.dataset.zoneId;
    const taskIndex = Number(taskButton.dataset.zoneTask);
    const zone = DATA.zones.find(function (item) { return item.id === zoneId; });
    if (!zone || !zone.tasks[taskIndex]) return;

    const id = zoneId + ":" + taskIndex;
    const current = state.zoneStates.get(id);
    const completed = !(current && current.completed);

    if (completed) {
      const completedDate = formatDateKey(new Date());
      const row = { id: id, completed: true, completedDate: completedDate };
      await DB.put("zoneTaskStates", row);
      state.zoneStates.set(id, row);
      await addActivity("zone", completedDate, id, zone.name + " · " + zone.tasks[taskIndex]);
      showToast("Un petit pas de plus.");
    } else {
      const completedDate = current.completedDate || formatDateKey(new Date());
      await DB.remove("zoneTaskStates", id);
      state.zoneStates.delete(id);
      await removeActivity("zone", completedDate, id);
    }

    renderZones();
    renderHome();
    renderHistory();
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

    elements.routineSummary.innerHTML = [
      '<div class="routine-summary-card">',
      "<strong>", completed, " sur ", tasks.length, " aujourd'hui</strong>",
      "<p>Routine ", names[state.activeRoutine], " · avance à ton rythme</p>",
      '<div class="routine-progress-track"><span style="--width:', percent, '%"></span></div>',
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
      const classes = [
        "calendar-day",
        dateKey === todayKey ? "today" : "",
        dateKey === state.selectedHistoryDate ? "selected" : "",
        activityDates.has(dateKey) ? "has-steps" : ""
      ].filter(Boolean).join(" ");
      cells.push('<button class="' + classes + '" data-date="' + dateKey + '" aria-label="' + dateKey + '">' + day + "</button>");
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

    if (!dayActivities.length) {
      elements.historyList.innerHTML = '<div class="empty-state"><h3>Aucun pas enregistré</h3><p>Cette journée peut rester douce et vide.</p></div>';
      return;
    }

    const labels = {
      mission: "Mission du jour",
      tip: "Conseil lu",
      zone: "Mini-tâche",
      routine: "Routine"
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
    renderNotificationStatus();
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
    const daily = getDailyContent();
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
      state.serviceWorkerRegistration.waiting.postMessage({ type: "SKIP_WAITING" });
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
