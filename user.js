module.exports = class user {
    constructor(username, password, salt){
        this.username = username
        this.password = password
        this.salt = salt
    }
}