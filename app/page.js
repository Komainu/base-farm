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

function drawFarm(canvas, score, firstTxDate) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const W = canvas.width;
  const H = canvas.height;

  ctx.clearRect(0, 0, W, H);

  // Sky gradient
  const sky = ctx.createLinearGradient(0, 0, 0, H * 0.55);
  sky.addColorStop(0, "#0d1b3e");
  sky.addColorStop(1, "#1a3a5c");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H * 0.55);

  // Stars (more stars for higher score)
  const starCount = 8 + Math.floor(score / 5);
  for (let i = 0; i < starCount; i++) {
    const sx = Math.abs(Math.sin(i * 12.3)) * 0.9 + 0.05;
    const sy = Math.abs(Math.cos(i * 45.6)) * 0.4 + 0.05;
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.beginPath();
    ctx.arc(W * sx, H * sy, 1.2 + (score > 80 ? Math.random() * 0.8 : 0), 0, Math.PI * 2);
    ctx.fill();
  }

  // Moon
  ctx.fillStyle = "#ffeaa0";
  ctx.beginPath();
  ctx.arc(W * 0.82, H * 0.12, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#1a3a5c";
  ctx.beginPath();
  ctx.arc(W * 0.85, H * 0.1, 11, 0, Math.PI * 2);
  ctx.fill();

  // Ground
  const ground = ctx.createLinearGradient(0, H * 0.5, 0, H);
  ground.addColorStop(0, "#2d4a1e");
  ground.addColorStop(0.3, "#3d6228");
  ground.addColorStop(1, "#1a2e0f");
  ctx.fillStyle = ground;
  ctx.fillRect(0, H * 0.5, W, H * 0.5);

  // Path
  ctx.fillStyle = score > 50 ? "#a67b45" : "#8b6914"; // lighter path for higher score
  ctx.beginPath();
  ctx.moveTo(W * 0.42 - (score > 60 ? 10 : 0), H * 0.5);
  ctx.lineTo(W * 0.58 + (score > 60 ? 10 : 0), H * 0.5);
  ctx.lineTo(W * 0.65 + (score > 40 ? 15 : 0), H);
  ctx.lineTo(W * 0.35 - (score > 40 ? 15 : 0), H);
  ctx.fill();

  // ── Buildings based on score ──
  function drawHouse(x, y, w, h, color, roofColor) {
    ctx.fillStyle = color;
    ctx.fillRect(x - w/2, y - h, w, h);
    ctx.fillStyle = roofColor;
    ctx.beginPath();
    ctx.moveTo(x - w/2 - 4, y - h);
    ctx.lineTo(x, y - h - h * 0.55);
    ctx.lineTo(x + w/2 + 4, y - h);
    ctx.closePath();
    ctx.fill();
    // Door
    ctx.fillStyle = "#4a2800";
    ctx.fillRect(x - 5, y - 16, 10, 16);
    // Window
    ctx.fillStyle = "#ffe066";
    ctx.fillRect(x - w/2 + 6, y - h + 8, 10, 8);
    ctx.fillRect(x + w/2 - 16, y - h + 8, 10, 8);
  }
  
  function drawMansion(x, y) {
    drawHouse(x, y, 70, 50, "#d1b490", "#7a3c10");
    // Extra wings
    drawHouse(x - 45, y, 30, 35, "#b5956c", "#632d09");
    drawHouse(x + 45, y, 30, 35, "#b5956c", "#632d09");
    // Chimney
    ctx.fillStyle = "#7a3c10";
    ctx.fillRect(x + 20, y - 75, 8, 20);
  }

  function drawTree(x, y, size) {
    ctx.fillStyle = "#5c3d11";
    ctx.fillRect(x - size*0.08, y - size * 0.3, size*0.16, size * 0.35);
    ctx.fillStyle = "#2d7a3a";
    ctx.beginPath();
    ctx.arc(x, y - size * 0.5, size * 0.38, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#3d9a4a";
    ctx.beginPath();
    ctx.arc(x - size * 0.15, y - size * 0.6, size * 0.25, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawCrop(x, y, probability) {
    const isGrown = Math.random() < probability;
    ctx.strokeStyle = isGrown ? "#4fc87a" : "#8b6914";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y - (isGrown ? 18 : 10));
    ctx.stroke();
    if (isGrown) {
      ctx.fillStyle = "#ffd700";
      ctx.beginPath();
      ctx.arc(x, y - 16, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawSilo(x, y) {
    ctx.fillStyle = "#8b7355";
    ctx.fillRect(x - 12, y - 50, 24, 50);
    ctx.fillStyle = "#a0522d";
    ctx.beginPath();
    ctx.arc(x, y - 50, 12, Math.PI, 2 * Math.PI);
    ctx.fill();
  }

  function drawWell(x, y) {
    ctx.fillStyle = "#6b4c2a";
    ctx.fillRect(x - 10, y - 14, 20, 14);
    ctx.strokeStyle = "#4a3320";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - 10, y - 14); ctx.lineTo(x - 12, y - 22);
    ctx.moveTo(x + 10, y - 14); ctx.lineTo(x + 12, y - 22);
    ctx.moveTo(x - 12, y - 22); ctx.lineTo(x + 12, y - 22);
    ctx.stroke();
    ctx.fillStyle = "#223399";
    ctx.beginPath();
    ctx.ellipse(x, y - 2, 8, 4, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  const groundY = H * 0.5;

  // Base trees scale continuously
  const treeBaseSize = 15 + (score * 0.25);
  drawTree(W * 0.12, groundY + 2, treeBaseSize);
  drawTree(W * 0.88, groundY + 2, Math.max(10, treeBaseSize - 4));
  
  if (score > 10) drawTree(W * 0.75, groundY + 2, 10 + score * 0.2);
  if (score > 60) drawTree(W * 0.62, groundY + 2, 10 + score * 0.15);

  // House
  if (score <= 10) {
    // Small shack/tent
    drawHouse(W * 0.5, groundY + 1, 30, 25, "#8b6914", "#5c3d11");
  } else if (score <= 30) {
    drawHouse(W * 0.5, groundY + 1, 40, 30, "#a0522d", "#6b3410");
  } else if (score <= 80) {
    drawHouse(W * 0.5, groundY + 1, 52, 42, "#c4845a", "#8b4513");
  } else {
    drawMansion(W * 0.5, groundY + 1);
  }

  // Crops (Density based on score)
  const cropCount = Math.min(24, Math.floor(score / 4));
  const grownProbability = Math.min(1.0, score / 60);
  // Fixed seed for consistent crops per render frame, avoiding flickering
  const pseudoRandom = (seed) => {
    let x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  };
  
  for (let i = 0; i < cropCount; i++) {
    const isGrown = pseudoRandom(i * 100) < grownProbability;
    
    // Left side crops
    if (i % 2 === 0) {
      const x = W * 0.12 + (i/2) * 12;
      ctx.strokeStyle = isGrown ? "#4fc87a" : "#8b6914";
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x, groundY + 20); ctx.lineTo(x, groundY + 20 - (isGrown ? 18 : 10)); ctx.stroke();
      if (isGrown) {
        ctx.fillStyle = "#ffd700";
        ctx.beginPath(); ctx.arc(x, groundY + 20 - 16, 3, 0, Math.PI * 2); ctx.fill();
      }
    } else {
      // Right side crops
      const x = W * 0.74 + ((i-1)/2) * 12;
      ctx.strokeStyle = isGrown ? "#4fc87a" : "#8b6914";
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x, groundY + 20); ctx.lineTo(x, groundY + 20 - (isGrown ? 18 : 10)); ctx.stroke();
      if (isGrown) {
        ctx.fillStyle = "#ffd700";
        ctx.beginPath(); ctx.arc(x, groundY + 20 - 16, 3, 0, Math.PI * 2); ctx.fill();
      }
    }
  }

  // Equipment
  if (score >= 40) drawWell(W * 0.35, groundY);
  if (score >= 60) drawSilo(W * 0.78, groundY);
  if (score >= 70) drawHouse(W * 0.18, groundY + 1, 40, 34, "#8b4513", "#6b3410"); // Barn

  // Flowers
  if (score > 30) {
    const flowerCount = Math.floor((score - 30) / 2);
    for (let i = 0; i < flowerCount; i++) {
      ctx.fillStyle = i % 2 === 0 ? "#ff88dd" : "#ffffff";
      const fx = W * 0.35 + Math.sin(i * 11) * 30;
      const fy = groundY + 15 + Math.cos(i * 13) * 15;
      ctx.beginPath();
      ctx.arc(fx, fy, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  if (score >= 90) {
    // Golden Statue / Monument
    ctx.fillStyle = "#ffd700";
    ctx.fillRect(W * 0.88 - 6, groundY - 50, 12, 50);
    ctx.beginPath();
    ctx.arc(W * 0.88, groundY - 50, 10, 0, Math.PI * 2);
    ctx.fill();
  }

  // Fence (Density / quality improves)
  ctx.strokeStyle = score > 50 ? "#eeeeee" : "#7a5c2a"; // White picket fence for high score
  ctx.lineWidth = score > 50 ? 3 : 2;
  const fenceSpacing = score > 30 ? 18 : 25;
  for (let i = 0; i < Math.floor(W / fenceSpacing); i++) {
    ctx.beginPath();
    ctx.moveTo(i * fenceSpacing + 5, groundY - 2);
    ctx.lineTo(i * fenceSpacing + 5, groundY + 12);
    ctx.stroke();
    if (i > 0) {
      ctx.beginPath();
      ctx.moveTo((i - 1) * fenceSpacing + 5, groundY + 3);
      ctx.lineTo(i * fenceSpacing + 5, groundY + 3);
      ctx.stroke();
      if (score > 10) {
        ctx.beginPath();
        ctx.moveTo((i - 1) * fenceSpacing + 5, groundY + 8);
        ctx.lineTo(i * fenceSpacing + 5, groundY + 8);
        ctx.stroke();
      }
    }
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

function FarmCanvas({ growthScore, firstTxDate }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (canvasRef.current) {
      drawFarm(canvasRef.current, growthScore, firstTxDate);
    }
  }, [growthScore, firstTxDate]);

  return (
    <canvas
      ref={canvasRef}
      width={600}
      height={300}
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
            <FarmCanvas growthScore={data.growthScore} firstTxDate={data.firstTxDate} />
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
                { icon: "📅", label: "Base参入日", value: data.firstTxDate },
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
