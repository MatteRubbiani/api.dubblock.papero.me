const gameConfig = require("../constants/gameConfig")
const GameModel = require("../models/Game")

class ActiveGamePlayers{
    constructor(playerDict) {
        this.id = playerDict.id
        this.color = playerDict.color
        this.shape = playerDict.shape
        this.position = playerDict.position
        this.localId = playerDict.localId
        this.status = playerDict.status
        this.username = playerDict.username
        //agiungerai effetti speciali
    }
}

class ActiveGames{
    constructor(gameDict) {
        this.id = gameDict.id
        this.adminUserId = gameDict.adminUserId
        this.status = gameDict.status
        this.map = gameDict.map
        this.difficulty = gameDict.difficulty
        this.createdAt = gameDict.createdAt
        this.players = []
        for (let i=0; i<gameDict.players.length; i++){
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


    async saveToDb(){
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

    async deleteGame(){
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

    static async createActiveGame(activeUser, gameId, username){
        const dict = {
            id : gameId,
            status : 0,
            map: [], //create map ...
            players: [
                {
                    id: activeUser.userId,
                    sessionId: activeUser.sessionId,
                    localId: 0,
                    status: 1,
                    username: username,
                    shape: 1,
                    color: 1,
                    admin: true

                }
            ]
        }
        let g = new ActiveGames(dict)
        return g
    }
}

module.exports = ActiveGames