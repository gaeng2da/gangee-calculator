const KEY_AUTO = "gangee_calc_v5_auto";
const KEY_PRESETS = "gangee_calc_v5_presets";

const ids = {
  stockName: "stockName",
  currency: "currency",
  price: "price",
  seed: "seed",
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
  totalCost: "totalCost",
  remainCash: "remainCash",
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

function getRemainQty(mode, baseQty, cumQty, customRemainQty) {
  if (mode === "all") return 0;
  if (mode === "first") return Math.min(baseQty, cumQty);
  if (mode === "custom") return Math.min(Math.max(customRemainQty, 0), cumQty);
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

function collectInputValues() {
  return {
    stockName: $(ids.stockName).value,
    currency: $(ids.currency).value,
    price: $(ids.price).value,
    seed: $(ids.seed).value,
    takeMode: $(ids.takeMode).value,
    targetType: $(ids.targetType).value,
    targetRate: $(ids.targetRate).value,
    customTargetRate: $(ids.customTargetRate).value,
    customRemainQty: $(ids.customRemainQty).value
  };
}

function applyInputValues(data) {
  $(ids.stockName).value = data.stockName || "";
  $(ids.currency).value = data.currency || "USD";
  $(ids.price).value = data.price || "";
  $(ids.seed).value = data.seed || "";
  $(ids.takeMode).value = data.takeMode || "all";
  $(ids.targetType).value = data.targetType || "preset";
  $(ids.targetRate).value = data.targetRate || "3";
  $(ids.customTargetRate).value = data.customTargetRate || "";
  $(ids.customRemainQty).value = data.customRemainQty || "";
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
    ids.stockName,
    ids.currency,
    ids.price,
    ids.seed,
    ids.takeMode,
    ids.targetType,
    ids.targetRate,
    ids.customTargetRate,
    ids.customRemainQty
  ].forEach(id => {
    $(id).addEventListener("input", saveAuto);
    $(id).addEventListener("change", () => {
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
  $(ids.saveStatus).textContent = "현재 설정을 종목별 저장 목록에 저장했습니다.";
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
      d.stockName || "종목명 없음",
      d.currency || "USD",
      d.price ? `현재가 ${d.price}` : "",
      d.seed ? `시드 ${d.seed}` : "",
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
  const stockName = $(ids.stockName).value.trim();
  const price = parseFloat($(ids.price).value);
  const seed = parseFloat($(ids.seed).value);
  const takeMode = $(ids.takeMode).value;
  const selectedRate = getSelectedRate();
  const customRemainQty = parseFloat($(ids.customRemainQty).value || "0");

  if (!price || !seed || price <= 0 || seed <= 0) {
    alert("현재 주가와 총 시드금액을 올바르게 입력해주세요.");
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

  saveAuto();

  const plan = getPlan(price);
  const unitCost = plan.reduce((sum, row) => sum + row.price * row.mult, 0);
  const baseQty = seed / unitCost;

  let cumQty = 0;
  let cumCost = 0;

  const rows = plan.map(row => {
    const qty = baseQty * row.mult;
    const cost = qty * row.price;
    cumQty += qty;
    cumCost += cost;
    const avg = cumCost / cumQty;

    return {
      ...row,
      qty,
      cost,
      cumQty,
      cumCost,
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
  const totalCost = finalRow.cumCost;
  const remainCash = seed - totalCost;

  let finalRemainQty = getRemainQty(takeMode, baseQty, finalRow.cumQty, customRemainQty);
  let finalSellQty = 0;
  let finalSellAmount = 0;

  if (takeMode === "recover") {
    finalSellQty = Math.min(finalRow.cumCost / selectedTargetPrice, finalRow.cumQty);
    finalSellAmount = finalSellQty * selectedTargetPrice;
    finalRemainQty = Math.max(finalRow.cumQty - finalSellQty, 0);
  } else {
    finalSellQty = Math.max(finalRow.cumQty - finalRemainQty, 0);
    finalSellAmount = finalSellQty * selectedTargetPrice;
  }

  const finalRemainValue = finalRemainQty * selectedTargetPrice;
  const finalTotalValue = finalSellAmount + finalRemainValue;
  const finalProfit = finalTotalValue - finalRow.cumCost;
  const finalProfitRate = finalRow.cumCost > 0 ? (finalProfit / finalRow.cumCost) * 100 : 0;

  $(ids.resultTitle).textContent = stockName ? `계산 결과 - ${stockName}` : "계산 결과";
  $(ids.baseQty).textContent = fmtNum(baseQty, 4) + "주";
  $(ids.totalCost).textContent = fmtMoney(totalCost);
  $(ids.remainCash).textContent = fmtMoney(remainCash);
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
      <td>${fmtNum(r.cumQty, 4)}주</td>
      <td>${fmtMoney(r.cumCost)}</td>
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
    let remainQty = getRemainQty(takeMode, baseQty, r.cumQty, customRemainQty);
    let sellQty = 0;
    let sellAmount = 0;

    const recoverQty = Math.min(r.cumCost / exitPrice, r.cumQty);
    const recoverRemainQty = Math.max(r.cumQty - recoverQty, 0);
    const recoverProfit = recoverRemainQty * exitPrice;

    if (takeMode === "recover") {
      sellQty = recoverQty;
      sellAmount = sellQty * exitPrice;
      remainQty = recoverRemainQty;
    } else {
      sellQty = Math.max(r.cumQty - remainQty, 0);
      sellAmount = sellQty * exitPrice;
    }

    const remainValue = remainQty * exitPrice;
    const totalValue = sellAmount + remainValue;
    const profit = totalValue - r.cumCost;
    const profitRate = r.cumCost > 0 ? (profit / r.cumCost) * 100 : 0;

    return {
      name: r.name,
      cumQty: r.cumQty,
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
      <td>${fmtNum(r.cumQty, 4)}주</td>
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

  const planSummary = [
    `${stockName || "종목명 미입력"} - 갱이 매매법 계획 요약`,
    `통화: ${$(ids.currency).value}`,
    `현재 주가: ${fmtMoney(price)}`,
    `총 시드금액: ${fmtMoney(seed)}`,
    `자동 기준 수량: ${fmtNum(baseQty, 4)}주`,
    `선택 익절 목표: +${fmtNum(selectedRate, 2)}%`,
    `선택 익절 방식: ${modeText}`,
    `진입 가격: ${fmtMoney(rows[0].price)}`,
    `1차 가격: ${fmtMoney(rows[1].price)}`,
    `2차 가격: ${fmtMoney(rows[2].price)}`,
    `3차 가격: ${fmtMoney(rows[3].price)}`,
    `4차 가격: ${fmtMoney(rows[4].price)}`,
    `5차 가격: ${fmtMoney(rows[5].price)}`,
    `최종 누적 평단: ${fmtMoney(finalRow.avg)}`,
    `최종 선택 익절가: ${fmtMoney(selectedTargetPrice)}`,
    `최종 예상 수익: ${fmtMoney(finalProfit)}`,
    `최종 예상 수익률: ${fmtPercent(finalProfitRate)}`
  ].join("\n");

  const scenarioSummary = scenarioRows.map(r => {
    return [
      `[${r.name}까지]`,
      `누적 수량 ${fmtNum(r.cumQty, 4)}주`,
      `누적 평단 ${fmtMoney(r.avg)}`,
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

  $(ids.simpleGuide).innerHTML = `
    <strong>${stockName ? stockName + " " : ""}한눈에 보는 쉬운 설명</strong>
    <p>총 시드금액 ${fmtMoney(seed)} 안에서 5차까지 가능하도록 첫 기준 수량을 <span class="ok">${fmtNum(baseQty, 4)}주</span>로 자동 계산했습니다.</p>
    <p>현재 선택한 익절 목표는 <span class="warn">+${fmtNum(selectedRate, 2)}%</span>이고, 최종 기준 선택 익절가는 <span class="warn">${fmtMoney(selectedTargetPrice)}</span>입니다.</p>
    <p>현재 익절 방식은 <span class="warn">${modeText}</span>입니다.</p>
    <p>최종 기준으로 계산했을 때 예상 수익은 <span class="ok">${fmtMoney(finalProfit)}</span>, 예상 수익률은 <span class="ok">${fmtPercent(finalProfitRate)}</span>입니다.</p>
    <p>종목별 저장 기능으로 같은 전략을 나중에 다시 바로 불러올 수 있습니다.</p>
  `;

  $(ids.resultCard).style.display = "block";
  $(ids.resultCard).scrollIntoView({ behavior: "smooth", block: "start" });
}

function resetForm() {
  $(ids.stockName).value = "";
  $(ids.currency).value = "USD";
  $(ids.price).value = "";
  $(ids.seed).value = "";
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
  $(ids.totalCost).textContent = "-";
  $(ids.remainCash).textContent = "-";
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
toggleCustomFields();
renderPresetList();
