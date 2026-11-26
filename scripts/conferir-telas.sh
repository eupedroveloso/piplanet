#!/usr/bin/env bash
# Confere se as telas principais CARREGAM (mapa/planeta 3D, exercícios, cartas, álbum, nível, ajustes, painel)
# com cada perfil, sem erro no console. Usa um portal do Maestri.
# Uso: scripts/conferir-telas.sh "Nome do Portal" [http://localhost:3100]
P="${1:-Mundo QA}"; U="${2:-http://localhost:3100}"
falhas=0
for perfil in pietro perola pais; do
  corpo='{"perfil":"'$perfil'"'; [ "$perfil" = pais ] && corpo="$corpo"',"senha":"0001"'; corpo="$corpo}"
  maestri portal navigate "$P" "$U/entrar" >/dev/null; sleep 3
  maestri portal evaluate "$P" "fetch('/api/entrar',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify($corpo)}).then(r=>r.status)" >/dev/null
  rotas="/ /jogar/br-fazenda/0 /jogar/br-fazenda/1 /jogar/br-fazenda/2 /jogar/br-fazenda/9 /cartas /album /nivelamento /ajustes"
  [ "$perfil" = pais ] && rotas="$rotas /painel"
  for r in $rotas; do
    maestri portal navigate "$P" "$U$r" >/dev/null; maestri portal logs-start "$P" >/dev/null; sleep 9
    erro=$(maestri portal logs "$P" | grep -iE "\[error\]|uncaught" | grep -viE "favicon|DevTools" | head -1 | cut -c1-160)
    estado=$(maestri portal evaluate "$P" "(()=>{const t=document.body.innerText;return (t.includes('Application error')?'ERRO ':'')+(document.querySelector('[aria-label=Carregando]')?'carregando':'ok')})()")
    if [ -n "$erro" ] || [ "$estado" != "ok" ]; then falhas=$((falhas+1)); echo "FALHOU $perfil $r → $estado $erro"; else echo "ok     $perfil $r"; fi
  done
done
echo "Falhas: $falhas"; [ "$falhas" = 0 ]
