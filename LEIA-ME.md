# Que nem Santo — Vamos colorir

Aplicativo estático de colorir com cinco artes fornecidas pela marca Que nem Santo.

## Usar

Publique o conteúdo da pasta `dist` em uma hospedagem de sites estáticos. Para testar no computador, execute `python -m http.server 8765 --directory dist` nesta pasta e abra `http://localhost:8765`. Abrir o HTML diretamente como arquivo pode bloquear o carregamento dos SVGs.

- Balde: clique ou toque em uma área fechada.
- Pincel e borracha: arraste sobre o desenho; o controle de tamanho fica disponível ao escolher a ferramenta.
- Ao escolher Pincel ou Borracha, use “Nos limites” para respeitar a região inicial ou “Livre” para atravessar os contornos.
- Desfazer e refazer guardam até 40 etapas por desenho durante a sessão.
- Ao trocar de desenho, a pintura permanece na memória enquanto a página está aberta.
- “Baixar pintura”, no topo da tela, exporta PNG de 1132 × 1600 pixels com a marca.
- “Imprimir desenho”, no topo da tela, baixa o PDF original, sem pintura.
- Não há banco de dados, conta própria do aplicativo, armazenamento persistente ou envio das pinturas a um servidor. Recarregar ou fechar a página apaga a sessão.
- No teclado, focalize o desenho, use as setas para mover o cursor e espaço para preencher. Shift + seta move em passos menores. Ctrl/Cmd + Z desfaz.

## Artes

Os arquivos `dist/assets/*.svg` contêm caminhos vetoriais reais, sem uma imagem raster embutida. A vetorização preserva o desenho e divide os espaços fechados em 758 regiões: Carlo 155, José 150, Miguel 204, Coração de Jesus 107 e Teresinha 142. Suavização leve, remoção de pixels isolados e simplificação geométrica reduziram o tamanho dos SVGs em cerca de 30%.

Pequenas interrupções de até dois pixels foram fechadas antes do traçado. Linhas decorativas abertas não são tratadas como divisórias: áreas conectadas no original continuam sendo uma única região. O balde muda apenas o caminho selecionado. O pincel protegido usa recorte vetorial da região inicial; os traços escuros permanecem sobre a pintura.

## Validação

Testados no Microsoft Edge: carregamento das cinco artes, preenchimento, desfazer/refazer, pincel protegido e livre, exportação PNG, download do PDF, retenção na troca de desenho, confirmação de limpeza e layout de 390 px sem rolagem horizontal. Revisão visual de todos os desenhos preenchidos. Nenhum erro JavaScript observado nesses testes.

O suporte opcional a WebMCP é detectado quando disponível no navegador. A validação em um navegador com essa API nativa não estava disponível; o app funciona sem ela.

A hospedagem Sites começa privada para revisão do proprietário. A permissão de acesso da hospedagem é independente da ausência de cadastro interno no aplicativo.
