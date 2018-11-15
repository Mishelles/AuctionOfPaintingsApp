// @flow

const express = require('express');
const router = express.Router();

import {Auction} from '../models/auction';

const auction = new Auction();

let auction_in_progress = false;

let last_voted_participant = undefined;
let last_painting = undefined;
const participants = Object.assign({}, auction.participants);
let paintings = {};

for (let id in auction.paintings) {
    if (auction.paintings[id].participate_in_auction) {
        paintings[id] = auction.paintings[id];
        paintings[id]['sold'] = false;
    }
}

/* GET home page. */
router.get('/', function (req, res, next) {
    try {
        return res.render('index', {participants: auction.participants});
    } catch (e) {
        return res.status(404).send('Not found');
    }
});

router.get('/admin', function (req, res, next) {
    return res.render('admin', {participants: participants, paintings: paintings});
});

router.get('/api/get_participant', (req, res) => {
    const result = auction.getParticipant(req.query.participant_id);
    result['id'] = req.query.participant_id;
    return res.json(result);
});

router.get('/api/participant_pictures', (req, res) => {
    if ('bought_pictures' in participants[req.query.participant_id]) {
        return res.json(participants[req.query.participant_id].bought_pictures);
    }
    return res.json([]);
});

const io = require('socket.io').listen(3030);

const delay = (amount) => {
    return new Promise((resolve) => {
        setTimeout(resolve, amount);
    });
};

async function auctionLoop() {
    for (let key in paintings) {
        if (paintings[key].participate_in_auction) {
            last_painting = Object.assign({}, paintings[key]);
            last_painting['current_price'] = paintings[key].starting_price;
            last_painting['not_voted_yet'] = true;
            last_painting['id'] = key;
            const timeout_arr = auction.params.timeout.split(":");
            const mins = parseInt(timeout_arr[0]);
            const secs = parseInt(timeout_arr[1]);
            const timeout_millis = mins * 60000 + secs * 1000;
            const end_timeout = (new Date()).getTime() + timeout_millis;
            io.json.emit("pictureAuctionStarted", JSON.stringify({
                message: {
                    text: `Начат торг по картине "${paintings[key].title}"`,
                    message_type: "danger",
                    datetime: (new Date()).toLocaleTimeString()
                },
                payload: {
                    painting: paintings[key],
                    timeout: end_timeout
                }
            }));
            await delay(timeout_millis);
            if (last_voted_participant !== undefined) {
                const old_cash_reserve = parseInt(participants[last_voted_participant.participant_id].cash_reserve);
                participants[last_voted_participant.participant_id].cash_reserve = old_cash_reserve - parseInt(last_painting.current_price);

                if ('bought_pictures' in participants[last_voted_participant.participant_id]) {
                    participants[last_voted_participant.participant_id]['bought_pictures'].push(last_painting);
                } else {
                    participants[last_voted_participant.participant_id]['bought_pictures'] = [last_painting];
                }

                last_voted_participant.socket.json.emit("changeCashReserve", JSON.stringify({
                    message: {
                        text: `Соверешена покупка картины. Ваш баланс равен ${participants[last_voted_participant.participant_id].cash_reserve}`,
                        message_type: "default",
                        datetime: (new Date()).toLocaleTimeString()
                    },
                    payload: {
                        cash_reserve: participants[last_voted_participant.participant_id].cash_reserve,
                        participant_id: last_voted_participant.participant_id
                    }
                }));

                io.json.emit("changeParticipantCash", JSON.stringify({
                    payload: {
                        cash_reserve: participants[last_voted_participant.participant_id].cash_reserve,
                        participant_id: last_voted_participant.participant_id
                    }
                }));

                io.json.emit("pictureAuctionFinished", JSON.stringify({
                    message: {
                        text: `Окончен торг по картине "${paintings[key].title}"\n 
                            Картина продана участнику ${last_voted_participant.participant.name} по цене ${last_painting.current_price}`,
                        message_type: "danger",
                        datetime: (new Date()).toLocaleTimeString()
                    },
                    payload: {
                        sold: true,
                        participant: last_voted_participant.participant,
                        price: last_painting.current_price,
                        painting_id: last_painting.id
                    }
                }));
            } else {
                io.json.emit("pictureAuctionFinished", JSON.stringify({
                    message: {
                        text: `Окончен торг по картине "${paintings[key].title}"\n 
                           По итогу торга картина не продана`,
                        message_type: "danger",
                        datetime: (new Date()).toLocaleTimeString()
                    },
                    payload: {
                        sold: false
                    }
                }));
            }
            last_voted_participant = undefined;
        }
    }
    auction_in_progress = false;
    io.json.emit("auctionFinished", JSON.stringify({
        message: {
            text: `Аукцион окончен!`,
            message_type: "danger",
            datetime: (new Date()).toLocaleTimeString()
        }
    }));
}

setTimeout(() => {
    let start_time = new Date();
    io.json.emit("auctionStarted", JSON.stringify({
        message: {
            text: `Аукцион начался!`,
            message_type: "danger",
            datetime: start_time.toLocaleTimeString()
        },
        payload: {
            start_time: start_time
        }
    }));
    auction_in_progress = true;
    auctionLoop();

}, 10000);


io.sockets.on('connection', (socket) => {

    socket.json.emit("init", JSON.stringify({
        message: {
            text: "Вы успешно подключены к аукциону картин!",
            message_type: "default",
            datetime: (new Date()).toLocaleTimeString()
        }
    }));

    socket.on("hello", (msg) => {
        socket.broadcast.json.emit("message", JSON.stringify({
            message: {
                text: `Участник ${JSON.parse(msg)['participant']['name']} присоединился к аукциону.`,
                message_type: "default",
                datetime: (new Date()).toLocaleTimeString()
            }
        }));
    });

    socket.on("apply", (msg) => {
        const participant_id = JSON.parse(msg).payload['participant_id'];
        const participant = participants[participant_id];
        io.json.emit("applyCompleted", JSON.stringify({
            message: {
                text: `Участник ${participant.name} подал заявку.`,
                message_type: "default",
                datetime: (new Date()).toLocaleTimeString()
            }
        }));
    });

    socket.on("voteNewPrice", (msg) => {
        const response = JSON.parse(msg);
        const new_price = response.payload.new_price;
        const participant = participants[response.payload.participant_id];
        let participant_can_vote = false;

        const delta = parseInt(new_price) - parseInt(last_painting.current_price);

        if ((delta === 0) && (last_painting.not_voted_yet) && ((parseInt(new_price) <= parseInt(participant.cash_reserve)))) {
            participant_can_vote = true;
            last_painting.not_voted_yet = false;
        }

        if (!participant_can_vote) {
            if ((delta > 0) && (delta >= parseInt(last_painting.min_step)) &&
                (delta <= parseInt(last_painting.max_step)) &&
                (parseInt(new_price) <= parseInt(participant.cash_reserve))) {
                participant_can_vote = true;
            }
        }

        if (participant_can_vote) {
            last_painting.current_price = new_price;
            io.json.emit("message", JSON.stringify({
                message: {
                    text: `Участник ${participant.name} предложил новую цену ${new_price}`,
                    message_type: "default",
                    datetime: (new Date()).toLocaleTimeString()
                }
            }));
            io.json.emit("changePrice", JSON.stringify({
                payload: {
                    new_price: new_price,
                    painting_id: last_painting['id']
                }
            }));
            last_voted_participant = {
                socket: socket,
                participant: participant,
                participant_id: response.payload.participant_id
            };

        } else {
            socket.json.emit("auctionStarted", JSON.stringify({
                message: {
                    text: `Невозможно поднять цену! Укажите правильную цену и не жульничайте!`,
                    message_type: "warning",
                    datetime: (new Date()).toLocaleTimeString()
                }
            }));
        }

    });
});

module.exports = router;
