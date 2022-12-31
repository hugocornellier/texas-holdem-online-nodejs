const Room = require('./room.js')
module.exports = class room_manager {
    constructor(io) {
        this.rooms = {}
        this.num_rooms = 0
        this.io = io
    }

    update_ids(old_id, new_id) {
        for (let id in this.rooms) {
            if (id.includes(old_id) === true) {
                this.rooms[new_id] = this.rooms[old_id]
            }
        }


        for (let id in this.rooms) {
            if (id.includes(old_id) === true) {

            }
        }
    }

    create_room(p1) {
        console.log("\n# Creating room...".blue)
        let to_add = new Room(p1, this.io)
        this.rooms[to_add.id] = to_add
        let output = "# Success! (room ID: " + to_add.id + ")"
        console.log(output.blue)
        this.num_rooms++
    }

    update() {
        for (let id in this.rooms) {
            this.rooms[id].update()
        }
    }

    find_room(to_find) {
        let room = {}
        for (let id in this.rooms) {
            if (id.includes(to_find) === true) {
                room = this.rooms[id]
                return room
            }
        }
    }

    find_user(to_find) {
        let p = ""
        for (let id in this.rooms) {
            if (id.includes(to_find) === true) {
                let room = this.rooms[id]
                let players = room.players
                players.forEach(player => {
                    if (player.id === to_find) {
                        p = player
                    }
                })
            }
        }
        return p
    }
}
