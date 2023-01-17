const playerHandDiv = document.querySelector(".player-hand");
const computerHandDiv = document.querySelector(".computer-hand");
const boardDiv = document.querySelector(".board");
const cells = boardDiv.querySelectorAll(".cell");
for (let i = 0; i < cells.length; i++) {
    cells[i].setAttribute("id", "cell-" + i);
    cells[i].dataset.cellId = i;
}

function showRuleSelect() {
    // 生成规则选择遮罩
    let overlay = document.getElementsByClassName('rules-overlay')[0];
    overlay.innerHTML = `
        <div class="rules-modal">
            <div class="rules-title">选择规则</div>
            <div class="rules-content">
                <div>
                    <input type="checkbox" id="all-open" value="all-open">
                    <label for="all-open">全明牌</label>
                </div>
                <div>
                    <input type="checkbox" id="three-open" value="three-open">
                    <label for="three-open">三明牌</label>
                </div>
                <div>
                    <input type="checkbox" id="same" value="same">
                    <label for="same">同数</label>
                </div>
                <div>
                    <input type="checkbox" id="sudden-death" value="sudden-death">
                    <label for="sudden-death">不胜不休</label>
                </div>
                <div>
                    <input type="checkbox" id="plus" value="plus">
                    <label for="plus">加算</label>
                </div>
                <div>
                    <input type="checkbox" id="random-hand" value="random-hand" checked>
                    <label for="random-hand">随机</label>
                </div>
                <div>
                    <input type="checkbox" id="order" value="order">
                    <label for="order">秩序</label>
                </div>
                <div>
                    <input type="checkbox" id="chaos" value="chaos">
                    <label for="chaos">混乱</label>
                </div>
                <div>
                    <input type="checkbox" id="reverse" value="reverse">
                    <label for="reverse">逆转</label>
                </div>
                <div>
                    <input type="checkbox" id="ace-killer" value="ace-killer">
                    <label for="ace-killer">王牌杀手</label>
                </div>
                <div>
                    <input type="checkbox" id="type-ascend" value="type-ascend">
                    <label for="type-ascend">同类强化</label>
                </div>
                <div>
                    <input type="checkbox" id="type-descend" value="type-descend">
                    <label for="type-descend">同类弱化</label>
                </div>
                <div>
                    <input type="checkbox" id="swap" value="swap">
                    <label for="swap">交换</label>
                </div>
                <div>
                    <input type="checkbox" id="draft" value="draft">
                    <label for="draft">选拔</label>
                </div>
                <div>
                    <input type="checkbox" id="roulette" value="roulette">
                    <label for="roulette">天选</label>
                </div>
            </div>
            <button id="start-btn" type="button">开始</button>
        </div>
    `;

    // 监听规则选择
    const exclusiveRules = {
        'random-hand': ['draft'],
        'draft': ['random-hand'],
        'all-open': ['three-open'],
        'three-open': ['all-open'],
        'roulette': ['all-open', 'three-open', 'same', 'sudden-death', 'plus', 'order', 'chaos', 'reverse', 'ace-killer', 'type-ascend', 'type-descend', 'swap']
      };
    const rules = document.querySelectorAll('.rules-content input[type="checkbox"]');
    const startButton = document.querySelector('#start-btn');
    rules.forEach(rule => {
        rule.addEventListener('change', function () {
            if (this.checked) {
                const exclusiveRuleGroup = exclusiveRules[this.id];
                if (exclusiveRuleGroup) {
                exclusiveRuleGroup.forEach(ruleId => {
                    const rule = document.getElementById(ruleId);
                    rule.checked = false;
                    rule.disabled = true;
                });
                }
            } else {
                const exclusiveRuleGroup = exclusiveRules[this.id];
                if (exclusiveRuleGroup) {
                    exclusiveRuleGroup.forEach(ruleId => {
                    const rule = document.getElementById(ruleId);
                    rule.disabled = false;
                    });
                }
            }
            const randomCheck = document.getElementById("random-hand").checked;
            const draftCheck = document.getElementById("draft").checked;
            if (!randomCheck && !draftCheck) {
                startButton.disabled = true;
                startButton.title = "随机和选拔规则需选择一个";
            } else {
                startButton.disabled = false;
                startButton.removeAttribute("title");
            }
        });
    });

    // 禁用还未实现的规则
    rules.forEach(rule => {
        if (!['all-open', 'three-open', 'swap'].includes(rule.id)) rule.disabled = true;
    });

    // 开始按钮
    startButton.addEventListener('click', function () {
        if (!this.disabled) {
            let selectedRules = [];
            let ruleElements = document.querySelectorAll('.rules-content input[type="checkbox"]:checked');
            for (let i = 0; i < ruleElements.length; i++) {
                selectedRules.push(ruleElements[i].value);
            }
            document.getElementsByClassName('container')[0].style.display = "flex";
            overlay.remove();
            game = new Game(selectedRules);
            game.start();
        }
    });
}

// 展示双方手牌
function displayCards(cards, owner, num) {
    handDiv = (owner == "player") ? playerHandDiv : computerHandDiv;
    let showSet = new Set();
    switch (num) {
        case 0:
            break;
        case 5:
            for (let i = 0; i < 5; i++) {
                showSet.add(i);
            }
            break;
        default:
            while (showSet.size < num) {
                let num = Math.floor(Math.random() * 5);
                showSet.add(num);
            }
            break;
    }
    cards.forEach((card, index) => {
        let cardDiv = document.createElement("div");
        cardDiv.innerHTML = `
            <div class="card-tooltip">
                <div class="card-img">
                    <img alt="${card.name}" src="img/card/${String(card.img).padStart(6, "0")}.png"
                    decoding="async" title="${card.name}" width="104" height="128" />
                </div>
                <div class="card-rarity card-rarity-${card.rarity}"></div>
                <div class="card-type card-type-${card.type}"></div>
                <div class="card-number">
                    <div class="card-number--top card-number--${card.up}"></div>
                    <div class="card-number--bottom card-number--${card.bottom}"></div>
                    <div class="card-number--left card-number--${card.left}"></div>
                    <div class="card-number--right card-number--${card.right}"></div>
                </div>
            </div>
        `;
        cardDiv.classList.add("card-container", owner+"-card");
        if (!showSet.has(index)) {
            cardDiv.classList.add("cardback");
        }
        cardDiv.setAttribute("id", owner + "-card-" + index);
        cardDiv.setAttribute("data-card-id", card.num);
        handDiv.appendChild(cardDiv);
    });
}

// 放置卡牌到棋盘
function displayCard(card, index) {
    let cardDiv = document.getElementById(card.owner + "-card-" + card.num % 5);
    let cellDiv = document.getElementById("cell-" + index);
    cellDiv.innerHTML = cardDiv.innerHTML;
    cardDiv.innerHTML = ``;
    cardDiv.classList.remove("cardback");
    cardDiv.classList.add("outcard");
}

// 清空游戏
function clearGame() {
    // 清除棋盘上的卡牌
    for (let i = 0; i < 9; i++) {
        let cellDiv = document.getElementById("cell-" + i);
        while (cellDiv.firstChild) {
            cellDiv.removeChild(cellDiv.firstChild);
        }
    }
    // 清空手牌
    playerHandDiv.innerHTML = ``;
    computerHandDiv.innerHTML = ``;
}

function showMaskedMessage(message) {
    // 创建遮罩元素
    let overlay = document.createElement("div");
    overlay.classList.add("overlay");
    // 创建消息元素
    let messageElement = document.createElement("div");
    messageElement.classList.add("message");
    messageElement.textContent = message;
    // 将消息添加到遮罩中
    overlay.appendChild(messageElement);
    // 将遮罩添加到页面中
    document.body.appendChild(overlay);
    // Animate message
    messageElement.style.animation = 'fade-in 0.5s ease-out forwards';
    // Remove overlay and message
    setTimeout(() => {
        messageElement.style.animation = 'fade-out 0.5s ease-out forwards';
        setTimeout(() => {
            messageElement.remove();
            overlay.remove();
        }, 500);
    }, 800);
}

function showStringWithButton(message, callback) {
    // 创建遮罩元素
    let overlay = document.createElement("div");
    overlay.classList.add("overlay");
    // 创建消息元素
    let messageElement = document.createElement("div");
    messageElement.classList.add("message");
    messageElement.textContent = message;
    // 将消息添加到遮罩中
    overlay.appendChild(messageElement);
    // 将遮罩添加到页面中
    document.body.appendChild(overlay);

    // create button container
    let buttonContainer = document.createElement('div');
    buttonContainer.classList.add('button-container');
    overlay.appendChild(buttonContainer);

    // create first button
    let firstButton = document.createElement('button');
    firstButton.innerText = 'Restart';
    firstButton.addEventListener('click', () => {
        callback();
        overlay.remove();
    });
    buttonContainer.appendChild(firstButton);

    // create second button
    let secondButton = document.createElement('button');
    secondButton.innerText = 'Home';
    secondButton.addEventListener('click', () => {
        window.location.href = 'https://honoka55.github.io';
    });
    buttonContainer.appendChild(secondButton);

    // create third button
    let thirdButton = document.createElement('button');
    thirdButton.innerText = 'Repo';
    thirdButton.addEventListener('click', () => {
        window.location.href = 'https://github.com/Honoka55/xiv-triple-triad';
    });
    buttonContainer.appendChild(thirdButton);
}

function displayRules(rules) {
    let ruleDiv = document.createElement("div");
    ruleDiv.classList.add("rule-label");
    ruleDiv.innerHTML = '当前规则：' + rules.join("、") + ' <a href="javascript:location.reload();">重设</a>';
    document.body.appendChild(ruleDiv);
}

function showSwapCards(playerCard, computerCard) {
    // 获取要交换的卡牌的.card-container
    const playerCardContainer = document.querySelector(`#player-card-${playerCard}`);
    const computerCardContainer = document.querySelector(`#computer-card-${computerCard}`);
    // 为.card-container添加selected类
    playerCardContainer.classList.add("selected");
    computerCardContainer.classList.add("selected");

    setTimeout(() => {
        // 交换两个.card-container的内容物
        const playerCardHTML = playerCardContainer.innerHTML;
        playerCardContainer.innerHTML = computerCardContainer.innerHTML;
        computerCardContainer.innerHTML = playerCardHTML;
        setTimeout(() => {
            // 移除selected类
            playerCardContainer.classList.remove("selected");
            computerCardContainer.classList.remove("selected");
        }, 400);
    }, 400);
}
