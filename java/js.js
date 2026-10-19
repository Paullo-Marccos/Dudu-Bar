/* =========================================================
   DUDU BAR — JavaScript do site

   Como ler este arquivo:
   - Cada bloco numerado faz UMA coisa só.
   - As "funções" são receitas: só rodam quando alguém chama o nome delas.
   - No final do arquivo ficam as chamadas que ligam tudo.
   ========================================================= */

// Coloquei varias frases, pois o comercio tem um menu muito variado, 
const tituloOriginal = document.title;

const mensagensDeVolta = [ 
  '🍸 Seu drink está esperando!',
  '🍽️ Sua mesa no Dudu Bar te espera',
  '🔥 O happy hour não espera, volte!',
  '📍 303 Sul, Brasília · Volte!'
  // add qunatas quiser ou remova
];

document.addEventListener('visibilitychange', function () {
  if (document.hidden) {
    // O usuário saiu da aba: sorteia uma das mensagens
    const sorteio = Math.floor(Math.random() * mensagensDeVolta.length);
    document.title = mensagensDeVolta[sorteio];
  } else {
    // O usuário voltou: devolve o título original
    document.title = tituloOriginal;
  }
});


/* ---------- CONFIGURAÇÃO (pode mudar à vontade) ---------- */

// Tempo entre uma foto e outra no topo do site (em milissegundos).
// 5000 = 5 segundos.
var TEMPO_ENTRE_FOTOS = 4000;

// Horários de funcionamento.
// Cada número de 0 a 6 é um dia da semana: 0 = domingo, 1 = segunda ... 6 = sábado.
// Cada horário é [abre, fecha] contado em MINUTOS desde a meia-noite.
//   12h = 720 | 15h = 900 | 17h = 1020 | 18h = 1080 | 24h = 1440
// Sexta e sábado fecham 01h30 do dia seguinte: 24h + 1h30 = 1530.
var HORARIOS = {
  0: [[720, 1020]],                  // domingo: 12h às 17h
  1: [[720, 900], [1080, 1440]],     // segunda: 12h às 15h e 18h às 00h
  2: [[720, 900], [1080, 1440]],     // terça
  3: [[720, 900], [1080, 1440]],     // quarta
  4: [[720, 900], [1080, 1440]],     // quinta
  5: [[720, 1530]],                  // sexta: 12h às 01h30
  6: [[720, 1530]]                   // sábado: 12h às 01h30
};


/* ---------- 1. MENU DO CELULAR ---------- */
// O botão ☰ abre e fecha o menu. Clicar em um link também fecha.

function iniciarMenuCelular() {
  var botao = document.getElementById('burger');
  var menu = document.getElementById('menu');

  botao.onclick = function () {
    menu.classList.toggle('open'); // se tem "open" tira, se não tem coloca
  };

  menu.addEventListener('click', function (evento) {
    if (evento.target.tagName === 'A') {
      menu.classList.remove('open');
    }
  });
}


/* ---------- 2. CABEÇALHO ---------- */
// Quando a pessoa rola a página mais de 40px, o cabeçalho ganha fundo escuro.

function iniciarCabecalho() {
  var cabecalho = document.getElementById('top');

  function atualizar() {
    var rolouBastante = window.scrollY > 40;
    cabecalho.classList.toggle('solid', rolouBastante);
  }

  atualizar(); // já confere ao abrir a página
  window.addEventListener('scroll', atualizar, { passive: true });
}


/* ---------- 3. APARECER AO ROLAR ---------- */
// Elementos com class="reveal" começam invisíveis e aparecem
// quando entram na tela (o CSS faz a animação ao receber a classe "in").

function iniciarAparecerAoRolar() {
  var elementos = document.querySelectorAll('.reveal');

  // Navegador muito antigo: mostra tudo de uma vez.
  if (!('IntersectionObserver' in window)) {
    elementos.forEach(function (el) { el.classList.add('in'); });
    return;
  }

  var vigia = new IntersectionObserver(function (entradas) {
    entradas.forEach(function (entrada) {
      if (entrada.isIntersecting) {          // entrou na tela?
        entrada.target.classList.add('in');  // então aparece
        vigia.unobserve(entrada.target);     // e para de vigiar (só anima 1 vez)
      }
    });
  }, { threshold: 0.12 }); // 12% do elemento visível já conta

  elementos.forEach(function (el) { vigia.observe(el); });
}


/* ---------- 4. AMPLIAR FOTO (lightbox) ---------- */
// Botões das seções "Pratos" e "Drinks" têm data-src="endereço-da-foto".
// Ao clicar, a foto abre grande sobre a página. Clicar de novo (ou Esc) fecha.

function iniciarAmpliarFoto() {
  var caixa = document.getElementById('lb');
  var foto = caixa.querySelector('img');
  var botoes = document.querySelectorAll('.menu-grid button, .gallery button');

  botoes.forEach(function (botao) {
    botao.onclick = function () {
      foto.src = botao.dataset.src;
      caixa.classList.add('on');
    };
  });

  caixa.onclick = function () {
    caixa.classList.remove('on');
  };

  window.addEventListener('keydown', function (evento) {
    if (evento.key === 'Escape') {
      caixa.classList.remove('on');
    }
  });
}


/* ---------- 5. SHOW DE FOTOS DO TOPO ---------- */
// Como funciona:
//  - Todas as fotos ficam empilhadas; só a que tem a classe "active" aparece.
//  - Trocar de foto = tirar "active" da atual e colocar na nova.
//  - As fotos (menos a primeira) começam com data-src em vez de src.
//    Assim o site abre rápido e cada foto só é baixada um pouco antes de aparecer.

var fotos = document.querySelectorAll('.hero-slide'); // todas as fotos
var pontos = [];                                      // bolinhas lá embaixo
var fotoAtual = 0;                                    // posição da foto na tela (0 = primeira)
var relogio = null;                                   // guarda o "cronômetro" do autoplay
var mouseEmCima = false;                              // true enquanto o mouse está no topo

// Baixa a foto de verdade (troca data-src por src). Se já foi baixada, não faz nada.
function baixarFoto(foto) {
  var endereco = foto.getAttribute('data-src');
  if (endereco) {
    foto.src = endereco;
    foto.removeAttribute('data-src');
  }
}

// Mostra a foto de número "n".
function mostrarFoto(n) {
  // 1) esconde a foto e a bolinha atuais
  fotos[fotoAtual].classList.remove('active');
  pontos[fotoAtual].classList.remove('active');

  // 2) calcula a nova posição. O "%" faz voltar ao começo depois da última
  //    (e ir para a última se voltar a partir da primeira).
  fotoAtual = (n + fotos.length) % fotos.length;

  // 3) baixa a foto nova e já deixa a seguinte pronta
  baixarFoto(fotos[fotoAtual]);
  baixarFoto(fotos[(fotoAtual + 1) % fotos.length]);

  // 4) mostra a foto e a bolinha novas
  fotos[fotoAtual].classList.add('active');
  pontos[fotoAtual].classList.add('active');

  // 5) troca o texto da legenda (nome e descrição do prato/drink)
  document.getElementById('legendaNome').textContent = fotos[fotoAtual].getAttribute('data-nome');
  document.getElementById('legendaInfo').textContent = fotos[fotoAtual].getAttribute('data-info');
}

function proximaFoto()  { mostrarFoto(fotoAtual + 1); }
function fotoAnterior() { mostrarFoto(fotoAtual - 1); }

// Autoplay: troca de foto sozinho a cada TEMPO_ENTRE_FOTOS.
function ligarAutoplay() {
  pararAutoplay(); // garante que nunca existam dois cronômetros
  relogio = setInterval(proximaFoto, TEMPO_ENTRE_FOTOS);
}
function pararAutoplay() {
  clearInterval(relogio);
}
// Depois de um clique do usuário, recomeça a contagem (se o mouse não estiver parado em cima).
function reiniciarAutoplay() {
  if (!mouseEmCima) {
    ligarAutoplay();
  }
}

// Cria uma bolinha para cada foto.
function criarPontos() {
  var area = document.getElementById('slideDots');

  fotos.forEach(function (_, posicao) {
    var ponto = document.createElement('button');
    ponto.setAttribute('aria-label', 'Ir para a foto ' + (posicao + 1));
    ponto.onclick = function () {
      mostrarFoto(posicao);
      reiniciarAutoplay();
    };
    area.appendChild(ponto);
    pontos.push(ponto);
  });
}

function iniciarShowDeFotos() {
  var topo = document.querySelector('.hero');

  // O zoom lento de cada foto (no CSS) dura o mesmo tempo que a foto fica na tela,
  // mais 1 segundo da troca suave. Assim os dois combinam, mesmo se você mudar o tempo lá em cima.
  topo.style.setProperty('--tempo-zoom', (TEMPO_ENTRE_FOTOS + 1000) + 'ms');

  criarPontos();
  mostrarFoto(0);

  // Setas
  document.getElementById('nextSlide').onclick = function () { proximaFoto(); reiniciarAutoplay(); };
  document.getElementById('prevSlide').onclick = function () { fotoAnterior(); reiniciarAutoplay(); };

  // Pausa enquanto o mouse está em cima (dá tempo de ler a legenda).
  topo.addEventListener('mouseenter', function () { mouseEmCima = true;  pararAutoplay(); });
  topo.addEventListener('mouseleave', function () { mouseEmCima = false; ligarAutoplay(); });

  // Deslizar o dedo no celular: para a esquerda = próxima, para a direita = anterior.
  var toqueInicio = 0;
  topo.addEventListener('touchstart', function (e) {
    toqueInicio = e.changedTouches[0].screenX;
  }, { passive: true });
  topo.addEventListener('touchend', function (e) {
    var diferenca = e.changedTouches[0].screenX - toqueInicio;
    if (diferenca < -40) { proximaFoto();  reiniciarAutoplay(); }
    if (diferenca > 40)  { fotoAnterior(); reiniciarAutoplay(); }
  }, { passive: true });

  // Quem pediu "menos animações" no aparelho não recebe troca automática.
  var semAnimacao = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!semAnimacao) {
    ligarAutoplay();
  }
}


/* ---------- 6. "ABERTO AGORA" ---------- */
// Descobre a hora em Brasília e compara com os HORARIOS lá de cima.

// Devolve o dia da semana (0 a 6) e os minutos desde a meia-noite, no horário de Brasília.
function horaEmBrasilia() {
  var partes = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo',
    weekday: 'short',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false
  }).formatToParts(new Date());

  function valorDe(tipo) {
    return partes.filter(function (p) { return p.type === tipo; })[0].value;
  }

  var dia = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(valorDe('weekday'));
  var minutos = (Number(valorDe('hour')) % 24) * 60 + Number(valorDe('minute'));

  return { dia: dia, minutos: minutos };
}

// true se o minuto "m" cai dentro de algum dos horários da lista.
function estaDentro(listaDeHorarios, m) {
  return listaDeHorarios.some(function (faixa) {
    return m >= faixa[0] && m < faixa[1];
  });
}

function atualizarStatus() {
  var agora = horaEmBrasilia();
  var ontem = (agora.dia + 6) % 7; // dia anterior (o "+6 % 7" evita número negativo)

  // Aberto por causa do horário de HOJE?
  var abertoHoje = estaDentro(HORARIOS[agora.dia], agora.minutos);

  // Ou ainda aberto da noite de ONTEM? (ex.: sábado 00h30 ainda vale a sexta, que fecha 01h30)
  // Somamos 24h (1440 min) ao horário atual para comparar com os horários que passam da meia-noite.
  var abertoDeOntem = estaDentro(HORARIOS[ontem], agora.minutos + 1440);

  var aberto = abertoHoje || abertoDeOntem;

  // Atualiza a bolinha e o texto no topo do site
  var etiqueta = document.getElementById('status');
  etiqueta.classList.toggle('open', aberto);
  etiqueta.querySelector('span').textContent = aberto
    ? 'Aberto agora · 303 Sul'
    : 'Fechado agora · aberto todos os dias';

  // Destaca a linha do dia de hoje na tabela de horários
  document.querySelectorAll('#hours li').forEach(function (linha) {
    var dias = linha.dataset.days.split(','); // ex.: "5,6" vira ["5", "6"]
    var ehHoje = dias.indexOf(String(agora.dia)) > -1;
    linha.classList.toggle('today', ehHoje);
  });
}

function iniciarStatusAberto() {
  atualizarStatus();
  setInterval(atualizarStatus, 60000); // confere de novo a cada 1 minuto
}


/* ---------- 7. ZOOM NAS FOTOS DE FUNDO ---------- */
// Elementos com class="zoom-bg" (ex.: foto do Happy Hour) ganham a classe "in"
// quando aparecem na tela. O CSS então faz a foto crescer devagar (zoom).

function iniciarZoomDeFundo() {
  var fundos = document.querySelectorAll('.zoom-bg');

  if (!('IntersectionObserver' in window)) {
    fundos.forEach(function (el) { el.classList.add('in'); });
    return;
  }

  var vigia = new IntersectionObserver(function (entradas) {
    entradas.forEach(function (entrada) {
      if (entrada.isIntersecting) {
        entrada.target.classList.add('in');
        vigia.unobserve(entrada.target);
      }
    });
  }, { threshold: 0.2 }); // 20% da seção visível já começa o zoom

  fundos.forEach(function (el) { vigia.observe(el); });
}


/* ---------- 8. BOTÃO "VOLTAR AO TOPO" ---------- */
// O botão ↑ só aparece depois de rolar 600px para baixo.

function iniciarVoltarAoTopo() {
  var botao = document.getElementById('toTop');

  function atualizar() {
    botao.classList.toggle('show', window.scrollY > 600);
  }

  atualizar();
  window.addEventListener('scroll', atualizar, { passive: true });
}


/* ---------- LIGANDO TUDO ---------- */
// Aqui cada bloco acima é colocado para funcionar.
// Se quiser desligar algo, é só comentar a linha (colocar // na frente).

iniciarMenuCelular();
iniciarCabecalho();
iniciarAparecerAoRolar();
iniciarAmpliarFoto();
iniciarShowDeFotos();
iniciarStatusAberto();
iniciarZoomDeFundo();
iniciarVoltarAoTopo();