
"use strict";

// Game state
let coins = 0;
let CoinPerClick = 1;
let UpgradeCost = 50;
let autoclickersowned = 0;
let autoclickerspeed = 1000;
let BoostMultiplier = 2;
let playerclick = 0;
let maxCoinsEarned = 0;
let totalCoinsEarned = 0;

let crazyboost = false;
let crazyBoostEndTime = 0;
let crazyBoostCooldownEndTime = 0;
const crazyBoostDuration = 60000;
const crazyBoostCooldownDuration = 600000;

let tenXBoostUnlocked = false;
let upgradeDiscountActive = false;
let permanentClickBonus = false;
let freeAutoClickersClaimed = false;
let offlineMultiplier = 2;
let totalOfflineEarned = 0;
let lastOnlineTime = Date.now();
let autoClickerTimer = null;
let boostDisplayTimer = null;
let saveTimer = null;
let claimedMissions = {};
let offlineRewardMessage = "";

// Boost upgrade prices and multipliers
const boostCosts = [250, 1000, 4000, 15000, 50000, 150000, 300000];
const boostMultipliers = [3, 4, 5, 6, 7, 8, 10];

// Beginner missions
const beginnerMissions = [
    {
        id: "firstClick",
        name: "First Steps",
        description: "Click 50 times",
        target: 50,
        reward: 100,
        type: "clicks"
    },
    {
        id: "coinCollector",
        name: "Coin Collector",
        description: "Reach 500 total coins",
        target: 500,
        reward: 250,
        type: "coins"
    },
    {
        id: "gettingRich",
        name: "Getting Rich",
        description: "Own 3 auto-clickers",
        target: 3,
        reward: 200,
        type: "auto"
    }
];

// Intermediate missions
const intermediateMissions = [
    {
        id: "clickMaster",
        name: "Click Master",
        description: "Click 500 times",
        target: 500,
        reward: 1000,
        type: "clicks"
    },
    {
        id: "wealthBuilder",
        name: "Wealth Builder",
        description: "Reach 10,000 total coins",
        target: 10000,
        reward: 2500,
        type: "coins"
    },
    {
        id: "autoEmpire",
        name: "Auto Empire",
        description: "Own 10 auto-clickers",
        target: 10,
        reward: 5000,
        type: "auto"
    },
    {
        id: "boostExpert",
        name: "Boost Expert",
        description: "Unlock the 5× Crazy Boost",
        target: 5,
        reward: 3000,
        type: "boost"
    }
];

// Hard missions
const hardMissions = [
    {
        id: "clickingLegend",
        name: "Clicking Legend",
        description: "Click 2,500 times",
        target: 2500,
        reward: "Permanently gain +2 Coins Per Click",
        type: "clicks"
    },
    {
        id: "automationOverlord",
        name: "Automation Overlord",
        description: "Own 25 auto-clickers",
        target: 25,
        reward: "Get 5 free auto-clickers",
        type: "auto"
    },
    {
        id: "boostMaster",
        name: "Boost Master",
        description: "Unlock the 8× Crazy Boost",
        target: 8,
        reward: "Unlock the 10× Crazy Boost",
        type: "boost"
    },
    {
        id: "theTycoon",
        name: "The Tycoon",
        description: "Reach 100,000 total coins",
        target: 100000,
        reward: "Permanently reduce click upgrade costs by 10%",
        type: "coins"
    },
    {
        id: "offlineOverlord",
        name: "Offline Overlord",
        description: "Earn 50,000 coins from offline earnings",
        target: 50000,
        reward: "Permanently increase offline earnings to 3×",
        type: "offline"
    },
    {
        id: "sleepyBillionaire",
        name: "Sleepy Billionaire",
        description: "Earn 250,000 coins from offline earnings",
        target: 250000,
        reward: "Permanently increase offline earnings to 5×",
        type: "offline"
    },
    {
        id: "dreamDimension",
        name: "Dream Dimension",
        description: "Earn 1,000,000 coins from offline earnings",
        target: 1000000,
        reward: "Permanently increase offline earnings to 10×",
        type: "offline"
    }
];

// General helper functions
function getElement(id) {
    return document.getElementById(id);
}

function setText(id, value) {
    const element = getElement(id);

    if (element) {
        element.textContent = value;
    }
}

function showMessage(message) {
    setText("message", message);
}

function formatNumber(value) {
    return Math.floor(Number(value) || 0).toLocaleString();
}

function formatTime(milliseconds) {
    const totalSeconds = Math.ceil(Math.max(0, milliseconds) / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function updateMaxCoins() {
    maxCoinsEarned = Math.max(maxCoinsEarned, coins);
}

function getUpgradeCost() {
    return upgradeDiscountActive
        ? Math.ceil(UpgradeCost * 0.9)
        : UpgradeCost;
}

function getAutoClickerCost() {
    return Math.floor(100 * Math.pow(1.5, autoclickersowned));
}

function getOfflineMultiplier() {
    return offlineMultiplier;
}

// Boost timer calculations use timestamps to avoid countdown drift
function getBoostRemaining() {
    return crazyboost
        ? Math.max(0, crazyBoostEndTime - Date.now())
        : 0;
}

function getCooldownRemaining() {
    return !crazyboost
        ? Math.max(0, crazyBoostCooldownEndTime - Date.now())
        : 0;
}

// Update the game display
function updateDisplay() {
    updateMaxCoins();

    setText("coins", formatNumber(coins));
    setText("coinPerClick", formatNumber(CoinPerClick));

    const upgradeButton = getElement("upgradeButton");

    if (upgradeButton) {
        upgradeButton.textContent =
            `Upgrade Click (+1) - ${formatNumber(getUpgradeCost())} coins`;
        upgradeButton.disabled = coins < getUpgradeCost();
    }

    const autoButton = getElement("autoClickerButton");

    if (autoButton) {
        autoButton.textContent =
            `Buy Auto-Clicker - ${formatNumber(getAutoClickerCost())} coins`;
        autoButton.disabled = coins < getAutoClickerCost();
    }

    updateBoostButton();
    updateBoostUpgrades();
}

// Display Boost duration and cooldown
function updateBoostButton() {
    const button = getElement("crazyButtonBoost");

    if (!button) return;

    if (crazyboost) {
        button.textContent =
            `Crazy Boost ACTIVE (${BoostMultiplier}×) — ${formatTime(getBoostRemaining())}`;
        button.disabled = true;
    } else {
        const cooldown = getCooldownRemaining();

        if (cooldown > 0) {
            button.textContent =
                `Crazy Boost (${BoostMultiplier}×) — Cooldown ${formatTime(cooldown)}`;
            button.disabled = true;
        } else {
            button.textContent = `Crazy Boost (${BoostMultiplier}×)`;
            button.disabled = false;
        }
    }
}

// Add coins and update progress
function earnCoins(amount, isOffline = false) {
    amount = Math.max(0, Number(amount) || 0);

    if (amount <= 0) return;

    coins += amount;
    totalCoinsEarned += amount;

    if (isOffline) {
        totalOfflineEarned += amount;
    }

    updateMaxCoins();
    updateDisplay();
    updateMissions();
}

// Handle manual clicks
function handleClick() {
    playerclick++;

    const multiplier = crazyboost ? BoostMultiplier : 1;
    earnCoins(CoinPerClick * multiplier);
}

// Purchase a click upgrade
function upgradeClick() {
    const cost = getUpgradeCost();

    if (coins < cost) {
        showMessage("Not enough coins for that upgrade!");
        return;
    }

    coins -= cost;
    CoinPerClick++;
    UpgradeCost = Math.ceil(UpgradeCost * 1.5);

    updateDisplay();
    updateMissions();
    saveGame();
    showMessage("Click power upgraded!");
}

// Purchase an auto-clicker
function buyAutoClicker() {
    const cost = getAutoClickerCost();

    if (coins < cost) {
        showMessage("Not enough coins for an auto-clicker!");
        return;
    }

    coins -= cost;
    autoclickersowned++;
    autoclickerspeed = Math.max(100, 1000 - autoclickersowned * 25);

    startAutoClickerTimer();
    updateDisplay();
    updateMissions();
    saveGame();

    showMessage("Auto-clicker purchased!");
}

// Restart the auto-clicker interval whenever its speed changes
function startAutoClickerTimer() {
    if (autoClickerTimer !== null) {
        clearInterval(autoClickerTimer);
        autoClickerTimer = null;
    }

    if (autoclickersowned <= 0) return;

    autoClickerTimer = setInterval(() => {
        const multiplier = crazyboost ? BoostMultiplier : 1;
        earnCoins(autoclickersowned * multiplier);
    }, Math.max(100, autoclickerspeed));
}

// End expired Boosts and establish their cooldown
function normalizeBoostState() {
    const now = Date.now();

    if (crazyboost && crazyBoostEndTime <= now) {
        crazyboost = false;
        crazyBoostCooldownEndTime =
            crazyBoostEndTime + crazyBoostCooldownDuration;
        crazyBoostEndTime = 0;

        if (crazyBoostCooldownEndTime <= now) {
            crazyBoostCooldownEndTime = 0;
        }

        showMessage("Crazy Boost ended! The 10-minute cooldown has started.");
        saveGame();
    }

    if (!crazyboost && crazyBoostCooldownEndTime <= now) {
        crazyBoostCooldownEndTime = 0;
    }
}

// Activate Boost if it is available
function activateCrazyBoost() {
    normalizeBoostState();

    if (crazyboost) {
        showMessage("Crazy Boost is already active!");
        return;
    }

    if (getCooldownRemaining() > 0) {
        showMessage(
            `Crazy Boost is on cooldown for ${formatTime(getCooldownRemaining())}.`
        );
        updateBoostButton();
        return;
    }

    crazyboost = true;
    crazyBoostEndTime = Date.now() + crazyBoostDuration;
    crazyBoostCooldownEndTime = 0;

    updateDisplay();
    updateMissions();
    saveGame();

    showMessage(`${BoostMultiplier}× Crazy Boost activated for 60 seconds!`);
}

// Refresh the timer display without counting down inaccurately
function restoreBoostTimer() {
    if (boostDisplayTimer !== null) {
        clearInterval(boostDisplayTimer);
    }

    boostDisplayTimer = setInterval(() => {
        normalizeBoostState();
        updateBoostButton();
    }, 250);

    normalizeBoostState();
    updateBoostButton();
}

// Purchase a Boost multiplier upgrade
function buyBoostUpgrade(level) {
    const index = level - 1;

    if (index < 0 || index >= boostCosts.length) return;

    if (level === 7 && !tenXBoostUnlocked) {
        showMessage("Complete Boost Master to unlock the 10× upgrade!");
        return;
    }

    const cost = boostCosts[index];
    const nextMultiplier = boostMultipliers[index];

    if (BoostMultiplier >= nextMultiplier) {
        showMessage("You already have this boost level!");
        return;
    }

    if (coins < cost) {
        showMessage("Not enough coins for this boost upgrade!");
        return;
    }

    coins -= cost;
    BoostMultiplier = nextMultiplier;

    updateDisplay();
    updateMissions();
    saveGame();

    showMessage(`Crazy Boost upgraded to ${BoostMultiplier}×!`);
}

// Create the final Boost upgrade button if necessary
function ensureTenXUpgradeButton() {
    let button = getElement("BoostUpgrade7");

    if (!button) {
        const sixthButton = getElement("BoostUpgrade6");

        if (!sixthButton || !sixthButton.parentElement) return;

        button = document.createElement("button");
        button.id = "BoostUpgrade7";
        sixthButton.insertAdjacentElement("afterend", button);
    }

    button.textContent = "Upgrade Crazy Boost to 10× - 300,000 coins";
    button.style.display = tenXBoostUnlocked ? "" : "none";
    button.disabled = BoostMultiplier >= 10 || coins < boostCosts[6];
    button.onclick = () => buyBoostUpgrade(7);
}

// Update all Boost upgrade buttons
function updateBoostUpgrades() {
    for (let level = 1; level <= 6; level++) {
        const button = getElement(`BoostUpgrade${level}`);

        if (!button) continue;

        const multiplier = boostMultipliers[level - 1];
        const cost = boostCosts[level - 1];

        button.textContent =
            `Upgrade Crazy Boost to ${multiplier}× - ${formatNumber(cost)} coins`;

        button.disabled =
            BoostMultiplier >= multiplier || coins < cost;
    }

    ensureTenXUpgradeButton();
}

// Calculate mission progress
function getMissionProgress(mission) {
    switch (mission.type) {
        case "clicks":
            return playerclick;
        case "coins":
            return totalCoinsEarned;
        case "auto":
            return autoclickersowned;
        case "boost":
            return BoostMultiplier;
        case "offline":
            return totalOfflineEarned;
        default:
            return 0;
    }
}

function isMissionComplete(mission) {
    return getMissionProgress(mission) >= mission.target;
}

function beginnerMissionsCompleted() {
    return beginnerMissions.every(mission => claimedMissions[mission.id]);
}

function intermediateMissionsCompleted() {
    return intermediateMissions.every(mission => claimedMissions[mission.id]);
}

// Render a group of mission cards
function renderMissionGroup(missions, container) {
    if (!container) return;

    container.innerHTML = "";

    for (const mission of missions) {
        const progress = Math.min(
            getMissionProgress(mission),
            mission.target
        );

        const completed = isMissionComplete(mission);
        const claimed = Boolean(claimedMissions[mission.id]);

        const card = document.createElement("div");
        card.className = "mission";

        const title = document.createElement("h3");
        title.textContent = mission.name;

        const description = document.createElement("p");
        description.textContent = mission.description;

        const progressText = document.createElement("p");
        progressText.textContent =
            `Progress: ${formatNumber(progress)} / ${formatNumber(mission.target)}`;

        const rewardText = document.createElement("p");
        rewardText.textContent = typeof mission.reward === "number"
            ? `Reward: ${formatNumber(mission.reward)} coins`
            : `Reward: ${mission.reward}`;

        const progressBar = document.createElement("progress");
        progressBar.max = mission.target;
        progressBar.value = progress;

        const claimButton = document.createElement("button");

        if (claimed) {
            claimButton.textContent = "Claimed";
            claimButton.disabled = true;
        } else if (completed) {
            claimButton.textContent = "Claim Reward";
            claimButton.onclick = () => claimMission(mission.id);
        } else {
            claimButton.textContent = "In Progress";
            claimButton.disabled = true;
        }

        card.append(
            title,
            description,
            progressText,
            progressBar,
            rewardText,
            claimButton
        );

        container.appendChild(card);
    }
}

// Display the currently available mission group
function renderMissions() {
    const beginnerContainer = getElement("beginnerMissions");
    const intermediateContainer = getElement("intermediateMissions");
    const hardContainer = getElement("hardMissions");
    const description = getElement("missionDescription");

    const beginnerComplete = beginnerMissionsCompleted();
    const intermediateComplete = intermediateMissionsCompleted();

    if (beginnerContainer) {
        beginnerContainer.style.display = beginnerComplete ? "none" : "";
    }

    if (intermediateContainer) {
        intermediateContainer.style.display =
            beginnerComplete && !intermediateComplete ? "" : "none";
    }

    if (hardContainer) {
        hardContainer.style.display =
            beginnerComplete && intermediateComplete ? "" : "none";
    }

    if (description) {
        description.textContent = !beginnerComplete
            ? "Beginner Missions"
            : !intermediateComplete
                ? "Intermediate Missions"
                : "Hard Missions";
    }

    renderMissionGroup(beginnerMissions, beginnerContainer);
    renderMissionGroup(intermediateMissions, intermediateContainer);
    renderMissionGroup(hardMissions, hardContainer);
}

function updateMissions() {
    renderMissions();
}

// Claim a completed mission
function claimMission(id) {
    const allMissions = [
        ...beginnerMissions,
        ...intermediateMissions,
        ...hardMissions
    ];

    const mission = allMissions.find(item => item.id === id);

    if (!mission || claimedMissions[id] || !isMissionComplete(mission)) {
        return;
    }

    claimedMissions[id] = true;

    if (typeof mission.reward === "number") {
        coins += mission.reward;
        totalCoinsEarned += mission.reward;
        updateMaxCoins();
    }

    if (id === "clickingLegend" && !permanentClickBonus) {
        CoinPerClick += 2;
        permanentClickBonus = true;
    }

    if (id === "automationOverlord" && !freeAutoClickersClaimed) {
        autoclickersowned += 5;
        autoclickerspeed = Math.max(100, 1000 - autoclickersowned * 25);
        freeAutoClickersClaimed = true;
        startAutoClickerTimer();
    }

    if (id === "boostMaster") {
        tenXBoostUnlocked = true;
    }

    if (id === "theTycoon") {
        upgradeDiscountActive = true;
    }

    if (id === "offlineOverlord") {
        offlineMultiplier = Math.max(offlineMultiplier, 3);
    }

    if (id === "sleepyBillionaire") {
        offlineMultiplier = Math.max(offlineMultiplier, 5);
    }

    if (id === "dreamDimension") {
        offlineMultiplier = Math.max(offlineMultiplier, 10);
    }

    updateDisplay();
    updateMissions();
    saveGame();

    showMessage(`${mission.name} completed! Reward claimed.`);
}

// Calculate offline earnings
function calculateOfflineEarnings() {
    const now = Date.now();
    const previousTime = Number(lastOnlineTime) || now;

    const secondsAway = Math.min(
        Math.max(0, (now - previousTime) / 1000),
        24 * 60 * 60
    );

    lastOnlineTime = now;

    if (autoclickersowned <= 0 || secondsAway <= 0) {
        return 0;
    }

    const ticksAway = secondsAway * (1000 / autoclickerspeed);
    const earnings = Math.floor(
        autoclickersowned * ticksAway * getOfflineMultiplier()
    );

    if (earnings <= 0) return 0;

    coins += earnings;
    totalCoinsEarned += earnings;
    totalOfflineEarned += earnings;
    updateMaxCoins();

    offlineRewardMessage =
        `Welcome back! You earned ${formatNumber(earnings)} coins offline at ${offlineMultiplier}×.`;

    return earnings;
}

// Save all persistent game data
function saveGame() {
    const now = Date.now();

    const data = {
        coins,
        CoinPerClick,
        UpgradeCost,
        autoclickersowned,
        autoclickerspeed,
        BoostMultiplier,
        playerclick,
        maxCoinsEarned,
        totalCoinsEarned,
        crazyboost,
        crazyBoostEndTime,
        crazyBoostCooldownEndTime,
        tenXBoostUnlocked,
        upgradeDiscountActive,
        permanentClickBonus,
        freeAutoClickersClaimed,
        offlineMultiplier,
        totalOfflineEarned,
        lastOnlineTime: now,
        claimedMissions
    };

    try {
        localStorage.setItem("clickerGameSave", JSON.stringify(data));
        lastOnlineTime = now;
    } catch (error) {
        console.error("Could not save game:", error);
    }
}

// Load previously saved game data
function loadGame() {
    let data = null;

    try {
        const savedData = localStorage.getItem("clickerGameSave");
        data = savedData ? JSON.parse(savedData) : null;
    } catch (error) {
        console.error("Could not load saved game:", error);
    }

    if (data && typeof data === "object") {
        coins = Math.max(0, Number(data.coins) || 0);
        CoinPerClick = Math.max(1, Number(data.CoinPerClick) || 1);
        UpgradeCost = Math.max(50, Number(data.UpgradeCost) || 50);
        autoclickersowned = Math.max(0, Number(data.autoclickersowned) || 0);
        autoclickerspeed = Math.max(100, Number(data.autoclickerspeed) || 1000);
        BoostMultiplier = Math.max(2, Number(data.BoostMultiplier) || 2);
        playerclick = Math.max(0, Number(data.playerclick) || 0);
        maxCoinsEarned = Math.max(Number(data.maxCoinsEarned) || 0, coins);
        totalCoinsEarned = Math.max(
            Number(data.totalCoinsEarned) || 0,
            maxCoinsEarned
        );

        crazyboost = Boolean(data.crazyboost);
        crazyBoostEndTime = Math.max(0, Number(data.crazyBoostEndTime) || 0);
        crazyBoostCooldownEndTime = Math.max(
            0,
            Number(data.crazyBoostCooldownEndTime) || 0
        );

        tenXBoostUnlocked = Boolean(data.tenXBoostUnlocked);
        upgradeDiscountActive = Boolean(data.upgradeDiscountActive);
        permanentClickBonus = Boolean(data.permanentClickBonus);
        freeAutoClickersClaimed = Boolean(data.freeAutoClickersClaimed);

        offlineMultiplier = Math.max(2, Number(data.offlineMultiplier) || 2);
        totalOfflineEarned = Math.max(0, Number(data.totalOfflineEarned) || 0);
        lastOnlineTime = Math.max(0, Number(data.lastOnlineTime) || Date.now());

        claimedMissions =
            data.claimedMissions && typeof data.claimedMissions === "object"
                ? data.claimedMissions
                : {};
    } else {
        lastOnlineTime = Date.now();
    }

    calculateOfflineEarnings();
    normalizeBoostState();
    updateMaxCoins();
}

// Initialize buttons
function initializeButtons() {
    const clickButton = getElement("clickButton");

    if (clickButton) {
        clickButton.addEventListener("click", handleClick);
    }

    const upgradeButton = getElement("upgradeButton");

    if (upgradeButton) {
        upgradeButton.addEventListener("click", upgradeClick);
    }

    const autoButton = getElement("autoClickerButton");

    if (autoButton) {
        autoButton.addEventListener("click", buyAutoClicker);
    }

    const boostButton = getElement("crazyButtonBoost");

    if (boostButton) {
        boostButton.addEventListener("click", activateCrazyBoost);
    }

    for (let level = 1; level <= 6; level++) {
        const button = getElement(`BoostUpgrade${level}`);

        if (button) {
            button.addEventListener("click", () => buyBoostUpgrade(level));
        }
    }

    ensureTenXUpgradeButton();
}

// Initialize theme settings
function initializeSettings() {
    const root = document.documentElement;
    const settingsButton = getElement("settingsButton");
    const overlay = getElement("settingsOverlay");
    const closeButton = getElement("closeSettings");
    const themeSelect = getElement("themeSelect");

    if (!settingsButton || !overlay || !closeButton || !themeSelect) {
        return;
    }

    function readTheme() {
        try {
            const saved = localStorage.getItem("clickerGameTheme");

            if (["light", "dark", "system"].includes(saved)) {
                return saved;
            }
        } catch (error) {
            console.warn("Could not load theme preference.", error);
        }

        return "system";
    }

    function applyTheme(theme, save = true) {
        if (!["light", "dark", "system"].includes(theme)) {
            theme = "system";
        }

        if (theme === "system") {
            delete root.dataset.theme;
        } else {
            root.dataset.theme = theme;
        }

        themeSelect.value = theme;

        if (save) {
            try {
                localStorage.setItem("clickerGameTheme", theme);
            } catch (error) {
                console.warn("Could not save theme preference.", error);
            }
        }
    }

    function openSettings() {
        overlay.hidden = false;
        closeButton.focus();
    }

    function closeSettings() {
        overlay.hidden = true;
        settingsButton.focus();
    }

    settingsButton.addEventListener("click", openSettings);
    closeButton.addEventListener("click", closeSettings);

    overlay.addEventListener("click", event => {
        if (event.target === overlay) {
            closeSettings();
        }
    });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape" && !overlay.hidden) {
            closeSettings();
        }
    });

    themeSelect.addEventListener("change", () => {
        applyTheme(themeSelect.value);
    });

    applyTheme(readTheme(), false);
}

// Start the game
function initializeGame() {
    loadGame();
    initializeButtons();
    initializeSettings();
    restoreBoostTimer();
    startAutoClickerTimer();
    updateDisplay();
    updateMissions();

    if (offlineRewardMessage) {
        showMessage(offlineRewardMessage);
    }

    saveTimer = setInterval(saveGame, 5000);

    window.addEventListener("beforeunload", saveGame);

    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") {
            normalizeBoostState();
            updateDisplay();
            updateMissions();
        }
    });
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeGame, { once: true });
} else {
    initializeGame();
}
