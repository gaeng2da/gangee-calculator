const KEY_AUTO = "gangee_calc_v6_auto";
const KEY_PRESETS = "gangee_calc_v6_presets";

const ids = {
  startMode: "startMode",
  stockName: "stockName",
  currency: "currency",
  price: "price",
  seed: "seed",
  holdingAvgPrice: "holdingAvgPrice",
  holdingQty: "holdingQty",
  remainingSeed: "remainingSeed",
  freshFields: "freshFields",
  holdingFields: "holdingFields",
  takeMode: "takeMode",
  targetType: "targetType",
  targetRate: "targetRate",
  customTargetRate: "customTargetRate",
  customRemainQty: "customRemainQty",
  presetName: "presetName",
  saveStatus: "saveStatus",
  resultCard: "resultCard",
  resultTitle: "resultTitle",
  baseQty: "baseQty",
  existingCost: "existingCost",
  totalCost: "totalCost",
  remainCash: "remainCash",
  finalQty: "finalQty",
  finalAvg: "finalAvg",
  selectedTarget: "selectedTarget",
  selectedTargetPrice: "selectedTargetPrice",
  finalProfit: "finalProfit",
  finalProfitRate: "finalProfitRate",
  tbody: "tbody",
  scenarioBody: "scenarioBody",
  planText: "planText",
  scenarioText: "scenarioText",
  simpleGuide: "simpleGuide",
  presetList: "presetList"
};

function $(id) {
  return document.getElementById(id);
}

function getCurrencyInfo() {
  const currency = $(ids.currency).value;
  if (currency === "KRW") {
    return { symbol: "₩", locale: "ko-KR" };
  }
  return { symbol: "$", locale: "en-US" };
}

function fmtNum(v, d = 4) {
  return Number(v).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: d
  });
}

function fmtMoney(v) {
  const info = getCurrencyInfo();
  return info.symbol + Number(v).toLocaleString(info.locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function fmtPercent(v) {
  return Number(v).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }) + "%";
}

function getPlan(price) {
  const mults = [1, 1, 2, 4, 12, 36];
  const names = ["진입", "1차", "2차", "3차", "4차", "5차"];
  const prices = [];
  prices[0] = price;
  prices[1] = prices[0] * 0.8;
  prices[2] = prices[1] * 0.89;
  prices[3] = prices[2] * 0.5;
  prices[4] = prices[3] * 0.5;
  prices[5] = prices[4] * 0.5;

  return names.map((name, i) => ({
    name,
    price: prices[i],
    mult: mults[i]
  }));
}

function getSelectedRate() {
  const targetType = $(ids.targetType).value;
  if (targetType === "custom") {
    return parseFloat($(ids.customTargetRate).value || "0");
  }
  return parseFloat($(ids.targetRate).value);
}

function getRemainQty(mode, firstBuyQty, totalQty, customRemainQty) {
  if (mode === "all") return 0;
  if (mode === "first") return Math.min(firstBuyQty, totalQty);
  if (mode === "custom") return Math.min(Math.max(customRemainQty, 0), totalQty);
  if (mode === "recover") return null;
  return 0;
}

function toggleCustomFields() {
  const takeMode = $(ids.takeMode).value;
  const targetType = $(ids.targetType).value;
  $(ids.customRemainQty).disabled = takeMode !== "custom";
  $(ids.customTargetRate).disabled = targetType !== "custom";
  $(ids.targetRate).disabled = targetType !== "preset";
}

function toggleStartModeFields() {
  const startMode = $(ids.startMode).value;
  $(ids.freshFields).classList.toggle("hidden", startMode !== "fresh");
  $(ids.holdingFields).classList.toggle("hidden", startMode !== "holding");
}

function collectInputValues() {
  return {
    startMode: $(ids.startMode).value,
    stockName: $(ids.stockName).value,
    currency: $(ids.currency).value,
    price: $(ids.price).value,
    seed: $(ids.seed).value,
    holdingAvgPrice: $(ids.holdingAvgPrice).value,
    holdingQty: $(ids.holdingQty).value,
    remainingSeed: $(ids.remainingSeed).value,
    takeMode: $(ids.takeMode).value,
    targetType: $(ids.targetType).value,
    targetRate: $(ids.targetRate).value,
    customTargetRate: $(ids.customTargetRate).value,
    customRemainQty: $(ids.customRemainQty).value
  };
}

function applyInputValues(data) {
  $(ids.startMode).value = data.startMode || "fresh";
  $(ids.stockName).value = data.stockName || "";
  $(ids.currency).value = data.currency || "USD";
  $(ids.price).value = data.price || "";
  $(ids.seed).value = data.seed || "";
  $(ids.holdingAvgPrice).value = data.holdingAvgPrice || "";
  $(ids.holdingQty).value = data.holdingQty || "";
  $(ids.remainingSeed).value = data.remainingSeed || "";
  $(ids.takeMode).value = data.takeMode || "all";
  $(ids.targetType).value = data.targetType || "preset";
  $(ids.targetRate).value = data.targetRate || "3";
  $(ids.customTargetRate).value = data.customTargetRate || "";
  $(ids.customRemainQty).value = data.customRemainQty || "";
  toggleStartModeFields();
  toggleCustomFields();
}

function saveAuto() {
  localStorage.setItem(KEY_AUTO, JSON.stringify(collectInputValues()));
  $(ids.saveStatus).textContent = "입력값이 이 기기에 자동 저장되었습니다.";
}

function loadAuto() {
  const raw = localStorage.getItem(KEY_AUTO);
  if (!raw) return;
  try {
    const data = JSON.parse(raw);
    applyInputValues(data);
    $(ids.saveStatus).textContent = "이전에 저장된 입력값을 불러왔습니다.";
  } catch {
    $(ids.saveStatus).textContent = "저장값을 읽지 못했습니다.";
  }
}

function bindAutoSave() {
  [
    ids.startMode,
    ids.stockName,
    ids.currency,
    ids.price,
    ids.seed,
    ids.holdingAvgPrice,
    ids.holdingQty,
    ids.remainingSeed,
    ids.takeMode,
    ids.targetType,
    ids.targetRate,
    ids.customTargetRate,
    ids.customRemainQty
  ].forEach(id => {
    $(id).addEventListener("input", saveAuto);
    $(id).addEventListener("change", () => {
      toggleStartModeFields();
      toggleCustomFields();
      saveAuto();
    });
  });
}

function getPresets() {
  const raw = localStorage.getItem(KEY_PRESETS);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function setPresets(list) {
  localStorage.setItem(KEY_PRESETS, JSON.stringify(list));
}

function savePreset() {
  const name = $(ids.presetName).value.trim();
  if (!name) {
    alert("저장 이름을 입력해주세요.");
    return;
  }

  const presets = getPresets();
  const item = {
    id: Date.now(),
    name,
    data: collectInputValues()
  };

  const existingIndex = presets.findIndex(p => p.name === name);
  if (existingIndex >= 0) {
    presets[existingIndex] = item;
  } else {
    presets.unshift(item);
  }

  setPresets(presets);
  renderPresetList();
  $(ids.presetName).value = "";
  $(ids.saveStatus).textContent = "현재 설정을 저장했습니다.";
}

function loadPreset(id) {
  const presets = getPresets();
  const item = presets.find(p => p.id === id);
  if (!item) return;
  applyInputValues(item.data);
  saveAuto();
  $(ids.saveStatus).textContent = `"${item.name}" 설정을 불러왔습니다.`;
}

function deletePreset(id) {
  const presets = getPresets().filter(p => p.id !== id);
  setPresets(presets);
  renderPresetList();
  $(ids.saveStatus).textContent = "저장된 설정을 삭제했습니다.";
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getTakeModeText(mode, customRemainQty = "") {
  if (mode === "all") return "전량 익절";
  if (mode === "first") return "첫 진입 수량만 남기기";
  if (mode === "custom") return `직접 수량 ${customRemainQty || 0}주 남기기`;
  if (mode === "recover") return "원금 회수 후 보유";
  return "";
}

function getStartModeText(mode) {
  return mode === "holding" ? "보유 상태에서 시작" : "새로 시작";
}

function renderPresetList() {
  const presets = getPresets();
  const box = $(ids.presetList);

  if (!presets.length) {
    box.innerHTML = `<div class="empty-box">아직 저장된 종목 설정이 없습니다. 입력 후 "현재 설정 저장" 버튼을 눌러보세요.</div>`;
    return;
  }

  box.innerHTML = presets.map(item => {
    const d = item.data || {};
    const desc = [
      getStartModeText(d.startMode || "fresh"),
      d.stockName || "종목명 없음",
      d.currency || "USD",
      d.price ? `현재가 ${d.price}` : "",
      d.startMode === "holding"
        ? `보유 ${d.holdingQty || 0}주 / 단가 ${d.holdingAvgPrice || 0}`
        : `시드 ${d.seed || 0}`,
      d.startMode === "holding"
        ? `남은 시드 ${d.remainingSeed || 0}`
        : "",
      d.takeMode ? `익절방식 ${getTakeModeText(d.takeMode, d.customRemainQty)}` : ""
    ].filter(Boolean).join(" / ");

    return `
      <div class="preset-item">
        <div class="preset-meta">
          <div class="preset-name">${escapeHtml(item.name)}</div>
          <div class="preset-desc">${escapeHtml(desc)}</div>
        </div>
        <div class="preset-actions">
          <button class="small-btn load-btn" data-load-id="${item.id}">불러오기</button>
          <button class="small-btn delete-btn" data-delete-id="${item.id}">삭제</button>
        </div>
      </div>
    `;
  }).join("");

  box.querySelectorAll("[data-load-id]").forEach(btn => {
    btn.addEventListener("click", () => loadPreset(Number(btn.dataset.loadId)));
  });

  box.querySelectorAll("[data-delete-id]").forEach(btn => {
    btn.addEventListener("click", () => {
      const ok = confirm("이 저장 설정을 삭제할까요?");
      if (ok) deletePreset(Number(btn.dataset.deleteId));
    });
  });
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    alert("복사되었습니다.");
  } catch {
    alert("복사에 실패했습니다. 아래 요약 박스에서 직접 복사해주세요.");
  }
}

function copyPlanSummary() {
  const text = $(ids.planText).value.trim();
  if (!text) {
    alert("먼저 계산하기를 눌러주세요.");
    return;
  }
  copyText(text);
}

function copyScenarioSummary() {
  const text = $(ids.scenarioText).value.trim();
  if (!text) {
    alert("먼저 계산하기를 눌러주세요.");
    return;
  }
  copyText(text);
}

function calculate() {
  const startMode = $(ids.startMode).value;
  const stockName = $(ids.stockName).value.trim();
  const currentPrice = parseFloat($(ids.price).value);
  const takeMode = $(ids.takeMode).value;
  const selectedRate = getSelectedRate();
  const customRemainQty = parseFloat($(ids.customRemainQty).value || "0");

  if (!currentPrice || currentPrice <= 0) {
    alert("현재 주가를 올바르게 입력해주세요.");
    return;
  }
  if (selectedRate < 0) {
    alert("익절 목표 퍼센트는 0 이상으로 입력해주세요.");
    return;
  }
  if (takeMode === "custom" && customRemainQty < 0) {
    alert("직접 남길 수량은 0 이상으로 입력해주세요.");
    return;
  }

  let existingQty = 0;
  let existingCost = 0;
  let availableSeed = 0;
  let firstBuyQtyRef = 0;

  if (startMode === "fresh") {
    const seed = parseFloat($(ids.seed).value);
    if (!seed || seed <= 0) {
      alert("총 시드금액을 올바르게 입력해주세요.");
      return;
    }
    availableSeed = seed;
  } else {
    const holdingAvgPrice = parseFloat($(ids.holdingAvgPrice).value);
    const holdingQty = parseFloat($(ids.holdingQty).value);
    const remainingSeed = parseFloat($(ids.remainingSeed).value);

    if (!holdingAvgPrice || holdingAvgPrice <= 0) {
      alert("현재 보유 단가를 올바르게 입력해주세요.");
      return;
    }
    if (!holdingQty || holdingQty <= 0) {
      alert("현재 보유 수량을 올바르게 입력해주세요.");
      return;
    }
    if (!remainingSeed || remainingSeed <= 0) {
      alert("남아있는 시드금액을 올바르게 입력해주세요.");
      return;
    }

    existingQty = holdingQty;
    existingCost = holdingAvgPrice * holdingQty;
    availableSeed = remainingSeed;
  }

  saveAuto();

  const plan = getPlan(currentPrice);
  const unitCost = plan.reduce((sum, row) => sum + row.price * row.mult, 0);
  const baseQty = availableSeed / unitCost;
  firstBuyQtyRef = baseQty;

  let addCumQty = 0;
  let addCumCost = 0;
  let totalQty = existingQty;
  let totalCost = existingCost;

  const rows = plan.map(row => {
    const qty = baseQty * row.mult;
    const cost = qty * row.price;

    addCumQty += qty;
    addCumCost += cost;
    totalQty += qty;
    totalCost += cost;

    const avg = totalCost / totalQty;

    return {
      ...row,
      qty,
      cost,
      addCumQty,
      addCumCost,
      totalQty,
      totalCost,
      avg,
      tp3: avg * 1.03,
      tp5: avg * 1.05,
      tp10: avg * 1.10,
      tp15: avg * 1.15,
      tp20: avg * 1.20,
      tp25: avg * 1.25,
      tp30: avg * 1.30
    };
  });

  const finalRow = rows[rows.length - 1];
  const selectedTargetPrice = finalRow.avg * (1 + selectedRate / 100);
  const remainCash = availableSeed - finalRow.addCumCost;

  let finalRemainQty = getRemainQty(takeMode, firstBuyQtyRef, finalRow.totalQty, customRemainQty);
  let finalSellQty = 0;
  let finalSellAmount = 0;

  if (takeMode === "recover") {
    finalSellQty = Math.min(finalRow.totalCost / selectedTargetPrice, finalRow.totalQty);
    finalSellAmount = finalSellQty * selectedTargetPrice;
    finalRemainQty = Math.max(finalRow.totalQty - finalSellQty, 0);
  } else {
    finalSellQty = Math.max(finalRow.totalQty - finalRemainQty, 0);
    finalSellAmount = finalSellQty * selectedTargetPrice;
  }

  const finalRemainValue = finalRemainQty * selectedTargetPrice;
  const finalTotalValue = finalSellAmount + finalRemainValue;
  const finalProfit = finalTotalValue - finalRow.totalCost;
  const finalProfitRate = finalRow.totalCost > 0 ? (finalProfit / finalRow.totalCost) * 100 : 0;

  $(ids.resultTitle).textContent = stockName ? `계산 결과 - ${stockName}` : "계산 결과";
  $(ids.baseQty).textContent = fmtNum(baseQty, 4) + "주";
  $(ids.existingCost).textContent = fmtMoney(existingCost);
  $(ids.totalCost).textContent = fmtMoney(finalRow.addCumCost);
  $(ids.remainCash).textContent = fmtMoney(remainCash);
  $(ids.finalQty).textContent = fmtNum(finalRow.totalQty, 4) + "주";
  $(ids.finalAvg).textContent = fmtMoney(finalRow.avg);
  $(ids.selectedTarget).textContent = `+${fmtNum(selectedRate, 2)}%`;
  $(ids.selectedTargetPrice).textContent = fmtMoney(selectedTargetPrice);
  $(ids.finalProfit).textContent = fmtMoney(finalProfit);
  $(ids.finalProfitRate).textContent = fmtPercent(finalProfitRate);

  $(ids.tbody).innerHTML = rows.map(r => `
    <tr>
      <td>${r.name}</td>
      <td>${fmtMoney(r.price)}</td>
      <td>${r.mult}배</td>
      <td>${fmtNum(r.qty, 4)}주</td>
      <td>${fmtMoney(r.cost)}</td>
      <td>${fmtNum(r.totalQty, 4)}주</td>
      <td>${fmtMoney(r.totalCost)}</td>
      <td>${fmtMoney(r.avg)}</td>
      <td>${fmtMoney(r.tp3)}</td>
      <td>${fmtMoney(r.tp5)}</td>
      <td>${fmtMoney(r.tp10)}</td>
      <td>${fmtMoney(r.tp15)}</td>
      <td>${fmtMoney(r.tp20)}</td>
      <td>${fmtMoney(r.tp25)}</td>
      <td>${fmtMoney(r.tp30)}</td>
    </tr>
  `).join("");

  const scenarioRows = rows.map(r => {
    const exitPrice = r.avg * (1 + selectedRate / 100);

    let remainQty = getRemainQty(takeMode, firstBuyQtyRef, r.totalQty, customRemainQty);
    let sellQty = 0;
    let sellAmount = 0;

    const recoverQty = Math.min(r.totalCost / exitPrice, r.totalQty);
    const recoverRemainQty = Math.max(r.totalQty - recoverQty, 0);
    const recoverProfit = recoverRemainQty * exitPrice;

    if (takeMode === "recover") {
      sellQty = recoverQty;
      sellAmount = sellQty * exitPrice;
      remainQty = recoverRemainQty;
    } else {
      sellQty = Math.max(r.totalQty - remainQty, 0);
      sellAmount = sellQty * exitPrice;
    }

    const remainValue = remainQty * exitPrice;
    const totalValue = sellAmount + remainValue;
    const profit = totalValue - r.totalCost;
    const profitRate = r.totalCost > 0 ? (profit / r.totalCost) * 100 : 0;

    return {
      name: r.name,
      totalQty: r.totalQty,
      avg: r.avg,
      exitPrice,
      remainQty,
      sellQty,
      sellAmount,
      profit,
      profitRate,
      recoverQty,
      recoverRemainQty,
      recoverProfit
    };
  });

  $(ids.scenarioBody).innerHTML = scenarioRows.map(r => `
    <tr>
      <td>${r.name}까지</td>
      <td>${fmtNum(r.totalQty, 4)}주</td>
      <td>${fmtMoney(r.avg)}</td>
      <td>${fmtMoney(r.exitPrice)}</td>
      <td>${fmtNum(r.remainQty, 4)}주</td>
      <td>${fmtNum(r.sellQty, 4)}주</td>
      <td>${fmtMoney(r.sellAmount)}</td>
      <td>${fmtMoney(r.profit)}</td>
      <td>${fmtPercent(r.profitRate)}</td>
      <td>${fmtNum(r.recoverQty, 4)}주</td>
      <td>${fmtNum(r.recoverRemainQty, 4)}주</td>
      <td>${fmtMoney(r.recoverProfit)}</td>
    </tr>
  `).join("");

  const modeText = getTakeModeText(takeMode, customRemainQty);
  const startText = getStartModeText(startMode);

  const startSummary = startMode === "fresh"
    ? [
        `시작 방식: ${startText}`,
        `총 시드금액: ${fmtMoney(availableSeed)}`
      ]
    : [
        `시작 방식: ${startText}`,
        `현재 보유 단가: ${fmtMoney(existingQty > 0 ? existingCost / existingQty : 0)}`,
        `현재 보유 수량: ${fmtNum(existingQty, 4)}주`,
        `기존 보유 금액: ${fmtMoney(existingCost)}`,
        `남아있는 시드금액: ${fmtMoney(availableSeed)}`
      ];

  const planSummary = [
    `${stockName || "종목명 미입력"} - 갱이 매매법 계획 요약`,
    ...startSummary,
    `통화: ${$(ids.currency).value}`,
    `현재 주가: ${fmtMoney(currentPrice)}`,
    `추가매수 기준 수량: ${fmtNum(baseQty, 4)}주`,
    `선택 익절 목표: +${fmtNum(selectedRate, 2)}%`,
    `선택 익절 방식: ${modeText}`,
    `진입 가격: ${fmtMoney(rows[0].price)}`,
    `1차 가격: ${fmtMoney(rows[1].price)}`,
    `2차 가격: ${fmtMoney(rows[2].price)}`,
    `3차 가격: ${fmtMoney(rows[3].price)}`,
    `4차 가격: ${fmtMoney(rows[4].price)}`,
    `5차 가격: ${fmtMoney(rows[5].price)}`,
    `추가 매수 총액: ${fmtMoney(finalRow.addCumCost)}`,
    `최종 합산 수량: ${fmtNum(finalRow.totalQty, 4)}주`,
    `최종 합산 평단: ${fmtMoney(finalRow.avg)}`,
    `최종 선택 익절가: ${fmtMoney(selectedTargetPrice)}`,
    `최종 예상 수익: ${fmtMoney(finalProfit)}`,
    `최종 예상 수익률: ${fmtPercent(finalProfitRate)}`
  ].join("\n");

  const scenarioSummary = scenarioRows.map(r => {
    return [
      `[${r.name}까지]`,
      `합산 수량 ${fmtNum(r.totalQty, 4)}주`,
      `합산 평단 ${fmtMoney(r.avg)}`,
      `익절가 ${fmtMoney(r.exitPrice)}`,
      `매도 수량 ${fmtNum(r.sellQty, 4)}주`,
      `남는 수량 ${fmtNum(r.remainQty, 4)}주`,
      `예상 매도 금액 ${fmtMoney(r.sellAmount)}`,
      `예상 수익 ${fmtMoney(r.profit)}`,
      `예상 수익률 ${fmtPercent(r.profitRate)}`,
      `원금 회수 필요 매도수량 ${fmtNum(r.recoverQty, 4)}주`,
      `원금 회수 후 남는 수량 ${fmtNum(r.recoverRemainQty, 4)}주`,
      `원금 회수 후 남는 수익 ${fmtMoney(r.recoverProfit)}`
    ].join(" / ");
  }).join("\n");

  $(ids.planText).value = planSummary;
  $(ids.scenarioText).value = scenarioSummary;

  $(ids.simpleGuide).innerHTML = startMode === "fresh"
    ? `
      <strong>${stockName ? stockName + " " : ""}한눈에 보는 쉬운 설명</strong>
      <p>새로 시작 기준으로 총 시드금액 ${fmtMoney(availableSeed)} 안에서 5차까지 가능하도록 추가매수 기준 수량을 <span class="ok">${fmtNum(baseQty, 4)}주</span>로 계산했습니다.</p>
      <p>최종 합산 수량은 <span class="ok">${fmtNum(finalRow.totalQty, 4)}주</span>, 최종 합산 평단은 <span class="ok">${fmtMoney(finalRow.avg)}</span>입니다.</p>
      <p>현재 선택한 익절 목표는 <span class="warn">+${fmtNum(selectedRate, 2)}%</span>, 최종 선택 익절가는 <span class="warn">${fmtMoney(selectedTargetPrice)}</span>입니다.</p>
      <p>최종 예상 수익은 <span class="ok">${fmtMoney(finalProfit)}</span>, 예상 수익률은 <span class="ok">${fmtPercent(finalProfitRate)}</span>입니다.</p>
    `
    : `
      <strong>${stockName ? stockName + " " : ""}한눈에 보는 쉬운 설명</strong>
      <p>현재 보유 수량 <span class="ok">${fmtNum(existingQty, 4)}주</span>, 보유 단가 <span class="ok">${fmtMoney(existingCost / existingQty)}</span>를 먼저 반영했습니다.</p>
      <p>남아있는 시드금액 <span class="ok">${fmtMoney(availableSeed)}</span> 안에서 5차까지 추가매수를 계산했고, 최종 합산 수량은 <span class="ok">${fmtNum(finalRow.totalQty, 4)}주</span>입니다.</p>
      <p>최종 합산 평단은 <span class="ok">${fmtMoney(finalRow.avg)}</span>, 선택 익절가는 <span class="warn">${fmtMoney(selectedTargetPrice)}</span>입니다.</p>
      <p>즉, 이미 들고 있는 물량을 포함해서 앞으로 어떻게 물타고 어느 가격에서 익절할지 한 번에 볼 수 있습니다.</p>
    `;

  $(ids.resultCard).style.display = "block";
  $(ids.resultCard).scrollIntoView({ behavior: "smooth", block: "start" });
}

function resetForm() {
  $(ids.startMode).value = "fresh";
  $(ids.stockName).value = "";
  $(ids.currency).value = "USD";
  $(ids.price).value = "";
  $(ids.seed).value = "";
  $(ids.holdingAvgPrice).value = "";
  $(ids.holdingQty).value = "";
  $(ids.remainingSeed).value = "";
  $(ids.takeMode).value = "all";
  $(ids.targetType).value = "preset";
  $(ids.targetRate).value = "3";
  $(ids.customTargetRate).value = "";
  $(ids.customRemainQty).value = "";
  $(ids.presetName).value = "";
  $(ids.resultCard).style.display = "none";
  $(ids.tbody).innerHTML = "";
  $(ids.scenarioBody).innerHTML = "";
  $(ids.resultTitle).textContent = "계산 결과";
  $(ids.baseQty).textContent = "-";
  $(ids.existingCost).textContent = "-";
  $(ids.totalCost).textContent = "-";
  $(ids.remainCash).textContent = "-";
  $(ids.finalQty).textContent = "-";
  $(ids.finalAvg).textContent = "-";
  $(ids.selectedTarget).textContent = "-";
  $(ids.selectedTargetPrice).textContent = "-";
  $(ids.finalProfit).textContent = "-";
  $(ids.finalProfitRate).textContent = "-";
  $(ids.planText).value = "";
  $(ids.scenarioText).value = "";
  $(ids.simpleGuide).innerHTML = "";
  localStorage.removeItem(KEY_AUTO);
  $(ids.saveStatus).textContent = "자동 저장된 입력값과 화면을 초기화했습니다.";
  toggleStartModeFields();
  toggleCustomFields();
}

function bindButtons() {
  $("calcBtn").addEventListener("click", calculate);
  $("resetBtn").addEventListener("click", resetForm);
  $("copyPlanBtn").addEventListener("click", copyPlanSummary);
  $("copyScenarioBtn").addEventListener("click", copyScenarioSummary);
  $("savePresetBtn").addEventListener("click", savePreset);
}

loadAuto();
bindAutoSave();
bindButtons();
toggleStartModeFields();
toggleCustomFields();
renderPresetList();
