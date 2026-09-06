(() => {
  'use strict';

  const $ = (selector) => document.querySelector(selector);
  const responsiveStyle = document.createElement('style');
  responsiveStyle.textContent = '.canvas-wrap { border: 0 !important; outline: none !important; box-shadow: 0 22px 70px rgba(0,0,0,.38) !important; } .canvas-wrap::before, .canvas-wrap::after { display: none !important; } .level-progress { display:grid; grid-template-columns:minmax(45px,1fr) auto; align-items:center; gap:8px; min-width:145px; margin-left:auto; } .level-progress::before { content:""; grid-column:1; grid-row:1; height:3px; background:#23343a; } .level-progress i { grid-column:1; grid-row:1; display:block; width:0; height:3px; background:#e6b86b; box-shadow:0 0 8px #e6b86b; transition:width .3s; } .level-progress small { color:#9db4b7; font:7px DM Mono,monospace; white-space:nowrap; } @media (max-width:700px) { .topbar { height: 60px !important; } .game-layout { padding-top: 18px !important; gap: 18px !important; } .intro-panel h1 { font-size: clamp(36px, 10vw, 48px) !important; margin: 10px 0 8px !important; } .intro-copy { font-size: 10px !important; line-height: 1.5 !important; } .eyebrow { font-size: 8px !important; } .hud-row { margin-bottom: 9px !important; } .field-header { min-height: 25px !important; margin-bottom: 5px !important; } .field-header strong { font-size: 10px !important; } .field-kicker { font-size: 7px !important; margin-bottom: 2px !important; } .game-footer { padding-top: 8px !important; gap: 6px !important; } .power-status { font-size: 8px !important; } .game-actions { width: 100%; justify-content: flex-end; } .level-progress { min-width:110px; gap:4px; } .level-progress small { font-size:6px; } }';
  document.head.append(responsiveStyle);
  const canvas = $('#game-canvas');
  const ctx = canvas.getContext('2d');
  const grid = 24;
  const cell = canvas.width / grid;
  const scoreEl = $('#score');
  const highScoreEl = $('#high-score');
  const difficultyEl = $('#difficulty');
  const levelEl = $('#level');
  const resonanceEl = $('#resonance-value');
  const resonanceBar = $('#resonance-bar');
  const overlay = $('#game-overlay');
  const overlayKicker = $('#overlay-kicker');
  const overlayTitle = $('#overlay-title');
  const overlayMessage = $('#overlay-message');
  const startButton = $('#start-button');
  const muteButton = $('#mute-button');
  const powerStatus = $('#power-status');
  const statusOrb = $('.status-orb');
  const spellEls = [...document.querySelectorAll('.spell')];
  const keys = { ArrowUp: 'up', w: 'up', W: 'up', ArrowDown: 'down', s: 'down', S: 'down', ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right' };
  const vectors = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } };
  const powerTypes = ['speed', 'slow', 'shield', 'multiplier', 'teleport', 'magnet', 'freeze', 'growth', 'ghost'];
  const missionCatalog = [{ text: 'Gather 10 arcane orbs', target: 10, type: 'orbs' }, { text: 'Reach a trail of 12', target: 12, type: 'length' }, { text: 'Score 150 points', target: 150, type: 'score' }];
  let savedProfile = {};
  try { savedProfile = JSON.parse(localStorage.getItem('runebound-profile') || '{}') || {}; } catch { localStorage.removeItem('runebound-profile'); }
  const profile = { totalOrbs: savedProfile.totalOrbs || 0, missionIndex: savedProfile.missionIndex || 0, missionProgress: savedProfile.missionProgress || 0, unlockedSkins: savedProfile.unlockedSkins || ['ember'], skin: savedProfile.skin || 'ember' };

  let snake;
  let direction;
  let nextDirection;
  let food;
  let rune;
  let hazard;
  let hazardTimer = 0;
  let nextRuneScore = 30;
  let portal = null;
  let worldStage = 0;
  let score;
  let highScore = Number(localStorage.getItem('runebound-high-score')) || 0;
  let state = 'ready';
  let lastStep = 0;
  let lastSecond = 0;
  let particles = [];
  let activePower = null;
  let powerTimer = 0;
  let unlockedSpells = 0;
  let muted = false;
  let audioContext;
  let musicTimer;
  let countdownTimer;
  let countdown = 3;
  let touchStart = null;
  let speedScale = Math.max(0.9, Number(localStorage.getItem('runebound-speed-scale')) || 1);
  let endlessMode = localStorage.getItem('runebound-endless-mode') === 'true';
  let lives = 3;
  let combo = 0;
  let comboTimer = 0;
  let runTime = 0;
  let skin = profile.skin;
  let spellInventory = new Set();
  let currentLevel = 1;
  const levelStages = ['CALM', 'WATCHFUL', 'RESTLESS', 'FERAL', 'ARCANE', 'ANCIENT', 'PRIMAL', 'MYTHIC', 'ASCENDED'];

  const liveRegion = document.createElement('div');
  liveRegion.className = 'sr-only';
  liveRegion.setAttribute('aria-live', 'polite');
  document.body.append(liveRegion);

  const pauseButton = makeButton('Ⅱ Pause', 'Pause or resume game');
  const restartButton = makeButton('↻ Restart', 'Restart game');
  const actions = document.createElement('div');
  actions.className = 'game-actions';
  actions.append(pauseButton, restartButton);
  $('.game-footer').append(actions);

  const settingsButton = makeButton('⚙', 'Open game settings');
  settingsButton.className = 'icon-button settings-button';
  $('.header-actions').prepend(settingsButton);
  const settingsPanel = document.createElement('section');
  settingsPanel.className = 'settings-panel';
  settingsPanel.setAttribute('aria-label', 'Game settings');
  settingsPanel.innerHTML = '<div class="settings-head"><strong>FIELD SETTINGS</strong><button type="button" aria-label="Close settings">×</button></div><label>Game mode<select id="mode-setting"><option value="classic">Classic boundary</option><option value="endless">Endless grove</option></select></label><label>Difficulty<select id="difficulty-setting"><option value="1">Wanderer</option><option value=".82">Spellbound</option><option value=".68">Dragon\'s fury</option></select></label><label>Dragon form<select id="skin-setting"><option value="ember">Emberwing</option><option value="frost">Frostscale</option><option value="storm">Stormcoil</option><option value="void">Voidwyrm</option></select></label><label class="setting-check"><input id="motion-setting" type="checkbox"> Reduce motion</label><label class="setting-check"><input id="contrast-setting" type="checkbox"> High contrast</label>';
  document.body.append(settingsPanel);
  const difficultySetting = $('#difficulty-setting');
  const modeSetting = $('#mode-setting');
  const skinSetting = $('#skin-setting');
  difficultySetting.value = String(speedScale);
  modeSetting.value = endlessMode ? 'endless' : 'classic';
  skinSetting.value = skin;
  const skinThresholds = { ember: 0, frost: 25, storm: 75, void: 150 };
  [...skinSetting.options].forEach((option) => { option.disabled = profile.totalOrbs < skinThresholds[option.value]; option.textContent = option.disabled ? `${option.textContent} · ${skinThresholds[option.value]} orbs` : option.textContent; });
  $('.controls-hint span').textContent = 'arrows · P pause · 1–4 spells';

  const fieldHeader = document.createElement('div');
  fieldHeader.className = 'field-header';
  fieldHeader.innerHTML = `<div><span class="field-kicker">ARCANE FIELD</span><strong>THE GLOWING GROVE</strong></div><span class="field-meta">24 × 24 GRID <i></i> ${endlessMode ? 'ENDLESS TRAIL' : 'BOUNDARY ACTIVE'}</span>`;
  $('.canvas-wrap').before(fieldHeader);
  const runStrip = document.createElement('div');
  runStrip.className = 'run-strip';
  runStrip.innerHTML = '<span>TRAIL <b id="trail-length">04</b></span><span>LEVEL <b id="run-level">01</b></span><span>LIVES <b id="run-lives">♥♥♥</b></span><span>COMBO <b id="run-combo">x1</b></span><span>NEXT RUNE <b id="next-rune">30</b></span><div class="level-progress"><i id="level-progress"></i><small id="level-caption">0 / 50 TO NEXT LEVEL</small></div>';
  $('.canvas-wrap').before(runStrip);
  const milestone = document.createElement('div');
  milestone.className = 'milestone-toast';
  $('.canvas-wrap').append(milestone);
  const missionPanel = document.createElement('div');
  missionPanel.className = 'side-section mission-section';
  missionPanel.innerHTML = '<div class="section-heading"><span>04</span><h3>Current oath</h3></div><p id="mission-text"></p><div class="mission-meter"><i id="mission-bar"></i></div><small id="mission-progress"></small>';
  $('.side-panel').prepend(missionPanel);
  const mobilePad = document.createElement('div');
  mobilePad.className = 'mobile-pad';
  mobilePad.innerHTML = '<button data-direction="up" aria-label="Move up">▲</button><div><button data-direction="left" aria-label="Move left">◀</button><button data-direction="down" aria-label="Move down">▼</button><button data-direction="right" aria-label="Move right">▶</button></div>';
  $('.canvas-wrap').append(mobilePad);

  function makeButton(label, ariaLabel) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    button.setAttribute('aria-label', ariaLabel);
    return button;
  }

  function announce(message) { liveRegion.textContent = message; }
  function saveProfile() { localStorage.setItem('runebound-profile', JSON.stringify(profile)); }

  function resetGame() {
    snake = [{ x: 12, y: 13 }, { x: 11, y: 13 }, { x: 10, y: 13 }, { x: 9, y: 13 }];
    direction = 'right';
    nextDirection = 'right';
    score = 0;
    lives = 3;
    combo = 0;
    comboTimer = 0;
    runTime = 0;
    lastSecond = 0;
    currentLevel = 1;
    rune = null;
    hazard = null;
    hazardTimer = 0;
    nextRuneScore = 30;
    portal = null;
    worldStage = 0;
    activePower = null;
    powerTimer = 0;
    unlockedSpells = 0;
    spellInventory = new Set();
    particles = [];
    clearInterval(countdownTimer);
    pauseButton.textContent = 'Ⅱ Pause';
    placeFood();
    updateHud();
    updateSpells();
  }

  function openCells() {
    const open = [];
    for (let y = 0; y < grid; y += 1) for (let x = 0; x < grid; x += 1) if (!isWallCell(x, y) && (!portal || portal.x !== x || portal.y !== y) && !snake.some((part) => part.x === x && part.y === y) && (!rune || rune.x !== x || rune.y !== y) && (!food || food.x !== x || food.y !== y)) open.push({ x, y });
    return open;
  }

  function isWallCell(x, y) {
    const level = getLevel();
    if (level === 1) return false;
    if (level === 2 && y === 12 && x >= 3 && x <= 20) return ![7, 8, 15, 16].includes(x);
    if (level >= 3 && y === 12 && x >= 3 && x <= 20) return ![7, 8, 15, 16].includes(x);
    if (level >= 3 && x === 12 && y >= 3 && y <= 20) return ![7, 8, 15, 16].includes(y);
    if (level >= 4 && y === 6 && x >= 3 && x <= 20) return ![4, 5, 18, 19].includes(x);
    return false;
  }

  function placeFood() { const open = openCells(); food = open[Math.floor(Math.random() * open.length)]; }
  function placeRune() { const open = openCells(); if (!open.length) return; const spot = open[Math.floor(Math.random() * open.length)]; rune = { ...spot, type: powerTypes[Math.floor(Math.random() * powerTypes.length)] }; nextRuneScore = score + Math.max(25, 42 - getLevel() * 2); announce(`${rune.type} rune appeared`); }
  function placePortal() { const open = openCells(); if (!open.length) return; const spot = open[Math.floor(Math.random() * open.length)]; portal = { ...spot }; showMilestone(`PORTAL OPEN · ENTER LEVEL ${getLevel() + 1}`); announce('A portal to the next level has appeared'); }
  function placeHazard() { const open = openCells(); if (!open.length) return; hazard = open[Math.floor(Math.random() * open.length)]; hazardTimer = 120; showMilestone('WILD MAGIC STORM'); }

  function startGame() {
    resetGame();
    beginAudio();
    state = 'countdown';
    countdown = 3;
    overlay.classList.remove('hidden');
    showCountdown();
    countdownTimer = setInterval(() => {
      countdown -= 1;
      if (countdown > 0) showCountdown();
      else { clearInterval(countdownTimer); state = 'playing'; overlay.classList.add('hidden'); announce('Quest started'); }
    }, 650);
  }

  function showCountdown() { overlayKicker.textContent = 'THE GROVE AWAKENS'; overlayTitle.textContent = String(countdown); overlayMessage.textContent = 'Prepare your next turn.'; startButton.innerHTML = '<span>✦</span> Begin'; }

  function endGame() {
    state = 'gameover';
    stopMusic();
    playTone(110, .32, 'sawtooth');
    if (score > highScore) { highScore = score; localStorage.setItem('runebound-high-score', String(highScore)); }
    overlayKicker.textContent = 'THE TRAIL ENDS HERE';
    overlayTitle.textContent = 'The grove claims you';
    overlayMessage.innerHTML = `Score <strong>${score.toString().padStart(4, '0')}</strong> · Trail <strong>${snake.length}</strong> · ${formatTime(runTime)}<br>Orbs gathered: <strong>${profile.missionProgress}</strong>. Gather yourself and try again.`;
    startButton.innerHTML = '<span>↻</span> Restart quest';
    overlay.classList.remove('hidden');
    announce(`Game over. Score ${score}`);
    updateHud();
  }

  function togglePause() {
    if (state === 'playing') {
      state = 'paused'; stopMusic(); pauseButton.textContent = '▶ Resume';
      overlayKicker.textContent = 'TIME HOLDS ITS BREATH'; overlayTitle.textContent = 'Quest paused'; overlayMessage.innerHTML = 'The grove is waiting.<br>Resume when you are ready.'; startButton.innerHTML = '<span>▶</span> Resume quest'; overlay.classList.remove('hidden'); announce('Quest paused');
    } else if (state === 'paused') {
      state = 'playing'; pauseButton.textContent = 'Ⅱ Pause'; overlay.classList.add('hidden'); beginAudio(); announce('Quest resumed');
    }
  }

  function requestDirection(next) { if (state !== 'playing') return; const opposite = vectors[direction].x + vectors[next].x === 0 && vectors[direction].y + vectors[next].y === 0; if (!opposite) nextDirection = next; }

  function formatTime(seconds) { const minutes = Math.floor(seconds / 60); return `${minutes}:${String(seconds % 60).padStart(2, '0')}`; }
  function recoverFromHit() { lives -= 1; snake = [{ x: 12, y: 13 }, { x: 11, y: 13 }, { x: 10, y: 13 }, { x: 9, y: 13 }]; direction = 'right'; nextDirection = 'right'; activePower = null; combo = 0; comboTimer = 0; burst(12, 13, '#f18351', 30); announce(`${lives} lives remaining`); if (navigator.vibrate) navigator.vibrate([70, 40, 70]); updateHud(); }

  function step() {
    direction = nextDirection;
    const level = getLevel();
    const wallsActive = level >= 1;
    let head = { x: snake[0].x + vectors[direction].x, y: snake[0].y + vectors[direction].y };
    head = { x: (head.x + grid) % grid, y: (head.y + grid) % grid };
    if (activePower === 'magnet' && food) { const pull = { x: food.x + Math.sign(head.x - food.x), y: food.y + Math.sign(head.y - food.y) }; if (pull.x >= 0 && pull.x < grid && pull.y >= 0 && pull.y < grid && !snake.some((part) => part.x === pull.x && part.y === pull.y)) food = pull; }
    const hitWall = wallsActive && isWallCell(head.x, head.y);
    const hitSelf = activePower !== 'ghost' && snake.some((part, index) => index > 0 && part.x === head.x && part.y === head.y);
    const hitHazard = hazard && head.x === hazard.x && head.y === hazard.y;
    const hitPortal = portal && head.x === portal.x && head.y === portal.y;
    if (hitWall || hitSelf || hitHazard) {
      if (activePower === 'shield') { activePower = null; powerTimer = 0; burst(snake[0].x, snake[0].y, '#7ce8d4', 20); direction = direction === 'left' ? 'right' : direction === 'right' ? 'left' : direction === 'up' ? 'down' : 'up'; nextDirection = direction; updateHud(); return; }
      if (lives > 1) { recoverFromHit(); return; }
      endGame(); return;
    }
    if (hitPortal) advanceThroughPortal();
    snake.unshift(head);
    if (head.x === food.x && head.y === food.y) {
      combo = comboTimer > 0 ? Math.min(9, combo + 1) : 1;
      comboTimer = 100;
      const comboPoints = Math.min(4, combo);
      score += (activePower === 'multiplier' ? 20 : 10) * comboPoints;
      profile.totalOrbs += 1;
      if (missionCatalog[profile.missionIndex].type === 'orbs') profile.missionProgress += 1;
      if (navigator.vibrate) navigator.vibrate(18);
      burst(food.x, food.y, '#f8d278', 24); playTone(520, .12, 'sine'); playTone(760, .16, 'sine', .08); placeFood();
      if (score >= levelThreshold(worldStage + 2) && !portal && worldStage < levelStages.length - 1) placePortal();
      if (score >= nextRuneScore && !rune) placeRune();
      if (score >= 150 && score % Math.max(80, 140 - getLevel() * 5) < 10 && !hazard) placeHazard();
    } else if (rune && head.x === rune.x && head.y === rune.y) {
      activatePower(rune.type); burst(rune.x, rune.y, '#7ce8d4', 30); rune = null; score += 5;
    } else snake.pop();
    if (missionCatalog[profile.missionIndex].type === 'length') profile.missionProgress = snake.length;
    if (missionCatalog[profile.missionIndex].type === 'score') profile.missionProgress = score;
    if (profile.missionProgress >= missionCatalog[profile.missionIndex].target) completeMission();
    if (activePower && --powerTimer <= 0) activePower = null;
    if (comboTimer > 0 && --comboTimer <= 0) combo = 0;
    if (hazard && --hazardTimer <= 0) hazard = null;
    saveProfile();
    updateHud();
  }

  function advanceThroughPortal() { worldStage = Math.min(levelStages.length - 1, worldStage + 1); currentLevel = getLevel(); portal = null; if (food && isWallCell(food.x, food.y)) placeFood(); if (rune && isWallCell(rune.x, rune.y)) placeRune(); showLevelUp(); }

  function completeMission() { const completed = missionCatalog[profile.missionIndex]; profile.missionIndex = (profile.missionIndex + 1) % missionCatalog.length; profile.missionProgress = 0; showMilestone(`OATH COMPLETE · ${completed.target} REACHED`); }
  function levelThreshold(level) { return level <= 1 ? 0 : (level - 1) * 75 + ((level - 1) * (level - 2) / 2) * 25; }
  function getLevel() { return Math.min(levelStages.length, worldStage + 1); }
  function levelProgressInfo() { const level = getLevel(); const start = levelThreshold(level); const end = levelThreshold(Math.min(levelStages.length, level + 1)); return { level, current: score - start, needed: Math.max(1, end - start) }; }
  function showLevelUp() { burst(snake[0].x, snake[0].y, '#e6b86b', 36); playTone(260, .14, 'triangle'); playTone(390, .18, 'triangle', .08); playTone(580, .3, 'triangle', .16); showMilestone(`LEVEL ${currentLevel} · ${levelStages[currentLevel - 1]}`); }

  function activatePower(type) { activePower = type; powerTimer = 80; if (powerTypes.indexOf(type) < 4) { spellInventory.add(type); unlockedSpells = Math.min(4, spellInventory.size); } if (type === 'growth') { snake.push(...snake.slice(-3).map((part) => ({ ...part }))); } if (type === 'teleport') { const open = openCells(); if (open.length) snake[0] = open[Math.floor(Math.random() * open.length)]; } updateSpells(); powerStatus.textContent = `${type.toUpperCase()} SPELL · 8 SEC`; statusOrb.classList.add('active'); playTone(310, .16, 'triangle'); playTone(620, .28, 'triangle', .1); announce(`${type} spell active`); }
  function castStoredSpell(index) { const type = powerTypes[index]; if (state === 'playing' && spellInventory.has(type) && !activePower) activatePower(type); }
  function showMilestone(message) { milestone.textContent = message; milestone.classList.remove('show'); requestAnimationFrame(() => milestone.classList.add('show')); setTimeout(() => milestone.classList.remove('show'), 1600); announce(message); }
  function updateSpells() { spellEls.forEach((element, index) => { element.classList.toggle('unlocked', index < unlockedSpells); if (index < unlockedSpells) element.querySelector('b').textContent = 'FOUND'; }); }
  function updateHud() { const progress = levelProgressInfo(); const level = progress.level; scoreEl.textContent = score.toString().padStart(4, '0'); highScoreEl.textContent = highScore.toString().padStart(4, '0'); difficultyEl.innerHTML = `${['I','II','III','IV','V','VI','VII','VIII','IX'][level - 1]} <small>${levelStages[level - 1]}</small>`; levelEl.textContent = String(level).padStart(2, '0'); $('#trail-length').textContent = String(snake.length).padStart(2, '0'); $('#run-level').textContent = String(level).padStart(2, '0'); $('#run-lives').textContent = `${'♥'.repeat(lives)}${'·'.repeat(3 - lives)}`; $('#run-combo').textContent = `x${Math.max(1, Math.min(9, combo))}`; $('#next-rune').textContent = portal ? 'PORTAL' : String(Math.max(1, nextRuneScore - score)).padStart(2, '0'); const mission = missionCatalog[profile.missionIndex]; $('#mission-text').textContent = `${mission.text} · SCORE ${score}`; $('#mission-progress').textContent = `${Math.min(profile.missionProgress, mission.target)} / ${mission.target}`; $('#mission-bar').style.width = `${Math.min(100, profile.missionProgress / mission.target * 100)}%`; const resonance = Math.min(100, progress.current / progress.needed * 100); resonanceEl.textContent = `${Math.round(resonance)}%`; resonanceBar.style.width = `${resonance}%`; $('#level-progress').style.width = `${Math.min(100, progress.current / progress.needed * 100)}%`; $('#level-caption').textContent = level === levelStages.length ? 'MAX LEVEL REACHED' : portal ? 'ENTER PORTAL TO ADVANCE' : `${progress.current} / ${progress.needed} TO PORTAL`; const mapLabel = level === 1 ? 'OPEN TRAINING' : `${Math.min(3, level - 1)} WALL${level >= 3 ? 'S' : ''} ACTIVE`; $('.field-meta').innerHTML = `24 × 24 GRID <i></i> ${mapLabel}`; if (activePower) powerStatus.textContent = `${activePower.toUpperCase()} SPELL · ${Math.ceil(powerTimer / 10)} SEC`; else { powerStatus.textContent = portal ? 'PORTAL READY' : rune ? `${rune.type.toUpperCase()} RUNE NEARBY` : (endlessMode ? 'ENDLESS GROVE READY' : 'NO ACTIVE SPELL'); statusOrb.classList.toggle('active', Boolean(rune || portal)); } }

  function burst(x, y, color, amount) { for (let i = 0; i < amount; i += 1) particles.push({ x: (x + .5) * cell, y: (y + .5) * cell, vx: (Math.random() - .5) * 3.8, vy: (Math.random() - .5) * 3.8, life: 1, color, size: Math.random() * 3 + 1 }); }
  function beginAudio() { audioContext = audioContext || new (window.AudioContext || window.webkitAudioContext)(); audioContext.resume(); if (!musicTimer && !muted) startMusic(); }
  function startMusic() { const notes = [196, 233, 261, 293, 261, 233]; let index = 0; musicTimer = setInterval(() => { if (state === 'playing') playTone(notes[index++ % notes.length], .38, 'sine'); }, 620); }
  function stopMusic() { clearInterval(musicTimer); musicTimer = null; }
  function playTone(frequency, duration, type = 'sine', delay = 0) { if (muted || !audioContext) return; const oscillator = audioContext.createOscillator(); const gain = audioContext.createGain(); oscillator.type = type; oscillator.frequency.value = frequency; gain.gain.setValueAtTime(.0001, audioContext.currentTime + delay); gain.gain.exponentialRampToValueAtTime(.045, audioContext.currentTime + delay + .01); gain.gain.exponentialRampToValueAtTime(.0001, audioContext.currentTime + delay + duration); oscillator.connect(gain).connect(audioContext.destination); oscillator.start(audioContext.currentTime + delay); oscillator.stop(audioContext.currentTime + delay + duration + .02); }

  function draw(time = 0) { ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.fillStyle = hazard ? 'rgba(87, 33, 105, .18)' : '#081923'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.strokeStyle = 'rgba(119, 188, 176, .075)'; for (let i = 1; i < grid; i += 1) { ctx.beginPath(); ctx.moveTo(i * cell, 0); ctx.lineTo(i * cell, canvas.height); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, i * cell); ctx.lineTo(canvas.width, i * cell); ctx.stroke(); } drawForest(); drawWalls(); drawFood(time); drawRune(time); drawPortal(time); drawHazard(time); snake.forEach((part, index) => drawDragon(part, index)); drawParticles(); requestAnimationFrame(draw); }
  function drawForest() { ctx.fillStyle = 'rgba(11, 50, 49, .34)'; for (let i = 0; i < 14; i += 1) { const x = (i * 97 + 22) % canvas.width; const h = 40 + (i * 37) % 100; ctx.beginPath(); ctx.moveTo(x, canvas.height); ctx.lineTo(x + 22, canvas.height - h); ctx.lineTo(x + 43, canvas.height); ctx.fill(); } }
  function drawWalls() { if (getLevel() < 1) return; ctx.fillStyle = 'rgba(230,184,107,.24)'; ctx.strokeStyle = '#e6b86b'; ctx.shadowColor = '#e6b86b'; ctx.shadowBlur = 8; ctx.lineWidth = 2; for (let y = 0; y < grid; y += 1) for (let x = 0; x < grid; x += 1) if (isWallCell(x, y)) { ctx.fillRect(x * cell + 2, y * cell + 2, cell - 4, cell - 4); } ctx.shadowBlur = 0; }
  function drawFood(time) { if (!food) return; const x = (food.x + .5) * cell; const y = (food.y + .5) * cell; ctx.save(); ctx.translate(x, y); ctx.rotate(time / 1000); ctx.scale(1 + Math.sin(time / 180) * .09, 1 + Math.sin(time / 180) * .09); ctx.fillStyle = '#f8d278'; ctx.shadowColor = '#f18351'; ctx.shadowBlur = 17; ctx.beginPath(); for (let i = 0; i < 8; i += 1) { const angle = i * Math.PI / 4; const radius = i % 2 ? 6 : 13; ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius); } ctx.closePath(); ctx.fill(); ctx.restore(); }
  function drawRune(time) { if (!rune) return; const x = (rune.x + .5) * cell; const y = (rune.y + .5) * cell; ctx.save(); ctx.translate(x, y); ctx.rotate(-time / 900); ctx.strokeStyle = '#7ce8d4'; ctx.shadowColor = '#7ce8d4'; ctx.shadowBlur = 18; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, -13); ctx.lineTo(11, 0); ctx.lineTo(0, 13); ctx.lineTo(-11, 0); ctx.closePath(); ctx.stroke(); ctx.restore(); }
  function drawPortal(time) { if (!portal) return; const x = (portal.x + .5) * cell; const y = (portal.y + .5) * cell; ctx.save(); ctx.translate(x, y); ctx.rotate(time / 700); ctx.strokeStyle = '#c07cff'; ctx.shadowColor = '#c07cff'; ctx.shadowBlur = 24; ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(0, 0, 11 + Math.sin(time / 180) * 2, 15, 0, 0, Math.PI * 2); ctx.stroke(); ctx.strokeStyle = '#7ce8d4'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(0, 0, 5, 10, 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); }
  function drawHazard(time) { if (!hazard) return; const x = (hazard.x + .5) * cell; const y = (hazard.y + .5) * cell; ctx.save(); ctx.translate(x, y); ctx.rotate(time / 400); ctx.strokeStyle = '#c07cff'; ctx.shadowColor = '#c07cff'; ctx.shadowBlur = 20; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-10, -10); ctx.lineTo(10, 10); ctx.moveTo(10, -10); ctx.lineTo(-10, 10); ctx.stroke(); ctx.restore(); }
  function drawDragon(part, index) { const palettes = { ember: ['#b6ffe3', '#47c9b0'], frost: ['#d8f6ff', '#7fb8e8'], storm: ['#fff0a8', '#bd8cff'], void: ['#f3d2ff', '#a94bd1'] }; const palette = palettes[skin] || palettes.ember; const x = (part.x + .5) * cell; const y = (part.y + .5) * cell; const head = index === 0; ctx.save(); ctx.translate(x, y); if (head) { const angle = { right: 0, down: Math.PI / 2, left: Math.PI, up: -Math.PI / 2 }[direction]; ctx.rotate(angle); ctx.fillStyle = `${palette[1]}33`; ctx.shadowColor = palette[1]; ctx.shadowBlur = 20; ctx.beginPath(); ctx.arc(0, 0, cell * .63, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = palette[0]; ctx.beginPath(); ctx.moveTo(11, 0); ctx.lineTo(-6, -10); ctx.lineTo(-4, 10); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#153e42'; ctx.beginPath(); ctx.arc(2, -4, 2, 0, Math.PI * 2); ctx.arc(2, 4, 2, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#e6b86b'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-4, -8); ctx.lineTo(-8, -13); ctx.moveTo(-4, 8); ctx.lineTo(-8, 13); ctx.stroke(); } else { const fade = Math.max(.25, 1 - index / snake.length); ctx.fillStyle = palette[1]; ctx.globalAlpha = fade; ctx.shadowColor = palette[1]; ctx.shadowBlur = 10; ctx.beginPath(); ctx.arc(0, 0, cell * (.42 + fade * .06), 0, Math.PI * 2); ctx.fill(); } ctx.restore(); }
  function drawParticles() { particles = particles.filter((particle) => particle.life > 0); particles.forEach((particle) => { particle.x += particle.vx; particle.y += particle.vy; particle.life = Math.max(0, particle.life - .025); ctx.globalAlpha = particle.life; ctx.fillStyle = particle.color; ctx.beginPath(); ctx.arc(particle.x, particle.y, particle.size * particle.life, 0, Math.PI * 2); ctx.fill(); }); ctx.globalAlpha = 1; }
  function loop(timestamp) { if (state === 'playing') { if (!lastSecond) lastSecond = timestamp; if (timestamp - lastSecond >= 1000) { runTime += 1; lastSecond = timestamp; } const base = Math.max(125, 220 - score * .42 - (getLevel() - 1) * 2) * speedScale; const modifier = activePower === 'speed' ? .72 : activePower === 'slow' ? 1.9 : activePower === 'freeze' ? 3.2 : 1; if (timestamp - lastStep > base * modifier) { step(); lastStep = timestamp; } } requestAnimationFrame(loop); }

  document.addEventListener('keydown', (event) => { if (keys[event.key]) { event.preventDefault(); requestDirection(keys[event.key]); } if (event.key === ' ' || event.key === 'p' || event.key === 'P') { event.preventDefault(); togglePause(); } if (/^[1-4]$/.test(event.key)) { event.preventDefault(); castStoredSpell(Number(event.key) - 1); } });
  canvas.addEventListener('touchstart', (event) => { touchStart = event.changedTouches[0]; }, { passive: true });
  canvas.addEventListener('touchend', (event) => { if (!touchStart) return; const touch = event.changedTouches[0]; const dx = touch.clientX - touchStart.clientX; const dy = touch.clientY - touchStart.clientY; if (Math.max(Math.abs(dx), Math.abs(dy)) > 24) requestDirection(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up')); touchStart = null; }, { passive: true });
  startButton.addEventListener('click', () => { if (state === 'countdown') return; state === 'paused' ? togglePause() : startGame(); });
  pauseButton.addEventListener('click', togglePause);
  restartButton.addEventListener('click', startGame);
  muteButton.addEventListener('click', () => { muted = !muted; muteButton.textContent = muted ? '×' : '♫'; muteButton.setAttribute('aria-label', muted ? 'Unmute magic sounds' : 'Mute magic sounds'); if (muted) stopMusic(); else if (state === 'playing') beginAudio(); });
  settingsButton.addEventListener('click', () => settingsPanel.classList.toggle('open'));
  settingsPanel.querySelector('button').addEventListener('click', () => settingsPanel.classList.remove('open'));
  difficultySetting.addEventListener('change', () => { speedScale = Math.max(0.9, Number(difficultySetting.value)); localStorage.setItem('runebound-speed-scale', String(speedScale)); });
  skinSetting.addEventListener('change', () => { const required = { ember: 0, frost: 25, storm: 75, void: 150 }; const selected = skinSetting.value; if (profile.totalOrbs >= required[selected]) { skin = selected; profile.skin = selected; if (!profile.unlockedSkins.includes(selected)) profile.unlockedSkins.push(selected); saveProfile(); announce(`${selected} dragon selected`); } else { skinSetting.value = skin; announce(`Gather ${required[selected] - profile.totalOrbs} more orbs to unlock that dragon`); } });
  modeSetting.addEventListener('change', () => { endlessMode = modeSetting.value === 'endless'; localStorage.setItem('runebound-endless-mode', String(endlessMode)); $('.field-meta').innerHTML = `24 × 24 GRID <i></i> ${endlessMode ? 'ENDLESS TRAIL' : 'BOUNDARY ACTIVE'}`; updateHud(); announce(endlessMode ? 'Endless Grove enabled' : 'Classic boundary enabled'); });
  $('#motion-setting').addEventListener('change', (event) => document.body.classList.toggle('reduced-motion', event.target.checked));
  $('#contrast-setting').addEventListener('change', (event) => document.body.classList.toggle('high-contrast', event.target.checked));
  document.querySelectorAll('.mobile-pad button').forEach((button) => button.addEventListener('click', () => requestDirection(button.dataset.direction)));
  spellEls.forEach((element, index) => { element.setAttribute('role', 'button'); element.setAttribute('tabindex', '0'); element.setAttribute('aria-label', `Cast spell ${index + 1}`); element.addEventListener('click', () => castStoredSpell(index)); element.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') castStoredSpell(index); }); });

  resetGame();
  draw();
  requestAnimationFrame(loop);
})();