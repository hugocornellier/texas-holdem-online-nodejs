const { random } = require("colors");
const card = require("./card")

module.exports = class deck {
    constructor() {
        var dec = [];
        var suits = ['Hearts', 'Spades', 'Clubs', 'Diamonds'];
        for (var i = 0; i < 4; i++) {
            for (var j = 0; j < 13; j++){
                dec[j + (13 * i)] = new card(j+1, suits[i]);
            }
        }
        this.deck = dec;
        console.log(this.deck);
    }

    pickCard(){
        console.log("Pick card");
        var random = Math.floor(Math.random() * 52);
        // console.log(random);
        var card = null;
        do {
            random = (random + 1) % 52;
            console.log(random);
            card = this.deck[random];
        } while (card === null)
        this.deck[random] = null;
        return card;
    }
}