class Cell {
    constructor() {
        this.card = null;
        this.owner = null;
    }

    setCard(card) {
        this.card = card;
        this.owner = card.owner;
    }
}
