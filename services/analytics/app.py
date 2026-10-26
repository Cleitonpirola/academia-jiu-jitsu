from calendar import monthrange
from datetime import date, timedelta
from typing import Any, Literal
import pandas as pd
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field, StrictBool

app = FastAPI(title="Tatame Analytics", version="0.1.0")

class StudentInput(BaseModel):
    id: str = Field(min_length=1)
    nome: str = Field(min_length=1)
    faixa: str = Field(min_length=1, max_length=80)
    dataMatricula: date
    situacao: Literal['ativo', 'inativo']


class PaymentInput(BaseModel):
    alunoId: str = Field(min_length=1)
    valorCentavos: int = Field(gt=0, strict=True)
    dataVencimento: date
    dataPagamento: date | None = None


class AttendanceInput(BaseModel):
    alunoId: str = Field(min_length=1)
    dataTreino: date
    presente: StrictBool


class AnalyticsRequest(BaseModel):
    mes: str = Field(pattern=r"^\d{4}-(0[1-9]|1[0-2])$")
    hoje: date
    alunos: list[StudentInput]
    mensalidades: list[PaymentInput]
    presencas: list[AttendanceInput]

def calculate(data: AnalyticsRequest) -> dict[str, Any]:
    # A validação acontece antes do cálculo; JSON mantém as datas ISO usadas pelas regras existentes.
    alunos = [item.model_dump(mode='json') for item in data.alunos]
    mensalidades = [item.model_dump(mode='json') for item in data.mensalidades]
    presencas = [item.model_dump(mode='json') for item in data.presencas]
    year, month = map(int, data.mes.split("-"))
    start = date(year, month, 1)
    if start > data.hoje:
        raise ValueError("Selecione um mês que já começou.")
    reference = min(date(year, month, monthrange(year, month)[1]), data.hoje)
    previous_end = start - timedelta(days=1)
    previous_start = previous_end.replace(day=1)
    comparable_days = min(reference.day, previous_end.day)
    current_cutoff = start + timedelta(days=comparable_days - 1)
    previous_cutoff = previous_start + timedelta(days=comparable_days - 1)
    attendance = pd.DataFrame(presencas, columns=["alunoId", "dataTreino", "presente"])
    attendance["dataTreino"] = pd.to_datetime(attendance["dataTreino"], errors="coerce")
    attendance = attendance[attendance["presente"].eq(True) & attendance["dataTreino"].notna()]
    current = attendance[attendance["dataTreino"].between(pd.Timestamp(start), pd.Timestamp(current_cutoff))]
    previous = attendance[attendance["dataTreino"].between(pd.Timestamp(previous_start), pd.Timestamp(previous_cutoff))]
    current_counts = current.groupby("alunoId").size().to_dict()
    previous_counts = previous.groupby("alunoId").size().to_dict()
    before_reference = attendance[attendance["dataTreino"] <= pd.Timestamp(reference)]
    latest = before_reference.groupby("alunoId")["dataTreino"].max().to_dict()
    overdue = [m for m in mensalidades if m["dataVencimento"] < reference.isoformat() and (not m["dataPagamento"] or m["dataPagamento"] > reference.isoformat())]
    overdue_ids = {m["alunoId"] for m in overdue}
    active = [a for a in alunos if a["situacao"] == "ativo" and a["dataMatricula"] <= reference.isoformat()]
    risks = []
    for aluno in active:
        student_id = aluno["id"]
        current_count = int(current_counts.get(student_id, 0))
        previous_count = int(previous_counts.get(student_id, 0))
        last_training = latest[student_id].date() if student_id in latest else date.fromisoformat(aluno["dataMatricula"])
        days_away = max(0, (reference - last_training).days)
        points = 0
        signals = []
        if student_id in overdue_ids:
            points += 30
            signals.append("Mensalidade em atraso")
        if days_away >= 14:
            points += 30
            signals.append("14 dias ou mais sem treinar")
        if previous_count > 0 and current_count < previous_count * 0.5:
            points += 40
            signals.append("Frequência caiu mais de 50%")
        risks.append({"alunoId": student_id, "nome": aluno["nome"], "faixa": aluno["faixa"], "frequenciaAtual": current_count, "frequenciaAnterior": previous_count, "diasSemTreinar": days_away, "pontos": points, "nivel": "alto" if points > 60 else "medio" if points > 30 else "baixo", "sinais": signals})
    risks.sort(key=lambda r: (-r["pontos"], r["nome"]))
    revenue = sum(m["valorCentavos"] for m in mensalidades if m["dataPagamento"] and m["dataPagamento"].startswith(data.mes) and m["dataPagamento"] <= reference.isoformat())
    months = []
    for offset in range(-5, 1):
        index = year * 12 + month - 1 + offset
        mes = f"{index // 12:04d}-{index % 12 + 1:02d}"
        value = sum(m["valorCentavos"] for m in mensalidades if m["dataPagamento"] and m["dataPagamento"].startswith(mes) and m["dataPagamento"] <= reference.isoformat())
        months.append({"mes": mes, "receitaCentavos": value})
    return {"mes": data.mes, "dataReferencia": reference.isoformat(), "alunosAtivos": len(active), "alunosInadimplentes": len(overdue_ids), "receitaCentavos": int(revenue), "inadimplenciaCentavos": int(sum(m["valorCentavos"] for m in overdue)), "frequenciaMedia": round(sum(r["frequenciaAtual"] for r in risks) / len(active), 1) if active else 0, "alunosEmRisco": sum(r["nivel"] != "baixo" for r in risks), "presencasNoMes": int(len(current)), "riscos": risks, "receitaMensal": months}

@app.get("/health")
def health():
    return {"status": "ok", "service": "FastAPI + Pandas"}

@app.post("/analytics")
def analytics(data: AnalyticsRequest):
    try:
        return calculate(data)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
