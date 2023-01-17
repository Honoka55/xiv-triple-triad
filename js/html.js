const playerHandDiv = document.querySelector(".player-hand");
const computerHandDiv = document.querySelector(".computer-hand");
const boardDiv = document.querySelector(".board");
const cells = boardDiv.querySelectorAll(".cell");
for (let i = 0; i < cells.length; i++) {
    cells[i].setAttribute("id", "cell-" + i);
    cells[i].dataset.cellId = i;
}

// 展示双方手牌
function displayCards(cards, owner) {
    handDiv = (owner == "player") ? playerHandDiv : computerHandDiv;
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