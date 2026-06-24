const KEY_AUTO = "gangee_unified_auto_v1";
const KEY_PRESETS = "gangee_unified_presets_v1";

const S = {
  activeTab: "averaging"
};

function $(id) {
  return document.getElementById(id);
}

function getCurrencyInfo() {
  const currency = $("currency").value;
  if (currency === "KRW") return { symbol: "₩", locale: "ko-KR" };
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

function setActiveTab(tab) {
  S.activeTab = tab;

  $("tabAveraging").classList.toggle("active", tab === "averaging");
  $("tabInfinite").classList.toggle("active", tab === "infinite");

  $("averagingSection").classList.toggle("hidden", tab !== "averaging");
  $("infiniteSection").classList.toggle("hidden", tab !== "infinite");

  $("avgResultCard").classList.add("hidden");
  $("infResultCard").classList.add("hidden");

  $("calculatorType").value = tab === "averaging" ? "갱이 매매법 계산기" : "갱이 무한매수법 계산기";
  saveAuto();
}

function toggleStartModeFields() {
  const mode = $("startMode").value;
  $("freshFields").classList.toggle("hidden", mode !== "fresh");
  $("holdingFields").classList.toggle("hidden", mode !== "holding");
}

function toggleAvgFields() {
  const targetType = $("avgTargetType").value;
  const takeMode = $("avgTakeMode").value;
  $("avgCustomTargetRate").disabled = targetType !== "custom";
  $("avgTargetRate").disabled = targetType !== "preset";
  $("avgCustomRemainQty").disabled = takeMode !== "custom";
}

function toggleInfFields() {
  const targetType = $("infTargetType").value;
  $("infCustomTargetRate").disabled = targetType !== "custom";
  $("infTargetRate").disabled = targetType !== "preset";
}

function getAvgSelectedRate() {
  if ($("avgTargetType").value === "custom") {
    return parseFloat($("avgCustomTargetRate").value || "0");
  }
  return parseFloat($("avgTargetRate").value || "0");
}

function getInfSelectedRate() {
  if ($("infTargetType").value === "custom") {
    return parseFloat($("infCustomTargetRate").value || "0");
  }
  return parseFloat($("infTargetRate").value || "0");
}

function getAveragingPlan(price) {
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

function getAvgRemainQty(mode, firstBuyQty, totalQty, customRemainQty) {
  if (mode === "all") return 0;
  if (mode === "first") return Math.min(firstBuyQty, totalQty);
  if (mode === "custom") return Math.min(Math.max(customRemainQty, 0), totalQty);
  if (mode === "recover") return null;
  return 0;
}

function collectValues() {
  return {
    activeTab: S.activeTab,
    startMode: $("startMode").value,
    stockName: $("stockName").value,
    currency: $("currency").value,
    price: $("price").value,
    seed: $("seed").value,
    holdingAvgPrice: $("holdingAvgPrice").value,
    holdingQty: $("holdingQty").value,
    remainingSeed: $("remainingSeed").value,
    avgTakeMode: $("avgTakeMode").value,
    avgTargetType: $("avgTargetType").value,
    avgTargetRate: $("avgTargetRate").value,
    avgCustomTargetRate: $("avgCustomTargetRate").value,
    avgCustomRemainQty: $("avgCustomRemainQty").value,
    infSplitCount: $("infSplitCount").value,
    infTakeMode: $("infTakeMode").value,
    infTargetType: $("infTargetType").value,
    infTargetRate: $("infTargetRate").value,
    infCustomTargetRate: $("infCustomTargetRate").value,
    infMinBuyQty: $("infMinBuyQty").value
  };
}

function applyValues(v) {
  $("startMode").value = v.startMode || "fresh";
  $("stockName").value = v.stockName || "";
  $("currency").value = v.currency || "USD";
  $("price").value = v.price || "";
  $("seed").value = v.seed || "";
  $("holdingAvgPrice").value = v.holdingAvgPrice || "";
  $("holdingQty").value = v.holdingQty || "";
  $("remainingSeed").value = v.remainingSeed || "";
  $("avgTakeMode").value = v.avgTakeMode || "all";
  $("avgTargetType").value = v.avgTargetType || "preset";
  $("avgTargetRate").value = v.avgTargetRate || "3";
  $("avgCustomTargetRate").value = v.avgCustomTargetRate || "";
  $("avgCustomRemainQty").value = v.avgCustomRemainQty || "";
  $("infSplitCount").value = v.infSplitCount || "40";
  $("infTakeMode").value = v.infTakeMode || "all";
  $("infTargetType").value = v.infTargetType || "preset";
  $("infTargetRate").value = v.infTargetRate || "3";
  $("infCustomTargetRate").value = v.infCustomTargetRate || "";
  $("infMinBuyQty").value = v.infMinBuyQty || "2";

  setActiveTab(v.activeTab || "averaging");
  toggleStartModeFields();
  toggleAvgFields();
  toggleInfFields();
}

function saveAuto() {
  localStorage.setItem(KEY_AUTO, JSON.stringify(collectValues()));
  $("saveStatus").textContent = "입력값이 자동 저장되었습니다.";
}

function loadAuto() {
  const raw = localStorage.getItem(KEY_AUTO);
  if (!raw) return;
  try {
    const v = JSON.parse(raw);
    applyValues(v);
    $("saveStatus").textContent = "이전에 저장된 입력값을 불러왔습니다.";
  } catch {
    $("saveStatus").textContent = "저장값을 읽지 못했습니다.";
  }
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

function renderPresetSelect() {
  const list = getPresets();
  let html = `<option value="">저장된 설정을 선택하세요</option>`;
  html += list.map(item => {
    const calcName = item.data.activeTab === "infinite" ? "무한매수" : "물타기";
    return `<option value="${item.id}">${item.name} - ${calcName} - ${item.data.stockName || "종목명 없음"}</option>`;
  }).join("");
  $("presetSelect").innerHTML = html;
}

function savePreset() {
  const name = $("presetName").value.trim();
  if (!name) {
    alert("저장 이름을 입력해주세요.");
    return;
  }
  const list = getPresets();
  const item = { id: Date.now(), name, data: collectValues() };
  const idx = list.findIndex(x => x.name === name);
  if (idx >= 0) list[idx] = item;
  else list.unshift(item);
  setPresets(list);
  renderPresetSelect();
  $("presetName").value = "";
  $("saveStatus").textContent = "현재 설정을 저장했습니다.";
}

function loadPresetBySelected() {
  const id = Number($("presetSelect").value);
  if (!id) {
    alert("불러올 저장 설정을 선택해주세요.");
    return;
  }
  const item = getPresets().find(x => x.id === id);
  if (!item) return;
  applyValues(item.data);
  saveAuto();
  $("saveStatus").textContent = `"${item.name}" 설정을 불러왔습니다.`;
}

function deletePresetBySelected() {
  const id = Number($("presetSelect").value);
  if (!id) {
    alert("삭제할 저장 설정을 선택해주세요.");
    return;
  }
  const item = getPresets().find(x => x.id === id);
  if (!item) return;
  if (!confirm(`"${item.name}" 설정을 삭제할까요?`)) return;
  setPresets(getPresets().filter(x => x.id !== id));
  renderPresetSelect();
  $("saveStatus").textContent = "저장된 설정을 삭제했습니다.";
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    alert("복사되었습니다.");
  } catch {
    alert("복사에 실패했습니다.");
  }
}

function copyPlanSummary() {
  const text = $("planText").value.trim();
  if (!text) {
    alert("먼저 계산하기를 눌러주세요.");
    return;
  }
  copyText(text);
}

function copyScenarioSummary() {
  const text = $("scenarioText").value.trim();
  if (!text) {
    alert("먼저 계산하기를 눌러주세요.");
    return;
  }
  copyText(text);
}

function renderQuickList(id, rows) {
  $(id).innerHTML = rows.map(row => `
    <div class="quick-item">
      <div class="quick-label">${row.label}</div>
      <div class="quick-value">${row.value}</div>
    </div>
  `).join("");
}

function getBaseAccountState() {
  const startMode = $("startMode").value;
  const currentPrice = parseFloat($("price").value);
  if (!currentPrice || currentPrice <= 0) {
    throw new Error("현재 주가를 올바르게 입력해주세요.");
  }

  let existingQty = 0;
  let existingCost = 0;
  let availableSeed = 0;

  if (startMode === "fresh") {
    const seed = parseFloat($("seed").value);
    if (!seed || seed <= 0) throw new Error("총 시드금액을 올바르게 입력해주세요.");
    availableSeed = seed;
  } else {
    const holdingAvgPrice = parseFloat($("holdingAvgPrice").value);
    const holdingQty = parseFloat($("holdingQty").value);
    const remainingSeed = parseFloat($("remainingSeed").value);

    if (!holdingAvgPrice || holdingAvgPrice <= 0) throw new Error("현재 보유 단가를 올바르게 입력해주세요.");
    if (!holdingQty || holdingQty <= 0) throw new Error("현재 보유 수량을 올바르게 입력해주세요.");
    if (!remainingSeed || remainingSeed <= 0) throw new Error("남아있는 시드금액을 올바르게 입력해주세요.");

    existingQty = holdingQty;
    existingCost = holdingAvgPrice * holdingQty;
    availableSeed = remainingSeed;
  }

  return { startMode, currentPrice, existingQty, existingCost, availableSeed };
}

function calculateAveraging() {
  const { startMode, currentPrice, existingQty, existingCost, availableSeed } = getBaseAccountState();
  const stockName = $("stockName").value.trim();
  const takeMode = $("avgTakeMode").value;
  const selectedRate = getAvgSelectedRate();
  const customRemainQty = parseFloat($("avgCustomRemainQty").value || "0");

  if (selectedRate < 0) throw new Error("익절 목표 퍼센트는 0 이상으로 입력해주세요.");
  if (takeMode === "custom" && customRemainQty < 0) throw new Error("직접 남길 수량은 0 이상으로 입력해주세요.");

  const plan = getAveragingPlan(currentPrice);
  const unitCost = plan.reduce((sum, row) => sum + row.price * row.mult, 0);
  const baseQty = availableSeed / unitCost;
  const firstBuyQtyRef = baseQty;

  let addCumCost = 0;
  let totalQty = existingQty;
  let totalCost = existingCost;

  const rows = plan.map(row => {
    const qty = baseQty * row.mult;
    const cost = qty * row.price;
    addCumCost += cost;
    totalQty += qty;
    totalCost += cost;
    const avg = totalCost / totalQty;
    return {
      ...row,
      qty,
      cost,
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

  let finalRemainQty = getAvgRemainQty(takeMode, firstBuyQtyRef, finalRow.totalQty, customRemainQty);
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

  $("avgResultTitle").textContent = stockName ? `갱이 매매법 계산 결과 - ${stockName}` : "갱이 매매법 계산 결과";
  $("avgBaseQty").textContent = fmtNum(baseQty, 4) + "주";
  $("avgExistingCost").textContent = fmtMoney(existingCost);
  $("avgTotalCost").textContent = fmtMoney(finalRow.addCumCost);
  $("avgRemainCash").textContent = fmtMoney(remainCash);
  $("avgFinalQty").textContent = fmtNum(finalRow.totalQty, 4) + "주";
  $("avgFinalAvg").textContent = fmtMoney(finalRow.avg);
  $("avgSelectedTarget").textContent = `+${fmtNum(selectedRate, 2)}%`;
  $("avgSelectedTargetPrice").textContent = fmtMoney(selectedTargetPrice);
  $("avgFinalProfit").textContent = fmtMoney(finalProfit);
  $("avgFinalProfitRate").textContent = fmtPercent(finalProfitRate);

  $("avgTbody").innerHTML = rows.map(r => `
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
    let remainQty = getAvgRemainQty(takeMode, firstBuyQtyRef, r.totalQty, customRemainQty);
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

  $("avgScenarioBody").innerHTML = scenarioRows.map(r => `
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

  renderQuickList("avgPlanSummaryView", [
    { label: "시작 방식", value: startMode === "holding" ? "보유 상태 시작" : "새로 시작" },
    { label: "종목명", value: stockName || "-" },
    { label: "현재 주가", value: fmtMoney(currentPrice) },
    { label: "기준 수량", value: fmtNum(baseQty, 4) + "주" },
    { label: "최종 수량", value: fmtNum(finalRow.totalQty, 4) + "주" },
    { label: "최종 평단", value: fmtMoney(finalRow.avg) },
    { label: "최종 익절가", value: fmtMoney(selectedTargetPrice) },
    { label: "예상 수익", value: fmtMoney(finalProfit) },
    { label: "예상 수익률", value: fmtPercent(finalProfitRate) }
  ]);

  renderQuickList("avgScenarioSummaryView", scenarioRows.map(r => ({
    label: `${r.name}까지`,
    value: `평단 ${fmtMoney(r.avg)} / 익절 ${fmtMoney(r.exitPrice)} / 수익 ${fmtMoney(r.profit)} / ${fmtPercent(r.profitRate)}`
  })));

  $("planText").value = [
    `${stockName || "종목명 미입력"} - 갱이 매매법 계획 요약`,
    `현재 주가: ${fmtMoney(currentPrice)}`,
    `기준 수량: ${fmtNum(baseQty, 4)}주`,
    `최종 수량: ${fmtNum(finalRow.totalQty, 4)}주`,
    `최종 평단: ${fmtMoney(finalRow.avg)}`,
    `최종 익절가: ${fmtMoney(selectedTargetPrice)}`,
    `예상 수익: ${fmtMoney(finalProfit)}`,
    `예상 수익률: ${fmtPercent(finalProfitRate)}`
  ].join("\n");

  $("scenarioText").value = scenarioRows.map(r =>
    `[${r.name}까지] 수량 ${fmtNum(r.totalQty, 4)}주 / 평단 ${fmtMoney(r.avg)} / 익절 ${fmtMoney(r.exitPrice)} / 수익 ${fmtMoney(r.profit)} / ${fmtPercent(r.profitRate)}`
  ).join("\n");

  $("avgResultCard").classList.remove("hidden");
  $("infResultCard").classList.add("hidden");
}

function calculateInfinite() {
  const { startMode, currentPrice, existingQty, existingCost, availableSeed } = getBaseAccountState();
  const stockName = $("stockName").value.trim();
  const splitCount = parseInt($("infSplitCount").value || "40", 10);
  const minBuyQty = parseInt($("infMinBuyQty").value || "2", 10);
  const takeMode = $("infTakeMode").value;
  const selectedRate = getInfSelectedRate();

  if (!splitCount || splitCount <= 0) throw new Error("분할 수를 올바르게 입력해주세요.");
  if (!minBuyQty || minBuyQty <= 0) throw new Error("하루 최소 매수 기준을 올바르게 입력해주세요.");
  if (selectedRate < 0) throw new Error("익절 목표 퍼센트는 0 이상으로 입력해주세요.");

  const unitSeed = availableSeed / splitCount;
  const baseQty = unitSeed / currentPrice;
  const todayBuyQty = Math.max(baseQty, minBuyQty);
  const todayBuyCost = todayBuyQty * currentPrice;

  const totalCostAfterToday = existingCost + todayBuyCost;
  const totalQtyAfterToday = existingQty + todayBuyQty;
  const avgAfterToday = totalQtyAfterToday > 0 ? totalCostAfterToday / totalQtyAfterToday : 0;
  const targetPrice = avgAfterToday * (1 + selectedRate / 100);

  const usedSplits = Math.min(Math.floor(existingCost > 0 ? existingCost / unitSeed : 0), splitCount);
  const remainingSplit = Math.max(splitCount - usedSplits - 1, 0);
  const remainingCash = Math.max(availableSeed - todayBuyCost, 0);

  const sellAllAmount = totalQtyAfterToday * targetPrice;
  const profit = sellAllAmount - totalCostAfterToday;
  const profitRate = totalCostAfterToday > 0 ? (profit / totalCostAfterToday) * 100 : 0;

  $("infResultTitle").textContent = stockName ? `갱이 무한매수법 계산 결과 - ${stockName}` : "갱이 무한매수법 계산 결과";
  $("infUnitSeed").textContent = fmtMoney(unitSeed);
  $("infExistingCost").textContent = fmtMoney(existingCost);
  $("infExistingQty").textContent = fmtNum(existingQty, 4) + "주";
  $("infCurrentAvg").textContent = totalQtyAfterToday > 0 ? fmtMoney(avgAfterToday) : "-";
  $("infTodayBuyQty").textContent = fmtNum(todayBuyQty, 4) + "주";
  $("infTodayBuyCost").textContent = fmtMoney(todayBuyCost);
  $("infRemainingSplit").textContent = fmtNum(remainingSplit, 0) + "개";
  $("infRemainingCash").textContent = fmtMoney(remainingCash);
  $("infTargetPrice").textContent = fmtMoney(targetPrice);
  $("infProfitRate").textContent = fmtPercent(profitRate);

  const planRows = [];
  let runQty = existingQty;
  let runCost = existingCost;
  let runCash = availableSeed;

  for (let i = 1; i <= Math.min(splitCount, 10); i++) {
    const buyQty = Math.max(unitSeed / currentPrice, minBuyQty);
    const buyCost = buyQty * currentPrice;
    runQty += buyQty;
    runCost += buyCost;
    runCash -= buyCost;
    const avg = runCost / runQty;
    planRows.push({
      step: i,
      price: currentPrice,
      qty: buyQty,
      cost: buyCost,
      totalQty: runQty,
      avg,
      cash: Math.max(runCash, 0),
      remainSplit: Math.max(splitCount - i, 0)
    });
  }

  $("infTbody").innerHTML = planRows.map(r => `
    <tr>
      <td>${r.step}회차</td>
      <td>${fmtMoney(r.price)}</td>
      <td>${fmtNum(r.qty, 4)}주</td>
      <td>${fmtMoney(r.cost)}</td>
      <td>${fmtNum(r.totalQty, 4)}주</td>
      <td>${fmtMoney(r.avg)}</td>
      <td>${fmtMoney(r.cash)}</td>
      <td>${fmtNum(r.remainSplit, 0)}개</td>
    </tr>
  `).join("");

  const scenarioRows = planRows.map((r, idx) => {
    const tp = r.avg * (1 + selectedRate / 100);
    const allSellAmount = r.totalQty * tp;
    const p = allSellAmount - (existingCost + planRows.slice(0, idx + 1).reduce((s, x) => s + x.cost, 0));
    const pr = (existingCost + planRows.slice(0, idx + 1).reduce((s, x) => s + x.cost, 0)) > 0
      ? (p / (existingCost + planRows.slice(0, idx + 1).reduce((s, x) => s + x.cost, 0))) * 100
      : 0;
    const recoverQty = Math.min((existingCost + planRows.slice(0, idx + 1).reduce((s, x) => s + x.cost, 0)) / tp, r.totalQty);
    const remainQty = Math.max(r.totalQty - recoverQty, 0);
    return {
      step: idx + 1,
      totalQty: r.totalQty,
      avg: r.avg,
      tp,
      profit: p,
      profitRate: pr,
      recoverQty,
      remainQty
    };
  });

  $("infScenarioBody").innerHTML = scenarioRows.map(r => `
    <tr>
      <td>${r.step}회차 기준</td>
      <td>${fmtNum(r.totalQty, 4)}주</td>
      <td>${fmtMoney(r.avg)}</td>
      <td>${fmtMoney(r.tp)}</td>
      <td>${fmtMoney(r.profit)}</td>
      <td>${fmtPercent(r.profitRate)}</td>
      <td>${fmtNum(r.recoverQty, 4)}주</td>
      <td>${fmtNum(r.remainQty, 4)}주</td>
    </tr>
  `).join("");

  renderQuickList("infPlanSummaryView", [
    { label: "시작 방식", value: startMode === "holding" ? "보유 상태 시작" : "새로 시작" },
    { label: "종목명", value: stockName || "-" },
    { label: "1분할 금액", value: fmtMoney(unitSeed) },
    { label: "오늘 매수 수량", value: fmtNum(todayBuyQty, 4) + "주" },
    { label: "오늘 매수 금액", value: fmtMoney(todayBuyCost) },
    { label: "오늘 매수 후 평단", value: fmtMoney(avgAfterToday) },
    { label: "남은 분할 수", value: fmtNum(remainingSplit, 0) + "개" },
    { label: "남은 시드", value: fmtMoney(remainingCash) }
  ]);

  renderQuickList("infScenarioSummaryView", [
    { label: "익절 목표가", value: fmtMoney(targetPrice) },
    { label: "전량 매도 예상 수익", value: fmtMoney(profit) },
    { label: "예상 수익률", value: fmtPercent(profitRate) },
    { label: "원금 회수 필요 매도수량", value: fmtNum(Math.min(totalCostAfterToday / targetPrice, totalQtyAfterToday), 4) + "주" },
    { label: "원금 회수 후 남는 수량", value: fmtNum(Math.max(totalQtyAfterToday - Math.min(totalCostAfterToday / targetPrice, totalQtyAfterToday), 0), 4) + "주" }
  ]);

  $("planText").value = [
    `${stockName || "종목명 미입력"} - 갱이 무한매수법 계획 요약`,
    `현재 주가: ${fmtMoney(currentPrice)}`,
    `분할 수: ${splitCount}`,
    `1분할 금액: ${fmtMoney(unitSeed)}`,
    `오늘 매수 수량: ${fmtNum(todayBuyQty, 4)}주`,
    `오늘 매수 금액: ${fmtMoney(todayBuyCost)}`,
    `오늘 매수 후 평단: ${fmtMoney(avgAfterToday)}`,
    `익절 목표가: ${fmtMoney(targetPrice)}`,
    `예상 수익률: ${fmtPercent(profitRate)}`
  ].join("\n");

  $("scenarioText").value = scenarioRows.map(r =>
    `[${r.step}회차] 수량 ${fmtNum(r.totalQty, 4)}주 / 평단 ${fmtMoney(r.avg)} / 익절 ${fmtMoney(r.tp)} / 수익 ${fmtMoney(r.profit)} / ${fmtPercent(r.profitRate)}`
  ).join("\n");

  $("infResultCard").classList.remove("hidden");
  $("avgResultCard").classList.add("hidden");
}

function calculate() {
  try {
    saveAuto();
    if (S.activeTab === "averaging") {
      calculateAveraging();
    } else {
      calculateInfinite();
    }
  } catch (e) {
    alert(e.message || "계산 중 오류가 발생했습니다.");
  }
}

function resetForm() {
  $("startMode").value = "fresh";
  $("stockName").value = "";
  $("currency").value = "USD";
  $("price").value = "";
  $("seed").value = "";
  $("holdingAvgPrice").value = "";
  $("holdingQty").value = "";
  $("remainingSeed").value = "";
  $("avgTakeMode").value = "all";
  $("avgTargetType").value = "preset";
  $("avgTargetRate").value = "3";
  $("avgCustomTargetRate").value = "";
  $("avgCustomRemainQty").value = "";
  $("infSplitCount").value = "40";
  $("infTakeMode").value = "all";
  $("infTargetType").value = "preset";
  $("infTargetRate").value = "3";
  $("infCustomTargetRate").value = "";
  $("infMinBuyQty").value = "2";
  $("presetName").value = "";
  $("planText").value = "";
  $("scenarioText").value = "";
  $("avgResultCard").classList.add("hidden");
  $("infResultCard").classList.add("hidden");
  localStorage.removeItem(KEY_AUTO);
  toggleStartModeFields();
  toggleAvgFields();
  toggleInfFields();
  $("saveStatus").textContent = "입력값을 초기화했습니다.";
}

function bindEvents() {
  $("tabAveraging").addEventListener("click", () => setActiveTab("averaging"));
  $("tabInfinite").addEventListener("click", () => setActiveTab("infinite"));
  $("startMode").addEventListener("change", () => {
    toggleStartModeFields();
    saveAuto();
  });

  [
    "stockName", "currency", "price", "seed", "holdingAvgPrice", "holdingQty", "remainingSeed",
    "avgTakeMode", "avgTargetType", "avgTargetRate", "avgCustomTargetRate", "avgCustomRemainQty",
    "infSplitCount", "infTakeMode", "infTargetType", "infTargetRate", "infCustomTargetRate", "infMinBuyQty"
  ].forEach(id => {
    $(id).addEventListener("input", saveAuto);
    $(id).addEventListener("change", () => {
      toggleAvgFields();
      toggleInfFields();
      saveAuto();
    });
  });

  $("savePresetBtn").addEventListener("click", savePreset);
  $("loadPresetBtn").addEventListener("click", loadPresetBySelected);
  $("deletePresetBtn").addEventListener("click", deletePresetBySelected);
  $("calcBtn").addEventListener("click", calculate);
  $("resetBtn").addEventListener("click", resetForm);
  $("copyPlanBtn").addEventListener("click", copyPlanSummary);
  $("copyScenarioBtn").addEventListener("click", copyScenarioSummary);
}

loadAuto();
bindEvents();
toggleStartModeFields();
toggleAvgFields();
toggleInfFields();
renderPresetSelect();
setActiveTab(S.activeTab);
