"""Utilitários para conversão de dados de grafo."""

from __future__ import annotations

import json
from typing import Any, Dict, Iterable, List, Sequence


def grafo_json_para_lista(grafo: Any) -> List[List[List[int]]]:
    """Converte o JSON do editor em uma lista de adjacência.

    O formato retornado é ``[[[destino, peso], ...], ...]`` onde o índice do
    array externo corresponde ao ID numérico do vértice.
    """

    if isinstance(grafo, str):
        dados = json.loads(grafo)
    else:
        dados = grafo

    if not isinstance(dados, dict):
        raise TypeError("O grafo deve ser um dicionário ou uma string JSON válida.")

    nodes: Sequence[Dict[str, Any]] = dados.get("nodes", [])  # type: ignore[assignment]
    edges: Iterable[Dict[str, Any]] = dados.get("edges", [])  # type: ignore[assignment]

    if not nodes:
        return []

    try:
        max_id = max(int(node["id"]) for node in nodes)
    except (KeyError, ValueError, TypeError) as exc:  # pragma: no cover - defensive
        raise ValueError("Cada nó precisa ter o campo 'id' numérico.") from exc

    adjacencias: List[List[List[int]]] = [[] for _ in range(max_id + 1)]

    for edge in edges:
        try:
            origem = int(edge["source"])
            destino = int(edge["target"])
        except (KeyError, ValueError, TypeError) as exc:
            raise ValueError("Cada aresta precisa ter os campos 'source' e 'target' numéricos.") from exc

        try:
            peso = int(edge["weight"])
        except (KeyError, ValueError, TypeError) as exc:
            raise ValueError("Cada aresta precisa ter o campo 'weight' numérico.") from exc
        adjacencias[origem].append([destino, peso])

    return adjacencias


__all__ = ["grafo_json_para_lista"]
