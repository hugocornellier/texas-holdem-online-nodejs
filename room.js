const Player = require('./player.js')
const Card = require('./card.js')
const Deck = require('./deck.js')
const config = {
    screen_width,
    screen_height,
    player_width,
    player_height,
    end_point
} = require('./config.json')

module.exports = class room {
    constructor(p1, io) {
        this.player1 = new Player(p1)
        this.player1.turn = true
        this.player1.admin = true
        this.id = p1.room_code + p1.id
        this.deck = new Deck();
        this.cardsOnTable = []
        this.io = io
        this.players = []
        this.players.push(this.player1)
        this.moveCount = 0
        this.stage = 0
        this.updateFlop = false
        this.updateFourthSt = false
        this.updateRiver = false
    }
    init() {
        let usernames = [this.player1.username]
        this.players.forEach(p => {
            this.io.to(p.id).emit('usernames', usernames)
            this.io.to(p.id).emit('config', config)
            this.io.to(p.id).emit('initialize_game', this.players)
        })
        console.log(this.deck)
    }

    add_player(player) {
        this.players.push(new Player(player))
        let lastPlayer = this.players[this.players.length - 2]
        lastPlayer.nextPlayer = this.players.length - 1
    }

    update() {
        let status = {}
        let ids = []
        this.players.forEach(player => {
            ids.push(player.id)
            status[player.id] = player.to_trans
            if (player.msg !== "") {
                this.players.forEach(p => {
                    this.io.to(p.id).emit('user_message', player.username + ": " + player.msg)
                })
                player.msg = ""
            }
            if (this.updateFlop) {
                this.players.forEach(p => {
                    for (let i = 0; i < 3; i++) {
                        this.cardsOnTable.push(this.pullOutRandomCardFromDeck())
                    }
                    this.io.to(p.id).emit('flop', this.cardsOnTable)
                })
                this.updateFlop = false
            }
            if (this.updateFourthSt) {
                this.cardsOnTable.push(this.pullOutRandomCardFromDeck())
                this.players.forEach(p => {
                    this.io.to(p.id).emit('fourth_st', this.cardsOnTable[3])
                })
                this.updateFourthSt = false
            }
            if (this.updateRiver) {
                this.cardsOnTable.push(this.pullOutRandomCardFromDeck())
                this.players.forEach(p => {
                    this.io.to(p.id).emit('river', this.cardsOnTable[4])
                })
                this.updateRiver = false
            }
            if (player.updateCards) {
                this.io.to(player.id).emit('update_cards', player.cards)
                player.updateCards = false
            }
            if (player.updateTurn) {
                this.io.to(player.id).emit('change_turn', this.players)
                player.updateTurn = false
            }
            this.io.to(player.id).emit('update_lobby', this.players)
        })
    }

    pullOutRandomCardFromDeck() {
        return this.deck.pickCard()
    }

    disconnect(id) {
        console.log("Disconnecting")
    }

    print_room() {
        let output = "# Room ID: " + this.id
        console.log(output.red)
        this.players.forEach(p => {
            output = "# Player: " + p.username + "(" + p.id + ")"
            console.log(output.red)
        })
    }
}
