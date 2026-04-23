/**
 * LEVEMENTE - Dashboard Dashboard
 * Lógica para popular dados dinâmicos do Dashboard
 */

const API_FINANCEIRO = 'http://localhost:3000/api/financeiro';

document.addEventListener("DOMContentLoaded", () => {
    carregarFaturamentoMes();
});

async function carregarFaturamentoMes() {
    try {
        const hoje = new Date();
        const ano = hoje.getFullYear();
        const mes = String(hoje.getMonth() + 1).padStart(2, '0');

        const res = await fetch(`${API_FINANCEIRO}?mes=${mes}&ano=${ano}`);
        if (!res.ok) throw new Error('Erro ao buscar dados financeiros do mês');
        const lancamentos = await res.json();

        let faturamento = 0;
        lancamentos.forEach(item => {
            if (item.tipo === 'Receita' && item.status_pagamento === 'Pago') {
                faturamento += Number(item.valor) || 0;
            }
        });

        const elFaturamento = document.getElementById('faturamento-mes');
        if (elFaturamento) {
            elFaturamento.innerText = `R$ ${faturamento.toFixed(2).replace('.', ',')}`;
        }
    } catch (error) {
        console.error("Erro no Dashboard:", error);
    }
}
