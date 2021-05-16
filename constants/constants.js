function makeId(length) {
    let result = [];
    let characters = 'abcdefghijklmnopqrstuvwxyz';
    let charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result.push(characters.charAt(Math.floor(Math.random() *
            charactersLength)));
    }
    return result.join('');
}
function getHolesForDifficulty(difficulty){
    if (difficulty <= 2) {
        return 3
    } else if (difficulty <= 4) {
        return 2
    } else if (difficulty <= 6) {
        return 1
    }
}

function getRowsForDifficulty(difficulty){
    let a = parseInt(difficulty / 2)
    return 6 + a
}

function getColumnsForDifficulty(difficulty){
    if (difficulty <= 1) {
        return 6
    } else if (difficulty <= 3) {
        return 5
    } else if (difficulty <= 5) {
        return 4
    }
    return 3
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        let temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array
}

function createBlocks(difficulty) {
    let holesPerRow = getHolesForDifficulty(difficulty)
    let rows = getRowsForDifficulty(difficulty)
    let columns = getColumnsForDifficulty(difficulty)
    let blocksPerRow = columns - holesPerRow
    let arr = []
    for (let i=0; i<columns; i++){
        if (i<blocksPerRow) arr.push(1)
        else arr.push(0)
    }
    let blocks = []
    for (let j=0; j<rows; j++){
        let b = shuffleArray(arr.slice(0))
        blocks.push(b)

    }
    return {
        blocks,
        rows,
        columns
    }
}

module.exports = {
    makeId,
    createBlocks
}