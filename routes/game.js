const express = require('express');
const router = express.Router();
const {makeId} = require("../constants/constants")
const Games = require("../managers/activeGames")

/* GET users listing. */
router.get('/getNewId', async function(req, res, next) {
    let id = makeId()
    while (await Games.getActiveGameById(id)){
        id = makeId()
    }
    res.send(id);
});

module.exports = router;