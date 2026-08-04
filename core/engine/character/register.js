const { registerEngine } = require("../../ase");
const characterEngine = require("./index");

registerEngine("character", characterEngine);

module.exports = characterEngine;
