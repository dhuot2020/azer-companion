const { registerEngine } = require("../../ase");
const heroEngine = require("./index");
registerEngine("hero", heroEngine);
module.exports = heroEngine;
