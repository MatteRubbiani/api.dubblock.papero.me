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

    getGame(userId) {
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
            players = this.getPlayers(userId, false) //aggiungi revelation
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

        let g = {
            status: this.status,
            obstacles: blocks,
            players: players,
            localId: this.getUserByUserId(userId) ? this.getUserByUserId(userId).localId : null,
            settings: {
                difficulty: this.difficulty,
                rows: this.rows,
                columns: this.columns
            }

        }
        return g
    }

    getPlayers(userId, revelation = false) {
        let players = []
        this.players.forEach(p => {
            let col = null
            if (p.id === userId) col = p.column
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
        this.players.forEach(p => {
            p.row = 0
            p.column = Math.floor(Math.random() * this.columns)
            p.playing = false
        })
        this.players[0].playing = true
        this.rows = blocks.rows
        this.columns = blocks.columns
    }

    changeUserOnline(userId, online) {
        this.players.forEach(player => {
            if (player) if (player.id === userId) player.online = online
        })
    }

    nextTurn() {
        let n = 0
        for (let p = 0; p < this.players.length; p++) {
            if (this.players[p].playing) n = p;
            this.players[p].playing = false
        }
        n = (n + 1) % this.players.length
        this.players[n].playing = true

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