class EngineRegistry {
  constructor() {
    this.engines = new Map();
  }

  register(name, engine) {
    const key = String(name || "").trim().toLowerCase();
    if (!key) throw new Error("ASE: le nom du moteur est obligatoire.");
    if (!engine || typeof engine !== "object") {
      throw new Error(`ASE: moteur invalide pour ${key}.`);
    }
    this.engines.set(key, engine);
    return engine;
  }

  get(name) {
    return this.engines.get(String(name || "").trim().toLowerCase()) || null;
  }

  describe() {
    return [...this.engines.entries()].map(([name, engine]) => ({
      name,
      version: String(engine.version || "1.0.0"),
      ready: engine.ready !== false,
    }));
  }
}

module.exports = new EngineRegistry();
