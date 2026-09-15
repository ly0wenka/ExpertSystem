import unittest

from expert_system import get_diagnoses, infer


class ExpertSystemTests(unittest.TestCase):
    def assert_inference(self, initial, expected_diagnoses, expected_rules):
        facts, explanation = infer(initial)
        self.assertEqual(get_diagnoses(facts), expected_diagnoses)
        self.assertEqual([step.rule.name for step in explanation], expected_rules)

    def test_power_problem(self):
        self.assert_inference(
            {"power_on": False},
            ["Проблема живлення"],
            ["R1"],
        )

    def test_boot_and_storage_problem(self):
        self.assert_inference(
            {
                "power_on": True,
                "fans_spin": True,
                "display_signal": True,
                "os_booted": False,
                "disk_detected": False,
            },
            ["Проблема завантаження ОС", "Проблема накопичувача"],
            ["R3", "R5", "R6", "R7"],
        )

    def test_network_problem(self):
        self.assert_inference(
            {
                "power_on": True,
                "fans_spin": True,
                "display_signal": True,
                "os_booted": True,
                "network_available": False,
            },
            ["Проблема мережевого підключення"],
            ["R3", "R5", "R8", "R9"],
        )

    def test_video_problem(self):
        self.assert_inference(
            {
                "power_on": True,
                "fans_spin": True,
                "display_signal": False,
            },
            ["Проблема відеосистеми"],
            ["R3", "R4"],
        )

    def test_no_detected_problem(self):
        self.assert_inference(
            {
                "power_on": True,
                "fans_spin": True,
                "display_signal": True,
                "os_booted": True,
                "network_available": True,
            },
            [],
            ["R3", "R5", "R8"],
        )


if __name__ == "__main__":
    unittest.main()
