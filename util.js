var crypto = require('crypto');

function generateSalt(){
    return crypto.randomBytes(24).toString('base64');
}

function hashEncodePassword(password, salt){
    p = password + salt;
    var output = crypto.createHash('sha256').update(p).digest('base64')

    return output;
}

function validatePassword(password, salt, hash){
    var encoded = hashEncodePassword(password, salt);
    console.log("Encoded: " + encoded);
    console.log("Saved:   " + hash);
    return hash === encoded;
}

exports.validatePassword = validatePassword;
exports.hashEncodePassword = hashEncodePassword;
exports.generateSalt = generateSalt;