module.exports = class player {
    constructor(info) {
        this.gold = 500
        this.msg = ""
        this.username = info.username
        this.id = info.id
        this.cards = []
        this.updateCards = false
        this.turn = false
        this.updateTurn = false
        this.admin = false
        this.folded = false
        this.nextPlayer = 0  // By default, it's 0 so the last player links back to the first
    }
}