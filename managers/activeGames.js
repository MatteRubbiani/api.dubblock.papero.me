const GameModel = require("../models/Game")
const createBlocks = require("../constants/constants").createBlocks

class ActiveGamePlayers {
    constructor(playerDict) {
        this.id = playerDict.id
        this.color = playerDict.color
        this.shape = playerDict.shape
        this.localId = playerDict.localId
        this.online = playerDict.online
        this.username = playerDict.username
        this.admin = playerDict.admin
        this.row = playerDict.row
        this.column = playerDict.column
        this.playing = playerDict.playing
        this.earthquake = playerDict.earthquake
        this.revelation = playerDict.revelation
    }
}

class ActiveGames {
    constructor(gameDict) {
        this.id = gameDict.id
        this.adminUserId = gameDict.adminUserId
        this.status = gameDict.status
        this.difficulty = gameDict.difficulty
        this.createdAt = gameDict.createdAt
        this.players = []
        for (let i = 0; i < gameDict.players.length; i++) {
            let p = new ActiveGamePlayers(gameDict.players[i])
            this.players.push(p)
        }
        this.blocks = gameDict.blocks
        this.rows = gameDict.rows
        this.columns = gameDict.columns
    }

    getGame(userId, revelation=false) {
        let players = []
        let blocks = []
        if (this.status === 0) {
            this.players.forEach(p => {
                players.push(
                    {
                        localId: p.localId,
                        username: p.username,
                        shape: p.shape,
                        color: p.color,
                        admin: p.admin,
                    }
                )
            })
        } else if (this.status === 1) {
            players = this.getPlayers(userId, revelation)
            for (let r = 0; r < this.blocks.length; r++) {
                let row = this.blocks[r]
                for (let c = 0; c < row.length; c++) {
                    if (row[c] !== 0) blocks.push({
                        row: r,
                        column: c
                    })
                }
            }
        }
        let player = null
        this.players.forEach(p => {
            if (p.id === userId) player = p
        })
        let g = {
            status: this.status,
            obstacles: blocks,
            players: players,
            localId: this.getUserByUserId(userId) ? this.getUserByUserId(userId).localId : null,
            settings: {
                difficulty: this.difficulty,
                rows: this.rows,
                columns: this.columns,
                earthquake: player ? player.earthquake : null,
                revelation: player ? player.revelation : null
            }

        }
        return g
    }

    getPlayers(userId, revelation = false) {
        let players = []
        this.players.forEach(p => {
            let col = null
            if (p.id === userId || p.row === -1) col = p.column
            if (revelation) col = p.column
            let player = {
                localId: p.localId,
                username: p.username,
                shape: p.shape,
                color: p.color,
                admin: p.admin,
                online: p.online,
                playing: p.playing,
                row: p.row,
                column: col
            }
            players.push(player)
        })
        return players
    }

    getUserByUserId(userId) {
        let p = null
        this.players.forEach(player => {
            if (player.id === userId) p = player
        })
        return p
    }

    addPlayer(userId, username) {
        if (this.getUserByUserId(userId)) return null
        let sp = this.getFirstAvailableShapeAndColor()
        let p = {
            id: userId,
            localId: Date.now(),
            username: username,
            shape: sp[0],
            color: sp[1],
            admin: false,
            online: true
        }
        this.players.push(p)
    }

    getFirstAvailableShapeAndColor() {
        for (let s = 0; s < 4; s++) {
            for (let c = 0; c < 4; c++) {
                let av = true
                for (let i = 0; i < this.players.length; i++) {
                    if (this.players[i].shape === s && this.players[i].color === c) av = false
                }
                if (av) return [s, c]
            }
        }
    }

    removePlayer(userId) {
        let newPlayers = []
        this.players.forEach(p => {
            if (p.id !== userId) {
                newPlayers.push(p)
            }
        })
        if (newPlayers.length <= 0) return "delete_game"
        let player = this.getUserByUserId(userId)
        if (player.admin) newPlayers[0].admin = true
        this.players = newPlayers
        return "user_deleted"
    }

    checkAvailablePawn(shape, color) {
        let available = true
        this.players.forEach(p => {
            if (p.shape === shape && p.color === color) available = false
        })
        return available
    }

    changePawn(userId, shape, color) {
        if (this.checkAvailablePawn(shape, color)) {
            for (let i = 0; i < this.players.length; i++) {
                let p = this.players[i]
                if (p.id === userId) {
                    p.shape = shape
                    p.color = color
                }
            }
            return true
        }
        return false
    }

    changeDifficulty(diff) {
        this.difficulty = diff
    }

    startGame() {
        this.status = 1
        let blocks = createBlocks(this.difficulty)
        this.blocks = blocks.blocks
        this.rows = blocks.rows
        this.columns = blocks.columns
        this.players.forEach(p => {
            p.row = 0
            p.column = Math.floor(Math.random() * this.columns);
            p.playing = false
            p.earthquake = 0
            p.revelation = 0
        })
        this.players[0].playing = true
    }

    changeUserOnline(userId, online) {
        this.players.forEach(player => {
            if (player) if (player.id === userId) player.online = online
        })
    }

    nextTurn() {
        if (this.gameEnded()) return null
        let i = 0
        for (let p = 0; p < this.players.length; p++) {
            if (this.players[p].playing) {
                i = p
            }
        }
        this.players.forEach(p => {
            p.playing = false
        })
        i = (i + 1) % this.players.length
        while (this.players[i].row === -1) {
            i = (i + 1) % this.players.length
        }
        this.players[i + 1].playing = true
    }
    gameEnded(){
        let not_finished = 0
        this.players.forEach(p => {
            if (p.row !== -1) not_finished ++
        })
        return not_finished > 1
    }

    movePawn(userId, row, column) {
        this.players.forEach(p => {
            if (p.id === userId && p.playing) {
                p.row = row
                p.column = column
            }
        })
        this.nextTurn()
    }

    moveBlock(fromR, fromC, toR, toC) {
        if (this.blocks[fromR][fromC] === 1) {
            if (this.blocks[toR][toC] === 0) {
                this.blocks[toR][toC] = 1
                this.blocks[fromR][fromC] = 0
            }
        }
        this.nextTurn()
    }

    earthquake(userId){
        for (let i=0; i<this.players.length; i++){
            let p = this.players[i]
            if (p.id === userId){
                if (p.earthquake < 1){
                    let blocks = createBlocks(this.difficulty)
                    this.blocks = blocks.blocks
                    p.earthquake += 1
                    this.nextTurn()
                    return true
                }
            }
        }
        return false
    }

    reveal(userId){
        for (let i=0; i<this.players.length; i++){
            let p = this.players[i]
            if (p.id === userId){
                if (p.revelation < 2){
                    p.revelation += 1
                    this.nextTurn()
                    return this.getGame(userId, true)
                }
            }
        }
        return null
    }

    async saveToDb() {
        let d = {
            id: this.id,
            status: this.status,
            blocks: this.blocks,
            difficulty: this.difficulty,
            createdAt: this.createdAt,
            players: this.players,
            rows: this.rows,
            columns: this.columns
        }
        await GameModel.replaceOne({id: this.id}, d, {upsert: true})
    }

    async deleteGame() {
        await GameModel.remove({id: this.id})
    }

    static async getActiveGameById(gameId) {
        let game = await GameModel.findOne({id: gameId}, (err, game) => {
            return game
        }).exec()
        if (!game) return null
        let g = await new ActiveGames(game);
        return g
    }

    static async createActiveGame(activeUser, gameId, username) {
        const dict = {
            id: gameId,
            status: 0,
            blocks: [],
            players: [
                {
                    id: activeUser.userId,
                    sessionId: activeUser.sessionId,
                    localId: 0,
                    online: true,
                    username: username,
                    shape: 1,
                    color: 1,
                    admin: true

                }
            ],
            difficulty: 0
        }
        let g = new ActiveGames(dict)
        return g
    }
}

module.exports = ActiveGames