"use strict";

const RULES = [
  { name: "R1", conditions: { power_on: false }, conclusion: ["power_problem", true] },
  { name: "R2", conditions: { power_on: true, fans_spin: false }, conclusion: ["board_or_cooling_problem", true] },
  { name: "R3", conditions: { power_on: true, fans_spin: true }, conclusion: ["system_started", true] },
  { name: "R4", conditions: { system_started: true, display_signal: false }, conclusion: ["video_problem", true] },
  { name: "R5", conditions: { system_started: true, display_signal: true }, conclusion: ["post_passed", true] },
  { name: "R6", conditions: { post_passed: true, os_booted: false }, conclusion: ["boot_problem", true] },
  { name: "R7", conditions: { boot_problem: true, disk_detected: false }, conclusion: ["storage_problem", true] },
  { name: "R8", conditions: { post_passed: true, os_booted: true }, conclusion: ["os_working", true] },
  { name: "R9", conditions: { os_working: true, network_available: false }, conclusion: ["network_problem", true] },
];

const DIAGNOSES = {
  power_problem: "Проблема живлення",
  board_or_cooling_problem: "Проблема системної плати або охолодження",
  video_problem: "Проблема відеосистеми",
  boot_problem: "Проблема завантаження операційної системи",
  storage_problem: "Проблема накопичувача",
  network_problem: "Проблема мережевого підключення",
};

const ICONS = {
  power: '<svg viewBox="0 0 24 24"><path d="M12 2v10"/><path d="M7.1 4.8a8 8 0 1 0 9.8 0"/></svg>',
  fan: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="2"/><path d="M12 10c-1.4-3.7.1-6 2.2-6 2.3 0 3.2 3.2 1.5 5.7M14 12c3.7-1.4 6 .1 6 2.2 0 2.3-3.2 3.2-5.7 1.5M12 14c1.4 3.7-.1 6-2.2 6-2.3 0-3.2-3.2-1.5-5.7M10 12c-3.7 1.4-6-.1-6-2.2 0-2.3 3.2-3.2 5.7-1.5"/></svg>',
  display: '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8M12 17v4"/></svg>',
  system: '<svg viewBox="0 0 24 24"><path d="M5 3h14v18H5z"/><path d="M8 7h8M8 11h8"/><circle cx="12" cy="16" r="1"/></svg>',
  disk: '<svg viewBox="0 0 24 24"><ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/></svg>',
  network: '<svg viewBox="0 0 24 24"><path d="M4.9 9.9a10 10 0 0 1 14.2 0M7.8 12.8a6 6 0 0 1 8.4 0M10.6 15.6a2 2 0 0 1 2.8 0"/><circle cx="12" cy="19" r="1"/></svg>',
};

const QUESTIONS = [
  { key: "power_on", category: "Живлення", title: "Чи вмикається живлення комп'ютера?", hint: "Перевірте індикатори на корпусі та реакцію комп'ютера на кнопку ввімкнення.", icon: "power" },
  { key: "fans_spin", category: "Охолодження", title: "Чи працюють вентилятори?", hint: "Зверніть увагу на вентилятори блока живлення, процесора та корпусу.", icon: "fan" },
  { key: "display_signal", category: "Відеосистема", title: "Чи є сигнал на дисплеї?", hint: "Монітор має показувати зображення або принаймні екран початкової перевірки POST.", icon: "display" },
  { key: "os_booted", category: "Операційна система", title: "Чи завантажилась операційна система?", hint: "Відповідайте «так», якщо з'явився робочий стіл або екран входу до системи.", icon: "system" },
  { key: "disk_detected", category: "Накопичувач", title: "Чи визначено накопичувач?", hint: "Перевірте, чи бачить BIOS або меню завантаження ваш SSD чи жорсткий диск.", icon: "disk" },
  { key: "network_available", category: "Мережа", title: "Чи доступне мережеве підключення?", hint: "Перевірте стан Wi-Fi або кабельного з'єднання та доступ до мережі.", icon: "network" },
];

function infer(initialFacts, rules = RULES) {
  const facts = { ...initialFacts };
  const queue = Object.keys(initialFacts);
  const firedRules = new Set();
  const explanation = [];

  while (queue.length > 0) {
    const changedVariable = queue.shift();

    for (const rule of rules) {
      if (firedRules.has(rule.name) || !(changedVariable in rule.conditions)) continue;

      const conditions = Object.entries(rule.conditions);
      const allKnown = conditions.every(([name]) => name in facts);
      const allTrue = conditions.every(([name, expected]) => facts[name] === expected);
      if (!allKnown || !allTrue) continue;

      const [resultName, resultValue] = rule.conclusion;
      firedRules.add(rule.name);

      if (!(resultName in facts)) {
        facts[resultName] = resultValue;
        queue.push(resultName);
      }
      explanation.push(rule);
    }
  }

  return { facts, explanation };
}

function getDiagnoses(facts) {
  return Object.entries(DIAGNOSES)
    .filter(([key]) => facts[key] === true)
    .map(([key, label]) => ({ key, label }));
}

function formatValue(value) {
  return value ? "так" : "ні";
}

function formatRule(rule) {
  const conditions = Object.entries(rule.conditions)
    .map(([name, value]) => `${name}=${formatValue(value)}`)
    .join(", ");
  const [name, value] = rule.conclusion;
  return `${rule.name}: ${conditions} → ${name}=${formatValue(value)}`;
}

function initApp() {
  const questionView = document.querySelector("#question-view");
  if (!questionView) return;

  const elements = {
    questionView,
    resultView: document.querySelector("#result-view"),
    stepLabel: document.querySelector("#step-label"),
    progressPercent: document.querySelector("#progress-percent"),
    progressFill: document.querySelector("#progress-fill"),
    questionIcon: document.querySelector("#question-icon"),
    questionCategory: document.querySelector("#question-category"),
    questionTitle: document.querySelector("#question-title"),
    questionHint: document.querySelector("#question-hint"),
    answerYes: document.querySelector("#answer-yes"),
    answerNo: document.querySelector("#answer-no"),
    backButton: document.querySelector("#back-button"),
    restartButton: document.querySelector("#restart-button"),
    resultStatus: document.querySelector("#result-status"),
    resultTitle: document.querySelector("#result-title"),
    resultDescription: document.querySelector("#result-description"),
    diagnosisList: document.querySelector("#diagnosis-list"),
    explanationList: document.querySelector("#explanation-list"),
    ruleCount: document.querySelector("#rule-count"),
  };

  let currentQuestion = 0;
  let answers = {};

  function renderQuestion() {
    const question = QUESTIONS[currentQuestion];
    const step = currentQuestion + 1;
    const percent = Math.round((step / QUESTIONS.length) * 100);

    elements.stepLabel.textContent = `Запитання ${step} із ${QUESTIONS.length}`;
    elements.progressPercent.textContent = `${percent}%`;
    elements.progressFill.style.width = `${percent}%`;
    elements.questionIcon.innerHTML = ICONS[question.icon];
    elements.questionCategory.textContent = question.category;
    elements.questionTitle.textContent = question.title;
    elements.questionHint.textContent = question.hint;
    elements.backButton.disabled = currentQuestion === 0;
  }

  function showResult() {
    const { facts, explanation } = infer(answers);
    const diagnoses = getDiagnoses(facts);
    const hasProblems = diagnoses.length > 0;

    elements.questionView.hidden = true;
    elements.resultView.hidden = false;
    elements.resultStatus.className = `result-status ${hasProblems ? "warning" : "clear"}`;
    elements.resultStatus.textContent = hasProblems ? "!" : "✓";
    elements.resultTitle.textContent = hasProblems
      ? "Виявлено можливу несправність"
      : "Критичних несправностей не виявлено";
    elements.resultDescription.textContent = hasProblems
      ? "Перевірте наведені компоненти. Остаточний ремонт має виконувати кваліфікований спеціаліст."
      : "За заданими правилами система не знайшла ознак критичної несправності.";

    elements.diagnosisList.replaceChildren();
    const visibleDiagnoses = hasProblems
      ? diagnoses
      : [{ label: "Система працює у штатному режимі", clear: true }];
    for (const diagnosis of visibleDiagnoses) {
      const item = document.createElement("div");
      item.className = `diagnosis-item${diagnosis.clear ? " clear-item" : ""}`;
      item.innerHTML = `<span>${diagnosis.clear ? "✓" : "!"}</span><div></div>`;
      item.lastElementChild.textContent = diagnosis.label;
      elements.diagnosisList.append(item);
    }

    elements.explanationList.replaceChildren();
    for (const rule of explanation) {
      const item = document.createElement("li");
      item.textContent = formatRule(rule);
      elements.explanationList.append(item);
    }
    elements.ruleCount.textContent = `${explanation.length} ${explanation.length === 1 ? "правило" : "правила"}`;
    elements.resultView.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function answer(value) {
    answers[QUESTIONS[currentQuestion].key] = value;
    if (currentQuestion < QUESTIONS.length - 1) {
      currentQuestion += 1;
      renderQuestion();
    } else {
      showResult();
    }
  }

  elements.answerYes.addEventListener("click", () => answer(true));
  elements.answerNo.addEventListener("click", () => answer(false));
  elements.backButton.addEventListener("click", () => {
    if (currentQuestion === 0) return;
    delete answers[QUESTIONS[currentQuestion].key];
    currentQuestion -= 1;
    renderQuestion();
  });
  elements.restartButton.addEventListener("click", () => {
    currentQuestion = 0;
    answers = {};
    elements.resultView.hidden = true;
    elements.questionView.hidden = false;
    renderQuestion();
    elements.questionView.scrollIntoView({ behavior: "smooth", block: "start" });
  });
  document.addEventListener("keydown", (event) => {
    if (elements.questionView.hidden) return;
    if (event.key === "1" || event.key.toLowerCase() === "y") answer(true);
    if (event.key === "2" || event.key.toLowerCase() === "n") answer(false);
  });

  renderQuestion();
}

if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", initApp);
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { RULES, DIAGNOSES, infer, getDiagnoses, formatRule };
}
