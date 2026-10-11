
let coins = 0;
let CoinPerClick = 1;
let UpgradeCost = 50;
let autoclickersowned = 0;
let autoclickerspeed = 1000;
let BoostMultiplier = 2;
let playerclick = 0;
let maxCoinsEarned = 0;
let crazyboost = false;
let crazyBoostEndTime = 0;
let crazyBoostDuration = 10000;
let tenXBoostUnlocked = false;
let upgradeDiscountActive = false;
let permanentClickBonus = false;
let freeAutoClickersClaimed = false;
let offlineMultiplier = 2;
let totalOfflineEarned = 0;
let lastOnlineTime = Date.now();
let autoClickerTimer = null;
let boostTimer = null;

const boostCosts = [250, 1000, 4000, 15000, 50000, 150000, 300000];
const boostMultipliers = [3, 4, 5, 6, 7, 8, 10];

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

let claimedMissions = {};
let offlineRewardMessage = "";

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

function updateMaxCoins() {
    maxCoinsEarned = Math.max(maxCoinsEarned, coins);
}

function getUpgradeCost() {
    return upgradeDiscountActive
        ? Math.ceil(UpgradeCost * 0.9)
        : UpgradeCost;
}

function getOfflineMultiplier() {
    return offlineMultiplier;
}

function updateDisplay() {
    updateMaxCoins();

    setText("coins", Math.floor(coins).toLocaleString());
    setText("coinPerClick", CoinPerClick.toLocaleString());

    const upgradeButton = getElement("upgradeButton");

    if (upgradeButton) {
        upgradeButton.textContent =
            `Upgrade Click (+1) - ${getUpgradeCost().toLocaleString()} coins`;
    }

    const autoButton = getElement("autoClickerButton");

    if (autoButton) {
        autoButton.textContent =
            `Buy Auto-Clicker - ${getAutoClickerCost().toLocaleString()} coins`;
    }

    const crazyButton = getElement("crazyButtonBoost");

    if (crazyButton) {
        crazyButton.textContent = crazyboost
            ? `Crazy Boost ACTIVE (${BoostMultiplier}×)`
            : `Crazy Boost (${BoostMultiplier}×)`;
    }

    updateBoostUpgrades();
}

function getAutoClickerCost() {
    return Math.floor(100 * Math.pow(1.5, autoclickersowned));
}

function earnCoins(amount) {
    coins += amount;
    updateMaxCoins();
    updateDisplay();
    updateMissions();
}

function handleClick() {
    playerclick++;

    const multiplier = crazyboost ? BoostMultiplier : 1;
    earnCoins(CoinPerClick * multiplier);
}

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

function startAutoClickerTimer() {
    if (autoClickerTimer) {
        clearInterval(autoClickerTimer);
    }

    if (autoclickersowned <= 0) {
        autoClickerTimer = null;
        return;
    }

    autoClickerTimer = setInterval(() => {
        if (autoclickersowned <= 0) {
            return;
        }

        const multiplier = crazyboost ? BoostMultiplier : 1;
        earnCoins(autoclickersowned * multiplier);
    }, autoclickerspeed);
}

function activateCrazyBoost() {
    if (crazyboost) {
        showMessage("Crazy Boost is already active!");
        return;
    }

    crazyboost = true;
    crazyBoostEndTime = Date.now() + crazyBoostDuration;

    updateDisplay();
    updateMissions();
    restoreBoostTimer();

    showMessage(`${BoostMultiplier}× Crazy Boost activated!`);
    saveGame();
}

function restoreBoostTimer() {
    if (boostTimer) {
        clearTimeout(boostTimer);
        boostTimer = null;
    }

    if (!crazyboost) {
        updateDisplay();
        return;
    }

    const remaining = crazyBoostEndTime - Date.now();

    if (remaining <= 0) {
        crazyboost = false;
        crazyBoostEndTime = 0;
        updateDisplay();
        saveGame();
        return;
    }

    boostTimer = setTimeout(() => {
        crazyboost = false;
        crazyBoostEndTime = 0;

        updateDisplay();
        updateMissions();
        saveGame();

        showMessage("Crazy Boost has ended!");
    }, remaining);
}

function buyBoostUpgrade(level) {
    const index = level - 1;
    const cost = boostCosts[index];
    const nextMultiplier = boostMultipliers[index];

    if (level === 7 && !tenXBoostUnlocked) {
        showMessage("Complete Boost Master to unlock the 10× upgrade!");
        return;
    }

    if (index < 0 || index >= boostCosts.length) {
        return;
    }

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

function ensureTenXUpgradeButton() {
    const existing = getElement("BoostUpgrade7");

    if (existing) {
        existing.style.display = tenXBoostUnlocked ? "" : "none";
        existing.onclick = () => buyBoostUpgrade(7);
        return;
    }

    const sixthButton = getElement("BoostUpgrade6");

    if (!sixthButton || !sixthButton.parentElement) {
        return;
    }

    const button = document.createElement("button");

    button.id = "BoostUpgrade7";
    button.textContent = "Upgrade Crazy Boost to 10× - 300,000 coins";
    button.style.display = tenXBoostUnlocked ? "" : "none";
    button.onclick = () => buyBoostUpgrade(7);

    sixthButton.insertAdjacentElement("afterend", button);
}

function updateBoostUpgrades() {
    for (let level = 1; level <= 6; level++) {
        const button = getElement(`BoostUpgrade${level}`);

        if (!button) {
            continue;
        }

        const multiplier = boostMultipliers[level - 1];
        const cost = boostCosts[level - 1];

        button.textContent =
            `Upgrade Crazy Boost to ${multiplier}× - ${cost.toLocaleString()} coins`;

        button.disabled = BoostMultiplier >= multiplier;
    }

    ensureTenXUpgradeButton();

    const finalButton = getElement("BoostUpgrade7");

    if (finalButton) {
        finalButton.textContent =
            "Upgrade Crazy Boost to 10× - 300,000 coins";
        finalButton.disabled = BoostMultiplier >= 10;
    }
}

function getMissionProgress(mission) {
    switch (mission.type) {
        case "clicks":
            return playerclick;

        case "coins":
            return maxCoinsEarned;

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

function renderMissionGroup(missions, container) {
    if (!container) {
        return;
    }

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
            `Progress: ${Math.floor(progress).toLocaleString()} / ${mission.target.toLocaleString()}`;

        const rewardText = document.createElement("p");
        rewardText.textContent =
            typeof mission.reward === "number"
                ? `Reward: ${mission.reward.toLocaleString()} coins`
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
        if (!beginnerComplete) {
            description.textContent = "Beginner Missions";
        } else if (!intermediateComplete) {
            description.textContent = "Intermediate Missions";
        } else {
            description.textContent = "Hard Missions";
        }
    }

    renderMissionGroup(beginnerMissions, beginnerContainer);
    renderMissionGroup(intermediateMissions, intermediateContainer);
    renderMissionGroup(hardMissions, hardContainer);
}

function claimMission(id) {
    const mission = [
        ...beginnerMissions,
        ...intermediateMissions,
        ...hardMissions
    ].find(item => item.id === id);

    if (!mission || claimedMissions[id] || !isMissionComplete(mission)) {
        return;
    }

    claimedMissions[id] = true;

    if (typeof mission.reward === "number") {
        coins += mission.reward;
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

function updateMissions() {
    renderMissions();
}

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
    const baseEarnings = autoclickersowned * ticksAway;
    const earnings = Math.floor(baseEarnings * getOfflineMultiplier());

    if (earnings <= 0) {
        return 0;
    }

    coins += earnings;
    totalOfflineEarned += earnings;
    updateMaxCoins();

    offlineRewardMessage =
        `Welcome back! You earned ${earnings.toLocaleString()} coins offline at ${offlineMultiplier}×.`;

    return earnings;
}

function saveGame() {
    lastOnlineTime = Date.now();

    const data = {
        coins,
        CoinPerClick,
        UpgradeCost,
        autoclickersowned,
        autoclickerspeed,
        BoostMultiplier,
        playerclick,
        maxCoinsEarned,
        crazyboost,
        crazyBoostEndTime,
        tenXBoostUnlocked,
        upgradeDiscountActive,
        permanentClickBonus,
        freeAutoClickersClaimed,
        offlineMultiplier,
        totalOfflineEarned,
        lastOnlineTime,
        claimedMissions
    };

    try {
        localStorage.setItem("clickerGameSave", JSON.stringify(data));
    } catch (error) {
        console.error("Could not save game:", error);
    }
}

function loadGame() {
    let data;

    try {
        const savedData = localStorage.getItem("clickerGameSave");
        data = savedData ? JSON.parse(savedData) : null;
    } catch (error) {
        console.error("Could not load saved game:", error);
        data = null;
    }

    if (data) {
        coins = Number(data.coins) || 0;
        CoinPerClick = Number(data.CoinPerClick) || 1;
        UpgradeCost = Number(data.UpgradeCost) || 50;
        autoclickersowned = Number(data.autoclickersowned) || 0;
        autoclickerspeed = Number(data.autoclickerspeed) || 1000;
        BoostMultiplier = Number(data.BoostMultiplier) || 2;
        playerclick = Number(data.playerclick) || 0;
        maxCoinsEarned = Number(data.maxCoinsEarned) || coins;

        crazyboost = Boolean(data.crazyboost);
        crazyBoostEndTime = Number(data.crazyBoostEndTime) || 0;

        tenXBoostUnlocked = Boolean(data.tenXBoostUnlocked);
        upgradeDiscountActive = Boolean(data.upgradeDiscountActive);
        permanentClickBonus = Boolean(data.permanentClickBonus);
        freeAutoClickersClaimed = Boolean(data.freeAutoClickersClaimed);

        offlineMultiplier = Number(data.offlineMultiplier) || 2;
        totalOfflineEarned = Number(data.totalOfflineEarned) || 0;

        lastOnlineTime = Number(data.lastOnlineTime) || Date.now();

        claimedMissions =
            data.claimedMissions && typeof data.claimedMissions === "object"
                ? data.claimedMissions
                : {};
    }

    calculateOfflineEarnings();

    updateMaxCoins();
    updateDisplay();
    updateMissions();
}

function initializeButtons() {
    const clickButton = getElement("clickButton");

    if (clickButton) {
        clickButton.addEventListener("click", handleClick);
    }

    const upgradeButton = getElement("upgradeButton");

    if (upgradeButton) {
        upgradeButton.addEventListener("click", upgradeClick);
    }

    const autoClickerButton = getElement("autoClickerButton");

    if (autoClickerButton) {
        autoClickerButton.addEventListener("click", buyAutoClicker);
    }

    const crazyButton = getElement("crazyButtonBoost");

    if (crazyButton) {
        crazyButton.addEventListener("click", activateCrazyBoost);
    }

    for (let level = 1; level <= 6; level++) {
        const button = getElement(`BoostUpgrade${level}`);

        if (button) {
            button.addEventListener("click", () => buyBoostUpgrade(level));
        }
    }

    ensureTenXUpgradeButton();
}

loadGame();
initializeButtons();
restoreBoostTimer();
startAutoClickerTimer();
updateDisplay();
updateMissions();

if (offlineRewardMessage) {
    showMessage(offlineRewardMessage);
}

setInterval(saveGame, 1000);

window.addEventListener("beforeunload", saveGame);


function initializeSettings() {
    const root = document.documentElement;
    const settingsButton = document.getElementById("settingsButton");
    const overlay = document.getElementById("settingsOverlay");
    const closeButton = document.getElementById("closeSettings");
    const themeSelect = document.getElementById("themeSelect");

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
            console.warn("Could not load theme preference.");
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
                console.warn("Could not save theme preference.");
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

initializeSettings();
