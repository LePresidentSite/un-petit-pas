(function () {
  "use strict";

  const DATABASE_NAME = "un-petit-pas";
  const DATABASE_VERSION = 2;
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
    return requestToPromise((await store(name, "readwrite")).put(value));
  }

  async function remove(name, key) {
    return requestToPromise((await store(name, "readwrite")).delete(key));
  }

  async function clear(name) {
    return requestToPromise((await store(name, "readwrite")).clear());
  }

  async function seedRoutines(defaultTasks) {
    const current = await getAll("routineTasks");
    if (current.length) return current;
    await Promise.all(defaultTasks.map(function (task) { return put("routineTasks", task); }));
    return defaultTasks.slice();
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

  async function clearUserData() {
    await Promise.all([
      clear("settings"),
      clear("activities"),
      clear("routineTasks"),
      clear("zoneTaskStates"),
      clear("routineChecks"),
      clear("favorites")
    ]);
  }

  window.AppDB = {
    open: open,
    getAll: getAll,
    get: get,
    put: put,
    remove: remove,
    clear: clear,
    seedRoutines: seedRoutines,
    getSettings: getSettings,
    saveSettings: saveSettings,
    clearUserData: clearUserData
  };
})();
