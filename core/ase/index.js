const registry = require("./registry");

const ASE_VERSION = "2.1.0";

function registerEngine(name, engine) {
  return registry.register(name, engine);
}

function getEngine(name) {
  return registry.get(name);
}

function getStatus() {
  return {
    name: "Azer Sync Engine",
    version: ASE_VERSION,
    engines: registry.describe(),
  };
}

module.exports = {
  ASE_VERSION,
  registerEngine,
  getEngine,
  getStatus,
};
