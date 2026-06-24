"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// ─── Constants ─────────────────────────────────────────────
const TICKER_DEMOS = [
  { addr: "0xd8dA6B...96045", level: 88, value: "$4.21" },
  { addr: "0xAb5801...bA86", level: 34, value: "$1.07" },
  { addr: "0x742d35...d4E2", level: 61, value: "$2.88" },
  { addr: "0x1f9840...5dC2", level: 112, value: "$6.54" },
  { addr: "0xBE0eB5...3378", level: 7, value: "$0.33" },
  { addr: "0x47ac0F...6F82", level: 229, value: "$9.99" },
];

const LOADING_STEPS = [
  "🌱 土を耕しています...",
  "🌾 チェーン履歴を読み解いています...",
  "✨ 種を蒔いています...",
  "🔮 精霊を呼び出しています...",
  "🌟 農場を形成しています...",
];

const FARM_TITLES = [
  { min: 0,   max: 10,  icon: "🌱", title: "産声を上げたばかりの新芽",   desc: "Base上での旅が始まったばかりです。" },
  { min: 11,  max: 30,  icon: "🌿", title: "芽吹いた希望の農地",          desc: "少しずつ根を張り始めています。" },
  { min: 31,  max: 60,  icon: "🌻", title: "成長中の活気ある開拓地",      desc: "日に日に勢力を広げています。" },
  { min: 61,  max: 80,  icon: "🏡", title: "確かな実績を持つ農場",        desc: "Base上に確かな足跡を残しています。" },
  { min: 81,  max: 95,  icon: "🏰", title: "古参の豊かな大農場",           desc: "長きにわたりBaseを開拓してきた証です。" },
  { min: 96,  max: Infinity, icon: "👑", title: "伝説の農場主", desc: "Base上でもっとも深い足跡を刻む者。" },
];

const SPIRIT_STATES = [
  { min: 0,  max: 2,  name: "眠れる精霊",      color1: "#3344aa", color2: "#223399", pulse: 0.3 },
  { min: 3,  max: 7,  name: "目覚めの精霊",     color1: "#5566cc", color2: "#4455bb", pulse: 0.5 },
  { min: 8,  max: 15, name: "活発な精霊",       color1: "#7b6ef6", color2: "#4fc3f7", pulse: 0.75 },
  { min: 16, max: 30, name: "燃え盛る精霊",     color1: "#f59e0b", color2: "#ef4444", pulse: 1.0 },
  { min: 31, max: Infinity, name: "超越した精霊", color1: "#ffd700", color2: "#ff6b6b", pulse: 1.0 },
];

// ─── Helpers ────────────────────────────────────────────────
function shortenAddress(addr) {
  if (!addr) return "";
  if (addr.includes(".eth")) return addr;
  return addr.slice(0, 6) + "..." + addr.slice(-4);
}

function formatDate(timestamp) {
  if (!timestamp) return "Unknown";
  const d = new Date(parseInt(timestamp) * 1000);
  return d.toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" });
}

function weiToEth(wei) {
  return parseFloat(wei) / 1e18;
}

// Estimate daily BASE yield: gas_used * gas_price * reward_factor
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
  // reward coefficient: empirical multiplier to estimate Base sequencer rewards equivalent
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

function totalGasUsd(txs) {
  let total = 0;
  txs.forEach((tx) => {
    const gasUsed = parseInt(tx.gasUsed || tx.gas || 21000);
    const gasPrice = parseInt(tx.gasPrice || 0);
    total += (gasUsed * gasPrice) / 1e18;
  });
  return (total * 3200).toFixed(2);
}

function getSpiritState(todayCount) {
  return SPIRIT_STATES.find((s) => todayCount >= s.min && todayCount <= s.max) || SPIRIT_STATES[0];
}

function getFarmTitle(score) {
  return FARM_TITLES.find((t) => score >= t.min && score <= t.max) || FARM_TITLES[0];
}

function calculateGrowthScore(txs, uniqueTokenCount, totalGasUsd) {
  const now = Math.floor(Date.now() / 1000);
  const thirtyDaysAgo = now - 30 * 86400;
  
  const recentTxs = txs.filter((tx) => parseInt(tx.timeStamp) >= thirtyDaysAgo);
  
  // 1. Active days
  const activeDaysSet = new Set();
  recentTxs.forEach(tx => {
    const date = new Date(parseInt(tx.timeStamp) * 1000).toDateString();
    activeDaysSet.add(date);
  });
  const activeDaysScore = Math.min(30, (activeDaysSet.size / 20) * 30);
  
  // 2. Tx count
  const txScore = Math.min(30, (recentTxs.length / 100) * 30);
  
  // 3. Unique contracts (DApps)
  const uniqueContracts = getUniqueContracts(recentTxs);
  const contractsScore = Math.min(20, (uniqueContracts / 10) * 20);
  
  // 4. Tokens
  const tokensScore = Math.min(10, (uniqueTokenCount / 5) * 10);
  
  // 5. Gas usage
  const gasScore = Math.min(10, (parseFloat(totalGasUsd) / 10) * 10);
  
  const totalScore = activeDaysScore + txScore + contractsScore + tokensScore + gasScore;
  return Math.floor(totalScore);
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

  // Outer glow rings
  for (let i = 3; i >= 1; i--) {
    const gr = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r * (1 + i * 0.35));
    gr.addColorStop(0, spiritState.color1 + "60");
    gr.addColorStop(1, "transparent");
    ctx.fillStyle = gr;
    ctx.beginPath();
    ctx.arc(cx, cy, r * (1 + i * 0.35), 0, Math.PI * 2);
    ctx.fill();
  }

  // Body gradient
  const grad = ctx.createRadialGradient(cx - r * 0.2, cy - r * 0.2, r * 0.05, cx, cy, r);
  grad.addColorStop(0, "#ffffff");
  grad.addColorStop(0.25, spiritState.color1);
  grad.addColorStop(0.7, spiritState.color2);
  grad.addColorStop(1, spiritState.color2 + "aa");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  // Energy particles (more = higher activity)
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

  // Face — eyes
  const eyeY = cy - r * 0.12;
  const eyeOffX = r * 0.22;
  const eyeR = r * 0.07;

  ctx.fillStyle = "rgba(255,255,255,0.95)";
  ctx.beginPath(); ctx.arc(cx - eyeOffX, eyeY, eyeR, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + eyeOffX, eyeY, eyeR, 0, Math.PI * 2); ctx.fill();

  // Pupils
  ctx.fillStyle = spiritState.color2 === "#223399" ? "#001166" : "#000033";
  ctx.beginPath(); ctx.arc(cx - eyeOffX + eyeR * 0.2, eyeY + eyeR * 0.1, eyeR * 0.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + eyeOffX + eyeR * 0.2, eyeY + eyeR * 0.1, eyeR * 0.5, 0, Math.PI * 2); ctx.fill();

  // Expression based on activity
  const smileY = cy + r * 0.18;
  ctx.strokeStyle = "rgba(255,255,255,0.9)";
  ctx.lineWidth = r * 0.05;
  ctx.lineCap = "round";
  ctx.beginPath();
  if (activityLevel === 0) {
    // Sleeping z
    ctx.moveTo(cx - r * 0.15, smileY);
    ctx.lineTo(cx + r * 0.15, smileY);
  } else if (activityLevel <= 5) {
    // Slight smile
    ctx.arc(cx, smileY - r * 0.05, r * 0.18, 0.2, Math.PI - 0.2);
  } else {
    // Big smile
    ctx.arc(cx, smileY - r * 0.1, r * 0.25, 0.1, Math.PI - 0.1);
  }
  ctx.stroke();

  // Shine highlight
  const shine = ctx.createRadialGradient(cx - r * 0.28, cy - r * 0.28, 0, cx - r * 0.28, cy - r * 0.28, r * 0.35);
  shine.addColorStop(0, "rgba(255,255,255,0.4)");
  shine.addColorStop(1, "transparent");
  ctx.fillStyle = shine;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
}

function drawFarm(canvas, score) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const W = canvas.width;
  const H = canvas.height;
  const groundY = H * 0.50;

  ctx.clearRect(0, 0, W, H);

  const pseudoRandom = (seed) => {
    let x = Math.sin(seed + 1) * 10000;
    return x - Math.floor(x);
  };
  const t = Date.now() / 1000;

  // ════════════════════════════════════════════
  // 1. SKY — dramatic per-phase
  // ════════════════════════════════════════════
  const sky = ctx.createLinearGradient(0, 0, 0, groundY);
  if (score < 20) {
    sky.addColorStop(0, "#020408"); sky.addColorStop(1, "#070d1c");
  } else if (score < 40) {
    sky.addColorStop(0, "#0a1630"); sky.addColorStop(1, "#142850");
  } else if (score < 60) {
    sky.addColorStop(0, "#112050"); sky.addColorStop(1, "#1e3d78");
  } else if (score < 90) {
    sky.addColorStop(0, "#1a2d6a"); sky.addColorStop(1, "#2a509f");
  } else {
    sky.addColorStop(0, "#2b1055"); sky.addColorStop(0.35, "#4a3fa0");
    sky.addColorStop(0.7, "#cc8844"); sky.addColorStop(1, "#ffcc77");
  }
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, groundY);

  // Stars
  const starCount = score < 20 ? 3 : (score < 40 ? 20 : (score < 60 ? 40 : (score < 90 ? 70 : 0)));
  for (let i = 0; i < starCount; i++) {
    const sx = pseudoRandom(i * 7 + 1) * W;
    const sy = pseudoRandom(i * 13 + 3) * groundY * 0.9;
    const sr = score >= 60 ? 1.5 + pseudoRandom(i + 200) * 1.5 : 1;
    ctx.fillStyle = `rgba(255,255,255,${0.4 + pseudoRandom(i + 50) * 0.5})`;
    ctx.beginPath(); ctx.arc(sx, sy, sr, 0, Math.PI * 2); ctx.fill();
  }

  // Milky way band (score >= 40)
  if (score >= 40 && score < 90) {
    ctx.save();
    ctx.globalAlpha = 0.12;
    const mg = ctx.createLinearGradient(0, groundY * 0.2, W, groundY * 0.6);
    mg.addColorStop(0, "transparent"); mg.addColorStop(0.3, "#7799ff");
    mg.addColorStop(0.7, "#aa88ff"); mg.addColorStop(1, "transparent");
    ctx.fillStyle = mg;
    ctx.fillRect(0, groundY * 0.15, W, groundY * 0.5);
    ctx.globalAlpha = 1.0;
    ctx.restore();
  }

  // Aurora (score >= 60)
  if (score >= 60 && score < 90) {
    ctx.save();
    ctx.globalAlpha = 0.2 + Math.sin(t * 0.5) * 0.05;
    const ag = ctx.createRadialGradient(W * 0.5, groundY * 0.3, 20, W * 0.5, groundY * 0.3, W * 0.6);
    ag.addColorStop(0, "#4fc3f7"); ag.addColorStop(0.5, "#7b6ef6"); ag.addColorStop(1, "transparent");
    ctx.fillStyle = ag;
    ctx.beginPath(); ctx.ellipse(W * 0.5, groundY * 0.35, W * 0.6, groundY * 0.4, 0.1, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1.0;
    ctx.restore();
  }

  // Sunrise glow (score >= 90)
  if (score >= 90) {
    const sg = ctx.createRadialGradient(W * 0.5, groundY, 10, W * 0.5, groundY, W * 0.7);
    sg.addColorStop(0, "rgba(255,220,100,0.7)"); sg.addColorStop(0.4, "rgba(255,150,50,0.3)"); sg.addColorStop(1, "transparent");
    ctx.fillStyle = sg;
    ctx.beginPath(); ctx.arc(W * 0.5, groundY, W * 0.7, 0, Math.PI * 2); ctx.fill();
  }

  // Moon
  if (score < 90) {
    ctx.fillStyle = "#ffeaa0";
    ctx.beginPath(); ctx.arc(W * 0.85, groundY * 0.25, 22, 0, Math.PI * 2); ctx.fill();
    if (score < 60) {
      ctx.fillStyle = score < 20 ? "#020408" : (score < 40 ? "#0a1630" : "#112050");
      ctx.beginPath(); ctx.arc(W * 0.88, groundY * 0.22, 20, 0, Math.PI * 2); ctx.fill();
    }
  }

  // ════════════════════════════════════════════
  // 2. GROUND & PATH
  // ════════════════════════════════════════════
  const gg = ctx.createLinearGradient(0, groundY, 0, H);
  if (score < 20) {
    gg.addColorStop(0, "#151e0c"); gg.addColorStop(1, "#0d130a");
  } else if (score < 40) {
    gg.addColorStop(0, "#243618"); gg.addColorStop(1, "#172410");
  } else if (score < 60) {
    gg.addColorStop(0, "#2e4c1e"); gg.addColorStop(1, "#1e3213");
  } else if (score < 90) {
    gg.addColorStop(0, "#3d6625"); gg.addColorStop(1, "#264016");
  } else {
    gg.addColorStop(0, "#55aa28"); gg.addColorStop(1, "#377018");
  }
  ctx.fillStyle = gg;
  ctx.fillRect(0, groundY, W, H - groundY);

  // Path
  const pw = score < 20 ? 0.06 : (score < 40 ? 0.10 : (score < 60 ? 0.16 : (score < 90 ? 0.22 : 0.30)));
  const pc = score < 40 ? "#3a2d18" : (score < 60 ? "#7a5c30" : (score < 90 ? "#b08840" : "#d4a855"));
  ctx.fillStyle = pc;
  ctx.beginPath();
  ctx.moveTo(W * 0.5 - W * pw * 0.15, groundY);
  ctx.lineTo(W * 0.5 + W * pw * 0.15, groundY);
  ctx.lineTo(W * 0.5 + W * pw, H);
  ctx.lineTo(W * 0.5 - W * pw, H);
  ctx.fill();

  // ════════════════════════════════════════════
  // 3. HELPERS
  // ════════════════════════════════════════════
  function drawHouse(x, y, w, h, bodyCol, roofCol, windowGlow) {
    // Body
    ctx.fillStyle = bodyCol; ctx.fillRect(x - w / 2, y - h, w, h);
    // Roof
    ctx.fillStyle = roofCol;
    ctx.beginPath(); ctx.moveTo(x - w * 0.6, y - h); ctx.lineTo(x, y - h - h * 0.7); ctx.lineTo(x + w * 0.6, y - h); ctx.closePath(); ctx.fill();
    // Door
    ctx.fillStyle = "#2a1500"; ctx.fillRect(x - w * 0.12, y - h * 0.35, w * 0.24, h * 0.35);
    // Windows with glow
    const wc = windowGlow ? "#ffe066" : "#333";
    ctx.fillStyle = wc;
    const ww = w * 0.18, wh = h * 0.18;
    ctx.fillRect(x - w * 0.38, y - h * 0.7, ww, wh);
    ctx.fillRect(x + w * 0.20, y - h * 0.7, ww, wh);
    if (windowGlow) {
      ctx.shadowColor = "#ffe066"; ctx.shadowBlur = 15;
      ctx.fillRect(x - w * 0.38, y - h * 0.7, ww, wh);
      ctx.fillRect(x + w * 0.20, y - h * 0.7, ww, wh);
      ctx.shadowBlur = 0;
    }
  }

  function drawCastle(x, y) {
    const w = 200, h = 120;
    // Aura behind
    const aura = ctx.createRadialGradient(x, y - h * 0.5, 10, x, y - h * 0.5, 250);
    aura.addColorStop(0, "rgba(255,215,0,0.5)"); aura.addColorStop(0.5, "rgba(255,180,50,0.15)"); aura.addColorStop(1, "transparent");
    ctx.fillStyle = aura;
    ctx.beginPath(); ctx.arc(x, y - h * 0.5, 250, 0, Math.PI * 2); ctx.fill();
    // Main body
    ctx.fillStyle = "#e8d5b0"; ctx.fillRect(x - w / 2, y - h, w, h);
    // Grand roof
    ctx.fillStyle = "#8a2e10";
    ctx.beginPath(); ctx.moveTo(x - w * 0.55, y - h); ctx.lineTo(x, y - h - 70); ctx.lineTo(x + w * 0.55, y - h); ctx.closePath(); ctx.fill();
    // Left tower
    ctx.fillStyle = "#d4b88a"; ctx.fillRect(x - w / 2 - 30, y - h - 40, 35, h + 40);
    ctx.fillStyle = "#771e0a";
    ctx.beginPath(); ctx.moveTo(x - w / 2 - 35, y - h - 40); ctx.lineTo(x - w / 2 - 12, y - h - 90); ctx.lineTo(x - w / 2 + 10, y - h - 40); ctx.fill();
    // Right tower
    ctx.fillStyle = "#d4b88a"; ctx.fillRect(x + w / 2 - 5, y - h - 40, 35, h + 40);
    ctx.fillStyle = "#771e0a";
    ctx.beginPath(); ctx.moveTo(x + w / 2 - 10, y - h - 40); ctx.lineTo(x + w / 2 + 12, y - h - 90); ctx.lineTo(x + w / 2 + 35, y - h - 40); ctx.fill();
    // Flags on towers
    ctx.fillStyle = "#ffd700";
    ctx.fillRect(x - w / 2 - 13, y - h - 90, 2, 15);
    ctx.fillStyle = "#0052ff"; ctx.fillRect(x - w / 2 - 11, y - h - 90, 14, 10);
    ctx.fillStyle = "#ffd700";
    ctx.fillRect(x + w / 2 + 11, y - h - 90, 2, 15);
    ctx.fillStyle = "#0052ff"; ctx.fillRect(x + w / 2 + 13, y - h - 90, 14, 10);
    // Grand door
    ctx.fillStyle = "#3a1800";
    ctx.beginPath(); ctx.moveTo(x - 20, y); ctx.lineTo(x - 20, y - 45); ctx.arc(x, y - 45, 20, Math.PI, 0); ctx.lineTo(x + 20, y); ctx.fill();
    // Many windows glowing
    ctx.fillStyle = "#ffe066"; ctx.shadowColor = "#ffe066"; ctx.shadowBlur = 20;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 5; c++) {
        if (c === 2 && r === 0) continue;
        ctx.fillRect(x - 80 + c * 38, y - h + 15 + r * 32, 22, 18);
      }
    }
    // Tower windows
    ctx.fillRect(x - w / 2 - 22, y - h - 30, 15, 18);
    ctx.fillRect(x + w / 2 + 5, y - h - 30, 15, 18);
    ctx.shadowBlur = 0;
  }

  function drawTree(x, y, scale) {
    const trunk = score < 20 ? "#221508" : "#5c3d11";
    const leaf = score >= 90 ? "#55dd55" : (score >= 60 ? "#2e8a3a" : (score >= 40 ? "#256830" : "#1a4020"));
    ctx.fillStyle = trunk;
    ctx.fillRect(x - 5 * scale, y, 10 * scale, 25 * scale);
    if (score < 20) {
      // Dead tree — branches only
      ctx.strokeStyle = "#332211"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x, y + 5); ctx.lineTo(x - 15 * scale, y - 15 * scale); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 12 * scale, y - 20 * scale); ctx.stroke();
      return;
    }
    ctx.fillStyle = leaf;
    ctx.beginPath(); ctx.arc(x, y - 10 * scale, 22 * scale, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x - 14 * scale, y - 20 * scale, 18 * scale, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + 14 * scale, y - 16 * scale, 17 * scale, 0, Math.PI * 2); ctx.fill();
    if (score >= 60) {
      ctx.beginPath(); ctx.arc(x, y - 28 * scale, 14 * scale, 0, Math.PI * 2); ctx.fill();
    }
  }

  function drawField(xCenter, yTop, width, rows, cols, isGlowing) {
    // Soil
    ctx.fillStyle = score < 40 ? "#1e1208" : (score < 60 ? "#3a2814" : "#4d3820");
    ctx.beginPath();
    ctx.moveTo(xCenter - width * 0.4, yTop);
    ctx.lineTo(xCenter + width * 0.4, yTop);
    ctx.lineTo(xCenter + width * 0.7, yTop + rows * 14);
    ctx.lineTo(xCenter - width * 0.7, yTop + rows * 14);
    ctx.fill();
    // Crops
    for (let r = 0; r < rows; r++) {
      const rowY = yTop + r * 14 + 10;
      const rw = width * 0.4 + (width * 0.3 * (r / rows));
      for (let c = 0; c < cols; c++) {
        const cx = xCenter - rw + (rw * 2 * c / (cols - 1 || 1));
        // Stem
        ctx.strokeStyle = isGlowing ? "#66ee88" : "#3fa86a";
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(cx, rowY); ctx.lineTo(cx, rowY - 12); ctx.stroke();
        // Fruit
        const fruitColors = ["#ffd700", "#ff6644", "#ff44aa", "#66eeff"];
        ctx.fillStyle = fruitColors[(r + c) % fruitColors.length];
        if (isGlowing) { ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 12; }
        ctx.beginPath(); ctx.arc(cx, rowY - 14, 4, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
      }
    }
  }

  function drawWindmill(x, y, scale) {
    const bw = 30 * scale, bh = 100 * scale;
    ctx.fillStyle = "#d8d8d8"; ctx.fillRect(x - bw / 2, y - bh, bw, bh);
    ctx.fillStyle = "#aa3333";
    ctx.beginPath(); ctx.moveTo(x - bw * 0.6, y - bh); ctx.lineTo(x, y - bh - 35 * scale); ctx.lineTo(x + bw * 0.6, y - bh); ctx.fill();
    // Blades
    const bladeLen = 65 * scale;
    ctx.save();
    ctx.translate(x, y - bh);
    ctx.rotate(t * 0.8);
    ctx.fillStyle = "#f4f4f4";
    for (let i = 0; i < 4; i++) {
      ctx.save(); ctx.rotate(i * Math.PI / 2);
      ctx.fillRect(-5, 0, 10, bladeLen);
      ctx.restore();
    }
    ctx.restore();
  }

  function drawWell(x, y) {
    ctx.fillStyle = "#777"; ctx.fillRect(x - 14, y - 20, 28, 20);
    ctx.fillStyle = "#999"; ctx.fillRect(x - 16, y - 3, 32, 5);
    ctx.strokeStyle = "#555"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(x - 12, y - 20); ctx.lineTo(x - 14, y - 32); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + 12, y - 20); ctx.lineTo(x + 14, y - 32); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - 14, y - 32); ctx.lineTo(x + 14, y - 32); ctx.stroke();
    ctx.fillStyle = "#224488";
    ctx.beginPath(); ctx.ellipse(x, y - 5, 10, 5, 0, 0, Math.PI * 2); ctx.fill();
  }

  function drawSilo(x, y, scale) {
    const sw = 28 * scale, sh = 70 * scale;
    ctx.fillStyle = "#8b7355"; ctx.fillRect(x - sw / 2, y - sh, sw, sh);
    ctx.fillStyle = "#a0522d";
    ctx.beginPath(); ctx.arc(x, y - sh, sw / 2, Math.PI, 0); ctx.fill();
    // Bands
    ctx.strokeStyle = "#6b4c2a"; ctx.lineWidth = 2;
    for (let i = 1; i < 4; i++) {
      ctx.beginPath(); ctx.moveTo(x - sw / 2, y - sh + i * sh / 4); ctx.lineTo(x + sw / 2, y - sh + i * sh / 4); ctx.stroke();
    }
  }

  function drawGoldenStatue(x, y) {
    // Pedestal
    ctx.fillStyle = "#555"; ctx.fillRect(x - 18, y - 20, 36, 20);
    // Figure
    ctx.fillStyle = "#ffd700"; ctx.shadowColor = "#ffd700"; ctx.shadowBlur = 25;
    ctx.fillRect(x - 6, y - 70, 12, 50);
    ctx.beginPath(); ctx.arc(x, y - 75, 10, 0, Math.PI * 2); ctx.fill();
    // Arms
    ctx.fillRect(x - 20, y - 60, 40, 6);
    ctx.shadowBlur = 0;
  }

  // ════════════════════════════════════════════
  // 4. RENDER BY PHASE — big scale differences
  // ════════════════════════════════════════════
  if (score < 20) {
    // ── Phase 1: Barren wasteland ──
    drawTree(W * 0.12, groundY - 5, 0.7);
    drawTree(W * 0.88, groundY - 2, 0.5);
    drawHouse(W * 0.5, groundY + 2, 35, 28, "#2a2018", "#1a120a", false);
    drawField(W * 0.25, groundY + 15, 40, 1, 3, false);

  } else if (score < 40) {
    // ── Phase 2: Growing settlement ──
    drawTree(W * 0.10, groundY - 5, 1.3);
    drawTree(W * 0.90, groundY - 2, 1.1);
    drawTree(W * 0.72, groundY - 5, 0.8);
    drawHouse(W * 0.5, groundY + 2, 65, 55, "#7a5533", "#4a2a18", true);
    drawField(W * 0.20, groundY + 15, 90, 4, 8, false);
    drawField(W * 0.80, groundY + 20, 80, 3, 7, false);

  } else if (score < 60) {
    // ── Phase 3: Thriving farm ──
    drawTree(W * 0.08, groundY - 8, 1.8);
    drawTree(W * 0.92, groundY - 5, 1.6);
    drawTree(W * 0.68, groundY - 10, 1.2);
    drawTree(W * 0.30, groundY - 5, 1.0);
    drawHouse(W * 0.50, groundY + 2, 100, 80, "#bb7744", "#882211", true);
    drawWell(W * 0.34, groundY + 5);
    drawSilo(W * 0.72, groundY + 2, 0.8);
    drawField(W * 0.15, groundY + 20, 140, 6, 12, false);
    drawField(W * 0.85, groundY + 25, 130, 5, 10, false);

  } else if (score < 90) {
    // ── Phase 4: Grand estate ──
    drawTree(W * 0.06, groundY - 10, 2.2);
    drawTree(W * 0.94, groundY - 8, 2.0);
    drawTree(W * 0.25, groundY - 15, 1.6);
    drawTree(W * 0.75, groundY - 12, 1.4);
    drawWindmill(W * 0.15, groundY + 2, 1.0);
    drawHouse(W * 0.50, groundY + 2, 130, 100, "#d4a870", "#8a3015", true);
    drawHouse(W * 0.80, groundY + 10, 70, 55, "#a05533", "#5c2510", true);
    drawSilo(W * 0.88, groundY + 5, 1.0);
    drawWell(W * 0.38, groundY + 5);
    drawField(W * 0.12, groundY + 25, 180, 8, 14, true);
    drawField(W * 0.88, groundY + 35, 180, 7, 12, true);

  } else {
    // ── Phase 5: Legendary domain ──
    drawTree(W * 0.04, groundY - 10, 2.8);
    drawTree(W * 0.96, groundY - 8, 2.6);
    drawTree(W * 0.18, groundY - 18, 2.0);
    drawTree(W * 0.82, groundY - 15, 1.8);
    drawWindmill(W * 0.12, groundY + 2, 1.2);
    drawWindmill(W * 0.88, groundY + 2, 1.0);
    drawCastle(W * 0.50, groundY + 5);
    drawSilo(W * 0.32, groundY + 5, 1.2);
    drawGoldenStatue(W * 0.72, groundY + 5);
    drawField(W * 0.08, groundY + 30, 220, 10, 16, true);
    drawField(W * 0.50, groundY + H * 0.30, 200, 8, 14, true);
    drawField(W * 0.92, groundY + 35, 220, 10, 16, true);
  }

  // ════════════════════════════════════════════
  // 5. FENCE
  // ════════════════════════════════════════════
  if (score >= 20) {
    ctx.strokeStyle = score >= 60 ? "#ddd" : "#5c3d11";
    ctx.lineWidth = score >= 60 ? 3 : 2;
    const fs = score >= 60 ? 16 : 24;
    for (let i = 0; i < W / fs; i++) {
      if (score < 40 && pseudoRandom(i) < 0.3) continue;
      const fx = i * fs + 3;
      ctx.beginPath(); ctx.moveTo(fx, H - 30); ctx.lineTo(fx, H - 8); ctx.stroke();
      if (i > 0) {
        ctx.beginPath(); ctx.moveTo(fx - fs, H - 22); ctx.lineTo(fx, H - 22); ctx.stroke();
        if (score >= 40) {
          ctx.beginPath(); ctx.moveTo(fx - fs, H - 14); ctx.lineTo(fx, H - 14); ctx.stroke();
        }
      }
    }
  }

  // ════════════════════════════════════════════
  // 6. MAGIC PARTICLES (animated)
  // ════════════════════════════════════════════
  if (score >= 60) {
    const pCount = score >= 90 ? 80 : 30;
    for (let i = 0; i < pCount; i++) {
      const px = W * pseudoRandom(i * 3);
      const speed = 15 + pseudoRandom(i * 7 + 2) * 40;
      const py = H - ((t * speed + pseudoRandom(i * 11) * H) % (H * 0.85));
      const pr = 1.5 + pseudoRandom(i * 5 + 1) * 3;
      if (score >= 90) {
        ctx.fillStyle = `rgba(255,${200 + Math.floor(pseudoRandom(i+99)*55)},${Math.floor(pseudoRandom(i+77)*100)},${0.6 + pseudoRandom(i+33)*0.4})`;
        ctx.shadowColor = "#ffdd44"; ctx.shadowBlur = 18;
      } else {
        ctx.fillStyle = `rgba(${80+Math.floor(pseudoRandom(i+5)*100)},255,${180+Math.floor(pseudoRandom(i+8)*75)},${0.4+pseudoRandom(i+22)*0.5})`;
        ctx.shadowColor = "#44ffaa"; ctx.shadowBlur = 12;
      }
      ctx.beginPath(); ctx.arc(px, py, pr, 0, Math.PI * 2); ctx.fill();
    }
    ctx.shadowBlur = 0;
  }
}

function generateShareCanvas(canvas, data) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const W = canvas.width;
  const H = canvas.height;

  // Background
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#080c18");
  bg.addColorStop(0.5, "#0d1530");
  bg.addColorStop(1, "#080c18");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Grid lines
  ctx.strokeStyle = "rgba(0,82,255,0.1)";
  ctx.lineWidth = 1;
  for (let i = 0; i < W; i += 40) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, H); ctx.stroke();
  }
  for (let i = 0; i < H; i += 40) {
    ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(W, i); ctx.stroke();
  }

  // Header bar
  const headerGrad = ctx.createLinearGradient(0, 0, W, 0);
  headerGrad.addColorStop(0, "#0052ff");
  headerGrad.addColorStop(1, "#7b6ef6");
  ctx.fillStyle = headerGrad;
  ctx.fillRect(0, 0, W, 50);

  ctx.fillStyle = "white";
  ctx.font = "bold 20px 'Space Grotesk', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("⚡ BASE FARM", W / 2, 33);

  // Spirit orb (mini)
  const cx = W / 2;
  const cy = H / 2 - 20;
  const orb = ctx.createRadialGradient(cx - 15, cy - 15, 5, cx, cy, 65);
  orb.addColorStop(0, "#ffffff");
  orb.addColorStop(0.3, data.spiritState?.color1 || "#7b6ef6");
  orb.addColorStop(0.7, data.spiritState?.color2 || "#4fc3f7");
  orb.addColorStop(1, "transparent");
  ctx.fillStyle = orb;
  ctx.beginPath();
  ctx.arc(cx, cy, 65, 0, Math.PI * 2);
  ctx.fill();

  // Spirit name
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.font = "bold 14px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(data.spiritState?.name || "精霊", cx, cy + 85);

  // Value
  ctx.font = "bold 38px 'Space Grotesk', sans-serif";
  const valGrad = ctx.createLinearGradient(0, H * 0.72, W, H * 0.72);
  valGrad.addColorStop(0, "#ffd700");
  valGrad.addColorStop(1, "#4fc3f7");
  ctx.fillStyle = valGrad;
  ctx.fillText(`$${data.todayValue}`, cx, H * 0.72);

  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.font = "12px Inter, sans-serif";
  ctx.fillText("今日の推定BASE獲得期待値", cx, H * 0.72 + 20);

  // Stats row
  const statsY = H * 0.82;
  const items = [
    { label: "開拓Lv.", value: `Lv.${data.level}` },
    { label: "本日のTx", value: `${data.todayTxCount}回` },
    { label: "Growth Score", value: `${data.growthScore}` },
  ];
  items.forEach((item, i) => {
    const x = (W / items.length) * i + W / items.length / 2;
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.font = "10px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(item.label, x, statsY);
    ctx.fillStyle = "white";
    ctx.font = "bold 16px 'Space Grotesk', sans-serif";
    ctx.fillText(item.value, x, statsY + 20);
  });

  // Footer
  ctx.fillStyle = "rgba(255,255,255,0.25)";
  ctx.font = "11px Inter, sans-serif";
  ctx.textAlign = "center";
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
  // Try ENS resolve via Etherscan
  try {
    const data = await fetchBasescan({ module: "account", action: "balance", address: trimmed, tag: "latest" });
    if (data.status === "1") return trimmed; // passthrough if direct
  } catch {}
  throw new Error(`"${trimmed}" はBase上で見つかりませんでした。0xアドレスまたはENS名を入力してください。`);
}

async function loadChainData(address, onStep) {
  onStep(0);
  // Fetch tx list (last 1000)
  const txData = await fetchBasescan({
    module: "account",
    action: "txlist",
    address,
    startblock: "0",
    endblock: "99999999",
    page: "1",
    offset: "1000",
    sort: "asc",
  });

  onStep(1);
  // Token transfers to get unique tokens
  const tokenData = await fetchBasescan({
    module: "account",
    action: "tokentx",
    address,
    startblock: "0",
    endblock: "99999999",
    page: "1",
    offset: "100",
    sort: "desc",
  });

  onStep(2);
  // ETH balance
  const balData = await fetchBasescan({
    module: "account",
    action: "balance",
    address,
    tag: "latest",
  });

  onStep(3);

  const txs = txData.result && Array.isArray(txData.result) ? txData.result : [];
  const tokenTxs = tokenData.result && Array.isArray(tokenData.result) ? tokenData.result : [];

  const uniqueTokens = new Set(tokenTxs.map((t) => t.contractAddress));
  const firstTx = txs.length > 0 ? txs[0] : null;
  const totalTxCount = txs.length;
  const todayTxList = getTodayTxs(txs);
  const todayTxCount = todayTxList.length;
  const todayContracts = getUniqueContracts(todayTxList);
  const totalGas = totalGasUsd(txs);
  const todayValue = estimateDailyValue(txs);
  const ethBalance = balData.result ? (weiToEth(balData.result)).toFixed(4) : "0.0000";
  const uniqueTokenCount = uniqueTokens.size;

  const growthScore = calculateGrowthScore(txs, uniqueTokenCount, totalGas);
  const level = Math.max(1, Math.floor(growthScore / 10));

  onStep(4);

  return {
    address,
    txs,
    totalTxCount,
    level,
    growthScore,
    todayTxCount,
    todayContracts,
    todayValue,
    totalGas,
    ethBalance,
    uniqueTokenCount,
    firstTxDate: firstTx ? formatDate(firstTx.timeStamp) : "不明",
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

  return (
    <canvas
      ref={canvasRef}
      width={300}
      height={300}
      className="spirit-canvas"
      style={{ borderRadius: "50%" }}
    />
  );
}

function FarmCanvas({ growthScore }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    const animate = () => {
      if (canvasRef.current) {
        drawFarm(canvasRef.current, growthScore);
      }
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [growthScore]);

  return (
    <canvas
      ref={canvasRef}
      width={600}
      height={400}
      className="farm-canvas"
    />
  );
}

// ─── Screen 1: Entrance ──────────────────────────────────────
function EntranceScreen({ onObserve }) {
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!address.trim()) { setError("アドレスまたはENS名を入力してください"); return; }
    setError("");
    onObserve(address.trim());
  };

  const handleTickerClick = (addr) => {
    setAddress(addr.replace("...", ""));
  };

  // Doubled for seamless loop
  const tickerItems = [...TICKER_DEMOS, ...TICKER_DEMOS];

  return (
    <div className="screen entrance-screen">
      {/* Hero */}
      <div className="entrance-hero">
        <div className="entrance-logo">
          <span className="logo-badge">⚡ BASE FARM</span>
        </div>

        {/* Static spirit orb */}
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
            {/* Eyes */}
            <circle cx="66" cy="74" r="6" fill="rgba(255,255,255,0.95)" />
            <circle cx="94" cy="74" r="6" fill="rgba(255,255,255,0.95)" />
            <circle cx="67.5" cy="75" r="3" fill="#001166" />
            <circle cx="95.5" cy="75" r="3" fill="#001166" />
            {/* Smile */}
            <path d="M 62 90 Q 80 105 98 90" stroke="rgba(255,255,255,0.9)" strokeWidth="3" fill="none" strokeLinecap="round" />
            {/* Shine */}
            <ellipse cx="64" cy="60" rx="12" ry="8" fill="rgba(255,255,255,0.3)" transform="rotate(-20 64 60)" />
          </svg>
        </div>

        <h1 className="entrance-title">あなたのBase上の<br />足跡を精霊に変換</h1>
        <p className="entrance-subtitle">
          Baseネットワーク上のオンチェーン活動を、農場と精霊のビジュアルに変換します。
          ウォレット接続は一切不要です。
        </p>
      </div>

      {/* Form */}
      <form className="input-card" onSubmit={handleSubmit} id="observe-form">
        <label className="input-label" htmlFor="address-input">
          ウォレットアドレスまたはENS
        </label>
        <input
          id="address-input"
          className="address-input"
          type="text"
          placeholder="0x... または vitalik.eth"
          value={address}
          onChange={(e) => { setAddress(e.target.value); setError(""); }}
          autoComplete="off"
          autoCorrect="off"
          spellCheck="false"
        />

        <div className="security-badge">
          <span>🔒</span>
          <span>読み取り専用 — ウォレットの接続・署名は一切不要です</span>
        </div>

        {error && (
          <div className="error-banner">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <button
          id="observe-btn"
          type="submit"
          className="observe-btn"
          disabled={!address.trim()}
        >
          🌾 足跡を辿る
        </button>
      </form>

      {/* Ticker */}
      <div className="ticker-wrapper">
        <p className="ticker-label">最近観測された農場</p>
        <div className="ticker-track">
          {tickerItems.map((item, i) => (
            <div
              key={i}
              className="ticker-item"
              onClick={() => handleTickerClick(item.addr)}
            >
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
function LoadingScreen({ address, stepIndex }) {
  return (
    <div className="screen loading-screen">
      <div className="loading-spirit">
        <div className="loading-ring" />
        <div className="loading-ring" />
        <div className="loading-ring" />
        <div className="loading-core" />
      </div>
      <div className="loading-text-group">
        <p className="loading-step" key={stepIndex}>
          {LOADING_STEPS[Math.min(stepIndex, LOADING_STEPS.length - 1)]}
        </p>
        <p className="loading-address">{shortenAddress(address)}</p>
      </div>
    </div>
  );
}

// ─── Screen 3: Results ─────────────────────────────────────────
function ResultScreen({ data, onBack, onShare }) {
  const [accordionOpen, setAccordionOpen] = useState(false);
  const [popup, setPopup] = useState(null);

  const farmBuildings = [
    { x: 0.5, y: 0.98, label: "本宅", desc: `Base農場の中心です。Growth Score ${data.growthScore} に応じて進化します。` },
    { x: 0.18, y: 0.98, label: "納屋", desc: data.growthScore >= 70 ? "豊かな農場の証拠です。" : "もっと活動すると建設されます。", locked: data.growthScore < 70 },
    { x: 0.78, y: 0.98, label: "サイロ", desc: data.growthScore >= 60 ? `${data.uniqueTokenCount}種のトークンを保有する多様な農場主です。` : "Score 60で解放されます。", locked: data.growthScore < 60 },
    { x: 0.35, y: 0.98, label: "井戸", desc: data.growthScore >= 40 ? "安定したETHバランスを維持しています。" : "Score 40で解放されます。", locked: data.growthScore < 40 },
  ];

  return (
    <div className="screen result-screen">
      {/* Back button */}
      <div style={{ padding: "16px 4px 0", display: "flex", alignItems: "center", gap: 12 }}>
        <button id="back-btn" className="back-btn" onClick={onBack} style={{ padding: "8px 16px", fontSize: 13 }}>
          ← 戻る
        </button>
        <span style={{ fontSize: 13, color: "var(--text-muted)", fontFamily: "monospace" }}>
          {shortenAddress(data.address)}
        </span>
      </div>

      {/* ── Section A: Spirit ── */}
      <section className="spirit-section" id="spirit-section">
        <div className="spirit-bg-glow" />
        <div className="spirit-canvas-wrapper">
          <SpiritCanvas spiritState={data.spiritState} todayTxCount={data.todayTxCount} />
        </div>

        <div className="spirit-stats-bar">
          <p className="spirit-label">✨ {data.spiritState.name}</p>
          <div className="spirit-value-big">${data.todayValue}</div>
          <p className="spirit-sub">今日の推定BASE獲得期待値</p>
        </div>

        <div className="spirit-meta-chips">
          <div className="meta-chip">
            <span className="chip-icon">⚡</span>
            <span>本日 {data.todayTxCount} Tx</span>
          </div>
          <div className="meta-chip">
            <span className="chip-icon">🔗</span>
            <span>コントラクト {data.todayContracts} 種</span>
          </div>
          <div className="meta-chip">
            <span className="chip-icon">💎</span>
            <span>{data.ethBalance} ETH</span>
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ── Section B: Farm ── */}
      <section className="farm-section" id="farm-section">
        <div className="section-header">
          <div className="section-icon">{data.farmTitle.icon}</div>
          <h2>{data.farmTitle.title}</h2>
          <p style={{ marginTop: "4px", fontSize: "13px", color: "var(--text-muted)" }}>{data.farmTitle.desc}</p>
        </div>

        <div className="farm-card">
          <div className="farm-canvas-wrapper">
            <FarmCanvas growthScore={data.growthScore} />
            <div className="farm-overlay-badge">
              <span>⚔️ Growth Score: {data.growthScore} (Lv.{data.level})</span>
            </div>

            {/* Tap zones */}
            {farmBuildings.map((b, i) => (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: `${b.x * 100}%`,
                  top: `${b.y * 100}%`,
                  transform: "translate(-50%, -100%)",
                  width: 60,
                  height: 60,
                  cursor: "pointer",
                  borderRadius: "50%",
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  const rect = e.currentTarget.parentElement.getBoundingClientRect();
                  setPopup(popup?.label === b.label ? null : { ...b, px: b.x * 100, py: Math.max(10, b.y * 100 - 30) });
                }}
              />
            ))}

            {popup && (
              <div
                className="farm-popup"
                style={{ left: `${popup.px}%`, top: `${popup.py}%`, transform: "translate(-50%, -100%)" }}
              >
                <strong style={{ color: popup.locked ? "var(--text-muted)" : "var(--spirit-cyan)" }}>
                  {popup.locked ? "🔒" : "🏠"} {popup.label}
                </strong>
                <br />
                {popup.desc}
              </div>
            )}
          </div>

          <div className="farm-stats-grid">
            <div className="farm-stat">
              <span className="farm-stat-label">開拓レベル</span>
              <span className="farm-stat-value">Lv.{data.level}</span>
            </div>
            <div className="farm-stat">
              <span className="farm-stat-label">総Tx数</span>
              <span className="farm-stat-value">{data.totalTxCount.toLocaleString()}</span>
            </div>
            <div className="farm-stat">
              <span className="farm-stat-label">トークン種類</span>
              <span className="farm-stat-value">{data.uniqueTokenCount}種</span>
            </div>
            <div className="farm-stat">
              <span className="farm-stat-label">消費ガス(推定)</span>
              <span className="farm-stat-value">${data.totalGas}</span>
            </div>
          </div>
        </div>

        {/* Farm title */}
        <div className="farm-title-card">
          <span className="farm-title-icon">{data.farmTitle.icon}</span>
          <div className="farm-title-text">
            <h3>{data.farmTitle.title}</h3>
            <p>{data.farmTitle.desc}</p>
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ── Section C: Data ── */}
      <section className="data-section" id="data-section">
        <div className="section-header">
          <div className="section-icon">📊</div>
          <h2>オンチェーン解析</h2>
        </div>

        <div className="accordion-card">
          <button
            id="accordion-trigger"
            className="accordion-trigger"
            onClick={() => setAccordionOpen(!accordionOpen)}
            aria-expanded={accordionOpen}
          >
            <span>詳細な活動記録を見る</span>
            <span className={`accordion-chevron ${accordionOpen ? "open" : ""}`}>▼</span>
          </button>
          <div className={`accordion-body ${accordionOpen ? "open" : ""}`}>
            <div className="data-list">
              {[

                { icon: "⚡", label: "総トランザクション数", value: `${data.totalTxCount.toLocaleString()} 回` },
                { icon: "🏦", label: "保有トークン種類", value: `${data.uniqueTokenCount} 種` },
                { icon: "⛽", label: "推定消費ガス代", value: `$${data.totalGas}` },
                { icon: "💎", label: "現在のETH残高", value: `${data.ethBalance} ETH` },
                { icon: "🌾", label: "開拓レベル", value: `Lv.${data.level}` },
                { icon: "✨", label: "精霊の状態", value: data.spiritState.name },
              ].map((row, i) => (
                <div key={i} className="data-row">
                  <div className="data-row-label">
                    <span>{row.icon}</span>
                    <span>{row.label}</span>
                  </div>
                  <span className="data-row-value">{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Float Share Button ── */}
      <div className="float-share">
        <button id="share-btn" className="share-btn" onClick={onShare}>
          <span>🌿</span>
          <span>この農場をCastする</span>
        </button>
      </div>
    </div>
  );
}

// ─── Share Modal ──────────────────────────────────────────────
function ShareModal({ data, onClose }) {
  const canvasRef = useRef(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (canvasRef.current) {
      generateShareCanvas(canvasRef.current, data);
    }
  }, [data]);

  const shareText = encodeURIComponent(
    `私のBase農場 🌾\n\n今日の精霊: ${data.spiritState?.name || "精霊"}\n推定獲得期待値: $${data.todayValue}\n開拓レベル: Lv.${data.level}\n\nあなたの農場はどんな姿？ 👇\nhttps://base-farm.vercel.app`
  );
  const warpcastUrl = `https://warpcast.com/~/compose?text=${shareText}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(
      `私のBase農場 🌾\n今日の精霊: ${data.spiritState?.name}\n推定獲得期待値: $${data.todayValue}\n開拓レベル: Lv.${data.level}\nhttps://base-farm.vercel.app`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="share-modal-overlay" onClick={onClose}>
      <div className="share-modal" onClick={(e) => e.stopPropagation()}>
        <h3>🌿 農場をシェアする</h3>

        <div className="share-preview">
          <canvas ref={canvasRef} width={480} height={270} style={{ width: "100%", borderRadius: 12 }} />
        </div>

        <div className="share-actions">
          <a
            id="warpcast-share-link"
            href={warpcastUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="warpcast-btn"
            style={{ textDecoration: "none" }}
          >
            <svg width="20" height="20" viewBox="0 0 1000 1000" fill="none">
              <path d="M257.778 155.556H742.222V844.444H671.111V528.889H670.414C662.554 441.677 589.258 373.333 500 373.333C410.742 373.333 337.446 441.677 329.586 528.889H328.889V844.444H257.778V155.556Z" fill="white"/>
              <path d="M128.889 253.333L157.778 351.111H182.222V746.667C169.949 746.667 160 756.616 160 768.889V795.556H155.556C143.283 795.556 133.333 805.505 133.333 817.778V844.444H382.222V817.778C382.222 805.505 372.273 795.556 360 795.556H355.556V768.889C355.556 756.616 345.606 746.667 333.333 746.667H306.667V253.333H128.889Z" fill="white"/>
              <path d="M817.778 746.667C805.505 746.667 795.556 756.616 795.556 768.889V795.556H791.111C778.838 795.556 768.889 805.505 768.889 817.778V844.444H1017.78V817.778C1017.78 805.505 1007.83 795.556 995.556 795.556H991.111V768.889C991.111 756.616 981.162 746.667 968.889 746.667V351.111H993.333L1022.22 253.333H844.444V746.667H817.778Z" fill="white"/>
            </svg>
            Warpcastでキャストする
          </a>

          <button id="copy-text-btn" className="copy-btn" onClick={handleCopy}>
            {copied ? "✓ コピーしました！" : "📋 テキストをコピーする"}
          </button>

          <button id="close-modal-btn" className="dismiss-btn" onClick={onClose}>
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────
export default function Home() {
  const [screen, setScreen] = useState("entrance"); // entrance | loading | result | error
  const [inputAddress, setInputAddress] = useState("");
  const [loadingStep, setLoadingStep] = useState(0);
  const [chainData, setChainData] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [showShare, setShowShare] = useState(false);

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
      setErrorMsg(err.message || "データの取得に失敗しました。");
      setScreen("error");
    }
  }, []);

  return (
    <div className="app-wrapper">
      {screen === "entrance" && <EntranceScreen onObserve={handleObserve} />}

      {screen === "loading" && (
        <LoadingScreen address={inputAddress} stepIndex={loadingStep} />
      )}

      {screen === "result" && chainData && (
        <ResultScreen
          data={chainData}
          onBack={() => setScreen("entrance")}
          onShare={() => setShowShare(true)}
        />
      )}

      {screen === "error" && (
        <div className="screen entrance-screen">
          <div className="error-banner">
            <span>❌</span>
            <span>{errorMsg}</span>
          </div>
          <button className="back-btn" onClick={() => setScreen("entrance")}>
            ← 戻って再入力する
          </button>
        </div>
      )}

      {showShare && chainData && (
        <ShareModal data={chainData} onClose={() => setShowShare(false)} />
      )}
    </div>
  );
}
