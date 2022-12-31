const express = require('express');
const fs = require('fs');
const bodyParser = require("body-parser");
const options = {
    key: fs.readFileSync('server.key'),
    cert: fs.readFileSync('server.cert'),
};
const app = express();
var https = require('https').createServer(options, app)
.listen(3000, function (req, res) {
console.log("Server started at port 3000");
});
const io = require('socket.io')(https);
//const port = process.env.PORT || 3000;


const Lobby        = require('./lobby.js')
const RoomManager  = require('./room_manager.js')
const colors       = require('colors');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(express.static('images'));
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/menu.html');
    });



//===================================================


let username = "default"
let room_code = ""
let room_codes = {}
let mode = "public"

app.get('/private/:room_code/:username', (req, res) => {
    res.sendFile(__dirname + '/game.html')
    username = req.params.username
    room_code = req.params.room_code
})

var menu_io = io.of('/menu')
menu_io.on('connection', async(socket) => {
    console.log("\n" + socket.id.cyan + " joined menu")
    let validate = 0
    let message = ""
    let login = new Promise((resolve, reject) => {
        socket.on('create_private', (username, room_code) => {
            console.log("\n# server.js received 'create_private' call".red)
            if (room_codes[room_code] >= 1) {
                message = room_code + " already exists!"
                reject(message)
            } else {
                console.log("\n# Creating new private room...".yellow)
                room_codes[room_code] = 1
                validate = 1
            }
            socket.emit('create_validation', validate, message)
        })
        socket.on('join_private', (username, room_code) => {
            let validate = 0
            let message = ""
            console.log("\n# User is attempting to join a private room...".blue)
            if (room_codes[room_code] == null) {
                console.log("# Room does not exist.".blue)
                message = room_code + " does not exist!"
                reject(message)
            }
            else if (room_codes[room_code] > 0) {
                console.log("# Room joined!".blue)
                room_codes[room_code]++
                validate = 1
            } else if (room_codes[room_code] > 3) {
                console.log("# Room is full.".blue)
                message = "Room is full!"
                reject(message)
            } else {
                console.log("# Error joining room.".blue)
            }
            socket.emit('join_validation', validate, message)
        })
        resolve(message)
    })
    mode = await login
})

var game_io = io.of('/game')
let lobby = new Lobby()
let room_manager = new RoomManager(game_io)
game_io.on('connection', (socket) => {
    console.log("\n" + socket.id.cyan + " joined game. room code:" + room_code)
    lobby.add_player(socket.id, username, room_code)
    if (room_manager.find_room(room_code)) {
        let room_to_join = room_manager.find_room(room_code)
        let new_player = lobby.private_players[room_code].shift()
        room_to_join.add_player(new_player)
        let oldID = room_to_join.id
        let newID = oldID + new_player.id
        room_manager.update_ids(oldID, newID)
    }
    else if (lobby.get_num_private_players(room_code) === 1) {
        let player1 = lobby.private_players[room_code].shift()
        room_manager.create_room(player1)
        socket.emit('init_admin')
    }

    socket.on('disconnect', () => {
        const room = room_manager.find_room(socket.id)
        if (room != null) {
            //room.disconnect(socket.id)
        }
        if (room_codes[room_code] != null) {
            delete room_codes[room_code]
            delete lobby.private_players[room_code]
        }
        lobby.remove_player(socket.id)
    })

    socket.on('fold', () => {
        const room = room_manager.find_room(socket.id)
        let user = room_manager.find_user(socket.id)
        user.folded = true
        moveTurnToNextAvailablePlayer(user, room)
        socket.emit('change_turn', room.players)
        sendMessageToAllPlayers(room, "<i>" + user.username + " has folded</i>")
    })

    socket.on('check', () => {
        const room = room_manager.find_room(socket.id)
        let user = room_manager.find_user(socket.id)
        moveTurnToNextAvailablePlayer(user, room)
        socket.emit('change_turn', room.players)
        sendMessageToAllPlayers(room, "<i>" + user.username + " has checked</i>")
    })

    socket.on('message', (msg) => {
        const room = room_manager.find_room(socket.id)
        let user = room_manager.find_user(socket.id)
        sendMessageToAllPlayers(room, user.username + ": " + msg)
    })

    socket.on('start_game', () => {
        room_manager.find_room(socket.id).init()
    })

    socket.on('get_all_users', () => {
        console.log("Fetching all users")
        console.log(lobby.private_players)
    })

    socket.on('fetchdeck', () => {
        console.log("Fetch deck")
        const room = room_manager.find_room(socket.id)
        let user = room_manager.find_user(socket.id)
        user.cards.push(room.deck.pickCard())
        user.cards.push(room.deck.pickCard())
        user.updateCards = true
        console.log("Pick card")
        // let random_val = Math.floor(Math.random() * room.deck.length)
        // user.cards.push(room.deck[random_val])
        // room.deck.splice(random_val, 1)
        // random_val = Math.floor(Math.random() * room.deck.length)
        // user.cards.push(room.deck[random_val])
        // user.cards.splice(random_val, 1)
        // user.updateCards = true
    })
})

setInterval(() => {
    room_manager.update()
}, 30)

/*
const port = process.env.PORT || 3000;
https.listen(port, () => {
    console.log("\nServer is running!".red)
})


https.createServer(options, (req, res) => {
    }).listen(port, () => {
        console.log("\nServer is running!".red)
    })

*/


function sendMessageToAllPlayers(room, msg) {
    room.players.forEach(p => {
        room.io.to(p.id).emit('user_message', msg)
    })
}

function moveTurnToNextAvailablePlayer(user, room) {
    room.moveCount++
    if (room.moveCount % room.players.length === 0) {
        room.stage++
        if (room.stage === 1) {
            room.updateFlop = true
        }
        else if (room.stage === 2) {
            room.updateFourthSt = true
        }
        else if (room.stage === 3) {
            room.updateRiver = true
        }
    }
    console.log("Move count: " + room.moveCount + ", Stage: " + room.stage)
    user.turn = false
    let nextPlayer = room.players[user.nextPlayer]
    while (nextPlayer.folded) {
        nextPlayer = room.players[nextPlayer.nextPlayer]
    }
    nextPlayer.turn = true
    nextPlayer.updateTurn = true
}