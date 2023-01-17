class Board {
    constructor() {
        this.reset();
    }

    reset() {
        // 重置棋盘
        this.grid = Array(9).fill(null);
        for (let i = 0; i < 9; i++) {
            this.grid[i] = new Cell();
        }
        clearGame();
    }

    placeCard(index, card) {
        // 如果该位置已经有卡牌，则不能放置
        if (this.grid[index].card) {
            console.log("Error: Position already occupied.");
            return;
        }
        // 将卡牌放入棋盘上的该位置
        this.grid[index].setCard(card);
        displayCard(card, index);
    }

    updateView() {
        // 遍历棋盘上所有格子
        for (let i = 0; i < 9; i++) {
            let cell = document.getElementById(`cell-${i}`);
            let card = this.grid[i].card;
            if (card) {
                // 如果这个格子有卡牌
                let cardDiv = cell.querySelector('.card-tooltip');
                if (this.grid[i].owner === 'player') {
                    // 更新视图，将卡牌div添加.player-card类
                    cardDiv.classList.remove('computer-card');
                    cardDiv.classList.add('player-card');
                } else {
                    // 更新视图，将卡牌div添加.computer-card类
                    cardDiv.classList.remove('player-card');
                    cardDiv.classList.add('computer-card');
                }
            }
        }
        if (this.isFull()) {
            console.log("The board is full, no more cards can be added.");
            return;
        }
    }

    isFull() {
        return this.grid.every(cell => cell.card);
    }

    countCards(player) {
        let count = 0;
        // 遍历棋盘上所有格子
        for (let i = 0; i < 9; i++) {
            let cell = this.grid[i];
            if (cell.card && cell.owner === player) {
                // 如果这个格子有卡牌且属于给定玩家
                count++;
            }
        }
        return count;
    }
}
