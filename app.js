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
        socket.join(gameId)
        let user = new ActiveUsersManager(userId, gameId, socket.id)
        await user.saveToDb()
        let game = await ActiveGames.getActiveGameById(gameId)
        if (!game) {
            game = await ActiveGames.createActiveGame(user, gameId)
            await game.saveToDb()
        }
        if (game.status === 0) {
            socket.emit(Endpoints.LOBBY_MODIFIED, game.getGame(userId));
        }
    })
})


function sendLobbyChangedToPlayers(game) {
    let gameUsers = game.players
    for (let i = 0; i < gameUsers.length; i++) {
        let player = gameUsers[i]
        let s = io.sockets.connected[player.sessionId]
        if (s) {
            s.emit(Endpoints.LOBBY_MODIFIED, game.getGame(player.id))
        }
    }
}


http.listen(3004)
