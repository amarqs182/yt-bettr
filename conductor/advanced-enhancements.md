# Plano de Implementação: Melhorias Premium (Modo High)

Este plano descreve a adição gradual de recursos avançados de áudio e vídeo para elevar a experiência no modo **Auto High** além do padrão do YouTube.

## 1. Objetivos
- Implementar **Nitidez Inteligente** para simular upscaling.
- Implementar **Cores HDR simuladas** para maior vibração visual.
- Implementar **Som Surround/Stereo Widener** via Web Audio API.
- Garantir que esses recursos sejam opcionais e otimizados.

## 2. Etapas de Implementação

### Fase 1: Atualização da UI (popup.html/js)
- Adicionar uma nova seção "Premium / Melhorias" no popup.
- Adicionar toggles para:
  - `Nitidez Inteligente`
  - `Cores Vibrantes (HDR)`
  - `Expansão de Som (Stereo)`
- Atualizar o mapeamento do modo **Auto High** para ativar esses recursos por padrão.

### Fase 2: Melhorias Visuais (`src/features/visual_fx.js`)
- Criar script para injetar filtros CSS dinâmicos no elemento `<video>`.
- **Nitidez:** Usar combinação de `contrast` e um leve `sharpen` simulado.
- **HDR:** Ajustar `saturate` e `brightness` em curvas específicas para simular HDR em vídeos SDR.

### Fase 3: Melhoria de Áudio (`src/features/audio_fx.js`)
- Implementar interceptação de áudio via `AudioContext`.
- Criar um nó de processamento para atrasar levemente as frequências laterais, criando percepção de palco sonoro mais amplo (Stereo Widening).

### Fase 4: Refinamento do "Auto-Next"
- Implementar lógica para detectar vídeos já assistidos no histórico local e pular se estiver em "Auto-play".

## 3. Verificação
- Testar uso de CPU/GPU com os filtros ativos.
- Validar se o áudio não sofre atraso (latency).
- Confirmar se o modo **Auto Lite** desativa tudo isso para economizar energia.

---
**Próximo Passo:** Iniciar Fase 1 (UI).
