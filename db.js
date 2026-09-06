(function () {
  "use strict";

  const DATABASE_NAME = "un-petit-pas";
  const DATABASE_VERSION = 3;
  const DATA_STORES = [
    "activities",
    "routineTasks",
    "zoneTaskStates",
    "routineChecks",
    "favorites",
    "energyEvents",
    "dailyRewardStates",
    "stickerAwards",
    "ownedStickers"
  ];
  const ROUTINE_DEFAULTS_VERSION = 3;
  let databasePromise;

  function requestToPromise(request) {
    return new Promise(function (resolve, reject) {
      request.onsuccess = function () { resolve(request.result); };
      request.onerror = function () { reject(request.error); };
    });
  }

  function open() {
    if (databasePromise) return databasePromise;

    databasePromise = new Promise(function (resolve, reject) {
      const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

      request.onupgradeneeded = function (event) {
        const db = event.target.result;

        if (!db.objectStoreNames.contains("settings")) {
          db.createObjectStore("settings", { keyPath: "key" });
        }

        if (!db.objectStoreNames.contains("activities")) {
          const activities = db.createObjectStore("activities", { keyPath: "id" });
          activities.createIndex("date", "date", { unique: false });
          activities.createIndex("type", "type", { unique: false });
        }

        if (!db.objectStoreNames.contains("routineTasks")) {
          const routines = db.createObjectStore("routineTasks", { keyPath: "id" });
          routines.createIndex("routine", "routine", { unique: false });
          routines.createIndex("order", "order", { unique: false });
        }

        if (!db.objectStoreNames.contains("zoneTaskStates")) {
          db.createObjectStore("zoneTaskStates", { keyPath: "id" });
        }

        if (!db.objectStoreNames.contains("routineChecks")) {
          const checks = db.createObjectStore("routineChecks", { keyPath: "id" });
          checks.createIndex("date", "date", { unique: false });
        }

        if (!db.objectStoreNames.contains("favorites")) {
          db.createObjectStore("favorites", { keyPath: "id" });
        }

        if (!db.objectStoreNames.contains("energyEvents")) {
          const energyEvents = db.createObjectStore("energyEvents", { keyPath: "id" });
          energyEvents.createIndex("date", "date", { unique: false });
          energyEvents.createIndex("sourceKey", "sourceKey", { unique: true });
          energyEvents.createIndex("sourceType", "sourceType", { unique: false });
        }

        if (!db.objectStoreNames.contains("dailyRewardStates")) {
          const dailyRewardStates = db.createObjectStore("dailyRewardStates", { keyPath: "id" });
          dailyRewardStates.createIndex("date", "date", { unique: false });
          dailyRewardStates.createIndex("dateMilestone", ["date", "milestoneIndex"], { unique: true });
        }

        if (!db.objectStoreNames.contains("stickerAwards")) {
          const stickerAwards = db.createObjectStore("stickerAwards", { keyPath: "id" });
          stickerAwards.createIndex("date", "date", { unique: false });
          stickerAwards.createIndex("albumId", "albumId", { unique: false });
          stickerAwards.createIndex("stickerId", "stickerId", { unique: false });
        }

        if (!db.objectStoreNames.contains("ownedStickers")) {
          const ownedStickers = db.createObjectStore("ownedStickers", { keyPath: "id" });
          ownedStickers.createIndex("albumId", "albumId", { unique: false });
          ownedStickers.createIndex("stickerId", "stickerId", { unique: true });
        }
      };

      request.onsuccess = function () {
        const db = request.result;
        db.onversionchange = function () { db.close(); };
        resolve(db);
      };
      request.onerror = function () { reject(request.error); };
      request.onblocked = function () { reject(new Error("La base de données est bloquée par un autre onglet.")); };
    });

    return databasePromise;
  }

  async function store(name, mode) {
    const db = await open();
    return db.transaction(name, mode || "readonly").objectStore(name);
  }

  async function getAll(name) {
    return requestToPromise((await store(name)).getAll());
  }

  async function get(name, key) {
    return requestToPromise((await store(name)).get(key));
  }

  async function put(name, value) {
    const result = await requestToPromise((await store(name, "readwrite")).put(value));
    emitLocalChange(name);
    return result;
  }

  async function add(name, value) {
    const result = await requestToPromise((await store(name, "readwrite")).add(value));
    emitLocalChange(name);
    return result;
  }

  async function remove(name, key) {
    const result = await requestToPromise((await store(name, "readwrite")).delete(key));
    emitLocalChange(name);
    return result;
  }

  async function clear(name) {
    const result = await requestToPromise((await store(name, "readwrite")).clear());
    emitLocalChange(name);
    return result;
  }

  function emitLocalChange(storeName) {
    window.dispatchEvent(new CustomEvent("unpetitpas:local-data-change", {
      detail: { store: storeName }
    }));
  }

  async function seedRoutines(defaultTasks) {
    const current = await getAll("routineTasks");
    const settings = await getSettings({});
    const installedVersion = Number(settings.routineDefaultsVersion) || 0;

    if (!current.length) {
      await Promise.all(defaultTasks.map(function (task) { return put("routineTasks", task); }));
      await saveSettings({
        routineDefaultsVersion: ROUTINE_DEFAULTS_VERSION,
        cloudDirty: true
      });
      return defaultTasks.slice();
    }

    if (installedVersion >= ROUTINE_DEFAULTS_VERSION) return current;

    const customTasks = current.filter(function (task) {
      return !String(task.id).startsWith("default-");
    });
    const formerDefaults = current.filter(function (task) {
      return String(task.id).startsWith("default-");
    });

    await Promise.all(formerDefaults.map(function (task) {
      return remove("routineTasks", task.id);
    }));
    await Promise.all(defaultTasks.map(function (task) {
      return put("routineTasks", task);
    }));
    await saveSettings({
      routineDefaultsVersion: ROUTINE_DEFAULTS_VERSION,
      cloudDirty: true
    });

    return customTasks.concat(defaultTasks);
  }

  async function getSettings(defaults) {
    const rows = await getAll("settings");
    const values = Object.assign({}, defaults);
    rows.forEach(function (row) { values[row.key] = row.value; });
    return values;
  }

  async function saveSettings(values) {
    await Promise.all(Object.keys(values).map(function (key) {
      return put("settings", { key: key, value: values[key] });
    }));
  }

  async function exportData() {
    const collections = await Promise.all(DATA_STORES.map(function (name) {
      return getAll(name);
    }));
    const settings = await getSettings({});
    const payload = {
      version: 1,
      settings: settings
    };
    DATA_STORES.forEach(function (name, index) {
      payload[name] = collections[index];
    });
    return payload;
  }

  async function importData(payload) {
    if (!payload || typeof payload !== "object") throw new Error("Sauvegarde infonuagique invalide.");
    await Promise.all(DATA_STORES.map(function (name) { return clear(name); }));
    await clear("settings");

    const settings = payload.settings && typeof payload.settings === "object"
      ? payload.settings
      : {};
    await saveSettings(settings);

    for (const name of DATA_STORES) {
      const rows = Array.isArray(payload[name]) ? payload[name] : [];
      await Promise.all(rows.map(function (row) { return put(name, row); }));
    }
  }

  async function clearUserData() {
    await Promise.all(["settings"].concat(DATA_STORES).map(function (name) {
      return clear(name);
    }));
  }

  window.AppDB = {
    open: open,
    getAll: getAll,
    get: get,
    put: put,
    add: add,
    remove: remove,
    clear: clear,
    seedRoutines: seedRoutines,
    getSettings: getSettings,
    saveSettings: saveSettings,
    exportData: exportData,
    importData: importData,
    clearUserData: clearUserData
  };
})();
