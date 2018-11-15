export const displayPicture = (picture) => {
    $("#current_picture").attr("src", picture.image_url);
    $("#current_picture_title").text(picture.title);
    $("#current_picture_author").text(picture.author);
    $("#current_picture_starting_price").text(picture.starting_price);
    $("#current_picture_price").text(picture.starting_price);
    $("#current_picture_min_step").text(picture.min_step);
    $("#current_picture_max_step").text(picture.max_step);
};

export const addMessage = (message) => {
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

export const formatTimePart = (val) => {
    const valString = val + "";
    if (valString.length < 2) {
        return "0" + valString;
    } else {
        return valString;
    }
};