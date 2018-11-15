let socket = undefined;

const addMessage = (message) => {
    const message_block = $(`
       <div class="w3-panel w3-padding">
            <h4>${message["datetime"]}</h4>
            <p class="w3">${message["text"]}</p>
       </div>
    `);
    switch (message["message_type"]) {
        case "danger":
            $(message_block).addClass("w3-red");
            break;
        default:
            $(message_block).addClass("w3-blue");
    }
    $("#alerts_container .w3-panel").addClass("w3-gray");
    $("#alerts_container").prepend(message_block);
};

const formatTimePart = (val) => {
    const valString = val + "";
    if (valString.length < 2) {
        return "0" + valString;
    } else {
        return valString;
    }
};

const upTime = (countTo) => {
    const now = new Date();
    countTo = new Date(countTo);
    const difference = (now - countTo);

    const days = Math.floor(difference/(60*60*1000*24));
    const hours = Math.floor((difference%(60*60*1000*24))/(60*60*1000));
    const mins = Math.floor(((difference%(60*60*1000*24))%(60*60*1000))/(60*1000));
    const secs = Math.floor((((difference%(60*60*1000*24))%(60*60*1000))%(60*1000))/1000);

    $("#auction_timer #days").text(formatTimePart(days));
    $("#auction_timer #hours").text(formatTimePart(hours));
    $("#auction_timer #minutes").text(formatTimePart(mins));
    $("#auction_timer #seconds").text(formatTimePart(secs));

    clearTimeout(upTime.to);
    upTime.to = setTimeout(() => {
        upTime(countTo);
    }, 1000);

};

const startPictureCountDown = (timestamp) => {
    picture_timeout = timestamp + 2;

    let interval = setInterval(() => {
        const now = new Date().getTime();
        const difference = picture_timeout - now;

        const mins = Math.floor(((difference%(60*60*1000*24))%(60*60*1000))/(60*1000));
        const secs = Math.floor((((difference%(60*60*1000*24))%(60*60*1000))%(60*1000))/1000);

        $("#picture_timer #picture_minutes").text(formatTimePart(mins));
        $("#picture_timer #picture_seconds").text(formatTimePart(secs));

        if (difference < 0) {
            clearInterval(interval);
            $("#picture_timer #picture_minutes").text('00');
            $("#picture_timer #picture_seconds").text('00');
        }

    }, 1000);
};

const startAuctionTimer = (start_time) => {
    upTime(start_time);
};



const stopAuctionTimer = () => {
    clearTimeout(upTime.to);
};

const initializeSocketConnection = (participant) => {
    socket = io.connect("http://localhost:3030");
    socket.on("init", (response) => {
        response = JSON.parse(response);
        addMessage(response.message);
        socket.json.emit("hello", JSON.stringify({
            participant: participant
        }));
    });
    socket.on("message", (response) => {
        response = JSON.parse(response);
        addMessage(response.message);
    });
    socket.on("auctionStarted", (response) => {
        response = JSON.parse(response);
        addMessage(response.message);
        startAuctionTimer(response.payload.start_time);
    });
    socket.on("pictureAuctionStarted", (response) => {
        response = JSON.parse(response);
        addMessage(response.message);
        startPictureCountDown(response.payload.timeout)
    });
    socket.on("pictureAuctionFinished", (response) => {
        response = JSON.parse(response);
        addMessage(response.message);
        if (response.payload.sold) {
            $(`.picture_card[data-id="${response.payload.painting_id}"]`).append($(`
                <div class="w3-container w3-margin-top">
                    <p>Покупатель:</p>
                    <p>${response.payload.participant.name}</p>
                </div>
            `));
        }
    });
    socket.on("auctionFinished", (response) => {
        response = JSON.parse(response);
        addMessage(response.message);
        stopAuctionTimer();
    });
    socket.on("applyCompleted", (response) => {
        response = JSON.parse(response);
        addMessage(response.message);
    });
    socket.on("changePrice", (response) => {
        response = JSON.parse(response);
        $(`.current_picture_price[data-id="${response.payload.painting_id}"]`).text(response.payload.new_price);
    });
    socket.on("changeParticipantCash", (response) => {
        response = JSON.parse(response);
        $(`.participant_cache[data-id="${response.payload.participant_id}"]`).text(response.payload.cash_reserve);
    });
};

$(document).ready(() => {
    initializeSocketConnection({
        name: "Admin"
    });
});