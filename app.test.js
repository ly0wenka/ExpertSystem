"use strict";

const assert = require("node:assert/strict");
const { infer, getDiagnoses } = require("./app.js");

const cases = [
  [{ power_on: false }, ["Проблема живлення"], ["R1"]],
  [
    { power_on: true, fans_spin: true, display_signal: true, os_booted: false, disk_detected: false },
    ["Проблема завантаження операційної системи", "Проблема накопичувача"],
    ["R3", "R5", "R6", "R7"],
  ],
  [
    { power_on: true, fans_spin: true, display_signal: true, os_booted: true, network_available: false },
    ["Проблема мережевого підключення"],
    ["R3", "R5", "R8", "R9"],
  ],
];

for (const [facts, expectedDiagnoses, expectedRules] of cases) {
  const result = infer(facts);
  assert.deepEqual(getDiagnoses(result.facts).map(({ label }) => label), expectedDiagnoses);
  assert.deepEqual(result.explanation.map(({ name }) => name), expectedRules);
}

console.log(`Перевірено сценаріїв: ${cases.length}. Усі тести пройдено.`);
