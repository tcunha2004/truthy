# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js (React), app nesta pasta. Dados vêm do Postgres alimentado pelo `../truthy-worker` (Go).

## Users

Profissionais de tecnologia no Brasil procurando emprego, tanto em empresas nacionais quanto internacionais (remoto/gringa). Chegam para encontrar vagas reais e abertas, filtrar pelo que importa (remoto, país, senioridade, salário, empresa) e ir direto para a candidatura no ATS da empresa.

## Product Purpose

Busca de vagas de tech que puxa as listagens direto dos ATSs oficiais das empresas (hoje Lever e Greenhouse). Existe porque os job boards comuns misturam posts patrocinados, vagas duplicadas, desatualizadas ou já fechadas. Sucesso: o usuário confia que toda vaga exibida está aberta de verdade e chega à candidatura oficial sem intermediários.

## Positioning

"No sponsored posts, just jobs that return true." Toda vaga vem da API oficial do ATS da empresa, é atualizada a cada execução do worker e é marcada como inativa quando some da fonte. Não há posts pagos nem ranking comprado.

## Operating Context

- O worker grava `jobs`, `companies`, `sources` e `ingestion_runs`. Cada empresa tem `last_fetched_at`; cada vaga tem `published_at`, `is_active` e `url` (link oficial do ATS).
- Empresas são classificadas como `nacional` ou `internacional`.
- Campos derivados (`is_remote`, `countries`, `remote_scope`, `seniority`) só são preenchidos quando a fonte traz o dado pronto; null significa "a fonte não informou", não "não".
- Salário é sempre normalizado para valor mensal, com moeda; muitas vagas não têm salário.
- `description` é HTML vindo da fonte e precisa ser sanitizado antes de exibir.

## Capabilities and Constraints

Escopo v1:
- Login com e-mail e senha + login com Google.
- Perfil próprio: nome, skills e demais dados do usuário.
- Busca e filtros de vagas, com página de detalhe antes de ir ao ATS.
- Vagas salvas.
- Busca de empresas e página de empresa com todas as vagas dela.

Fora da v1: alertas por e-mail.

Interface bilíngue desde o início: inglês e português (PT-BR).

## Brand Commitments

- Nome: **truthy** (minúsculo).
- Tagline: "No sponsored posts, just jobs that return true." A metáfora vem de programação (valores truthy, `return true`).
- Referência visual escolhida pelo usuário: o site da Apple (https://www.apple.com). Nível de acabamento e linguagem visual devem estar à altura dele.
- Anti-referências (confirmadas): parecer LinkedIn/Indeed, fantasia de terminal (tela preta, mono verde), ou sério/frio demais sem nenhuma piada do nome.

## Evidence on Hand

- Lista real de empresas no seed (`../db/init/002_seed.sql`): Swile, CI&T, Bluelight, Jobgether, Flex, Supermove, Firstup, Smart Working Solutions, Airbnb, Gofasti, Smartsheet, Twilio, Inter, Capco, Getnet.
- Não há logos, depoimentos, métricas de usuários ou números de vagas confirmados. Não inventar.

## Product Principles

1. Verdade acima de volume: só mostrar o que a fonte confirma; dado ausente aparece como ausente, nunca adivinhado.
2. Procedência visível: de onde a vaga veio e quando foi verificada é informação de primeira classe.
3. Caminho mais curto até a candidatura oficial.
4. Nada que pareça anúncio: nenhum destaque pago, nenhum ranking comprado.
