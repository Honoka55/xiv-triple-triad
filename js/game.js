class Game {
    constructor(rules) {
        this.rules = rules;
        this.board = new Board();
        this.playerHand = [];
        this.computerHand = [];
        this.turn = null;
        this.gameOver = false;
    }

    async start() {
        displayRules(this.rules);
        // 重置游戏状态
        this.playerHand = [];
        this.computerHand = [];
        // 随机分配卡牌
        let cards = await loadCards();
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
        rare4or5Counter = 0;
        rare5Counter = 0;
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
        this.handleOpenRules();
        setTimeout(() => {
            if (this.rules.includes('swap')) {
                this.handleSwapRule();
                if (this.rules.includes('reverse')) {
                    setTimeout(() => {
                        this.handleReverseRule();
                    }, 2500);
                }
            } else {
                this.handleReverseRule();
            }
            setTimeout(() => {
                // 随机指定先手
                var randomArr = Array.from({ length: 3 }, () => Math.round(Math.random()));
                let show = '开始！';
                for (var i = 0; i < randomArr.length; i++) {
                    if (randomArr[i] === 0) {
                        show = show + '蓝';
                    } else {
                        show = show + '红';
                    }
                }
                showMaskedMessage(show);
                setTimeout(() => {
                    if (randomArr.filter((x) => x === 0).length > randomArr.filter((x) => x === 1).length) {
                        this.turn = 'player';
                        showMaskedMessage('蓝方出牌');
                        this.play();
                    } else {
                        this.turn = 'computer';
                        showMaskedMessage('红方出牌');
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
            console.log('you placed Card#' + selectedCard + ' at Cell#' + selectedCell);
            this.board.placeCard(selectedCell, this.playerHand[selectedCard]);
            this.playerHand[selectedCard] = null;
            // 检查是否有卡牌被翻转
            this.checkCapture(selectedCell);
            this.checkGameOver();
            // 进入电脑回合
            if (!this.gameOver) {
                this.turn = 'computer';
                setTimeout(() => {
                    showMaskedMessage('红方出牌');
                    setTimeout(() => {
                        this.computerTurn();
                    }, 2800);
                }, 700);
            }
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
                if (Number.isInteger(selectedCard) && !document.getElementById('player-card-' + selectedCard).classList.contains('outcard')) {
                    cardDiv.classList.add('selected');
                    for (let i = 0; i < 9; i++) {
                        if (this.board.grid[i].card == null) {
                            cells[i].addEventListener('click', gameClickHandler);
                        }
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
        // 随机选择一张电脑手牌
        let selectedCard;
        do {
            selectedCard = Math.floor(Math.random() * 5);
        } while (this.computerHand[selectedCard] === null);
        // 放置卡牌
        console.log('computer placed Card#' + selectedCard + ' at Cell#' + selectedCell);
        document.getElementById('computer-card-' + selectedCard).classList.add('selected');
        setTimeout(() => {
            this.board.placeCard(selectedCell, this.computerHand[selectedCard]);
            document.getElementsByClassName('selected')[0].classList.remove('selected');
            this.computerHand[selectedCard] = null;
            this.checkCapture(selectedCell);
            this.checkGameOver();
            // 进入玩家回合
            if (!this.gameOver) {
                this.turn = 'player';
                setTimeout(() => {
                    showMaskedMessage('蓝方出牌');
                    this.play();
                }, 700);
            }
        }, 500);
    }

    checkCapture(index) {
        let currentCard = this.board.grid[index].card;
        let opponent = this.turn === 'player' ? 'computer' : 'player';
        // 检查上方格子
        if (index > 2 && this.board.grid[index - 3].card && this.board.grid[index - 3].owner === opponent) {
            let opponentCard = this.board.grid[index - 3].card;
            if (opponentCard.bottom < currentCard.up) {
                this.board.grid[index - 3].owner = this.turn;
            }
        }
        // 检查下方格子
        if (index < 6 && this.board.grid[index + 3].card && this.board.grid[index + 3].owner === opponent) {
            let opponentCard = this.board.grid[index + 3].card;
            if (opponentCard.up < currentCard.bottom) {
                this.board.grid[index + 3].owner = this.turn;
            }
        }
        // 检查左边格子
        if (index % 3 !== 0 && this.board.grid[index - 1].card && this.board.grid[index - 1].owner === opponent) {
            let opponentCard = this.board.grid[index - 1].card;
            if (opponentCard.right < currentCard.left) {
                this.board.grid[index - 1].owner = this.turn;
            }
        }
        // 检查右边格子
        if (index % 3 !== 2 && this.board.grid[index + 1].card && this.board.grid[index + 1].owner === opponent) {
            let opponentCard = this.board.grid[index + 1].card;
            if (opponentCard.left < currentCard.right) {
                this.board.grid[index + 1].owner = this.turn;
            }
        }

        setTimeout(() => {
            // 更新棋盘视图
            this.board.updateView();
        }, this.handleAceKillerRule());
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
        // 判定胜负
        if (playerScore > computerScore) {
            console.log('You won!');
            win = '蓝方胜利';
        } else if (playerScore < computerScore) {
            console.log('You lost!');
            win = '红方胜利';
        } else {
            console.log("It's a tie!");
            win = '不分胜负';
        }
        this.gameOver = true;
        showStringWithButton(win, () => {
            this.restart();
        });
    }

    restart() {
        // 重设棋盘
        this.board.reset();
        this.gameOver = false;
        this.start();
    }

    handleOpenRules() {
        // 处理全明牌和三明牌规则
        displayCards(this.playerHand, 'player', 5);
        if (this.rules.includes('all-open')) {
            displayCards(this.computerHand, 'computer', 5);
            showMaskedMessage('全明牌');
        } else if (this.rules.includes('three-open')) {
            displayCards(this.computerHand, 'computer', 3);
            showMaskedMessage('三明牌');
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
        showMaskedMessage('交换');
        setTimeout(() => {
            showSwapCards(playerIndex, computerIndex);
        }, 1200);
    }

    handleReverseRule() {
        // 处理逆转规则
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
        showMaskedMessage('逆转');
    }

    handleAceKillerRule() {
        return 0;
    }
}
