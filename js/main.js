"use strict";

const screens = [...document.querySelectorAll("[data-screen]")];
const progressSteps = [...document.querySelectorAll("[data-progress]")];
const arena = document.querySelector("#button-arena");
const yesButton = document.querySelector("#yes-button");
const noButton = document.querySelector("#no-button");
const noMessage = document.querySelector("#no-message");
const littleHint = document.querySelector("#little-hint");
const calendarDays = document.querySelector("#calendar-days");
const monthLabel = document.querySelector("#calendar-month");
const previousMonthButton = document.querySelector("#previous-month");
const nextMonthButton = document.querySelector("#next-month");
const timeDateLabel = document.querySelector("#time-date-label");
const timeSlots = [...document.querySelectorAll(".time-slot")];
const confirmButton = document.querySelector("#confirm-button");
const celebrationOverlay = document.querySelector("#celebration-overlay");
const loadingOverlay = document.querySelector("#loading-overlay");
const particleLayer = document.querySelector("#particle-layer");
const toast = document.querySelector("#toast-message");
const shareButton = document.querySelector("#share-date");
const downloadDateCardButton = document.querySelector("#download-date-card");
const whatsappChatLink = document.querySelector("#whatsapp-chat-link");
const shareStatus = document.querySelector("#share-status");

const escapeMessages = [
  "HAHAHA! 😂 You can't catch me!",
  "Nice try, baby! 😜💕",
  "Wrong button, princess! 👑",
  "Hehe… I'm too fast for you! 🏃‍♀️💨",
  "Your boyfriend is waitinggg! Say YES! 🥹❤️",
  "Nope! Not today, madam! 😂",
  "Catch me first, then we'll talk! 🤭",
  "ERROR 404: NO button not found! 💻🤣",
  "Stop chasing me and accept the date! 😘💗",
  "Plot twist: YES is the only correct answer! 😏❤️",
  "I saw that coming. Try the cute pink one! 🏃‍♀️✨",
  "Objection! This date is way too adorable to refuse! ⚖️💖",
];
const particleSymbols = ["♥", "♡", "✦", "✧", "❀", "✿"];
const particleColors = ["#e77e9d", "#f2aac0", "#98cbe2", "#c4a6d9", "#fff", "#e7a69f"];
const timeFormatter = new Intl.DateTimeFormat(undefined, {
  hour: "numeric",
  minute: "2-digit",
});
const dateFormatter = new Intl.DateTimeFormat(undefined, {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});
const monthFormatter = new Intl.DateTimeFormat(undefined, {
  month: "long",
  year: "numeric",
});

let today = startOfDay(new Date());
let visibleMonth = new Date(today.getFullYear(), today.getMonth(), 1);
let selectedDate = "";
let selectedTime = "";
let escapeCount = 0;
let currentMessageIndex = -1;
let toastTimeout;
let messageTimeout;
let messageFrame;
let confirmationInProgress = false;
let shareOperationInProgress = false;
let shareImagePromise;

document.body.append(noMessage);

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function dateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dateFromKey(key) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function refreshToday() {
  const latestToday = startOfDay(new Date());
  if (latestToday.getTime() !== today.getTime()) {
    const showingCurrentMonth =
      visibleMonth.getFullYear() === today.getFullYear() &&
      visibleMonth.getMonth() === today.getMonth();
    today = latestToday;
    if (selectedDate && selectedDate < dateKey(today)) {
      selectedDate = "";
      selectedTime = "";
    }
    if (showingCurrentMonth) {
      visibleMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    }
    return true;
  }
  return false;
}

function showScreen(name) {
  for (const screen of screens) {
    const isCurrent = screen.dataset.screen === name;
    screen.hidden = !isCurrent;
    screen.classList.toggle("is-visible", isCurrent);
  }

  const names = ["invitation", "planning", "celebration"];
  const currentIndex = names.indexOf(name);
  for (const [index, step] of progressSteps.entries()) {
    step.classList.toggle("is-active", index === currentIndex);
    step.classList.toggle("is-complete", index < currentIndex);
  }
  document.querySelector(`[data-screen="${name}"] h1, [data-screen="${name}"] h2`)?.focus({
    preventScroll: true,
  });
  if (name === "invitation") {
    escapeCount = 0;
    currentMessageIndex = -1;
    littleHint.hidden = true;
    resetNoButtonPosition();
  }
}

function positionEscapeMessage() {
  const bubbleWidth = noMessage.offsetWidth;
  const bubbleHeight = noMessage.offsetHeight;
  const buttonRect = noButton.getBoundingClientRect();
  const yesRect = yesButton.getBoundingClientRect();
  const viewportPadding = 14;
  const maxLeft = Math.max(viewportPadding, window.innerWidth - bubbleWidth - viewportPadding);
  const maxTop = Math.max(viewportPadding, window.innerHeight - bubbleHeight - viewportPadding);
  const clamp = (value, max) => Math.max(viewportPadding, Math.min(max, value));
  const candidates = [
    { left: buttonRect.left + buttonRect.width / 2 - bubbleWidth / 2, top: buttonRect.top - bubbleHeight - 14 },
    { left: buttonRect.left + buttonRect.width / 2 - bubbleWidth / 2, top: buttonRect.bottom + 14 },
    { left: buttonRect.right + 14, top: buttonRect.top + buttonRect.height / 2 - bubbleHeight / 2 },
    { left: buttonRect.left - bubbleWidth - 14, top: buttonRect.top + buttonRect.height / 2 - bubbleHeight / 2 },
  ].map((candidate) => ({
    left: clamp(candidate.left, maxLeft),
    top: clamp(candidate.top, maxTop),
  }));
  const overlaps = (first, second, gap = 8) =>
    first.left < second.right + gap &&
    first.left + bubbleWidth > second.left - gap &&
    first.top < second.bottom + gap &&
    first.top + bubbleHeight > second.top - gap;
  const yesBounds = {
    left: yesRect.left,
    right: yesRect.right,
    top: yesRect.top,
    bottom: yesRect.bottom,
  };
  const noBounds = {
    left: buttonRect.left,
    right: buttonRect.right,
    top: buttonRect.top,
    bottom: buttonRect.bottom,
  };
  const safeCandidates = candidates.filter(
    (candidate) => !overlaps(candidate, yesBounds) && !overlaps(candidate, noBounds),
  );
  const selected = safeCandidates.length
    ? safeCandidates[Math.floor(Math.random() * safeCandidates.length)]
    : candidates[0];

  noMessage.style.left = `${selected.left}px`;
  noMessage.style.top = `${selected.top}px`;
}

function pickAnotherMessage() {
  let nextIndex = Math.floor(Math.random() * escapeMessages.length);
  if (escapeMessages.length > 1 && nextIndex === currentMessageIndex) {
    nextIndex = (nextIndex + 1 + Math.floor(Math.random() * (escapeMessages.length - 1))) % escapeMessages.length;
  }
  currentMessageIndex = nextIndex;
  noMessage.textContent = escapeMessages[nextIndex];
  noMessage.hidden = false;
  noMessage.classList.remove("is-speaking");
  window.clearTimeout(messageTimeout);
  if (messageFrame) window.cancelAnimationFrame(messageFrame);
  void noMessage.offsetWidth;
  noMessage.classList.add("is-speaking");
  messageFrame = window.requestAnimationFrame(positionEscapeMessage);
  messageTimeout = window.setTimeout(() => {
    noMessage.classList.remove("is-speaking");
    noMessage.hidden = true;
  }, 3200);
}

function dismissEscapeMessage() {
  window.clearTimeout(messageTimeout);
  if (messageFrame) window.cancelAnimationFrame(messageFrame);
  noMessage.classList.remove("is-speaking");
  noMessage.hidden = true;
  noMessage.style.removeProperty("left");
  noMessage.style.removeProperty("top");
}

function escapeNoButton() {
  const arenaRect = arena.getBoundingClientRect();
  const buttonRect = noButton.getBoundingClientRect();
  const yesRect = yesButton.getBoundingClientRect();
  const buttonWidth = buttonRect.width;
  const buttonHeight = buttonRect.height;
  const edgePadding = 22;
  const minLeft = Math.min(edgePadding, (arenaRect.width - buttonWidth) / 2);
  const minTop = Math.min(edgePadding, (arenaRect.height - buttonHeight) / 2);
  const maxLeft = Math.max(minLeft, arenaRect.width - buttonWidth - minLeft);
  const maxTop = Math.max(minTop, arenaRect.height - buttonHeight - minTop);
  const yesBounds = {
    left: yesRect.left - arenaRect.left - buttonWidth * 0.3,
    right: yesRect.right - arenaRect.left + buttonWidth * 0.3,
    top: yesRect.top - arenaRect.top - buttonHeight * 0.45,
    bottom: yesRect.bottom - arenaRect.top + buttonHeight * 0.45,
  };
  const currentLeft = noButton.offsetLeft;
  const currentTop = noButton.offsetTop;
  const jumpToCenter = escapeCount > 1 && Math.random() < 0.2;
  const horizontalRange = maxLeft - minLeft;
  const verticalRange = maxTop - minTop;
  const overlapsYes = (candidate) =>
    candidate.left < yesBounds.right &&
    candidate.left + buttonWidth > yesBounds.left &&
    candidate.top < yesBounds.bottom &&
    candidate.top + buttonHeight > yesBounds.top;
  let target = null;

  for (let attempt = 0; attempt < 50; attempt += 1) {
    const left = jumpToCenter
      ? minLeft + horizontalRange / 2 + (Math.random() - 0.5) * Math.min(50, horizontalRange)
      : minLeft + Math.random() * horizontalRange;
    const top = jumpToCenter
      ? minTop + verticalRange / 2 + (Math.random() - 0.5) * Math.min(36, verticalRange)
      : minTop + Math.random() * verticalRange;
    const candidate = {
      left: Math.max(minLeft, Math.min(maxLeft, left)),
      top: Math.max(minTop, Math.min(maxTop, top)),
    };
    const overlaps = overlapsYes(candidate);
    const movedEnough = Math.hypot(candidate.left - currentLeft, candidate.top - currentTop) > 55;

    if (!overlaps && (movedEnough || attempt === 49)) {
      target = candidate;
      if (movedEnough) break;
    }
  }

  if (!target) {
    const centerLeft = minLeft + horizontalRange / 2;
    const centerTop = minTop + verticalRange / 2;
    const rightStart = Math.max(minLeft, Math.min(maxLeft, yesBounds.right));
    const belowStart = Math.max(minTop, Math.min(maxTop, yesBounds.bottom));
    const safeCorners = [
      { left: rightStart, top: minTop },
      { left: rightStart, top: maxTop },
      { left: maxLeft, top: minTop },
      { left: maxLeft, top: maxTop },
      { left: minLeft, top: belowStart },
      { left: maxLeft, top: belowStart },
      { left: minLeft, top: maxTop },
      { left: maxLeft, top: maxTop },
    ].filter(
      (candidate) => !overlapsYes(candidate),
    );
    const distantCorners = safeCorners.filter(
      (candidate) => Math.hypot(candidate.left - currentLeft, candidate.top - currentTop) > 55,
    );
    const centerFallback = distantCorners
      .slice()
      .sort(
        (first, second) =>
          Math.hypot(first.left - centerLeft, first.top - centerTop) -
          Math.hypot(second.left - centerLeft, second.top - centerTop),
      )[0];
    target =
      centerFallback ||
      safeCorners
        .slice()
        .sort(
          (first, second) =>
            Math.hypot(second.left - currentLeft, second.top - currentTop) -
            Math.hypot(first.left - currentLeft, first.top - currentTop),
        )[0];
  }

  if (target) {
    noButton.style.right = "auto";
    noButton.style.left = `${target.left}px`;
    noButton.style.top = `${target.top}px`;
  }

  noButton.classList.remove("is-jumping");
  if (escapeCount % 3 === 0 || Math.random() < 0.3) {
    void noButton.offsetWidth;
    noButton.classList.add("is-jumping");
  }

  escapeCount += 1;
  pickAnotherMessage();
  if (escapeCount >= 4) littleHint.hidden = false;
}

function resetNoButtonPosition() {
  noButton.style.removeProperty("left");
  noButton.style.removeProperty("right");
  noButton.style.removeProperty("top");
  dismissEscapeMessage();
}

function renderCalendar() {
  refreshToday();
  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  monthLabel.textContent = monthFormatter.format(visibleMonth);
  previousMonthButton.disabled =
    year === today.getFullYear() && month === today.getMonth();
  const maximumMonth = new Date(today.getFullYear(), today.getMonth() + 24, 1);
  nextMonthButton.disabled =
    year === maximumMonth.getFullYear() && month === maximumMonth.getMonth();
  calendarDays.replaceChildren();

  const firstWeekday = new Date(year, month, 1).getDay();
  const numberOfDays = new Date(year, month + 1, 0).getDate();
  const totalCells = Math.ceil((firstWeekday + numberOfDays) / 7) * 7;

  for (let cellIndex = 0; cellIndex < totalCells; cellIndex += 1) {
    const dayNumber = cellIndex - firstWeekday + 1;
    if (dayNumber < 1 || dayNumber > numberOfDays) {
      const emptyCell = document.createElement("span");
      emptyCell.className = "day-cell day-cell-empty";
      emptyCell.setAttribute("aria-hidden", "true");
      calendarDays.append(emptyCell);
      continue;
    }

    const dayDate = new Date(year, month, dayNumber);
    const dayKey = dateKey(dayDate);
    const dayButton = document.createElement("button");
    dayButton.type = "button";
    dayButton.className = "day-cell";
    dayButton.textContent = String(dayNumber);
    dayButton.setAttribute("aria-label", dateFormatter.format(dayDate));
    dayButton.setAttribute("aria-pressed", String(dayKey === selectedDate));
    dayButton.style.animationDelay = `${Math.min(cellIndex, 20) * 9}ms`;
    dayButton.disabled = dayDate < today;

    if (dayDate.getTime() === today.getTime()) dayButton.classList.add("is-today");
    if (dayKey === selectedDate) dayButton.classList.add("is-selected");

    dayButton.addEventListener("click", () => {
      if (selectedDate !== dayKey) selectedTime = "";
      selectedDate = dayKey;
      updateTimeChoices();
      renderCalendar();
    });
    calendarDays.append(dayButton);
  }
}

function updateTimeChoices() {
  if (refreshToday()) renderCalendar();
  const hasDate = Boolean(selectedDate);
  const chosenDate = hasDate ? dateFromKey(selectedDate) : null;
  const isToday = hasDate && selectedDate === dateKey(today);
  const now = new Date();

  if (!hasDate) {
    timeDateLabel.textContent = "Choose a day first to see your date times.";
  } else {
    timeDateLabel.textContent = `For ${dateFormatter.format(chosenDate)}`;
  }

  let selectedTimeIsValid = false;
  for (const slot of timeSlots) {
    const slotTime = slot.dataset.time;
    const [hour, minute] = slotTime.split(":").map(Number);
    const isPastToday =
      isToday && (hour < now.getHours() || (hour === now.getHours() && minute <= now.getMinutes()));
    const isDisabled = !hasDate || isPastToday;
    slot.disabled = isDisabled;
    slot.classList.toggle("is-selected", slotTime === selectedTime && !isDisabled);
    slot.setAttribute("aria-pressed", String(slotTime === selectedTime && !isDisabled));
    if (slotTime === selectedTime && !isDisabled) selectedTimeIsValid = true;
  }

  if (!selectedTimeIsValid) selectedTime = "";
  confirmButton.disabled = !hasDate || !selectedTimeIsValid;
  if (isToday && timeSlots.every((slot) => slot.disabled)) {
    timeDateLabel.textContent = "Those times have passed today — pick a future day, lovely.";
  }
}

function moveMonth(offset) {
  visibleMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + offset, 1);
  renderCalendar();
}

function showToast(message) {
  window.clearTimeout(toastTimeout);
  toast.textContent = message;
  toast.classList.add("is-visible");
  toastTimeout = window.setTimeout(() => toast.classList.remove("is-visible"), 3000);
}

function dateShareMessage() {
  const date = document.querySelector("#confirmed-date").textContent;
  const time = document.querySelector("#confirmed-time").textContent;
  return `Hey! ❤️🥹

Our little date is planned!

📅 Date: ${date}
⏰ Time: ${time}

One little date, a million little feelings, and my favourite person to spend it with. 💗

Looking forward to our special time together! 🫶💕`;
}

function updateWhatsAppLink() {
  whatsappChatLink.href = `https://wa.me/?text=${encodeURIComponent(dateShareMessage())}`;
}

function roundedRectangle(context, x, y, width, height, radius, fill, stroke) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
  if (fill) {
    context.fillStyle = fill;
    context.fill();
  }
  if (stroke) {
    context.strokeStyle = stroke;
    context.stroke();
  }
}

function drawShareHeart(context, x, y, size, color) {
  context.save();
  context.translate(x, y);
  context.scale(size / 100, size / 100);
  context.beginPath();
  context.moveTo(50, 88);
  context.bezierCurveTo(41, 80, 5, 55, 5, 30);
  context.bezierCurveTo(5, 8, 33, 0, 50, 20);
  context.bezierCurveTo(67, 0, 95, 8, 95, 30);
  context.bezierCurveTo(95, 55, 59, 80, 50, 88);
  context.fillStyle = color;
  context.fill();
  context.restore();
}

function fitCanvasText(context, text, x, y, maxWidth, fontSize, minimumSize = 24) {
  let size = fontSize;
  context.font = `700 ${size}px "DM Sans", "Trebuchet MS", sans-serif`;
  while (context.measureText(text).width > maxWidth && size > minimumSize) {
    size -= 1;
    context.font = `700 ${size}px "DM Sans", "Trebuchet MS", sans-serif`;
  }
  context.fillText(text, x, y);
}

async function createDateCardImage() {
  await document.fonts.ready;
  await new Promise((resolve) => {
    window.requestAnimationFrame(() => window.requestAnimationFrame(resolve));
  });

  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 900;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("This browser could not create the date card image.");

  const background = context.createLinearGradient(0, 0, 1200, 900);
  background.addColorStop(0, "#eaf6fb");
  background.addColorStop(0.52, "#fff6fa");
  background.addColorStop(1, "#fff4ed");
  context.fillStyle = background;
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.fillStyle = "rgba(255, 255, 255, 0.46)";
  context.beginPath();
  context.arc(130, 150, 190, 0, Math.PI * 2);
  context.fill();
  context.beginPath();
  context.arc(1080, 760, 230, 0, Math.PI * 2);
  context.fill();
  drawShareHeart(context, 120, 660, 58, "rgba(224, 121, 153, 0.42)");
  drawShareHeart(context, 1030, 150, 48, "rgba(143, 198, 223, 0.55)");
  drawShareHeart(context, 970, 690, 30, "rgba(224, 121, 153, 0.36)");

  context.shadowColor = "rgba(116, 99, 129, 0.16)";
  context.shadowBlur = 36;
  context.shadowOffsetY = 15;
  roundedRectangle(context, 76, 48, 1048, 804, 42, "rgba(255, 255, 255, 0.94)");
  context.shadowColor = "transparent";
  context.shadowBlur = 0;
  context.shadowOffsetY = 0;
  roundedRectangle(context, 76, 48, 1048, 804, 42, null, "rgba(255, 255, 255, 0.95)");

  drawShareHeart(context, 556, 102, 48, "#e77999");
  drawShareHeart(context, 606, 114, 24, "#f1b0c4");
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillStyle = "#bd7a94";
  context.font = '700 18px "DM Sans", "Trebuchet MS", sans-serif';
  context.letterSpacing = "4px";
  context.fillText("OUR LITTLE DATE", 600, 190);
  context.letterSpacing = "0";
  context.fillStyle = "#514253";
  context.font = '600 68px "Playfair Display", Georgia, serif';
  context.fillText("Love you so much!", 600, 274);
  context.fillStyle = "#89798b";
  context.font = '500 25px "DM Sans", "Trebuchet MS", sans-serif';
  context.fillText("Our little date is officially planned!", 600, 331);

  const panelGradient = context.createLinearGradient(190, 390, 1010, 680);
  panelGradient.addColorStop(0, "#fff0f5");
  panelGradient.addColorStop(1, "#edf7fc");
  roundedRectangle(context, 190, 386, 820, 280, 30, panelGradient, "rgba(221, 153, 175, 0.32)");

  context.textAlign = "left";
  context.fillStyle = "#b38b9e";
  context.font = '700 17px "DM Sans", "Trebuchet MS", sans-serif';
  context.letterSpacing = "2px";
  context.fillText("OUR DAY", 258, 452);
  context.fillText("OUR TIME", 258, 537);
  context.fillText("OUR PLAN", 258, 622);
  context.letterSpacing = "0";
  context.fillStyle = "#5e4f64";
  context.textBaseline = "middle";
  fitCanvasText(
    context,
    document.querySelector("#confirmed-date").textContent,
    258,
    482,
    690,
    31,
  );
  fitCanvasText(
    context,
    document.querySelector("#confirmed-time").textContent,
    258,
    567,
    690,
    31,
  );
  context.font = '700 29px "DM Sans", "Trebuchet MS", sans-serif';
  context.fillText("Just you & me", 258, 652);

  context.textAlign = "center";
  context.fillStyle = "#c16d88";
  context.font = 'italic 600 27px "Playfair Display", Georgia, serif';
  context.fillText("One little date. A million little feelings.", 600, 736);
  context.fillStyle = "#8f8292";
  context.font = '500 21px "DM Sans", "Trebuchet MS", sans-serif';
  context.fillText("My favourite person, my favourite plan. 💗", 600, 780);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("The date card could not be saved as a PNG."));
    }, "image/png");
  });
}

function prepareDateCardImage() {
  shareImagePromise = createDateCardImage();
  shareImagePromise.catch((error) => {
    console.error("Could not prepare the date card image.", error);
  });
}

function downloadDateCard(blob) {
  const downloadLink = document.createElement("a");
  const imageUrl = URL.createObjectURL(blob);
  downloadLink.href = imageUrl;
  downloadLink.download = "our-little-date.png";
  downloadLink.click();
  window.setTimeout(() => URL.revokeObjectURL(imageUrl), 1000);
}

async function handleDateShare() {
  if (shareOperationInProgress) return;
  shareOperationInProgress = true;
  shareButton.disabled = true;
  downloadDateCardButton.disabled = true;
  shareStatus.textContent = "Putting your little date card together…";

  try {
    const blob = await (shareImagePromise || createDateCardImage());
    const file = new File([blob], "our-little-date.png", { type: "image/png" });
    const canShareFile =
      typeof navigator.share === "function" &&
      typeof navigator.canShare === "function" &&
      navigator.canShare({ files: [file] });

    if (canShareFile) {
      await navigator.share({
        files: [file],
        title: "Our little date",
        text: dateShareMessage(),
      });
      shareStatus.textContent =
        "Your share sheet is ready—choose WhatsApp and the recipient to finish sharing.";
    } else {
      downloadDateCard(blob);
      shareStatus.textContent =
        "Your PNG is downloaded. Open the WhatsApp chat below and attach the image before sending.";
    }
  } catch (error) {
    if (error.name === "AbortError") {
      shareStatus.textContent = "Sharing was cancelled. Nothing was sent.";
    } else {
      console.error("Could not share the date card.", error);
      shareStatus.textContent =
        "Image sharing is unavailable right now. You can still open WhatsApp and send the date details as text.";
      if (shareImagePromise) {
        try {
          const blob = await shareImagePromise;
          downloadDateCard(blob);
          shareStatus.textContent =
            "The share sheet could not open, so the PNG was downloaded. Open the WhatsApp chat below to attach it.";
        } catch (imageError) {
          console.error("Could not generate the date card image.", imageError);
        }
      }
    }
  } finally {
    shareButton.disabled = false;
    downloadDateCardButton.disabled = false;
    shareOperationInProgress = false;
  }
}

async function handleDateCardDownload() {
  if (shareOperationInProgress) return;
  shareOperationInProgress = true;
  shareButton.disabled = true;
  downloadDateCardButton.disabled = true;
  shareStatus.textContent = "Creating your date card PNG…";
  try {
    const blob = await (shareImagePromise || createDateCardImage());
    downloadDateCard(blob);
    shareStatus.textContent =
      "Your date card PNG is downloaded. You can attach it in the WhatsApp chat.";
  } catch (error) {
    console.error("Could not download the date card image.", error);
    shareStatus.textContent =
      "The image could not be created, but you can still open WhatsApp and share the date details as text.";
  } finally {
    shareButton.disabled = false;
    downloadDateCardButton.disabled = false;
    shareOperationInProgress = false;
  }
}

function makeHeartShower(amount) {
  for (let index = 0; index < amount; index += 1) {
    const particle = document.createElement("span");
    const duration = 3.8 + Math.random() * 3.2;
    particle.className = "particle";
    particle.textContent = particleSymbols[Math.floor(Math.random() * particleSymbols.length)];
    particle.style.left = `${Math.random() * 100}%`;
    particle.style.setProperty("--particle-color", particleColors[Math.floor(Math.random() * particleColors.length)]);
    particle.style.setProperty("--particle-size", `${11 + Math.random() * 20}px`);
    particle.style.setProperty("--particle-duration", `${duration}s`);
    particle.style.setProperty("--particle-drift", `${Math.round((Math.random() - 0.5) * 150)}px`);
    particle.style.animationDelay = `${Math.random() * 1.1}s`;
    particleLayer.append(particle);
    window.setTimeout(() => particle.remove(), (duration + 1.2) * 1000);
  }
}

function beginCelebration() {
  if (confirmationInProgress) return;
  confirmationInProgress = true;
  yesButton.disabled = true;
  particleLayer.replaceChildren();
  celebrationOverlay.classList.add("is-active");
  celebrationOverlay.setAttribute("aria-hidden", "false");
  makeHeartShower(30);

  window.setTimeout(() => {
    celebrationOverlay.classList.remove("is-active");
    celebrationOverlay.setAttribute("aria-hidden", "true");
    showScreen("planning");
    confirmationInProgress = false;
    yesButton.disabled = false;
  }, 1450);
}

function completeDateConfirmation() {
  if (!selectedDate || !selectedTime || confirmationInProgress) return;
  updateTimeChoices();
  if (confirmButton.disabled) return;

  confirmationInProgress = true;
  confirmButton.disabled = true;
  loadingOverlay.classList.add("is-active");
  loadingOverlay.setAttribute("aria-hidden", "false");

  window.setTimeout(() => {
    const [hour, minute] = selectedTime.split(":").map(Number);
    const selectedDateTime = dateFromKey(selectedDate);
    selectedDateTime.setHours(hour, minute, 0, 0);

    document.querySelector("#confirmed-date").textContent =
      dateFormatter.format(dateFromKey(selectedDate));
    document.querySelector("#confirmed-time").textContent = timeFormatter.format(selectedDateTime);
    updateWhatsAppLink();
    shareStatus.textContent = "";
    loadingOverlay.classList.remove("is-active");
    loadingOverlay.setAttribute("aria-hidden", "true");
    showScreen("celebration");
    prepareDateCardImage();
    particleLayer.replaceChildren();
    makeHeartShower(44);
    confirmationInProgress = false;
    updateTimeChoices();
  }, 1250);
}

yesButton.addEventListener("click", beginCelebration);

noButton.addEventListener("pointerenter", (event) => {
  if (event.pointerType === "mouse") escapeNoButton();
});

noButton.addEventListener("pointerdown", (event) => {
  if (event.pointerType === "touch" || event.pointerType === "pen") {
    event.preventDefault();
    escapeNoButton();
  }
});

noButton.addEventListener("click", (event) => {
  event.preventDefault();
  if (event.detail === 0) escapeNoButton();
});

noButton.addEventListener("animationend", () => {
  noButton.classList.remove("is-jumping");
});

previousMonthButton.addEventListener("click", () => moveMonth(-1));
nextMonthButton.addEventListener("click", () => moveMonth(1));

for (const slot of timeSlots) {
  slot.addEventListener("click", () => {
    if (slot.disabled) return;
    selectedTime = slot.dataset.time;
    updateTimeChoices();
  });
}

confirmButton.addEventListener("click", completeDateConfirmation);
shareButton.addEventListener("click", handleDateShare);
downloadDateCardButton.addEventListener("click", handleDateCardDownload);
document.querySelector("#back-to-invite").addEventListener("click", () => showScreen("invitation"));
document.querySelector("#change-date").addEventListener("click", () => {
  visibleMonth = new Date(dateFromKey(selectedDate).getFullYear(), dateFromKey(selectedDate).getMonth(), 1);
  showScreen("planning");
  renderCalendar();
  updateTimeChoices();
});

document.querySelector(".brand").addEventListener("click", (event) => {
  event.preventDefault();
  showScreen("invitation");
});

window.addEventListener("resize", () => {
  if (document.querySelector('[data-screen="invitation"]').hidden) return;
  resetNoButtonPosition();
});

renderCalendar();
updateTimeChoices();
resetNoButtonPosition();
window.setInterval(updateTimeChoices, 30_000);
