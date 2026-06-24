"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// ─── Constants & I18N ──────────────────────────────────────
const I18N = {
  en: {
    loadingStep0: "🌱 Tilling the soil...",
    loadingStep1: "🌾 Deciphering chain history...",
    loadingStep2: "✨ Sowing seeds...",
    loadingStep3: "🔮 Summoning spirits...",
    loadingStep4: "🌟 Forming the farm...",
    farmTitle0: "A Newly Sprouted Seedling",
    farmDesc0: "Your journey on Base has just begun.",
    farmTitle1: "A Budding Patch of Hope",
    farmDesc1: "Roots are slowly taking hold.",
    farmTitle2: "A Thriving Frontier",
    farmDesc2: "Expanding influence day by day.",
    farmTitle3: "An Established Homestead",
    farmDesc3: "Leaving solid footprints on Base.",
    farmTitle4: "A Wealthy Grand Estate",
    farmDesc4: "A testament to long-term Base pioneering.",
    farmTitle5: "The Legendary Domain",
    farmDesc5: "One who has carved the deepest footprints on Base.",
    spiritState0: "Slumbering Spirit",
    spiritState1: "Awakening Spirit",
    spiritState2: "Active Spirit",
    spiritState3: "Blazing Spirit",
    spiritState4: "Transcendent Spirit",
    heroTitle1: "Transform your Base",
    heroTitle2: "footprint into a Spirit",
    heroSub: "Turn your on-chain activity on the Base network into a visual farm and spirit. No wallet connection required.",
    inputLabel: "Wallet Address",
    inputPlaceholder: "0x...",
    securityText: "Read-only — No wallet connection or signature required",
    btnObserve: "🌾 Trace Footprints",
    errorInput: "Please enter a valid 0x... address",
    errorFetch: "Failed to fetch data. Make sure it's a valid Base address.",
    tickerLabel: "Recently Observed Farms",
    backBtn: "← Back",
    backBtnRetry: "← Back and retry",
    todayValueLabel: "Today's Est. BASE Yield",
    todayTxLabel: "Today",
    contractsLabel: "Contracts",
    growthScoreLabel: "Growth Score",
    levelLabel: "Pioneer Level",
    tokenTypesLabel: "Token Types",
    buildingHouse: "Main House",
    descHouse: "The center of your Base farm. Evolves with your Growth Score.",
    buildingBarn: "Barn",
    descBarnRich: "Proof of a wealthy farm.",
    descBarnNeed: "Builds with more activity.",
    buildingSilo: "Silo",
    descSiloRich: "A diverse farmer holding many token types.",
    descSiloNeed: "Unlocks at Score 60.",
    buildingWell: "Well",
    descWellRich: "Maintaining a stable ETH balance.",
    descWellNeed: "Unlocks at Score 40.",
    analysisTitle: "On-Chain Analysis",
    accordionLabel: "View detailed activity records",
    statEthBalance: "Current ETH Balance",
    statSpiritState: "Spirit State",
    btnShare: "🌿 Cast this Farm",
    shareModalTitle: "🌿 Share your Farm",
    btnCastWarpcast: "Cast on Warpcast",
    btnCopyText: "📋 Copy Text",
    btnCopied: "✓ Copied!",
    btnClose: "Close",
    shareTextPrefix: "My Base Farm 🌾\n\nToday's Spirit: ",
    shareTextYield: "\nEst. Yield: $",
    shareTextLevel: "\nPioneer Level: Lv.",
    shareTextSuffix: "\n\nWhat does your farm look like? 👇\nhttps://base-farm.vercel.app"
  },
  jp: {
    loadingStep0: "🌱 土を耕しています...",
    loadingStep1: "🌾 チェーン履歴を読み解いています...",
    loadingStep2: "✨ 種を蒔いています...",
    loadingStep3: "🔮 精霊を呼び出しています...",
    loadingStep4: "🌟 農場を形成しています...",
    farmTitle0: "産声を上げたばかりの新芽",
    farmDesc0: "Base上での旅が始まったばかりです。",
    farmTitle1: "芽吹いた希望の農地",
    farmDesc1: "少しずつ根を張り始めています。",
    farmTitle2: "成長中の活気ある開拓地",
    farmDesc2: "日に日に勢力を広げています。",
    farmTitle3: "確かな実績を持つ農場",
    farmDesc3: "Base上に確かな足跡を残しています。",
    farmTitle4: "古参の豊かな大農場",
    farmDesc4: "長きにわたりBaseを開拓してきた証です。",
    farmTitle5: "伝説の農場主",
    farmDesc5: "Base上でもっとも深い足跡を刻む者。",
    spiritState0: "眠れる精霊",
    spiritState1: "目覚めの精霊",
    spiritState2: "活発な精霊",
    spiritState3: "燃え盛る精霊",
    spiritState4: "超越した精霊",
    heroTitle1: "あなたのBase上の",
    heroTitle2: "足跡を精霊に変換",
    heroSub: "Baseネットワーク上のオンチェーン活動を、農場と精霊のビジュアルに変換します。ウォレット接続は一切不要です。",
    inputLabel: "ウォレットアドレス",
    inputPlaceholder: "0x...",
    securityText: "読み取り専用 — ウォレットの接続・署名は一切不要です",
    btnObserve: "🌾 足跡を辿る",
    errorInput: "正しい0x...アドレスを入力してください",
    errorFetch: "データの取得に失敗しました。",
    tickerLabel: "最近観測された農場",
    backBtn: "← 戻る",
    backBtnRetry: "← 戻って再入力する",
    todayValueLabel: "今日の推定BASE獲得期待値",
    todayTxLabel: "本日",
    contractsLabel: "コントラクト",
    growthScoreLabel: "Growth Score",
    levelLabel: "開拓レベル",
    tokenTypesLabel: "トークン種類",
    buildingHouse: "本宅",
    descHouse: "Base農場の中心です。Growth Scoreに応じて進化します。",
    buildingBarn: "納屋",
    descBarnRich: "豊かな農場の証拠です。",
    descBarnNeed: "もっと活動すると建設されます。",
    buildingSilo: "サイロ",
    descSiloRich: "多様なトークンを保有する農場主です。",
    descSiloNeed: "Score 60で解放されます。",
    buildingWell: "井戸",
    descWellRich: "安定したETHバランスを維持しています。",
    descWellNeed: "Score 40で解放されます。",
    analysisTitle: "オンチェーン解析",
    accordionLabel: "詳細な活動記録を見る",
    statEthBalance: "現在のETH残高",
    statSpiritState: "精霊の状態",
    btnShare: "🌿 この農場をCastする",
    shareModalTitle: "🌿 農場をシェアする",
    btnCastWarpcast: "Warpcastでキャストする",
    btnCopyText: "📋 テキストをコピーする",
    btnCopied: "✓ コピーしました！",
    btnClose: "閉じる",
    shareTextPrefix: "私のBase農場 🌾\n\n今日の精霊: ",
    shareTextYield: "\n推定獲得期待値: $",
    shareTextLevel: "\n開拓レベル: Lv.",
    shareTextSuffix: "\n\nあなたの農場はどんな姿？ 👇\nhttps://base-farm.vercel.app"
  }
};

const TICKER_DEMOS = [
  { addr: "0xd8dA6B...96045", level: 88, value: "$4.21" },
  { addr: "0xAb5801...bA86", level: 34, value: "$1.07" },
  { addr: "0x742d35...d4E2", level: 61, value: "$2.88" },
  { addr: "0x1f9840...5dC2", level: 112, value: "$6.54" },
  { addr: "0xBE0eB5...3378", level: 7, value: "$0.33" },
  { addr: "0x47ac0F...6F82", level: 229, value: "$9.99" },
];

const FARM_TITLES = [
  { min: 0,   max: 10,  icon: "🌱", titleKey: "farmTitle0", descKey: "farmDesc0" },
  { min: 11,  max: 30,  icon: "🌿", titleKey: "farmTitle1", descKey: "farmDesc1" },
  { min: 31,  max: 60,  icon: "🌻", titleKey: "farmTitle2", descKey: "farmDesc2" },
  { min: 61,  max: 80,  icon: "🏡", titleKey: "farmTitle3", descKey: "farmDesc3" },
  { min: 81,  max: 95,  icon: "🏰", titleKey: "farmTitle4", descKey: "farmDesc4" },
  { min: 96,  max: Infinity, icon: "👑", titleKey: "farmTitle5", descKey: "farmDesc5" },
];

const SPIRIT_STATES = [
  { min: 0,  max: 2,  nameKey: "spiritState0", color1: "#3344aa", color2: "#223399", pulse: 0.3 },
  { min: 3,  max: 7,  nameKey: "spiritState1", color1: "#5566cc", color2: "#4455bb", pulse: 0.5 },
  { min: 8,  max: 15, nameKey: "spiritState2", color1: "#7b6ef6", color2: "#4fc3f7", pulse: 0.75 },
  { min: 16, max: 30, nameKey: "spiritState3", color1: "#f59e0b", color2: "#ef4444", pulse: 1.0 },
  { min: 31, max: Infinity, nameKey: "spiritState4", color1: "#ffd700", color2: "#ff6b6b", pulse: 1.0 },
];

// ─── Helpers ────────────────────────────────────────────────
function shortenAddress(addr) {
  if (!addr) return "";
  return addr.slice(0, 6) + "..." + addr.slice(-4);
}

function weiToEth(wei) {
  return parseFloat(wei) / 1e18;
}

function estimateDailyValue(txs) {
  const now = Math.floor(Date.now() / 1000);
  const dayAgo = now - 86400;
  const todayTxs = txs.filter((tx) => parseInt(tx.timeStamp) >= dayAgo);
  let totalGasEth = 0;
  todayTxs.forEach((tx) => {
    const gasUsed = parseInt(tx.gasUsed || tx.gas || 0);
    const gasPrice = parseInt(tx.gasPrice || 0);
    totalGasEth += (gasUsed * gasPrice) / 1e18;
  });
  const REWARD_FACTOR = 12;
  const ETH_PRICE_USD = 3200;
  return (totalGasEth * REWARD_FACTOR * ETH_PRICE_USD).toFixed(2);
}

function getTodayTxs(txs) {
  const now = Math.floor(Date.now() / 1000);
  const dayAgo = now - 86400;
  return txs.filter((tx) => parseInt(tx.timeStamp) >= dayAgo);
}

function getUniqueContracts(txs) {
  const contracts = new Set();
  txs.forEach((tx) => { if (tx.to) contracts.add(tx.to.toLowerCase()); });
  return contracts.size;
}

function getSpiritState(todayCount) {
  return SPIRIT_STATES.find((s) => todayCount >= s.min && todayCount <= s.max) || SPIRIT_STATES[0];
}

function getFarmTitle(score) {
  return FARM_TITLES.find((t) => score >= t.min && score <= t.max) || FARM_TITLES[0];
}

function calculateGrowthScore(txs, uniqueTokenCount) {
  const now = Math.floor(Date.now() / 1000);
  const thirtyDaysAgo = now - 30 * 86400;
  const recentTxs = txs.filter((tx) => parseInt(tx.timeStamp) >= thirtyDaysAgo);
  
  const activeDaysSet = new Set();
  recentTxs.forEach(tx => {
    const date = new Date(parseInt(tx.timeStamp) * 1000).toDateString();
    activeDaysSet.add(date);
  });
  const activeDaysScore = Math.min(30, (activeDaysSet.size / 20) * 30);
  const txScore = Math.min(30, (recentTxs.length / 100) * 30);
  const uniqueContracts = getUniqueContracts(recentTxs);
  const contractsScore = Math.min(20, (uniqueContracts / 10) * 20);
  const tokensScore = Math.min(20, (uniqueTokenCount / 5) * 20); // Re-weighted to 20 to keep max 100
  
  return Math.floor(activeDaysScore + txScore + contractsScore + tokensScore);
}

// ─── Canvas Drawings ────────────────────────────────────────
function drawSpirit(canvas, spiritState, activityLevel) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const W = canvas.width;
  const H = canvas.height;
  const cx = W / 2;
  const cy = H / 2;
  const t = Date.now() / 1000;

  ctx.clearRect(0, 0, W, H);

  const pulse = 0.85 + 0.15 * Math.sin(t * 2 * Math.PI * spiritState.pulse);
  const r = (W * 0.38) * pulse;

  for (let i = 3; i >= 1; i--) {
    const gr = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r * (1 + i * 0.35));
    gr.addColorStop(0, spiritState.color1 + "60");
    gr.addColorStop(1, "transparent");
    ctx.fillStyle = gr;
    ctx.beginPath();
    ctx.arc(cx, cy, r * (1 + i * 0.35), 0, Math.PI * 2);
    ctx.fill();
  }

  const grad = ctx.createRadialGradient(cx - r * 0.2, cy - r * 0.2, r * 0.05, cx, cy, r);
  grad.addColorStop(0, "#ffffff");
  grad.addColorStop(0.25, spiritState.color1);
  grad.addColorStop(0.7, spiritState.color2);
  grad.addColorStop(1, spiritState.color2 + "aa");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  const particleCount = Math.min(3 + activityLevel, 18);
  for (let i = 0; i < particleCount; i++) {
    const angle = (i / particleCount) * Math.PI * 2 + t * (i % 2 === 0 ? 1.2 : -0.8);
    const dist = r * (0.9 + 0.5 * Math.sin(t * 1.5 + i));
    const px = cx + Math.cos(angle) * dist;
    const py = cy + Math.sin(angle) * dist;
    const pr = 2 + 2 * Math.abs(Math.sin(t + i));
    const pg = ctx.createRadialGradient(px, py, 0, px, py, pr * 2);
    pg.addColorStop(0, "#ffffff");
    pg.addColorStop(0.5, spiritState.color1);
    pg.addColorStop(1, "transparent");
    ctx.fillStyle = pg;
    ctx.beginPath();
    ctx.arc(px, py, pr * 2, 0, Math.PI * 2);
    ctx.fill();
  }

  const eyeY = cy - r * 0.12;
  const eyeOffX = r * 0.22;
  const eyeR = r * 0.07;
  ctx.fillStyle = "rgba(255,255,255,0.95)";
  ctx.beginPath(); ctx.arc(cx - eyeOffX, eyeY, eyeR, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + eyeOffX, eyeY, eyeR, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = spiritState.color2 === "#223399" ? "#001166" : "#000033";
  ctx.beginPath(); ctx.arc(cx - eyeOffX + eyeR * 0.2, eyeY + eyeR * 0.1, eyeR * 0.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + eyeOffX + eyeR * 0.2, eyeY + eyeR * 0.1, eyeR * 0.5, 0, Math.PI * 2); ctx.fill();

  const smileY = cy + r * 0.18;
  ctx.strokeStyle = "rgba(255,255,255,0.9)";
  ctx.lineWidth = r * 0.05;
  ctx.lineCap = "round";
  ctx.beginPath();
  if (activityLevel === 0) {
    ctx.moveTo(cx - r * 0.15, smileY);
    ctx.lineTo(cx + r * 0.15, smileY);
  } else if (activityLevel <= 5) {
    ctx.arc(cx, smileY - r * 0.05, r * 0.18, 0.2, Math.PI - 0.2);
  } else {
    ctx.arc(cx, smileY - r * 0.1, r * 0.25, 0.1, Math.PI - 0.1);
  }
  ctx.stroke();

  const shine = ctx.createRadialGradient(cx - r * 0.28, cy - r * 0.28, 0, cx - r * 0.28, cy - r * 0.28, r * 0.35);
  shine.addColorStop(0, "rgba(255,255,255,0.4)");
  shine.addColorStop(1, "transparent");
  ctx.fillStyle = shine;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
}

// ─── STORYBOOK ILLUSTRATION OVERHAUL (DAYTIME / WARM) ───
function drawFarm(canvas, score) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const W = canvas.width;
  const H = canvas.height;
  const horizonY = H * 0.45;

  ctx.clearRect(0, 0, W, H);
  const t = Date.now() / 1000;
  const pseudoRandom = (seed) => {
    let x = Math.sin(seed + 1) * 10000;
    return x - Math.floor(x);
  };

  // 1. STORYBOOK WARM SKY
  const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
  skyGrad.addColorStop(0, "#8bb2d9"); // Soft blue at top
  skyGrad.addColorStop(0.6, "#e8cd9c"); // Warm yellow/peach
  skyGrad.addColorStop(1, "#f4dfb6"); // Bright warm horizon
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, W, horizonY);

  // Soft Sun
  const sunX = W * 0.15;
  const sunY = horizonY * 0.4;
  const sunGlow = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, 120);
  sunGlow.addColorStop(0, "rgba(255, 255, 255, 1)");
  sunGlow.addColorStop(0.3, "rgba(255, 240, 180, 0.8)");
  sunGlow.addColorStop(1, "transparent");
  ctx.fillStyle = sunGlow;
  ctx.beginPath(); ctx.arc(sunX, sunY, 120, 0, Math.PI * 2); ctx.fill();

  // Distant clouds
  ctx.fillStyle = "rgba(255, 245, 220, 0.6)";
  ctx.beginPath();
  ctx.arc(W*0.7, horizonY - 40, 20, 0, Math.PI*2);
  ctx.arc(W*0.75, horizonY - 45, 30, 0, Math.PI*2);
  ctx.arc(W*0.82, horizonY - 35, 25, 0, Math.PI*2);
  ctx.fill();

  // Background Mountains / Hills
  ctx.fillStyle = "#cca272";
  ctx.beginPath();
  ctx.moveTo(0, horizonY);
  ctx.quadraticCurveTo(W * 0.25, horizonY - 60, W * 0.6, horizonY);
  ctx.fill();
  ctx.fillStyle = "#b58c5c";
  ctx.beginPath();
  ctx.moveTo(W * 0.4, horizonY);
  ctx.quadraticCurveTo(W * 0.7, horizonY - 80, W, horizonY);
  ctx.lineTo(W, horizonY);
  ctx.fill();

  // 2. WHEAT FIELDS (Midground Base)
  const groundGrad = ctx.createLinearGradient(0, horizonY, 0, H);
  groundGrad.addColorStop(0, "#d8a643"); // Golden yellow top
  groundGrad.addColorStop(0.5, "#cc8c2b"); // Richer gold mid
  groundGrad.addColorStop(1, "#8a661f"); // Darker dirt/wheat base
  ctx.fillStyle = groundGrad;
  ctx.fillRect(0, horizonY, W, H - horizonY);

  // 3. ORGANIC DIRT PATH
  const pathGrad = ctx.createLinearGradient(0, horizonY, 0, H);
  pathGrad.addColorStop(0, "#ad8860");
  pathGrad.addColorStop(1, "#7d5e41");
  ctx.fillStyle = pathGrad;
  ctx.beginPath();
  ctx.moveTo(W * 0.5, horizonY);
  ctx.bezierCurveTo(W * 0.7, H * 0.6, W * 0.2, H * 0.8, W * 0.3, H);
  ctx.lineTo(W * 0.5, H);
  ctx.bezierCurveTo(W * 0.4, H * 0.8, W * 0.8, H * 0.6, W * 0.55, horizonY);
  ctx.fill();

  // Path texture (stones/dirt)
  ctx.fillStyle = "rgba(0,0,0,0.05)";
  for(let i=0; i<40; i++) {
    const px = W*0.3 + pseudoRandom(i)*W*0.4;
    const py = horizonY + pseudoRandom(i*2)*(H-horizonY);
    ctx.beginPath(); ctx.ellipse(px, py, 4+pseudoRandom(i)*6, 2+pseudoRandom(i)*3, 0, 0, Math.PI*2); ctx.fill();
  }

  // 4. DRAWING UTILS
  function drawTree(x, y, scale) {
    // Trunk
    ctx.fillStyle = "#5c402b";
    ctx.fillRect(x - 4 * scale, y - 20 * scale, 8 * scale, 25 * scale);
    
    // Foliage (Warm green/yellow)
    const leafGrad = ctx.createRadialGradient(x - 5*scale, y - 35*scale, 2*scale, x, y - 25*scale, 30*scale);
    leafGrad.addColorStop(0, "#a0b34d"); // Sunlit
    leafGrad.addColorStop(0.6, "#5c7a29"); // Mid
    leafGrad.addColorStop(1, "#294010"); // Shadow
    ctx.fillStyle = leafGrad;
    
    ctx.beginPath(); ctx.arc(x, y - 30 * scale, 18 * scale, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x - 12 * scale, y - 22 * scale, 15 * scale, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + 12 * scale, y - 25 * scale, 14 * scale, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x, y - 42 * scale, 12 * scale, 0, Math.PI * 2); ctx.fill();
  }

  function drawBuilding(x, y, scale, type) {
    const w = 110 * scale;
    const h = 70 * scale;
    
    // Drop shadow
    ctx.fillStyle = "rgba(80, 50, 20, 0.3)";
    ctx.beginPath(); ctx.ellipse(x + w*0.3, y, w*0.8, w*0.2, 0, 0, Math.PI*2); ctx.fill();

    // Walls (Stucco/Wood)
    const wallCol = type === "rich" ? "#e6dac3" : "#c4b59b";
    const wallShadow = type === "rich" ? "#c7b79d" : "#a3957b";
    
    // Front Wall
    ctx.fillStyle = wallCol;
    ctx.fillRect(x - w/2, y - h, w, h);
    
    // Side Wall (shaded)
    ctx.fillStyle = wallShadow;
    ctx.beginPath(); ctx.moveTo(x + w/2, y - h); ctx.lineTo(x + w*0.7, y - h*0.85); ctx.lineTo(x + w*0.7, y*1.05); ctx.lineTo(x + w/2, y); ctx.fill();

    // Red Tile Roof
    const roofBase = type === "rich" ? "#c24e3c" : "#8c3b2d";
    const roofLight = type === "rich" ? "#d96450" : "#a64938";
    const roofDark = type === "rich" ? "#8f3020" : "#5e2116";

    // Front Roof (Slanted)
    ctx.fillStyle = roofBase;
    ctx.beginPath(); ctx.moveTo(x - w * 0.55, y - h); ctx.lineTo(x, y - h - h * 0.6); ctx.lineTo(x + w * 0.55, y - h); ctx.fill();
    
    // Roof texture (tiles)
    ctx.strokeStyle = roofDark; ctx.lineWidth = 1;
    for(let i=-5; i<=5; i++) {
       ctx.beginPath(); ctx.moveTo(x + i*(w*0.08), y - h); ctx.lineTo(x + i*(w*0.05), y - h - h*0.5); ctx.stroke();
    }

    // Side Roof
    ctx.fillStyle = roofDark;
    ctx.beginPath(); ctx.moveTo(x + w*0.55, y - h); ctx.lineTo(x, y - h - h*0.6); ctx.lineTo(x + w*0.2, y - h - h*0.7); ctx.lineTo(x + w*0.7, y - h*0.85); ctx.fill();

    // Chimney
    if (type === "rich") {
      ctx.fillStyle = "#8a7e72";
      ctx.fillRect(x - w*0.3, y - h - h*0.8, w*0.12, h*0.5);
      ctx.fillStyle = "#63584e";
      ctx.fillRect(x - w*0.3 + w*0.12, y - h - h*0.8, w*0.05, h*0.45);
    }

    // Door and Porch
    ctx.fillStyle = "#4a2a18";
    ctx.fillRect(x - w*0.1, y - h*0.4, w*0.2, h*0.4);
    
    if (type === "rich") {
      // Porch roof
      ctx.fillStyle = roofLight;
      ctx.beginPath(); ctx.moveTo(x - w*0.4, y - h*0.45); ctx.lineTo(x + w*0.4, y - h*0.45); ctx.lineTo(x + w*0.45, y - h*0.35); ctx.lineTo(x - w*0.45, y - h*0.35); ctx.fill();
      // Porch pillars
      ctx.fillStyle = "#5c402b";
      ctx.fillRect(x - w*0.4, y - h*0.35, 4, h*0.35);
      ctx.fillRect(x + w*0.4 - 4, y - h*0.35, 4, h*0.35);
    }

    // Windows
    const winCol = "#38291f";
    const winGlass = "rgba(180,210,230,0.6)"; // Sky reflection
    const drawWindow = (wx, wy) => {
      ctx.fillStyle = winCol; ctx.fillRect(wx, wy, w*0.15, h*0.25);
      ctx.fillStyle = winGlass; ctx.fillRect(wx + 2, wy + 2, w*0.15 - 4, h*0.25 - 4);
      ctx.fillStyle = winCol; ctx.fillRect(wx + w*0.07, wy, 2, h*0.25); ctx.fillRect(wx, wy + h*0.12, w*0.15, 2);
    };
    drawWindow(x - w*0.35, y - h*0.35);
    drawWindow(x + w*0.2, y - h*0.35);
    
    // Attic window
    drawWindow(x - w*0.075, y - h - h*0.35);
  }

  function drawWindmill(x, y, scale) {
    const bw = 50 * scale, bh = 130 * scale;
    
    // Shadow
    ctx.fillStyle = "rgba(80, 50, 20, 0.3)";
    ctx.beginPath(); ctx.ellipse(x + bw*0.5, y, bw*1.2, bw*0.3, 0, 0, Math.PI*2); ctx.fill();

    // Body (Rustic Wood/Stone)
    const g = ctx.createLinearGradient(x - bw/2, 0, x + bw/2, 0);
    g.addColorStop(0, "#7a6b5d"); g.addColorStop(0.3, "#a89b8c"); g.addColorStop(1, "#54463a");
    ctx.fillStyle = g; 
    ctx.beginPath(); ctx.moveTo(x - bw*0.6, y); ctx.lineTo(x - bw*0.3, y - bh); ctx.lineTo(x + bw*0.3, y - bh); ctx.lineTo(x + bw*0.6, y); ctx.fill();
    
    // Roof
    ctx.fillStyle = "#8a3b2b";
    ctx.beginPath(); ctx.moveTo(x - bw*0.4, y - bh); ctx.lineTo(x, y - bh - 40*scale); ctx.lineTo(x + bw*0.4, y - bh); ctx.fill();

    // Blades (Lattice)
    const bladeLen = 90 * scale;
    const bladeW = 20 * scale;
    ctx.save(); ctx.translate(x, y - bh - 10*scale); ctx.rotate(t * 0.5);
    ctx.fillStyle = "#d1c2a3"; // Canvas sails
    ctx.strokeStyle = "#4a3320"; ctx.lineWidth = 2; // Wooden frame
    
    for (let i = 0; i < 4; i++) {
      ctx.save(); ctx.rotate(i * Math.PI / 2);
      // Sail
      ctx.fillRect(4*scale, 10*scale, bladeW, bladeLen);
      ctx.strokeRect(4*scale, 10*scale, bladeW, bladeLen);
      // Lattice lines
      ctx.beginPath();
      for(let j=1; j<5; j++) { ctx.moveTo(4*scale, 10*scale + j*18*scale); ctx.lineTo(4*scale + bladeW, 10*scale + j*18*scale); }
      ctx.stroke();
      // Main beam
      ctx.fillStyle = "#4a3320";
      ctx.fillRect(-2*scale, 0, 4*scale, bladeLen + 15*scale);
      ctx.restore();
    }
    // Hub
    ctx.beginPath(); ctx.arc(0, 0, 6*scale, 0, Math.PI*2); ctx.fill();
    ctx.restore();
  }

  function drawDenseWheat(xCenter, yTop, width, rows) {
    // We draw wheat stalks using thousands of small strokes for a textured look
    const density = score < 40 ? 0.3 : (score < 80 ? 0.6 : 1.0);
    const stalkCount = Math.floor(width * rows * density * 0.5);
    
    ctx.lineWidth = 2;
    for(let i=0; i<stalkCount; i++) {
       const px = xCenter - width*0.5 + pseudoRandom(i)*width;
       const rowRatio = pseudoRandom(i*2); // 0 to 1
       const py = yTop + rowRatio * rows * 20;
       
       // Wheat colors (golden)
       const colorBase = ["#e6b822", "#d9a111", "#f2cd41", "#c7860c"];
       ctx.strokeStyle = colorBase[Math.floor(pseudoRandom(i*3) * colorBase.length)];
       
       const height = 15 + pseudoRandom(i*4)*15;
       const sway = Math.sin(t*2 + px*0.01)*5 + (pseudoRandom(i*5)-0.5)*10;
       
       ctx.beginPath();
       ctx.moveTo(px, py);
       ctx.quadraticCurveTo(px + sway*0.5, py - height*0.5, px + sway, py - height);
       ctx.stroke();
       
       // Wheat head
       ctx.fillStyle = ctx.strokeStyle;
       ctx.beginPath(); ctx.ellipse(px + sway, py - height, 2, 4, sway*0.1, 0, Math.PI*2); ctx.fill();
    }
  }

  // Foreground elements
  function drawForeground() {
    // Fence along the bottom
    if (score >= 40) {
       ctx.fillStyle = "#523c28";
       for(let i=0; i<W/50; i++) {
         const fx = i * 50 + 20;
         if (fx > W*0.35 && fx < W*0.55) continue; // Gap for path
         // Post
         ctx.fillRect(fx, H - 35, 8, 40);
         // Rails
         if (i > 0 && !(fx > W*0.35 && fx < W*0.65)) {
           ctx.fillRect(fx - 50, H - 25, 50, 4);
           ctx.fillRect(fx - 50, H - 15, 50, 4);
         }
       }
    }
    
    // Flowers / Weeds
    for(let i=0; i<40; i++) {
       const fx = pseudoRandom(i) * W;
       const fy = H - pseudoRandom(i*2) * 20;
       if (fx > W*0.3 && fx < W*0.6) continue; // Path gap
       ctx.fillStyle = "#3d6621";
       ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(fx - 5, fy - 15); ctx.lineTo(fx + 5, fy - 10); ctx.fill();
       if (score >= 60 && pseudoRandom(i*3) > 0.5) {
         // Flower head
         const cols = ["#fff", "#8ab4f8", "#f28b82"];
         ctx.fillStyle = cols[Math.floor(pseudoRandom(i*4)*3)];
         ctx.beginPath(); ctx.arc(fx - 5, fy - 15, 3, 0, Math.PI*2); ctx.fill();
       }
    }
  }

  // 5. PHASE RENDERING
  if (score < 20) {
    drawTree(W * 0.15, horizonY + 20, 0.6);
    drawTree(W * 0.85, horizonY + 15, 0.5);
    drawBuilding(W * 0.7, horizonY + 60, 0.5, "poor");
    drawDenseWheat(W * 0.3, horizonY + 50, 200, 3);
  } else if (score < 60) {
    drawTree(W * 0.1, horizonY + 20, 0.9);
    drawTree(W * 0.9, horizonY + 15, 0.8);
    drawTree(W * 0.25, horizonY + 30, 0.7);
    drawBuilding(W * 0.7, horizonY + 60, 0.8, "rich");
    drawDenseWheat(W * 0.2, horizonY + 50, 250, 4);
    drawDenseWheat(W * 0.85, horizonY + 70, 150, 3);
  } else if (score < 80) {
    drawTree(W * 0.05, horizonY + 20, 1.2);
    drawTree(W * 0.95, horizonY + 15, 1.0);
    drawTree(W * 0.25, horizonY + 30, 0.9);
    drawWindmill(W * 0.85, horizonY + 40, 0.7);
    drawBuilding(W * 0.6, horizonY + 70, 1.0, "rich");
    drawDenseWheat(W * 0.2, horizonY + 60, 300, 5);
    drawDenseWheat(W * 0.9, horizonY + 80, 200, 4);
  } else {
    // Legendary Domain (Matches Reference tightly)
    drawTree(W * 0.05, horizonY + 20, 1.4);
    drawTree(W * 0.95, horizonY + 15, 1.2);
    drawTree(W * 0.15, horizonY + 40, 1.0);
    
    drawWindmill(W * 0.8, horizonY + 50, 1.0);
    drawBuilding(W * 0.45, horizonY + 80, 1.3, "rich");
    
    // Massive wheat fields wrapping around
    drawDenseWheat(W * 0.2, horizonY + 60, 400, 6);
    drawDenseWheat(W * 0.85, horizonY + 70, 300, 5);
    drawDenseWheat(W * 0.5, horizonY + 120, W, 4); // Foreground crop edges
  }

  drawForeground();
}

function generateShareCanvas(canvas, data, langObj) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const W = canvas.width;
  const H = canvas.height;

  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#080c18"); bg.addColorStop(0.5, "#0d1530"); bg.addColorStop(1, "#080c18");
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = "rgba(0,82,255,0.1)"; ctx.lineWidth = 1;
  for (let i = 0; i < W; i += 40) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, H); ctx.stroke(); }
  for (let i = 0; i < H; i += 40) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(W, i); ctx.stroke(); }

  const headerGrad = ctx.createLinearGradient(0, 0, W, 0);
  headerGrad.addColorStop(0, "#0052ff"); headerGrad.addColorStop(1, "#7b6ef6");
  ctx.fillStyle = headerGrad; ctx.fillRect(0, 0, W, 50);

  ctx.fillStyle = "white"; ctx.font = "bold 20px 'Space Grotesk', sans-serif"; ctx.textAlign = "center";
  ctx.fillText("⚡ BASE FARM", W / 2, 33);

  const cx = W / 2; const cy = H / 2 - 20;
  const orb = ctx.createRadialGradient(cx - 15, cy - 15, 5, cx, cy, 65);
  orb.addColorStop(0, "#ffffff");
  orb.addColorStop(0.3, data.spiritState?.color1 || "#7b6ef6");
  orb.addColorStop(0.7, data.spiritState?.color2 || "#4fc3f7");
  orb.addColorStop(1, "transparent");
  ctx.fillStyle = orb; ctx.beginPath(); ctx.arc(cx, cy, 65, 0, Math.PI * 2); ctx.fill();

  ctx.fillStyle = "rgba(255,255,255,0.9)"; ctx.font = "bold 14px Inter, sans-serif";
  ctx.fillText(langObj[data.spiritState?.nameKey] || "", cx, cy + 85);

  ctx.font = "bold 38px 'Space Grotesk', sans-serif";
  const valGrad = ctx.createLinearGradient(0, H * 0.72, W, H * 0.72);
  valGrad.addColorStop(0, "#ffd700"); valGrad.addColorStop(1, "#4fc3f7");
  ctx.fillStyle = valGrad; ctx.fillText(`$${data.todayValue}`, cx, H * 0.72);

  ctx.fillStyle = "rgba(255,255,255,0.5)"; ctx.font = "12px Inter, sans-serif";
  ctx.fillText(langObj.todayValueLabel, cx, H * 0.72 + 20);

  const statsY = H * 0.82;
  const items = [
    { label: langObj.levelLabel, value: `Lv.${data.level}` },
    { label: langObj.tokenTypesLabel, value: data.uniqueTokenCount.toString() },
    { label: langObj.growthScoreLabel, value: `${data.growthScore}` },
  ];
  items.forEach((item, i) => {
    const x = (W / items.length) * i + W / items.length / 2;
    ctx.fillStyle = "rgba(255,255,255,0.6)"; ctx.font = "10px Inter, sans-serif";
    ctx.fillText(item.label, x, statsY);
    ctx.fillStyle = "white"; ctx.font = "bold 16px 'Space Grotesk', sans-serif";
    ctx.fillText(item.value, x, statsY + 20);
  });

  ctx.fillStyle = "rgba(255,255,255,0.25)"; ctx.font = "11px Inter, sans-serif";
  ctx.fillText("base-farm.vercel.app", cx, H - 14);
}

// ─── API Helpers ─────────────────────────────────────────────
async function fetchBasescan(params) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`/api/basescan?${qs}`);
  const json = await res.json();
  if (json.error) throw new Error(json.error);
  return json;
}

async function resolveAddress(input) {
  const trimmed = input.trim();
  if (/^0x[0-9a-fA-F]{40}$/.test(trimmed)) return trimmed;
  // ENS resolution has been completely removed to focus on raw wallet addresses only
  throw new Error("errorFetch");
}

async function loadChainData(address, onStep) {
  onStep(0);
  const txData = await fetchBasescan({
    module: "account", action: "txlist", address, startblock: "0", endblock: "99999999", page: "1", offset: "1000", sort: "asc",
  });

  onStep(1);
  const tokenData = await fetchBasescan({
    module: "account", action: "tokentx", address, startblock: "0", endblock: "99999999", page: "1", offset: "100", sort: "desc",
  });

  onStep(2);
  const balData = await fetchBasescan({
    module: "account", action: "balance", address, tag: "latest",
  });

  onStep(3);
  const txs = txData.result && Array.isArray(txData.result) ? txData.result : [];
  const tokenTxs = tokenData.result && Array.isArray(tokenData.result) ? tokenData.result : [];

  const uniqueTokens = new Set(tokenTxs.map((t) => t.contractAddress));
  const todayTxList = getTodayTxs(txs);
  const todayTxCount = todayTxList.length;
  const todayContracts = getUniqueContracts(todayTxList);
  const todayValue = estimateDailyValue(txs);
  const ethBalance = balData.result ? (weiToEth(balData.result)).toFixed(4) : "0.0000";
  const uniqueTokenCount = uniqueTokens.size;

  const growthScore = calculateGrowthScore(txs, uniqueTokenCount);
  const level = Math.max(1, Math.floor(growthScore / 10));

  onStep(4);

  return {
    address,
    level,
    growthScore,
    todayTxCount,
    todayContracts,
    todayValue,
    ethBalance,
    uniqueTokenCount,
    spiritState: getSpiritState(todayTxCount),
    farmTitle: getFarmTitle(growthScore),
  };
}

// ─── Components ──────────────────────────────────────────────
function SpiritCanvas({ spiritState, todayTxCount }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  useEffect(() => {
    const animate = () => {
      drawSpirit(canvasRef.current, spiritState, todayTxCount);
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [spiritState, todayTxCount]);
  return <canvas ref={canvasRef} width={300} height={300} className="spirit-canvas" style={{ borderRadius: "50%" }} />;
}

function FarmCanvas({ growthScore }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  useEffect(() => {
    const animate = () => {
      if (canvasRef.current) drawFarm(canvasRef.current, growthScore);
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [growthScore]);
  return <canvas ref={canvasRef} width={600} height={400} className="farm-canvas" />;
}

// ─── Screen 1: Entrance ──────────────────────────────────────
function EntranceScreen({ onObserve, langObj }) {
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!address.trim()) { setError(langObj.errorInput); return; }
    setError("");
    onObserve(address.trim());
  };

  const tickerItems = [...TICKER_DEMOS, ...TICKER_DEMOS];

  return (
    <div className="screen entrance-screen">
      <div className="entrance-hero">
        <div className="entrance-logo"><span className="logo-badge">⚡ BASE FARM</span></div>
        <div style={{ position: "relative", width: 160, height: 160 }}>
          <div className="spirit-hero-glow" />
          <svg width="160" height="160" viewBox="0 0 160 160">
            <defs>
              <radialGradient id="spiritGrad" cx="38%" cy="35%" r="65%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="25%" stopColor="#7b6ef6" />
                <stop offset="70%" stopColor="#4fc3f7" />
                <stop offset="100%" stopColor="#4fc3f7" stopOpacity="0.6" />
              </radialGradient>
              <radialGradient id="glowRing" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#7b6ef6" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#7b6ef6" stopOpacity="0" />
              </radialGradient>
            </defs>
            <circle cx="80" cy="80" r="75" fill="url(#glowRing)" />
            <circle cx="80" cy="80" r="58" fill="url(#spiritGrad)" />
            <circle cx="66" cy="74" r="6" fill="rgba(255,255,255,0.95)" />
            <circle cx="94" cy="74" r="6" fill="rgba(255,255,255,0.95)" />
            <circle cx="67.5" cy="75" r="3" fill="#001166" />
            <circle cx="95.5" cy="75" r="3" fill="#001166" />
            <path d="M 62 90 Q 80 105 98 90" stroke="rgba(255,255,255,0.9)" strokeWidth="3" fill="none" strokeLinecap="round" />
            <ellipse cx="64" cy="60" rx="12" ry="8" fill="rgba(255,255,255,0.3)" transform="rotate(-20 64 60)" />
          </svg>
        </div>
        <h1 className="entrance-title">{langObj.heroTitle1}<br />{langObj.heroTitle2}</h1>
        <p className="entrance-subtitle">{langObj.heroSub}</p>
      </div>

      <form className="input-card" onSubmit={handleSubmit}>
        <label className="input-label">{langObj.inputLabel}</label>
        <input
          className="address-input"
          type="text"
          placeholder={langObj.inputPlaceholder}
          value={address}
          onChange={(e) => { setAddress(e.target.value); setError(""); }}
          autoComplete="off"
          autoCorrect="off"
          spellCheck="false"
        />
        <div className="security-badge"><span>🔒</span><span>{langObj.securityText}</span></div>
        {error && <div className="error-banner"><span>⚠️</span><span>{error}</span></div>}
        <button type="submit" className="observe-btn" disabled={!address.trim()}>{langObj.btnObserve}</button>
      </form>

      <div className="ticker-wrapper">
        <p className="ticker-label">{langObj.tickerLabel}</p>
        <div className="ticker-track">
          {tickerItems.map((item, i) => (
            <div key={i} className="ticker-item" onClick={() => { setAddress(item.addr.replace("...", "")); setError(""); }}>
              <div className="ticker-dot" />
              <span className="ticker-text">{item.addr}</span>
              <span className="ticker-value">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Screen 2: Loading ────────────────────────────────────────
function LoadingScreen({ address, stepIndex, langObj }) {
  const steps = [langObj.loadingStep0, langObj.loadingStep1, langObj.loadingStep2, langObj.loadingStep3, langObj.loadingStep4];
  return (
    <div className="screen loading-screen">
      <div className="loading-spirit">
        <div className="loading-ring" /><div className="loading-ring" /><div className="loading-ring" /><div className="loading-core" />
      </div>
      <div className="loading-text-group">
        <p className="loading-step">{steps[Math.min(stepIndex, steps.length - 1)]}</p>
        <p className="loading-address">{shortenAddress(address)}</p>
      </div>
    </div>
  );
}

// ─── Screen 3: Results ─────────────────────────────────────────
function ResultScreen({ data, onBack, onShare, langObj }) {
  const [accordionOpen, setAccordionOpen] = useState(false);
  const [popup, setPopup] = useState(null);

  const farmBuildings = [
    { x: 0.5, y: 0.98, label: langObj.buildingHouse, desc: langObj.descHouse },
    { x: 0.18, y: 0.98, label: langObj.buildingBarn, desc: data.growthScore >= 70 ? langObj.descBarnRich : langObj.descBarnNeed, locked: data.growthScore < 70 },
    { x: 0.78, y: 0.98, label: langObj.buildingSilo, desc: data.growthScore >= 60 ? langObj.descSiloRich : langObj.descSiloNeed, locked: data.growthScore < 60 },
    { x: 0.35, y: 0.98, label: langObj.buildingWell, desc: data.growthScore >= 40 ? langObj.descWellRich : langObj.descWellNeed, locked: data.growthScore < 40 },
  ];

  return (
    <div className="screen result-screen">
      <div style={{ padding: "16px 4px 0", display: "flex", alignItems: "center", gap: 12 }}>
        <button className="back-btn" onClick={onBack} style={{ padding: "8px 16px", fontSize: 13 }}>{langObj.backBtn}</button>
        <span style={{ fontSize: 13, color: "var(--text-muted)", fontFamily: "monospace" }}>{shortenAddress(data.address)}</span>
      </div>

      <section className="spirit-section">
        <div className="spirit-bg-glow" />
        <div className="spirit-canvas-wrapper">
          <SpiritCanvas spiritState={data.spiritState} todayTxCount={data.todayTxCount} />
        </div>
        <div className="spirit-stats-bar">
          <p className="spirit-label">✨ {langObj[data.spiritState.nameKey]}</p>
          <div className="spirit-value-big">${data.todayValue}</div>
          <p className="spirit-sub">{langObj.todayValueLabel}</p>
        </div>
        <div className="spirit-meta-chips">
          <div className="meta-chip">
            <span className="chip-icon">⚡</span><span>{langObj.todayTxLabel} {data.todayTxCount} Tx</span>
          </div>
          <div className="meta-chip">
            <span className="chip-icon">🔗</span><span>{langObj.contractsLabel} {data.todayContracts}</span>
          </div>
          <div className="meta-chip">
            <span className="chip-icon">💎</span><span>{data.ethBalance} ETH</span>
          </div>
        </div>
      </section>

      <div className="section-divider" />

      <section className="farm-section">
        <div className="section-header">
          <div className="section-icon">{data.farmTitle.icon}</div>
          <h2>{langObj[data.farmTitle.titleKey]}</h2>
          <p style={{ marginTop: "4px", fontSize: "13px", color: "var(--text-muted)" }}>{langObj[data.farmTitle.descKey]}</p>
        </div>

        <div className="farm-card">
          <div className="farm-canvas-wrapper">
            <FarmCanvas growthScore={data.growthScore} />
            <div className="farm-overlay-badge">
              <span>⚔️ {langObj.growthScoreLabel}: {data.growthScore} (Lv.{data.level})</span>
            </div>

            {farmBuildings.map((b, i) => (
              <div
                key={i}
                style={{ position: "absolute", left: `${b.x * 100}%`, top: `${b.y * 100}%`, transform: "translate(-50%, -100%)", width: 60, height: 60, cursor: "pointer", borderRadius: "50%" }}
                onClick={(e) => {
                  e.stopPropagation();
                  setPopup(popup?.label === b.label ? null : { ...b, px: b.x * 100, py: Math.max(10, b.y * 100 - 30) });
                }}
              />
            ))}

            {popup && (
              <div className="farm-popup" style={{ left: `${popup.px}%`, top: `${popup.py}%`, transform: "translate(-50%, -100%)" }}>
                <strong style={{ color: popup.locked ? "var(--text-muted)" : "var(--spirit-cyan)" }}>
                  {popup.locked ? "🔒" : "🏠"} {popup.label}
                </strong><br />{popup.desc}
              </div>
            )}
          </div>

          <div className="farm-stats-grid">
            <div className="farm-stat"><span className="farm-stat-label">{langObj.levelLabel}</span><span className="farm-stat-value">Lv.{data.level}</span></div>
            <div className="farm-stat"><span className="farm-stat-label">{langObj.tokenTypesLabel}</span><span className="farm-stat-value">{data.uniqueTokenCount}</span></div>
            <div className="farm-stat"><span className="farm-stat-label">ETH</span><span className="farm-stat-value">{data.ethBalance}</span></div>
            <div className="farm-stat"><span className="farm-stat-label">Status</span><span className="farm-stat-value">{langObj[data.spiritState.nameKey].split(" ")[0]}</span></div>
          </div>
        </div>
      </section>

      <div className="section-divider" />

      <section className="data-section">
        <div className="section-header">
          <div className="section-icon">📊</div>
          <h2>{langObj.analysisTitle}</h2>
        </div>
        <div className="accordion-card">
          <button className="accordion-trigger" onClick={() => setAccordionOpen(!accordionOpen)}>
            <span>{langObj.accordionLabel}</span>
            <span className={`accordion-chevron ${accordionOpen ? "open" : ""}`}>▼</span>
          </button>
          <div className={`accordion-body ${accordionOpen ? "open" : ""}`}>
            <div className="data-list">
              {[
                { icon: "🏦", label: langObj.tokenTypesLabel, value: `${data.uniqueTokenCount}` },
                { icon: "💎", label: langObj.statEthBalance, value: `${data.ethBalance} ETH` },
                { icon: "🌾", label: langObj.levelLabel, value: `Lv.${data.level}` },
                { icon: "✨", label: langObj.statSpiritState, value: langObj[data.spiritState.nameKey] },
              ].map((row, i) => (
                <div key={i} className="data-row">
                  <div className="data-row-label"><span>{row.icon}</span><span>{row.label}</span></div>
                  <span className="data-row-value">{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="float-share">
        <button className="share-btn" onClick={onShare}>
          <span>🌿</span><span>{langObj.btnShare}</span>
        </button>
      </div>
    </div>
  );
}

// ─── Share Modal ──────────────────────────────────────────────
function ShareModal({ data, onClose, langObj }) {
  const canvasRef = useRef(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (canvasRef.current) generateShareCanvas(canvasRef.current, data, langObj);
  }, [data, langObj]);

  const shareText = `${langObj.shareTextPrefix}${langObj[data.spiritState.nameKey]}${langObj.shareTextYield}${data.todayValue}${langObj.shareTextLevel}${data.level}${langObj.shareTextSuffix}`;
  const warpcastUrl = "https://warpcast.com/~/compose?text=" + encodeURIComponent(shareText);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="share-modal-overlay" onClick={onClose}>
      <div className="share-modal" onClick={(e) => e.stopPropagation()}>
        <h3>{langObj.shareModalTitle}</h3>
        <div className="share-preview">
          <canvas ref={canvasRef} width={480} height={270} style={{ width: "100%", borderRadius: 12 }} />
        </div>
        <div className="share-actions">
          <a href={warpcastUrl} target="_blank" rel="noopener noreferrer" className="warpcast-btn" style={{ textDecoration: "none" }}>
            <svg width="20" height="20" viewBox="0 0 1000 1000" fill="none">
              <path d="M257.778 155.556H742.222V844.444H671.111V528.889H670.414C662.554 441.677 589.258 373.333 500 373.333C410.742 373.333 337.446 441.677 329.586 528.889H328.889V844.444H257.778V155.556Z" fill="white"/>
              <path d="M128.889 253.333L157.778 351.111H182.222V746.667C169.949 746.667 160 756.616 160 768.889V795.556H155.556C143.283 795.556 133.333 805.505 133.333 817.778V844.444H382.222V817.778C382.222 805.505 372.273 795.556 360 795.556H355.556V768.889C355.556 756.616 345.606 746.667 333.333 746.667H306.667V253.333H128.889Z" fill="white"/>
              <path d="M817.778 746.667C805.505 746.667 795.556 756.616 795.556 768.889V795.556H791.111C778.838 795.556 768.889 805.505 768.889 817.778V844.444H1017.78V817.778C1017.78 805.505 1007.83 795.556 995.556 795.556H991.111V768.889C991.111 756.616 981.162 746.667 968.889 746.667V351.111H993.333L1022.22 253.333H844.444V746.667H817.778Z" fill="white"/>
            </svg>
            {langObj.btnCastWarpcast}
          </a>
          <button className="copy-btn" onClick={handleCopy}>{copied ? langObj.btnCopied : langObj.btnCopyText}</button>
          <button className="dismiss-btn" onClick={onClose}>{langObj.btnClose}</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────
export default function Home() {
  const [lang, setLang] = useState("en");
  const [screen, setScreen] = useState("entrance");
  const [inputAddress, setInputAddress] = useState("");
  const [loadingStep, setLoadingStep] = useState(0);
  const [chainData, setChainData] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [showShare, setShowShare] = useState(false);

  const langObj = I18N[lang];

  const handleObserve = useCallback(async (address) => {
    setInputAddress(address);
    setScreen("loading");
    setLoadingStep(0);
    try {
      const resolved = await resolveAddress(address);
      const data = await loadChainData(resolved, (step) => setLoadingStep(step));
      setChainData(data);
      setScreen("result");
    } catch (err) {
      setErrorMsg(err.message === "errorFetch" ? langObj.errorFetch : err.message);
      setScreen("error");
    }
  }, [langObj]);

  return (
    <div className="app-wrapper">
      <div style={{ position: "absolute", top: 16, right: 16, zIndex: 999 }}>
        <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 20, padding: 4, display: "flex", gap: 4, backdropFilter: "blur(10px)" }}>
          <button
            onClick={() => setLang("en")}
            style={{ padding: "4px 12px", borderRadius: 16, border: "none", background: lang === "en" ? "#0052ff" : "transparent", color: lang === "en" ? "#fff" : "#aaa", fontSize: 12, fontWeight: "bold", cursor: "pointer", transition: "0.2s" }}
          >EN</button>
          <button
            onClick={() => setLang("jp")}
            style={{ padding: "4px 12px", borderRadius: 16, border: "none", background: lang === "jp" ? "#0052ff" : "transparent", color: lang === "jp" ? "#fff" : "#aaa", fontSize: 12, fontWeight: "bold", cursor: "pointer", transition: "0.2s" }}
          >JP</button>
        </div>
      </div>

      {screen === "entrance" && <EntranceScreen onObserve={handleObserve} langObj={langObj} />}
      {screen === "loading" && <LoadingScreen address={inputAddress} stepIndex={loadingStep} langObj={langObj} />}
      {screen === "result" && chainData && (
        <ResultScreen data={chainData} onBack={() => setScreen("entrance")} onShare={() => setShowShare(true)} langObj={langObj} />
      )}
      {screen === "error" && (
        <div className="screen entrance-screen">
          <div className="error-banner"><span>❌</span><span>{errorMsg}</span></div>
          <button className="back-btn" onClick={() => setScreen("entrance")}>{langObj.backBtnRetry}</button>
        </div>
      )}
      {showShare && chainData && <ShareModal data={chainData} onClose={() => setShowShare(false)} langObj={langObj} />}
    </div>
  );
}
