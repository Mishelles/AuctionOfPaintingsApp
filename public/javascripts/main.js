/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./public/javascripts/index.js");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./public/javascripts/index.js":
/*!*************************************!*\
  !*** ./public/javascripts/index.js ***!
  \*************************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("const GET_PARTICIPANT_URL = '/api/get_participant';\nlet socket = undefined;\nlet current_participant_id = undefined;\nconst notification = new Audio('/audio/notification.mp3');\nlet full_timeout = undefined;\n\nlet picture_timeout = undefined;\nlet prev = 0;\n\nconst displayPicture = (picture) => {\n    $(\"#current_picture\").attr(\"src\", picture.image_url);\n    $(\"#current_picture_title\").text(picture.title);\n    $(\"#current_picture_author\").text(picture.author);\n    $(\"#current_picture_starting_price\").text(picture.starting_price);\n    $(\"#current_picture_price\").text(picture.starting_price);\n    $(\"#current_picture_min_step\").text(picture.min_step);\n    $(\"#current_picture_max_step\").text(picture.max_step);\n};\n\nconst addMessage = (message) => {\n    const message_block = $(`\n       <div class=\"w3-panel w3-padding\">\n            <h4>${message[\"datetime\"]}</h4>\n            <p class=\"w3\">${message[\"text\"]}</p>\n       </div>\n    `);\n    switch (message[\"message_type\"]) {\n        case \"danger\":\n            $(message_block).addClass(\"w3-red\");\n            break;\n        default:\n            $(message_block).addClass(\"w3-blue\");\n    }\n    $(\"#alerts_container .w3-panel\").addClass(\"w3-gray\");\n    notification.play();\n    $(\"#alerts_container\").prepend(message_block);\n};\n\nconst formatTimePart = (val) => {\n    const valString = val + \"\";\n    if (valString.length < 2) {\n        return \"0\" + valString;\n    } else {\n        return valString;\n    }\n};\n\nconst upTime = (countTo) => {\n    const now = new Date();\n    countTo = new Date(countTo);\n    const difference = (now - countTo);\n\n    const days = Math.floor(difference/(60*60*1000*24));\n    const hours = Math.floor((difference%(60*60*1000*24))/(60*60*1000));\n    const mins = Math.floor(((difference%(60*60*1000*24))%(60*60*1000))/(60*1000));\n    const secs = Math.floor((((difference%(60*60*1000*24))%(60*60*1000))%(60*1000))/1000);\n\n    $(\"#auction_timer #days\").text(formatTimePart(days));\n    $(\"#auction_timer #hours\").text(formatTimePart(hours));\n    $(\"#auction_timer #minutes\").text(formatTimePart(mins));\n    $(\"#auction_timer #seconds\").text(formatTimePart(secs));\n\n    clearTimeout(upTime.to);\n    upTime.to = setTimeout(() => {\n        upTime(countTo);\n    }, 1000);\n\n};\n\nconst startPictureCountDown = (timestamp) => {\n    picture_timeout = timestamp + 2;\n\n    let interval = setInterval(() => {\n        const now = new Date().getTime();\n        const difference = picture_timeout - now;\n\n        if (full_timeout === undefined) {\n            full_timeout = difference;\n        }\n\n        prev = prev + 1000;\n\n        updateProgress(full_timeout, prev);\n\n        const mins = Math.floor(((difference%(60*60*1000*24))%(60*60*1000))/(60*1000));\n        const secs = Math.floor((((difference%(60*60*1000*24))%(60*60*1000))%(60*1000))/1000);\n\n        $(\"#picture_timer #picture_minutes\").text(formatTimePart(mins));\n        $(\"#picture_timer #picture_seconds\").text(formatTimePart(secs));\n\n        if (difference < 0) {\n            clearInterval(interval);\n            $(\"#picture_timer #picture_minutes\").text('00');\n            $(\"#picture_timer #picture_seconds\").text('00');\n            prev = 0;\n            full_timeout = undefined;\n        }\n\n    }, 1000);\n};\n\nconst updateProgress = (full_timeout, count) => {\n    $(\"#progressbar\").progressbar({value: (count / full_timeout) * 100});\n};\n\nconst startAuctionTimer = (start_time) => {\n    upTime(start_time);\n};\n\n\n\nconst stopAuctionTimer = () => {\n    clearTimeout(upTime.to);\n};\n\nconst initializeSocketConnection = (participant) => {\n    socket = io.connect(\"http://localhost:3030\");\n    socket.on(\"init\", (response) => {\n        response = JSON.parse(response);\n        addMessage(response.message);\n        socket.json.emit(\"hello\", JSON.stringify({\n            participant: participant\n        }));\n    });\n    socket.on(\"message\", (response) => {\n        response = JSON.parse(response);\n        addMessage(response.message);\n    });\n    socket.on(\"auctionStarted\", (response) => {\n        response = JSON.parse(response);\n        addMessage(response.message);\n        startAuctionTimer(response.payload.start_time);\n    });\n    socket.on(\"pictureAuctionStarted\", (response) => {\n        response = JSON.parse(response);\n        addMessage(response.message);\n        displayPicture(response.payload['painting']);\n        $(\"#picture_container\").fadeIn();\n        $(\"#picture_timer_block\").show();\n        startPictureCountDown(response.payload.timeout);\n        $(\"#progressbar\").progressbar({value: 0});\n        $(\"#progressbar\").fadeIn();\n    });\n    socket.on(\"pictureAuctionFinished\", (response) => {\n        response = JSON.parse(response);\n        addMessage(response.message);\n        $(\"#picture_container\").fadeOut();\n        $(\"#progressbar\").fadeOut();\n    });\n    socket.on(\"auctionFinished\", (response) => {\n        response = JSON.parse(response);\n        addMessage(response.message);\n        stopAuctionTimer();\n    });\n    socket.on(\"applyCompleted\", (response) => {\n        response = JSON.parse(response);\n        addMessage(response.message);\n        $(\"#apply\").fadeOut();\n    });\n    socket.on(\"changePrice\", (response) => {\n        response = JSON.parse(response);\n        $(\"#current_picture_price\").text(response.payload.new_price);\n    });\n    socket.on(\"changeCashReserve\", (response) => {\n        response = JSON.parse(response);\n        addMessage(response.message);\n        $(\"#participant_cache\").text(response.payload.cash_reserve);\n    });\n};\n\nconst connectParticipant = (participant) => {\n    $(\"#participant_name\").text(participant['name']);\n    $(\"#participant_cache\").text(participant['cash_reserve']);\n    $(\"#participant_image\").attr(\"src\",participant['image_url']);\n    initializeSocketConnection(participant);\n    $(\"#auction_block\").fadeIn();\n};\n\n$(document).ready(() => {\n    $(\"#auction_process\").resizable();\n    $(\"#participant_modal\").fadeIn();\n\n    $(\"#join_auction\").click(() => {\n        const select_value = $(\"#participant_selector\").val();\n        current_participant_id = select_value;\n        if (select_value == null) {\n            return false;\n        } else {\n            $.ajax({\n                url: GET_PARTICIPANT_URL + `?participant_id=${select_value}`,\n                method: 'GET',\n                success: (participant) => {\n                    connectParticipant(participant);\n                    $(\"#participant_modal\").fadeOut();\n                },\n                error: (e) => {\n                    console.log('Error: ' + e);\n                }\n            });\n        }\n    });\n\n    $(\"#up_price\").click(() => {\n        socket.json.emit(\"voteNewPrice\", JSON.stringify({\n            payload: {\n                participant_id: current_participant_id,\n                new_price: $(\"#new_price\").val()\n            }\n        }));\n    });\n\n    $(\"#logout\").click(() => {\n        location.reload();\n    });\n\n    $(\"#apply\").click(() => {\n        socket.json.emit(\"apply\", JSON.stringify({\n            payload: {\n                participant_id: current_participant_id,\n            }\n        }));\n    });\n\n    $(\"#bought_pictures_show\").click(() => {\n        $.ajax({\n            url: '/api/participant_pictures' + `?participant_id=${current_participant_id}`,\n            method: 'GET',\n            success: (response) => {\n                const bought_pictures_container =  $(\"#bought_pictures_container\");\n                $(bought_pictures_container).empty();\n                for (let picture of response) {\n                    $(bought_pictures_container).append($(`\n                        <div class=\"w3-panel w3-margin w3-padding w3-white\">\n                            <div class=\"w3-container\">\n                                <div class=\"w3-third\">\n                                    <img src=\"${picture.image_url}\" style=\"height: 5vh\">\n                                </div>\n                                <div class=\"w3-twothird\">\n                                    <p>${picture.title}</p>\n                                    <p>${picture.author}</p>\n                                    <p>Куплена за ${picture.current_price}</p>\n                                </div>\n                            </div>\n                        </div>\n                    `));\n                }\n                $(\"#bought_pictures_modal\").fadeIn();\n            },\n            error: (e) => {\n                console.log('Error: ' + e);\n            }\n        });\n    });\n});\n\n//# sourceURL=webpack:///./public/javascripts/index.js?");

/***/ })

/******/ });