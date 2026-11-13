# ADR-002 — CLI offline sem dependências de produção

Status: PROPOSED

O primeiro vertical slice usa somente APIs nativas do Node. Isso garante `help`, `version`, `init`, `doctor` e validação básica sem rede, provider ou credencial. Bibliotecas externas só entram quando trouxerem benefício comprovado e lockfile auditável.

