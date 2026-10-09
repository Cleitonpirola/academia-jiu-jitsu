import unittest
from datetime import date
from app import AnalyticsRequest, calculate

def student(**changes):
    return {"id": "a", "nome": "Aluno exemplo", "faixa": "Branca", "situacao": "ativo", "dataMatricula": "2026-01-01", **changes}

def billing(**changes):
    return {"alunoId": "a", "valorCentavos": 15000, "dataVencimento": "2026-10-01", "dataPagamento": None, **changes}

def attendance(day):
    return {"alunoId": "a", "dataTreino": day, "presente": True}

def metrics(alunos=None, mensalidades=None, presencas=None):
    return calculate(AnalyticsRequest(mes="2026-10", hoje=date(2026, 10, 9), alunos=[student()] if alunos is None else alunos, mensalidades=mensalidades or [], presencas=presencas or []))

class AnalyticsTests(unittest.TestCase):
    def test_empty_data_is_zero(self):
        result = metrics(alunos=[])
        self.assertEqual(result["frequenciaMedia"], 0)
        self.assertEqual(result["alunosEmRisco"], 0)

    def test_risk_is_100_with_three_signals(self):
        result = metrics(mensalidades=[billing()], presencas=[attendance(f"2026-09-0{i}") for i in range(1, 5)])
        self.assertEqual(result["riscos"][0]["pontos"], 100)
        self.assertEqual(result["riscos"][0]["nivel"], "alto")

    def test_due_today_is_not_overdue(self):
        result = metrics(mensalidades=[billing(dataVencimento="2026-10-09")], presencas=[attendance("2026-10-08")])
        self.assertEqual(result["alunosInadimplentes"], 0)
        self.assertEqual(result["riscos"][0]["pontos"], 0)

    def test_equal_windows_and_exact_50_percent(self):
        rows = [attendance("2026-09-01"), attendance("2026-09-03"), attendance("2026-09-20"), attendance("2026-10-02")]
        result = metrics(presencas=rows)
        risk = result["riscos"][0]
        self.assertEqual(risk["frequenciaAnterior"], 2)
        self.assertEqual(risk["pontos"], 0)

    def test_payment_after_reference_is_overdue_in_history(self):
        result = metrics(mensalidades=[billing(dataPagamento="2026-10-12")])
        self.assertEqual(result["alunosInadimplentes"], 1)
        self.assertEqual(result["receitaCentavos"], 0)

    def test_revenue_uses_payment_date(self):
        result = metrics(mensalidades=[billing(dataVencimento="2026-09-10", dataPagamento="2026-10-08")])
        self.assertEqual(result["receitaCentavos"], 15000)
        self.assertEqual(result["inadimplenciaCentavos"], 0)

    def test_zero_previous_attendance_does_not_divide_by_zero(self):
        result = metrics(alunos=[student(dataMatricula="2026-10-01")])
        self.assertEqual(result["riscos"][0]["pontos"], 0)

    def test_inactive_students_not_in_risk(self):
        result = metrics(alunos=[student(situacao="inativo")])
        self.assertEqual(result["riscos"], [])

if __name__ == "__main__":
    unittest.main()
