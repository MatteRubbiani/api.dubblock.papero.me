Endpoints = {
    CONNECT_TO_GAME: "connect-to-game", // -> status a me + lobby modified se status 0
    LOBBY_MODIFIED: "lobby-modified", //{players: [], currentPlayer: 0, totalTurns: 5, admin: 0}
    JOIN_GAME: "join-game",
    QUIT_GAME: "quit-game",
    CHANGE_PAWN: "change-pawn",
    CHANGE_DIFFICULTY: "change-difficulty",

    START_GAME: "start-game",
    GAME_MODIFIED: "game-modified"
}

module.exports = Endpoints