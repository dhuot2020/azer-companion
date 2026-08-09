const { registerEngine } = require("../../ase");
const eventEngine = require("./index");

registerEngine("event", eventEngine);

module.exports = eventEngine;
