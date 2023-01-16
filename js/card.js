class Card {
    constructor(up, bottom, left, right, name, rarity, type, img, num) {
        this.up = up;
        this.bottom = bottom;
        this.left = left;
        this.right = right;
        this.name = name;
        this.rarity = rarity;
        this.type = type;
        this.img = img;
        this.num = num;
        this.owner = (Math.floor(this.num / 5) == 0) ? "player" : "computer";
    }
}
