const gameConfig = require("../constants/gameConfig")
const GameModel = require("../models/Game")

class ActiveGamePlayers {
    constructor(playerDict) {
        this.id = playerDict.id
        this.color = playerDict.color
        this.shape = playerDict.shape
        this.position = playerDict.position
        this.localId = playerDict.localId
        this.status = playerDict.status
        this.username = playerDict.username
        this.admin = playerDict.admin
        //agiungerai effetti speciali
    }
}

class ActiveGames {
    constructor(gameDict) {
        this.id = gameDict.id
        this.adminUserId = gameDict.adminUserId
        this.status = gameDict.status
        this.map = gameDict.map
        this.difficulty = gameDict.difficulty
        this.createdAt = gameDict.createdAt
        this.players = []
        for (let i = 0; i < gameDict.players.length; i++) {
            let p = new ActiveGamePlayers(gameDict.players[i])
            this.players.push(p)
        }
    }

    getGame(userId) {
        let players = []
        this.players.forEach(p => {
            players.push(
                {
                    localId: p.localId,
                    username: p.username,
                    shape: p.shape,
                    color: p.color,
                    admin: p.admin,
                    status: p.status,
                }
            )
        })
        let g = {
            status: this.status,
            map: this.map,
            players: players,
            localId: this.getUserByUserId(userId) ? this.getUserByUserId(userId).localId : null,
            settings: {
                difficulty: this.difficulty
            }

        }
        return g
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
            admin: false
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

    changeDifficulty(diff){
        this.difficulty = diff
    }


    async saveToDb() {
        let d = {
            id: this.id,
            status: this.status,
            map: this.map,
            difficulty: this.difficulty,
            createdAt: this.createdAt,
            players: this.players,
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
            map: [], //create map ...
            players: [
                {
                    id: activeUser.userId,
                    sessionId: activeUser.sessionId,
                    localId: 0,
                    status: 0,
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