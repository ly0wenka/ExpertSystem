"""Експертна система продукційного типу для діагностики ПК.

Система використовує пряме логічне виведення: початкові факти
потрапляють до FIFO-черги, а висновки правил стають новими фактами.
"""

from __future__ import annotations

from collections import deque
from dataclasses import dataclass
import sys
from typing import Iterable, Mapping


FactValue = bool
Conclusion = tuple[str, FactValue]


@dataclass(frozen=True)
class Rule:
    """Одне продукційне правило виду «ЯКЩО умови, ТО висновок»."""

    name: str
    conditions: Mapping[str, FactValue]
    conclusion: Conclusion


@dataclass(frozen=True)
class InferenceStep:
    """Запис про спрацювання правила для пояснення результату."""

    rule: Rule

    def __str__(self) -> str:
        conditions = ", ".join(
            f"{name}={format_value(value)}"
            for name, value in self.rule.conditions.items()
        )
        result_name, result_value = self.rule.conclusion
        return (
            f"{self.rule.name}: {conditions} -> "
            f"{result_name}={format_value(result_value)}"
        )


RULES: tuple[Rule, ...] = (
    Rule("R1", {"power_on": False}, ("power_problem", True)),
    Rule(
        "R2",
        {"power_on": True, "fans_spin": False},
        ("board_or_cooling_problem", True),
    ),
    Rule(
        "R3",
        {"power_on": True, "fans_spin": True},
        ("system_started", True),
    ),
    Rule(
        "R4",
        {"system_started": True, "display_signal": False},
        ("video_problem", True),
    ),
    Rule(
        "R5",
        {"system_started": True, "display_signal": True},
        ("post_passed", True),
    ),
    Rule(
        "R6",
        {"post_passed": True, "os_booted": False},
        ("boot_problem", True),
    ),
    Rule(
        "R7",
        {"boot_problem": True, "disk_detected": False},
        ("storage_problem", True),
    ),
    Rule(
        "R8",
        {"post_passed": True, "os_booted": True},
        ("os_working", True),
    ),
    Rule(
        "R9",
        {"os_working": True, "network_available": False},
        ("network_problem", True),
    ),
)


DIAGNOSES: dict[str, str] = {
    "power_problem": "Проблема живлення",
    "board_or_cooling_problem": "Проблема системної плати або охолодження",
    "video_problem": "Проблема відеосистеми",
    "boot_problem": "Проблема завантаження ОС",
    "storage_problem": "Проблема накопичувача",
    "network_problem": "Проблема мережевого підключення",
}


QUESTIONS: tuple[tuple[str, str], ...] = (
    ("power_on", "Чи вмикається живлення?"),
    ("fans_spin", "Чи працюють вентилятори?"),
    ("display_signal", "Чи є сигнал на дисплеї?"),
    ("os_booted", "Чи завантажилась ОС?"),
    ("disk_detected", "Чи визначено накопичувач?"),
    ("network_available", "Чи доступна мережа?"),
)


def format_value(value: FactValue) -> str:
    return "так" if value else "ні"


def infer(
    initial_facts: Mapping[str, FactValue],
    rules: Iterable[Rule] = RULES,
) -> tuple[dict[str, FactValue], list[InferenceStep]]:
    """Виконати пряме виведення з опрацюванням нових фактів у FIFO-порядку."""

    facts = dict(initial_facts)
    queue = deque(initial_facts)
    fired_rules: set[str] = set()
    explanation: list[InferenceStep] = []
    rule_list = tuple(rules)

    while queue:
        changed_variable = queue.popleft()

        for rule in rule_list:
            if rule.name in fired_rules or changed_variable not in rule.conditions:
                continue
            if not all(name in facts for name in rule.conditions):
                continue
            if not all(facts[name] == expected for name, expected in rule.conditions.items()):
                continue

            result_name, result_value = rule.conclusion
            fired_rules.add(rule.name)

            if result_name in facts and facts[result_name] != result_value:
                raise ValueError(
                    f"Суперечливий висновок для факту {result_name!r}: "
                    f"відомо {facts[result_name]}, правило {rule.name} дає {result_value}."
                )

            if result_name not in facts:
                facts[result_name] = result_value
                queue.append(result_name)

            explanation.append(InferenceStep(rule))

    return facts, explanation


def get_diagnoses(facts: Mapping[str, FactValue]) -> list[str]:
    """Перетворити встановлені діагностичні факти на зрозумілі назви."""

    return [label for key, label in DIAGNOSES.items() if facts.get(key) is True]


def ask_yes_no(question: str) -> bool:
    """Запитати булеве значення українською з перевіркою введення."""

    yes_answers = {"так", "т", "yes", "y", "+", "1"}
    no_answers = {"ні", "н", "no", "n", "-", "0"}

    while True:
        value = input(f"{question} [так/ні]: ").strip().lower()
        if value in yes_answers:
            return True
        if value in no_answers:
            return False
        print("Введіть 'так' або 'ні'.")


def main() -> None:
    # UTF-8 потрібен також тоді, коли виведення перенаправлено у файл або канал.
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")

    print("Експертна система діагностики несправностей ПК")
    print("Дайте відповідь на шість запитань.\n")

    initial_facts = {
        variable: ask_yes_no(question) for variable, question in QUESTIONS
    }
    facts, explanation = infer(initial_facts)
    diagnoses = get_diagnoses(facts)

    print("\nРезультат експертизи:")
    if diagnoses:
        for diagnosis in diagnoses:
            print(f"- {diagnosis}")
    else:
        print("Критичних несправностей за заданими правилами не виявлено.")

    print("\nЛанцюг логічних висновків:")
    if explanation:
        for step in explanation:
            print(step)
    else:
        print("Жодне правило не спрацювало.")


if __name__ == "__main__":
    main()
