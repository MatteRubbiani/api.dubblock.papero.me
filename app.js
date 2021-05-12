const express = require('express');
const cookie = require("cookie")

const Endpoints = require("./constants/endpoints")
const ActiveUsersManager = require("./managers/activeUsers")
const ActiveGames = require("./managers/activeGames")

const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

app.use("/games", require("./routes/game"))

io.on('connection', socket => {
    socket.on(Endpoints.CONNECT_TO_GAME, async data => {
        console.log("connectionnnn")
        let cookies = socket.handshake.headers.cookie
        try {
            cookies = cookie.parse(cookies)
        } catch (e) {
            console.log(e)
            return null
        }
        let userId = cookies["userId"]
        if (!data["gameId"]) return null
        let gameId = data["gameId"].toLowerCase()
        if (!userId || !gameId) return null
        let username = cookies["username"]
        let user = new ActiveUsersManager(userId, gameId, socket.id)
        await user.saveToDb()
        let game = await ActiveGames.getActiveGameById(gameId)
        if (!game) {
            game = await ActiveGames.createActiveGame(user, gameId, username)
            await game.saveToDb()
        } else {
            game.addPlayer(userId, username)
            await game.saveToDb()
        }
        if (game.status === 0) {
            console.log(game.getGame(userId))
            await sendLobbyChangedToPlayers(game)
        }
    })

    socket.on(Endpoints.JOIN_GAME, async data => {
        let cookies = socket.handshake.headers.cookie
        try {
            cookies = cookie.parse(cookies)
        } catch (e) {
            console.log(e)
            return null
        }

        let user = await ActiveUsersManager.findActiveUserBySessionId(socket.id)
        if (!user) return null
        let game = await ActiveGames.getActiveGameById(user.gameId)
        if (!game) return null
        let username = cookies["username"]
        game.addPlayer(user.userId, username)
        await sendLobbyChangedToPlayers(game)
        await game.saveToDb()


    })

    socket.on(Endpoints.CHANGE_PAWN, async data => {
        let user = await ActiveUsersManager.findActiveUserBySessionId(socket.id)
        if (!user) return null
        let game = await ActiveGames.getActiveGameById(user.gameId)
        if (!game) return null
        game.changePawn(user.userId, data["shape"], data["color"])
        await sendLobbyChangedToPlayers(game)
        await game.saveToDb()

    })

    socket.on(Endpoints.QUIT_GAME, async () => {
        let user = await ActiveUsersManager.findActiveUserBySessionId(socket.id)
        if (!user) return null
        let game = await ActiveGames.getActiveGameById(user.gameId)
        if (!game) return null
        let s = game.removePlayer(user.userId)
        if (s === "user_deleted"){
            await sendLobbyChangedToPlayers(game)
            await game.saveToDb()
        }
    })

    socket.on(Endpoints.CHANGE_DIFFICULTY, async difficulty => {
        let user = await ActiveUsersManager.findActiveUserBySessionId(socket.id)
        if (!user) return null
        let game = await ActiveGames.getActiveGameById(user.gameId)
        if (!game) return null
        game.changeDifficulty(parseInt(difficulty))
        await sendLobbyChangedToPlayers(game)
        await game.saveToDb()

    })
    socket.on('disconnect', async () => {
        let user = await ActiveUsersManager.findActiveUserBySessionId(socket.id)
        if (!user) return null
        let game = await ActiveGames.getActiveGameById(user.gameId)
        if (game) {
            if (game.status === 0) {
                let success = game.removePlayer(user.userId)
                if (success === "delete_game") {
                    await game.deleteGame()
                    //await sendLobbyChangedToPlayers(game)
                    return 0
                }
                if (success === "user_deleted") {
                    await sendLobbyChangedToPlayers(game)
                    await game.saveToDb()
                }
            }
        }
    })
})

async function sendGameToGame(game, endpoint){
    let activeUsers = await ActiveUsersManager.getUsersByGameId(game.id)
    activeUsers.forEach(u => {
        let s = io.sockets.connected[u.sessionId]
        if (s) {
            s.emit(endpoint, game.getGame(u.userId))
        }
    })
}

async function sendLobbyChangedToPlayers(game) {
    await sendGameToGame(game, Endpoints.LOBBY_MODIFIED)
}


http.listen(3004)
