const GET_PARTICIPANT_URL = '/api/get_participant';
let socket = undefined;
let current_participant_id = undefined;
const notification = new Audio('/audio/notification.mp3');
let full_timeout = undefined;

let picture_timeout = undefined;
let prev = 0;


const displayPicture = (picture) => {
    $("#current_picture").attr("src", picture.image_url);
    $("#current_picture_title").text(picture.title);
    $("#current_picture_author").text(picture.author);
    $("#current_picture_starting_price").text(picture.starting_price);
    $("#current_picture_price").text(picture.starting_price);
    $("#current_picture_min_step").text(picture.min_step);
    $("#current_picture_max_step").text(picture.max_step);
};

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
    notification.play();
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

        if (full_timeout === undefined) {
            full_timeout = difference;
        }

        prev = prev + 1000;

        updateProgress(full_timeout, prev);

        const mins = Math.floor(((difference%(60*60*1000*24))%(60*60*1000))/(60*1000));
        const secs = Math.floor((((difference%(60*60*1000*24))%(60*60*1000))%(60*1000))/1000);

        $("#picture_timer #picture_minutes").text(formatTimePart(mins));
        $("#picture_timer #picture_seconds").text(formatTimePart(secs));

        if (difference < 0) {
            clearInterval(interval);
            $("#picture_timer #picture_minutes").text('00');
            $("#picture_timer #picture_seconds").text('00');
            prev = 0;
            full_timeout = undefined;
        }

    }, 1000);
};

const updateProgress = (full_timeout, count) => {
    $("#progressbar").progressbar({value: (count / full_timeout) * 100});
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
        displayPicture(response.payload['painting']);
        $("#picture_container").fadeIn();
        $("#picture_timer_block").show();
        startPictureCountDown(response.payload.timeout);
        $("#progressbar").progressbar({value: 0});
        $("#progressbar").fadeIn();
    });
    socket.on("pictureAuctionFinished", (response) => {
        response = JSON.parse(response);
        addMessage(response.message);
        $("#picture_container").fadeOut();
        $("#progressbar").fadeOut();
    });
    socket.on("auctionFinished", (response) => {
        response = JSON.parse(response);
        addMessage(response.message);
        stopAuctionTimer();
    });
    socket.on("applyCompleted", (response) => {
        response = JSON.parse(response);
        addMessage(response.message);
        $("#apply").fadeOut();
    });
    socket.on("changePrice", (response) => {
        response = JSON.parse(response);
        $("#current_picture_price").text(response.payload.new_price);
    });
    socket.on("changeCashReserve", (response) => {
        response = JSON.parse(response);
        addMessage(response.message);
        $("#participant_cache").text(response.payload.cash_reserve);
    });
};

const connectParticipant = (participant) => {
    $("#participant_name").text(participant['name']);
    $("#participant_cache").text(participant['cash_reserve']);
    $("#participant_image").attr("src",participant['image_url']);
    initializeSocketConnection(participant);
    $("#auction_block").fadeIn();
};

$(document).ready(() => {
    $("#auction_process").resizable();
    $("#participant_modal").fadeIn();

    $("#join_auction").click(() => {
        const select_value = $("#participant_selector").val();
        current_participant_id = select_value;
        if (select_value == null) {
            return false;
        } else {
            $.ajax({
                url: GET_PARTICIPANT_URL + `?participant_id=${select_value}`,
                method: 'GET',
                success: (participant) => {
                    connectParticipant(participant);
                    $("#participant_modal").fadeOut();
                },
                error: (e) => {
                    console.log('Error: ' + e);
                }
            });
        }
    });

    $("#up_price").click(() => {
        socket.json.emit("voteNewPrice", JSON.stringify({
            payload: {
                participant_id: current_participant_id,
                new_price: $("#new_price").val()
            }
        }));
    });

    $("#logout").click(() => {
        location.reload();
    });

    $("#apply").click(() => {
        socket.json.emit("apply", JSON.stringify({
            payload: {
                participant_id: current_participant_id,
            }
        }));
    });

    $("#bought_pictures_show").click(() => {
        $.ajax({
            url: '/api/participant_pictures' + `?participant_id=${current_participant_id}`,
            method: 'GET',
            success: (response) => {
                const bought_pictures_container =  $("#bought_pictures_container");
                $(bought_pictures_container).empty();
                for (let picture of response) {
                    $(bought_pictures_container).append($(`
                        <div class="w3-panel w3-margin w3-padding w3-white">
                            <div class="w3-container">
                                <div class="w3-third">
                                    <img src="${picture.image_url}" style="height: 5vh">
                                </div>
                                <div class="w3-twothird">
                                    <p>${picture.title}</p>
                                    <p>${picture.author}</p>
                                    <p>Куплена за ${picture.current_price}</p>
                                </div>
                            </div>
                        </div>
                    `));
                }
                $("#bought_pictures_modal").fadeIn();
            },
            error: (e) => {
                console.log('Error: ' + e);
            }
        });
    });
});