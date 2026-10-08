# 🤠 Barretos Clash: A Lenda do Laço

**Versão atual: 1.2.0**

> **“O jogo de luta brasileiro em que o laço é sua arma e o cavalo é seu parceiro.”**

*Barretos Clash* é um jogo de luta e plataforma 2D (*platform fighter*) ambientado no universo dos rodeios e folclore brasileiro, combinando mecânicas profundas de combate, o inovador **Duelo de Laços**, **Assistência de Montaria** com o Cavalo Trovão, e a busca pela sagrada **Ferradura da Aurora**.

---

## 🎮 Controles Padrão

| Ação | Jogador 1 (P1) | Jogador 2 (P2) |
| :--- | :--- | :--- |
| **Mover / Agachar** | `A` / `D` / `S` | `←` / `→` / `↓` |
| **Pulo / Pulo Duplo** | `W` | `↑` |
| **Ataque Leve / Laço** | `J` | `1` (Teclado Numérico) |
| **Ataque Forte / Tiro de Laço** | `L` | `3` |
| **Especial (Laço Mágico / Choque)** | `K` | `2` |
| **Defesa / Esquiva** | `I` | `4` |
| **Agarrão / Laçada Curta** | `U` | `0` |
| **Assistência de Montaria (Cavalo)** | `O` ou `↓ + K` | `5` |
| **Super Golpe da Aurora (100%)** | `H` ou `K + L` | `6` |
| **Pausa** | `Esc` / `P` | `Esc` |

> *Suporte completo a Gamepads USB / Bluetooth via Gamepad API.*

---

## ⚡ Mecânicas Exclusivas

### 1. Duelo de Laços (Lasso Clash)
Quando dois projéteis de laço colidem no ar ou dois peões tentam se laçar ao mesmo tempo, o tempo desacelera e uma corda esticada com faíscas conecta ambos os lutadores. 
- Disputa rápida de força: **esmague o botão de ataque (`J` / `1`)** para puxar o medidor de cabo de guerra para o seu lado!
- O vencedor puxa o adversário com violência, causando atordoamento (*stun*) e abrindo espaço para combos aéreos devastadores!

### 2. Cavalo como Ataque de Assistência
Em vez de uma montaria fixa, Everttinho assobia para invocar o cavalo espiritual **"Trovão"**, que atravessa a arena em alta velocidade galopando, atropelando o oponente com dano e knockback vertical!

### 3. Barra de Especial da Aurora
Carregue sua barra de Aurora acertando golpes e vencendo Duelos de Laço para desferir o **Super Golpe da Aurora** com animação cinematográfica e hyper-armadura!

---

## 🏆 Modos de Jogo

1. **Versus Local (2P / 1P vs CPU):** Combate clássico com seleção de lutadores, skins e arenas.
2. **Modo História ("A Lenda da Ferradura da Aurora"):** 5 Capítulos com diálogos ilustrados, enfrentando rivais até os grandes chefes:
   - *Capítulo 1:* O Desafio na Arena de Barretos (vs Fernanda)
   - *Capítulo 2:* A Força Bruta do Cerrado (vs Nox)
   - *Capítulo 3:* A Ira do Touro de Ferro (Chefe com Hiper Armadura)
   - *Capítulo 4:* O Cavaleiro da Tempestade (Chefe dos Relâmpagos)
   - *Capítulo 5:* O Barão da Ferradura Negra (Batalha Final)
3. **Modo 8 Segundos (Rodeio Oficial):** Resista aos 8 segundos mais intensos contra o Touro de Ferro e ganhe a Super Fúria para o contra-ataque definitivo!
4. **Modo Tiro de Laço:** Minigame de precisão com alvos móveis (bezerros, barris, ferraduras douradas) acumulando pontos e combos.
5. **Modo Treinamento:** Lista de comandos (*movelist*), visualizador de *hitboxes*, display de *inputs*, e opções de simulação de Duelo de Laço.
6. **Armário do Peão:** Personalização cosmética de chapéus, laços (Dourado, Elétrico, Fogo, Couro) e fivelas.

---

## 🏟️ Arenas

- **Arena de Rodeio Barretos:** Holofotes móveis, fardos de feno e torcida animada com chapéus de peão.
- **Fazenda ao Pôr do Sol:** Céu alaranjado, moinho com pás giratórias e vaga-lumes.
- **Cerrado da Tempestade:** Chuva dinâmica, árvores retorcidas e relâmpagos em tempo real.
- **Curral Fantasma:** Luar esmeralda, névoa espectral e tochas místicas.
- **Arena da Aurora:** Santuário cósmico com ondas de aurora boreal e cavalos espirituais.
- **Terraço Neon:** A metrópole futurista original.

---

## 🚀 Como Executar

Abra o terminal e inicie um servidor HTTP local:

```bash
python3 -m http.server 8080
```

Abra no navegador em `http://localhost:8080` e prepare-se para o rodeio!

Para gerar o bundle web compartilhado entre computador, Android e iOS:

```bash
npm install
npm run build:web
```

## 🖥️📱 Compatibilidade entre computador, Android e iOS

O jogo usa uma única versão HTML5/JavaScript para os três ambientes. A mesma lógica de combate, fases, personagens, controles e assets é reaproveitada no navegador do computador, no app Android e no app iOS. No celular, a partida abre em modo horizontal e mostra controles virtuais de toque; teclado e gamepad continuam funcionando no computador e nos celulares compatíveis.

| Ambiente | Entrega | Compatibilidade mínima | Entrada |
| :--- | :--- | :--- | :--- |
| Computador | Navegador moderno | Chrome, Edge, Firefox ou Safari atual | Teclado, mouse e gamepad USB/Bluetooth |
| Android | Capacitor 8 | Android 7.0 (API 24) ou superior | Toque, teclado e gamepad |
| iOS | Capacitor 8 | iOS 15 ou superior | Toque e gamepad compatível |

O jogo mantém retrocompatibilidade de dados de controles salvos e usa detecção progressiva de recursos: quando um navegador ou WebView não oferece gamepad, tela cheia ou armazenamento local, os demais controles continuam disponíveis.

### Pré-requisitos

- **Android:** Node.js 22+, Android Studio Otter 2025.2.1 ou superior e Android SDK 36. O projeto está configurado para **Android 7.0 (API 24) ou superior**.
- **iOS:** macOS e **Xcode 26 ou superior**. O projeto usa **Capacitor 8.5.2** e está configurado para **iOS 15 ou superior**. A geração do projeto pode ser feita em qualquer sistema, mas a compilação e assinatura do iPhone precisam ser feitas no Xcode em um Mac. O projeto existente mantém CocoaPods; projetos novos do Capacitor 8 podem usar Swift Package Manager.

### Sincronizar o jogo

```bash
npm install
npm run cap:sync
```

### Abrir no Android Studio ou Xcode

```bash
npm run cap:open:android
npm run cap:open:ios
```

No Android Studio, escolha um celular ou emulador e pressione **Run** para gerar um APK de teste. No Xcode, selecione um iPhone ou simulador, escolha a assinatura da equipe e pressione **Run**. Para distribuir o app, use **Build > Generate Signed Bundle / APK** no Android Studio ou **Product > Archive** no Xcode.

Para gerar rapidamente o APK de debug pela linha de comando:

```bash
npm run build:android
```

Para gerar o pacote Android Release:

```bash
npm run build:android:release
```

O APK/AAB Release ainda precisa ser assinado com uma chave da sua conta Google Play. Faça a assinatura pelo Android Studio ou configure um keystore privado; nunca coloque a senha ou o keystore no GitHub.

O identificador configurado para as duas plataformas é `br.com.barretosclash.game`. Depois de alterar arquivos do jogo, execute `npm run cap:sync` novamente antes de testar o app nativo.

### Publicar na App Store

O projeto inclui o manifesto de privacidade da Apple e um script de Release que gera um arquivo `.xcarchive` e exporta o `.ipa` com assinatura automática. No Mac, depois de instalar o Xcode 26+, CocoaPods e iniciar sessão na sua conta Apple Developer, execute:

```bash
export APPLE_TEAM_ID="SEU_TEAM_ID_DA_APPLE"
npm run build:ios:release
```

O arquivo exportado será salvo em `build/AppStore/`. O `APPLE_TEAM_ID` não deve ser gravado no repositório. Antes do primeiro upload, crie no App Store Connect um registro para o Bundle ID `br.com.barretosclash.game`, confira o nome, ícone, classificação etária, privacidade e screenshots, e então envie o build pelo Organizer do Xcode ou pelo Transporter.
