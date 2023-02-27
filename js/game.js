class Game {
    constructor(rules) {
        this.rules = rules;
        this.board = new Board();
        this.playerHand = [];
        this.computerHand = [];
        this.turn = null;
        this.turnIndex = 0;
        this.playerHandOrder = [];
        this.computerHandOrder = [];
        this.gameOver = false;
        this.consecutiveDraws = 0;
        this.rouletteCount = this.rules.filter((rule) => rule === 'roulette').length;
    }

    async start() {
        this.handleRouletteRule();
        displayRules(this.rules);
        // 获取卡牌信息
        let cards = await loadCards();
        if (!this.rules.includes('sudden-death') || this.consecutiveDraws === 0) {
            // 重置游戏状态
            this.playerHand = [];
            this.computerHand = [];
            if (this.rules.includes('random-hand')) {
                this.handleRandomHandRule(cards);
            }
            let rare4or5Counter = 0;
            let rare5Counter = 0;
            while (this.computerHand.length < 5) {
                let randomIndex = Math.floor(Math.random() * cards.length);
                let selectedCard = cards[randomIndex];
                if (selectedCard.稀有度 === 4 || selectedCard.稀有度 === 5) {
                    if (rare4or5Counter >= 2) {
                        continue;
                    }
                    if (selectedCard.稀有度 === 5) {
                        if (rare5Counter >= 1) {
                            continue;
                        }
                        rare5Counter++;
                    }
                    rare4or5Counter++;
                }
                let card = new Card(
                    selectedCard.上,
                    selectedCard.下,
                    selectedCard.左,
                    selectedCard.右,
                    selectedCard.中文名,
                    selectedCard.稀有度,
                    selectedCard.类型ID,
                    selectedCard.卡面,
                    this.computerHand.length + 5
                );
                this.computerHand.push(card);
                cards.splice(randomIndex, 1);
            }
        }
        this.handleOpenRules();
        setTimeout(() => {
            let rulesToHandle = [];
            if (this.rules.includes('swap')) {
                rulesToHandle.push(() => this.handleSwapRule());
            }
            if (this.rules.includes('reverse')) {
                rulesToHandle.push(() => this.handleReverseRule());
            }
            if (this.rules.includes('order') || this.rules.includes('chaos')) {
                rulesToHandle.push(() => this.handleOrderAndChaosRules());
            }
            for (let i = 0; i < rulesToHandle.length; i++) {
                setTimeout(() => {
                    rulesToHandle[i]();
                }, 2500 * i);
            }
            setTimeout(() => {
                // 随机指定先手
                var randomArr = Array.from({ length: 3 }, () => Math.round(Math.random()));
                let show = i18n.getText('game-start');
                for (var i = 0; i < randomArr.length; i++) {
                    if (randomArr[i] === 0) {
                        show = show + '🟦';
                    } else {
                        show = show + '🟥';
                    }
                }
                showMaskedMessage(show);
                setTimeout(() => {
                    if (randomArr.filter((x) => x === 0).length > randomArr.filter((x) => x === 1).length) {
                        this.turn = 'player';
                        showMaskedMessage(i18n.getText('blue-turn'));
                        this.play();
                    } else {
                        this.turn = 'computer';
                        showMaskedMessage(i18n.getText('red-turn'));
                        setTimeout(() => {
                            this.computerTurn();
                        }, 2800);
                    }
                }, 1300);
            }, this.rules.filter((rule) => ['order', 'chaos', 'reverse', 'swap'].includes(rule)).length * 2500);
        }, this.rules.filter((rule) => ['all-open', 'three-open'].includes(rule)).length * 1200);
    }

    play() {
        // 检查游戏是否结束
        if (this.gameOver) {
            return;
        }
        let selectedCard;
        let selectedCell;
        // 秩序与混乱规则下禁用非当前卡牌
        if (this.playerHandOrder.length) {
            for (let i = 0; i < 5; i++) {
                if (i !== this.playerHandOrder[Math.floor(this.turnIndex / 2)]) {
                    document.getElementById('player-card-' + i).classList.add('disable-card');
                }
            }
        }
        // 给玩家手牌区的卡牌添加点击事件监听
        let gameClickHandler = (event) => {
            if (document.getElementsByClassName('selected')[0]) {
                document.getElementsByClassName('selected')[0].classList.remove('selected');
            }
            // 格子上没有卡牌
            selectedCell = parseInt(event.target.dataset.cellId);
            // 移除手牌区卡牌的点击事件监听
            playerHandDiv.removeEventListener('click', playerHandClickHandler);
            // 移除棋盘格子的点击事件监听
            for (let i = 0; i < cells.length; i++) {
                cells[i].removeEventListener('click', gameClickHandler);
            }
            // 如果合法就放置卡牌
            console.log(this.turnIndex + ': You placed Card#' + selectedCard + ' at Cell#' + selectedCell);
            this.board.placeCard(selectedCell, this.playerHand[selectedCard]);
            this.playerHand[selectedCard] = null;
            // 检查是否有卡牌被翻转
            this.checkCapture(selectedCell);
            setTimeout(() => {
                setTimeout(() => {
                    this.checkGameOver();
                    // 进入电脑回合
                    if (!this.gameOver) {
                        this.turnIndex++;
                        this.turn = 'computer';
                        setTimeout(() => {
                            showMaskedMessage(i18n.getText('red-turn'));
                            // 还原被禁用的卡牌
                            for (let i = 0; i < 5; i++) {
                                document.getElementById('player-card-' + i).classList.remove('disable-card');
                            }
                            setTimeout(() => {
                                this.computerTurn();
                            }, 2800);
                        }, 700);
                    }
                }, this.handleTypeAscendAndDescendRules(this.board.grid[selectedCell].card));
            }, this.handleSameAndPlusRules(selectedCell));
        };
        let playerHandClickHandler = (event) => {
            // 找到.card-container父元素
            let cardDiv = event.target;
            while (cardDiv.parentNode) {
                if (cardDiv.classList.contains('card-container')) {
                    break;
                }
                cardDiv = cardDiv.parentNode;
            }
            // 选择的卡牌
            if (document.getElementsByClassName('selected')[0]) {
                document.getElementsByClassName('selected')[0].classList.remove('selected');
            }
            if (cardDiv.dataset) {
                selectedCard = parseInt(cardDiv.dataset.cardId);
                // 如果点击的是手牌区中的卡牌就标记为已选择
                if (
                    Number.isInteger(selectedCard) &&
                    !document.getElementById('player-card-' + selectedCard).classList.contains('outcard') &&
                    !document.getElementById('player-card-' + selectedCard).classList.contains('disable-card')
                ) {
                    cardDiv.classList.add('selected');
                    for (let i = 0; i < 9; i++) {
                        if (this.board.grid[i].card == null) {
                            cells[i].addEventListener('click', gameClickHandler);
                        }
                    }
                } else {
                    // 移除棋盘格子的点击事件监听
                    for (let i = 0; i < cells.length; i++) {
                        cells[i].removeEventListener('click', gameClickHandler);
                    }
                }
            } else {
                // 移除棋盘格子的点击事件监听
                for (let i = 0; i < cells.length; i++) {
                    cells[i].removeEventListener('click', gameClickHandler);
                }
            }
        };
        playerHandDiv.addEventListener('click', playerHandClickHandler);
    }

    computerTurn() {
        // 检查游戏是否结束
        if (this.gameOver) {
            return;
        }
        // 随机选择一个空格
        let selectedCell;
        do {
            selectedCell = Math.floor(Math.random() * 9);
        } while (this.board.grid[selectedCell].card !== null);
        // 秩序与混乱规则下按指定顺序出牌
        let selectedCard;
        if (this.computerHandOrder.length) {
            selectedCard = this.computerHandOrder[Math.floor(this.turnIndex / 2)];
        } else {
            // 随机选择一张电脑手牌
            do {
                selectedCard = Math.floor(Math.random() * 5);
            } while (this.computerHand[selectedCard] === null);
        }
        // 放置卡牌
        console.log(this.turnIndex + ': Computer placed Card#' + selectedCard + ' at Cell#' + selectedCell);
        document.getElementById('computer-card-' + selectedCard).classList.add('selected');
        setTimeout(() => {
            this.board.placeCard(selectedCell, this.computerHand[selectedCard]);
            document.getElementsByClassName('selected')[0].classList.remove('selected');
            this.computerHand[selectedCard] = null;
            this.checkCapture(selectedCell);
            setTimeout(() => {
                setTimeout(() => {
                    this.checkGameOver();
                    // 进入玩家回合
                    if (!this.gameOver) {
                        this.turnIndex++;
                        this.turn = 'player';
                        setTimeout(() => {
                            showMaskedMessage(i18n.getText('blue-turn'));
                            this.play();
                        }, 700);
                    }
                }, this.handleTypeAscendAndDescendRules(this.board.grid[selectedCell].card));
            }, this.handleSameAndPlusRules(selectedCell));
        }, 500);
    }

    checkCapture(index) {
        let currentCard = this.board.grid[index].card;
        let opponent = this.turn === 'player' ? 'computer' : 'player';
        let capturedCards = [];
        // 检查上方格子
        if (index > 2 && this.board.grid[index - 3].card && this.board.grid[index - 3].owner === opponent) {
            let opponentCard = this.board.grid[index - 3].card;
            if (opponentCard.bottom < currentCard.up) {
                this.board.grid[index - 3].owner = this.turn;
                capturedCards.push(index - 3);
            }
        }
        // 检查下方格子
        if (index < 6 && this.board.grid[index + 3].card && this.board.grid[index + 3].owner === opponent) {
            let opponentCard = this.board.grid[index + 3].card;
            if (opponentCard.up < currentCard.bottom) {
                this.board.grid[index + 3].owner = this.turn;
                capturedCards.push(index + 3);
            }
        }
        // 检查左边格子
        if (index % 3 !== 0 && this.board.grid[index - 1].card && this.board.grid[index - 1].owner === opponent) {
            let opponentCard = this.board.grid[index - 1].card;
            if (opponentCard.right < currentCard.left) {
                this.board.grid[index - 1].owner = this.turn;
                capturedCards.push(index - 1);
            }
        }
        // 检查右边格子
        if (index % 3 !== 2 && this.board.grid[index + 1].card && this.board.grid[index + 1].owner === opponent) {
            let opponentCard = this.board.grid[index + 1].card;
            if (opponentCard.left < currentCard.right) {
                this.board.grid[index + 1].owner = this.turn;
                capturedCards.push(index + 1);
            }
        }
        let cardsCapturedByAceKiller = this.handleAceKillerRule(index);
        capturedCards = capturedCards.concat(cardsCapturedByAceKiller);
        let delay = cardsCapturedByAceKiller.length ? 1500 : 0;
        setTimeout(() => {
            // 更新棋盘视图
            this.board.updateView();
        }, delay);
        return capturedCards;
    }

    checkGameOver() {
        // 检查棋盘是否已满
        if (!this.board.isFull()) {
            return;
        }
        // 计算分数
        let playerScore = this.board.countCards('player');
        let computerScore = this.board.countCards('computer');
        if (this.turn == 'player') {
            computerScore = computerScore + 1;
        } else {
            playerScore = playerScore + 1;
        }
        let win;
        let suddenDelay = 0;
        // 判定胜负
        if (playerScore > computerScore) {
            console.log('You won!');
            win = i18n.getText('blue-wins');
            this.consecutiveDraws = 0;
        } else if (playerScore < computerScore) {
            console.log('You lost!');
            win = i18n.getText('red-wins');
            this.consecutiveDraws = 0;
        } else {
            console.log("It's a draw!");
            win = i18n.getText('draw');
            suddenDelay = this.handleSuddenDeathRule();
        }
        this.gameOver = true;
        this.turnIndex = 0;
        if (suddenDelay) {
            setTimeout(() => {
                this.restart();
            }, suddenDelay);
        } else {
            showStringWithButton(win, () => {
                this.restart();
            });
        }
    }

    restart() {
        // 重设棋盘
        this.board.reset();
        document.getElementsByClassName('rule-label')[0].remove();
        this.gameOver = false;
        if (this.rouletteCount && !this.consecutiveDraws) {
            this.rules.splice(-this.rouletteCount, this.rouletteCount, ...Array(this.rouletteCount).fill('roulette'));
        }
        this.start();
    }

    async handleRandomHandRule(cards) {
        // 处理随机规则
        let rare4or5Counter = 0;
        let rare5Counter = 0;
        while (this.playerHand.length < 5) {
            let randomIndex = Math.floor(Math.random() * cards.length);
            let selectedCard = cards[randomIndex];
            if (selectedCard.稀有度 === 4 || selectedCard.稀有度 === 5) {
                if (rare4or5Counter >= 2) {
                    continue;
                }
                if (selectedCard.稀有度 === 5) {
                    if (rare5Counter >= 1) {
                        continue;
                    }
                    rare5Counter++;
                }
                rare4or5Counter++;
            }
            let card = new Card(
                selectedCard.上,
                selectedCard.下,
                selectedCard.左,
                selectedCard.右,
                selectedCard.中文名,
                selectedCard.稀有度,
                selectedCard.类型ID,
                selectedCard.卡面,
                this.playerHand.length
            );
            this.playerHand.push(card);
            cards.splice(randomIndex, 1);
        }
    }

    handleOpenRules() {
        // 处理全明牌和三明牌规则
        displayCards(this.playerHand, 'player', 5);
        if (this.rules.includes('all-open')) {
            displayCards(this.computerHand, 'computer', 5);
            showMaskedMessage(i18n.getText('all-open'));
        } else if (this.rules.includes('three-open')) {
            displayCards(this.computerHand, 'computer', 3);
            showMaskedMessage(i18n.getText('three-open'));
        } else {
            displayCards(this.computerHand, 'computer', 0);
        }
    }

    handleSwapRule() {
        // 处理交换规则
        if (!this.rules.includes('swap')) {
            return;
        }
        let playerIndex = Math.floor(Math.random() * this.playerHand.length);
        let computerIndex = Math.floor(Math.random() * this.computerHand.length);
        console.log('player#' + playerIndex + ' ' + this.playerHand[playerIndex].name + ' <=> computer#' + computerIndex + ' ' + this.computerHand[computerIndex].name);
        // 交换位置
        [this.playerHand[playerIndex], this.computerHand[computerIndex]] = [this.computerHand[computerIndex], this.playerHand[playerIndex]];
        this.playerHand[playerIndex].owner = 'player';
        this.computerHand[computerIndex].owner = 'computer';
        this.playerHand[playerIndex].num = playerIndex;
        this.computerHand[computerIndex].num = computerIndex + 5;
        // 更新界面显示
        showMaskedMessage(i18n.getText('swap'));
        setTimeout(() => {
            showSwapCards(playerIndex, computerIndex);
        }, 1200);
    }

    handleReverseRule() {
        // 处理逆转规则
        if (!this.rules.includes('reverse')) {
            return;
        }
        this.playerHand.forEach((card) => {
            card.up = 11 - card.up;
            card.bottom = 11 - card.bottom;
            card.left = 11 - card.left;
            card.right = 11 - card.right;
        });
        this.computerHand.forEach((card) => {
            card.up = 11 - card.up;
            card.bottom = 11 - card.bottom;
            card.left = 11 - card.left;
            card.right = 11 - card.right;
        });
        showMaskedMessage(i18n.getText('reverse'));
    }

    handleAceKillerRule(index) {
        // 处理王牌杀手规则
        if (!this.rules.includes('ace-killer')) {
            return [];
        }
        let currentCard = this.board.grid[index].card;
        let opponent = this.turn === 'player' ? 'computer' : 'player';
        let capturedCards = [];
        // 检查上方格子
        if (index > 2 && this.board.grid[index - 3].card && this.board.grid[index - 3].owner === opponent) {
            let opponentCard = this.board.grid[index - 3].card;
            if (opponentCard.bottom == 10 && currentCard.up == 1) {
                this.board.grid[index - 3].owner = this.turn;
                capturedCards.push(index - 3);
            }
        }
        // 检查下方格子
        if (index < 6 && this.board.grid[index + 3].card && this.board.grid[index + 3].owner === opponent) {
            let opponentCard = this.board.grid[index + 3].card;
            if (opponentCard.up == 10 && currentCard.bottom == 1) {
                this.board.grid[index + 3].owner = this.turn;
                capturedCards.push(index + 3);
            }
        }
        // 检查左边格子
        if (index % 3 !== 0 && this.board.grid[index - 1].card && this.board.grid[index - 1].owner === opponent) {
            let opponentCard = this.board.grid[index - 1].card;
            if (opponentCard.right == 10 && currentCard.left == 1) {
                this.board.grid[index - 1].owner = this.turn;
                capturedCards.push(index - 1);
            }
        }
        // 检查右边格子
        if (index % 3 !== 2 && this.board.grid[index + 1].card && this.board.grid[index + 1].owner === opponent) {
            let opponentCard = this.board.grid[index + 1].card;
            if (opponentCard.left == 10 && currentCard.right == 1) {
                this.board.grid[index + 1].owner = this.turn;
                capturedCards.push(index + 1);
            }
        }
        if (capturedCards.length) {
            showMaskedMessage(i18n.getText('ace-killer'));
        }
        return capturedCards;
    }

    handleOrderAndChaosRules() {
        // 处理秩序和混乱规则
        let playerOrder = [0, 1, 2, 3, 4],
            computerOrder = [0, 1, 2, 3, 4];
        if (this.rules.includes('order')) {
            showMaskedMessage(i18n.getText('order'));
        } else if (this.rules.includes('chaos')) {
            showMaskedMessage(i18n.getText('chaos'));
            // 函数用来打乱数组
            const shuffle = (array) => {
                for (let i = array.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [array[i], array[j]] = [array[j], array[i]];
                }
                return array;
            };
            shuffle(playerOrder);
            shuffle(computerOrder);
        } else {
            return;
        }
        this.playerHandOrder = playerOrder;
        this.computerHandOrder = computerOrder;
    }

    handleSuddenDeathRule() {
        // 处理不胜不休规则
        if (!this.rules.includes('sudden-death')) {
            return 0;
        }
        this.consecutiveDraws++;
        if (this.consecutiveDraws >= 5) {
            this.consecutiveDraws = 0;
            return 0;
        }
        for (let i = 0; i < 9; i++) {
            if (this.board.grid[i].owner === 'player') {
                for (let j = 0; j < 5; j++) {
                    if (this.playerHand[j] === null) {
                        this.playerHand[j] = this.board.grid[i].card;
                        this.playerHand[j].owner = 'player';
                        this.playerHand[j].num = j;
                        break;
                    }
                }
            } else if (this.board.grid[i].owner === 'computer') {
                for (let j = 0; j < 5; j++) {
                    if (this.computerHand[j] === null) {
                        this.computerHand[j] = this.board.grid[i].card;
                        this.computerHand[j].owner = 'computer';
                        this.computerHand[j].num = j + 5;
                        break;
                    }
                }
            }
        }
        showMaskedMessage(i18n.getText('sudden-death'));
        return 1500;
    }

    handleTypeAscendAndDescendRules(card) {
        // 处理同类强化和弱化规则
        if ((!this.rules.includes('type-ascend') && !this.rules.includes('type-descend')) || card.type == 0) {
            return 0;
        }
        let type = card.type;
        let operator = this.rules.includes('type-ascend') ? 1 : -1;
        let reverse = this.rules.includes('reverse');
        showMaskedMessage(i18n.getText(operator == 1 ? 'type-ascend' : 'type-descend'));

        // 遍历所有卡牌，添加类
        for (let i = 0; i < 9; i++) {
            let currentCard = this.board.grid[i].card;
            if (currentCard && currentCard.type === type) {
                let cardDiv = document.getElementById(`cell-${i}`).firstElementChild;
                if (operator === 1) {
                    cardDiv.classList.add('ascend');
                } else {
                    cardDiv.classList.add('descend');
                }
                cardDiv.setAttribute('data-increment', (parseInt(cardDiv.getAttribute('data-increment')) || 0) + operator);
            }
        }
        for (let i = 0; i < 5; i++) {
            if (this.playerHand[i] && this.playerHand[i].type === type) {
                let cardDiv = document.getElementById(`player-card-${i}`).firstElementChild;
                if (operator === 1) {
                    cardDiv.classList.add('ascend');
                } else {
                    cardDiv.classList.add('descend');
                }
                cardDiv.setAttribute('data-increment', (parseInt(cardDiv.getAttribute('data-increment')) || 0) + operator);
            }
        }
        for (let i = 0; i < 5; i++) {
            if (this.computerHand[i] && this.computerHand[i].type === type) {
                let cardDiv = document.getElementById(`computer-card-${i}`).firstElementChild;
                if (operator === 1) {
                    cardDiv.classList.add('ascend');
                } else {
                    cardDiv.classList.add('descend');
                }
                cardDiv.setAttribute('data-increment', (parseInt(cardDiv.getAttribute('data-increment')) || 0) + operator);
            }
        }
        // 如果逆转规则生效，将操作符反转
        if (reverse) {
            operator *= -1;
        }
        // 再次遍历所有卡牌，修改值
        for (let i = 0; i < 9; i++) {
            let currentCard = this.board.grid[i].card;
            if (currentCard && currentCard.type === type) {
                currentCard.up += operator;
                currentCard.bottom += operator;
                currentCard.left += operator;
                currentCard.right += operator;
                // 确保值不超过10或小于1
                currentCard.up = Math.min(Math.max(currentCard.up, 1), 10);
                currentCard.bottom = Math.min(Math.max(currentCard.bottom, 1), 10);
                currentCard.left = Math.min(Math.max(currentCard.left, 1), 10);
                currentCard.right = Math.min(Math.max(currentCard.right, 1), 10);
            }
        }
        for (let i = 0; i < 5; i++) {
            if (this.playerHand[i] && this.playerHand[i].type === type) {
                this.playerHand[i].up += operator;
                this.playerHand[i].bottom += operator;
                this.playerHand[i].left += operator;
                this.playerHand[i].right += operator;
                this.playerHand[i].up = Math.min(Math.max(this.playerHand[i].up, 1), 10);
                this.playerHand[i].bottom = Math.min(Math.max(this.playerHand[i].bottom, 1), 10);
                this.playerHand[i].left = Math.min(Math.max(this.playerHand[i].left, 1), 10);
                this.playerHand[i].right = Math.min(Math.max(this.playerHand[i].right, 1), 10);
            }
            if (this.computerHand[i] && this.computerHand[i].type === type) {
                this.computerHand[i].up += operator;
                this.computerHand[i].bottom += operator;
                this.computerHand[i].left += operator;
                this.computerHand[i].right += operator;
                this.computerHand[i].up = Math.min(Math.max(this.computerHand[i].up, 1), 10);
                this.computerHand[i].bottom = Math.min(Math.max(this.computerHand[i].bottom, 1), 10);
                this.computerHand[i].left = Math.min(Math.max(this.computerHand[i].left, 1), 10);
                this.computerHand[i].right = Math.min(Math.max(this.computerHand[i].right, 1), 10);
            }
        }
        return 1500;
    }

    handleSameAndPlusRules(index) {
        // 处理同数和加算规则
        if (!this.rules.includes('same') && !this.rules.includes('plus')) {
            return 0;
        }
        let currentCard = this.board.grid[index].card;
        let opponent = this.turn === 'player' ? 'computer' : 'player';
        let capturedCards = [];
        let cardsCapturedBySame = [];
        let cardsCapturedByPlus = [];
        let totalDelay = 0;

        if (this.rules.includes('same')) {
            let sameCount = 0;
            let opponentCards = [];
            // 检查上方格子
            if (index > 2 && this.board.grid[index - 3].card) {
                let upCard = this.board.grid[index - 3].card;
                if (upCard.bottom === currentCard.up) {
                    sameCount++;
                    if (this.board.grid[index - 3].owner === opponent) {
                        opponentCards.push(index - 3);
                    }
                }
            }
            // 检查下方格子
            if (index < 6 && this.board.grid[index + 3].card) {
                let downCard = this.board.grid[index + 3].card;
                if (downCard.up === currentCard.bottom) {
                    sameCount++;
                    if (this.board.grid[index + 3].owner === opponent) {
                        opponentCards.push(index + 3);
                    }
                }
            }
            // 检查左边格子
            if (index % 3 !== 0 && this.board.grid[index - 1].card) {
                let leftCard = this.board.grid[index - 1].card;
                if (leftCard.right === currentCard.left) {
                    sameCount++;
                    if (this.board.grid[index - 1].owner === opponent) {
                        opponentCards.push(index - 1);
                    }
                }
            }
            // 检查右边格子
            if (index % 3 !== 2 && this.board.grid[index + 1].card) {
                let rightCard = this.board.grid[index + 1].card;
                if (rightCard.left === currentCard.right) {
                    sameCount++;
                    if (this.board.grid[index + 1].card.owner === opponent) {
                        opponentCards.push(index + 1);
                    }
                }
            }
            if (sameCount >= 2 && opponentCards.length > 0) {
                totalDelay += 1300;
                for (let i = 0; i < opponentCards.length; i++) {
                    cardsCapturedBySame.push(opponentCards[i]);
                    this.board.grid[opponentCards[i]].owner = this.turn;
                }
            }
        }

        if (this.rules.includes('plus')) {
            let plusArr = [];
            let plusCards = [];
            // 检查上方格子
            if (index > 2 && this.board.grid[index - 3].card) {
                let upCard = this.board.grid[index - 3].card;
                plusArr.push(upCard.bottom + currentCard.up);
                plusCards.push(index - 3);
            }
            // 检查下方格子
            if (index < 6 && this.board.grid[index + 3].card) {
                let downCard = this.board.grid[index + 3].card;
                plusArr.push(downCard.up + currentCard.bottom);
                plusCards.push(index + 3);
            }
            // 检查左边格子
            if (index % 3 !== 0 && this.board.grid[index - 1].card) {
                let leftCard = this.board.grid[index - 1].card;
                plusArr.push(leftCard.right + currentCard.left);
                plusCards.push(index - 1);
            }
            // 检查右边格子
            if (index % 3 !== 2 && this.board.grid[index + 1].card) {
                let rightCard = this.board.grid[index + 1].card;
                plusArr.push(rightCard.left + currentCard.right);
                plusCards.push(index + 1);
            }
            for (let i = 0; i < plusArr.length; i++) {
                for (let j = i + 1; j < plusArr.length; j++) {
                    if (plusArr[i] === plusArr[j]) {
                        if (this.board.grid[plusCards[i]].owner === opponent) {
                            cardsCapturedByPlus.push(plusCards[i]);
                            this.board.grid[plusCards[i]].owner = this.turn;
                        }
                        if (this.board.grid[plusCards[j]].owner === opponent) {
                            cardsCapturedByPlus.push(plusCards[j]);
                            this.board.grid[plusCards[j]].owner = this.turn;
                        }
                    }
                }
            }
            if (cardsCapturedByPlus.length) {
                totalDelay += 1300;
            }
        }

        let messagesToHandle = [];
        if (cardsCapturedBySame.length) {
            messagesToHandle.push(() => showMaskedMessage(i18n.getText('same')));
        }
        if (cardsCapturedByPlus.length) {
            messagesToHandle.push(() => showMaskedMessage(i18n.getText('plus')));
        }
        for (let i = 0; i < messagesToHandle.length; i++) {
            setTimeout(() => {
                messagesToHandle[i]();
            }, 1300 * i);
        }
        capturedCards = capturedCards.concat(cardsCapturedBySame);
        capturedCards = capturedCards.concat(cardsCapturedByPlus);
        capturedCards = [...new Set(capturedCards)];

        while (capturedCards.length > 0) {
            console.log('capturedCards: ');
            console.log(capturedCards);
            let tempCapturedCards = [];
            for (let i = 0; i < capturedCards.length; i++) {
                tempCapturedCards = tempCapturedCards.concat(this.checkCapture(capturedCards[i]));
            }
            if (tempCapturedCards.length === 0) {
                break;
            }
            console.log('tempCapturedCards: ');
            console.log(tempCapturedCards);
            setTimeout(() => {
                showMaskedMessage(i18n.getText('combo'));
                capturedCards = tempCapturedCards;
                totalDelay += 1300;
            }, totalDelay);
        }
        return totalDelay;
    }

    handleRouletteRule() {
        // 处理天选规则
        if (!this.rouletteCount) {
            return;
        }
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
        const nonRouletteRules = this.rules.filter((rule) => rule !== 'roulette');
        const availableRules = ['all-open', 'three-open', 'same', 'sudden-death', 'plus', 'order', 'chaos', 'reverse', 'ace-killer', 'type-ascend', 'type-descend', 'swap'].filter(
            (rule) => !nonRouletteRules.includes(rule) && (!exclusiveRules[rule] || !exclusiveRules[rule].some((exclusiveRule) => nonRouletteRules.includes(exclusiveRule)))
        );
        const selectedRules = new Set();
        for (let i = 0; i < this.rouletteCount; i++) {
            let newRule;
            do {
                newRule = availableRules[Math.floor(Math.random() * availableRules.length)];
            } while (selectedRules.has(newRule));
            selectedRules.add(newRule);
        }
        this.rules = nonRouletteRules.concat(Array.from(selectedRules));
    }
}
