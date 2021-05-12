function makeId(length) {
    let result           = [];
    let characters       = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let charactersLength = characters.length;
    for (let i=0; i<length; i++) {
        result.push(characters.charAt(Math.floor(Math.random() *
            charactersLength)));
    }
    return result.join('');
}
module.exports = {
    makeId
}