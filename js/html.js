const playerHandDiv = document.querySelector('.player-hand');
const computerHandDiv = document.querySelector('.computer-hand');
const boardDiv = document.querySelector('.board');
const cells = boardDiv.querySelectorAll('.cell');
for (let i = 0; i < cells.length; i++) {
    cells[i].setAttribute('id', 'cell-' + i);
    cells[i].dataset.cellId = i;
}

function showRuleSelect() {
    // 生成规则选择遮罩
    let overlay = document.getElementsByClassName('rules-overlay')[0];
    overlay.innerHTML = `
        <div class="rules-modal">
            <div class="rules-title" data-i18n="rules-title"></div>
            <div class="rules-content">
                <div>
                    <input type="checkbox" id="all-open" value="all-open">
                    <label for="all-open" data-i18n="all-open"></label>
                </div>
                <div>
                    <input type="checkbox" id="three-open" value="three-open">
                    <label for="three-open" data-i18n="three-open"></label>
                </div>
                <div>
                    <input type="checkbox" id="same" value="same">
                    <label for="same" data-i18n="same"></label>
                </div>
                <div>
                    <input type="checkbox" id="sudden-death" value="sudden-death">
                    <label for="sudden-death" data-i18n="sudden-death"></label>
                </div>
                <div>
                    <input type="checkbox" id="plus" value="plus">
                    <label for="plus" data-i18n="plus"></label>
                </div>
                <div>
                    <input type="checkbox" id="random-hand" value="random-hand" checked>
                    <label for="random-hand" data-i18n="random-hand"></label>
                </div>
                <div>
                    <input type="checkbox" id="order" value="order">
                    <label for="order" data-i18n="order"></label>
                </div>
                <div>
                    <input type="checkbox" id="chaos" value="chaos">
                    <label for="chaos" data-i18n="chaos"></label>
                </div>
                <div>
                    <input type="checkbox" id="reverse" value="reverse">
                    <label for="reverse" data-i18n="reverse"></label>
                </div>
                <div>
                    <input type="checkbox" id="ace-killer" value="ace-killer">
                    <label for="ace-killer" data-i18n="ace-killer"></label>
                </div>
                <div>
                    <input type="checkbox" id="type-ascend" value="type-ascend">
                    <label for="type-ascend" data-i18n="type-ascend"></label>
                </div>
                <div>
                    <input type="checkbox" id="type-descend" value="type-descend">
                    <label for="type-descend" data-i18n="type-descend"></label>
                </div>
                <div>
                    <input type="checkbox" id="swap" value="swap">
                    <label for="swap" data-i18n="swap"></label>
                </div>
                <div>
                    <input type="checkbox" id="draft" value="draft">
                    <label for="draft" data-i18n="draft"></label>
                </div>
                <div>
                    <input type="checkbox" id="roulette" value="roulette">
                    <label for="roulette" data-i18n="roulette"></label>
                    <span id="roulette-num" style="display:none;"></span>
                    <input type="range" id="roulette-count" min="1" max="9" value="1" style="display:none;">
                </div>
            </div>
            <button id="start-btn" type="button" data-i18n="start-button"></button>
            <p class="copyright-text">[FFXIV Materials] <wbr>Copyright © 2010-2023 SQUARE ENIX CO., LTD. All Rights Reserved.</p>
            <select id="language-select" onchange="i18n.setLanguage(this.value); i18n.translate();">
                <option value="zh">中文</option>
                <option value="ja">日本語</option>
                <option value="en">English</option>
                <option value="fr">Français</option>
                <option value="de">Deutsch</option>
                <option value="ko">한국어</option>
            </select>
        </div>
    `;

    // 监听规则选择
    const exclusiveRules = {
        'random-hand': ['draft'],
        'draft': ['random-hand'],
        'all-open': ['three-open'],
        'three-open': ['all-open'],
        'order': ['chaos'],
        'chaos': ['order'],
        'type-ascend': ['type-descend'],
        'type-descend': ['type-ascend']
    };
    const rules = document.querySelectorAll('.rules-content input[type="checkbox"]');
    const startButton = document.querySelector('#start-btn');
    rules.forEach((rule) => {
        rule.addEventListener('change', function () {
            if (this.checked) {
                const exclusiveRuleGroup = exclusiveRules[this.id];
                if (exclusiveRuleGroup) {
                    exclusiveRuleGroup.forEach((ruleId) => {
                        const rule = document.getElementById(ruleId);
                        rule.checked = false;
                        rule.disabled = true;
                    });
                }
            } else {
                const exclusiveRuleGroup = exclusiveRules[this.id];
                if (exclusiveRuleGroup) {
                    exclusiveRuleGroup.forEach((ruleId) => {
                        const rule = document.getElementById(ruleId);
                        rule.disabled = false;
                    });
                }
            }
            const randomCheck = document.getElementById('random-hand').checked;
            const draftCheck = document.getElementById('draft').checked;
            if (!randomCheck && !draftCheck) {
                startButton.disabled = true;
                startButton.title = '随机和选拔规则需选择一个';
            } else {
                startButton.disabled = false;
                startButton.removeAttribute('title');
            }
        });
    });

    // 处理天选规则相关监听
    const roulette = document.getElementById('roulette');
    const rouletteCount = document.getElementById('roulette-count');
    const rouletteNum = document.getElementById('roulette-num');
    let rouletteMax = 9;
    ['all-open', 'three-open', 'same', 'sudden-death', 'plus', 'order', 'chaos', 'reverse', 'ace-killer', 'type-ascend', 'type-descend', 'swap'].forEach((rule) => {
        document.getElementById(rule).addEventListener('change', function () {
            if (this.checked) {
                rouletteMax--;
            } else {
                rouletteMax++;
            }
            rouletteCount.max = rouletteMax;
            if (rouletteMax <= 0) {
                roulette.checked = false;
                roulette.disabled = true;
                rouletteCount.style.display = 'none';
                rouletteNum.style.display = 'none';
                rouletteCount.value = 1;
            } else {
                roulette.disabled = false;
                rouletteNum.innerHTML = '×' + rouletteCount.value;
            }
        });
    });
    roulette.addEventListener('change', function () {
        if (this.value === 'roulette') {
            rouletteCount.style.display = this.checked ? 'block' : 'none';
            rouletteNum.style.display = this.checked ? 'inline' : 'none';
            rouletteNum.innerHTML = '×' + rouletteCount.value;
        }
    });
    rouletteCount.addEventListener('input', function () {
        rouletteNum.innerHTML = '×' + this.value;
    });

    // 禁用还未实现的规则
    rules.forEach((rule) => {
        if (['random-hand', 'draft'].includes(rule.id)) {
            rule.disabled = true;
        }
    });

    // 开始按钮
    startButton.addEventListener('click', function () {
        if (!this.disabled) {
            let selectedRules = [];
            let ruleElements = document.querySelectorAll('.rules-content input[type="checkbox"]:checked');
            for (let i = 0; i < ruleElements.length; i++) {
                if (ruleElements[i].value == 'roulette') {
                    let rouletteCount = document.getElementById('roulette-count').value;
                    for (let j = 0; j < rouletteCount; j++) {
                        selectedRules.push('roulette');
                    }
                } else {
                    selectedRules.push(ruleElements[i].value);
                }
            }
            document.getElementsByClassName('container')[0].style.display = 'flex';
            overlay.remove();
            game = new Game(selectedRules);
            game.start();
        }
    });
}

// 展示双方手牌
function displayCards(cards, owner, num) {
    handDiv = owner == 'player' ? playerHandDiv : computerHandDiv;
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
        let cardDiv = document.createElement('div');
        cardDiv.innerHTML = `
            <div class="card-tooltip">
                <div class="card-img">
                    <img alt="${card.name}" src="https://gcore.jsdelivr.net/gh/Honoka55/xiv-triple-triad/img/card/${String(card.img).padStart(6, '0')}.png"
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
        cardDiv.classList.add('card-container', owner + '-card');
        if (!showSet.has(index)) {
            cardDiv.classList.add('cardback');
        }
        cardDiv.setAttribute('id', owner + '-card-' + index);
        cardDiv.setAttribute('data-card-id', card.num);
        handDiv.appendChild(cardDiv);
    });
}

// 放置卡牌到棋盘
function displayCard(card, index) {
    let cardDiv = document.getElementById(card.owner + '-card-' + (card.num % 5));
    let cellDiv = document.getElementById('cell-' + index);
    cellDiv.innerHTML = cardDiv.innerHTML;
    cardDiv.innerHTML = ``;
    cardDiv.classList.remove('cardback');
    cardDiv.classList.add('outcard');
    cellDiv.classList.add(card.owner + '-cell');
}

// 清空游戏
function clearGame() {
    // 清除棋盘上的卡牌
    for (let i = 0; i < 9; i++) {
        let cellDiv = document.getElementById('cell-' + i);
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
    let overlay = document.createElement('div');
    overlay.classList.add('overlay');
    // 创建消息元素
    let messageElement = document.createElement('div');
    messageElement.classList.add('message');
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
    let overlay = document.createElement('div');
    overlay.classList.add('overlay');
    // 创建消息元素
    let messageElement = document.createElement('div');
    messageElement.classList.add('message');
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
    firstButton.innerText = i18n.getText('restart');
    firstButton.addEventListener('click', () => {
        callback();
        overlay.remove();
    });
    buttonContainer.appendChild(firstButton);

    // create second button
    let secondButton = document.createElement('button');
    secondButton.innerText = i18n.getText('home');
    secondButton.addEventListener('click', () => {
        window.location.href = 'https://honoka55.github.io';
    });
    buttonContainer.appendChild(secondButton);

    // create third button
    let thirdButton = document.createElement('button');
    thirdButton.innerText = i18n.getText('repository');
    thirdButton.addEventListener('click', () => {
        window.location.href = 'https://github.com/Honoka55/xiv-triple-triad';
    });
    buttonContainer.appendChild(thirdButton);
}

function displayRules(rules) {
    let ruleDiv = document.createElement('div');
    ruleDiv.classList.add('rule-label');
    ruleDiv.innerHTML = `<div class="rule-text">${i18n.getText('current-rules')}${rules.map((r) => i18n.getText(r)).join(i18n.getText('delimiter'))}</div>
        <a href="javascript:location.reload();">${i18n.getText('reset')}</a>`;
    document.body.appendChild(ruleDiv);
}

function showSwapCards(playerCard, computerCard) {
    // 获取要交换的卡牌的.card-container
    const playerCardContainer = document.querySelector(`#player-card-${playerCard}`);
    const computerCardContainer = document.querySelector(`#computer-card-${computerCard}`);
    // 为.card-container添加selected类
    playerCardContainer.classList.add('selected');
    computerCardContainer.classList.add('selected');

    setTimeout(() => {
        // 交换两个.card-container的内容物
        const playerCardHTML = playerCardContainer.innerHTML;
        playerCardContainer.innerHTML = computerCardContainer.innerHTML;
        computerCardContainer.innerHTML = playerCardHTML;
        setTimeout(() => {
            // 移除selected类
            playerCardContainer.classList.remove('selected');
            computerCardContainer.classList.remove('selected');
        }, 400);
    }, 400);
}
