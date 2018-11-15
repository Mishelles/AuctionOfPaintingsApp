import {Painting} from "./painting";
import {Participant} from "./participant";
import fs from 'fs';
import moment from 'moment';

const FILENAME = 'database.json';

export class Auction {

    constructor() {
        let instance = {};
        try {
            instance = JSON.parse(fs.readFileSync(FILENAME));
            this.participants = instance['participants'];
            this.paintings = instance['paintings'];
            this.params = instance['params'];
        } catch (e) {
            console.log('An error occurred while reading the file.');
        }
    }

    static generateId() {
        return (Math.random().toString(16).slice(2) + (new Date()).getTime()).toString();
    }

    addPainting(title, author, description, starting_price, min_step, max_step, image_url ) {
        let new_painting = new Painting(title, author, description, starting_price, min_step, max_step, image_url);
        this.paintings[Auction.generateId()] = new_painting;
        this.save();
    }

    editPainting(painting_id, props) {
        let painting = this.paintings[painting_id];
        if (painting !== undefined) {
            for (let property in props) {
                if ((property in painting) && (props[property] !== "")) {
                    painting[property] = props[property];
                }
            }
            this.paintings[painting_id] = painting;
            this.save();
        }
    }

    removePainting(painting_id) {
        if (painting_id in this.paintings) {
            delete this.paintings[painting_id];
            this.save();
        }
    }

    getPainting(painting_id) {
        return this.paintings[painting_id];
    }

    putUpPaintingForAuction(painting_id) {
        if (painting_id in this.paintings) {
            this.paintings[painting_id].participate_in_auction = true;
            this.save();
            return true;
        }
        return false;
    }

    withdrawPaintingFromAuction(painting_id) {
        if (painting_id in this.paintings) {
            this.paintings[painting_id].participate_in_auction = false;
            this.save();
            return true
        }
        return false;
    }

    addParticipant(name, image_url, cash_reserve) {
        let new_participant = undefined;
        if (image_url === "") {
            new_participant = new Participant(name, cash_reserve);
        } else {
            new_participant = new Participant(name, cash_reserve, image_url);
        }
        this.participants[Auction.generateId()] = new_participant;
        this.save();
    }

    editParticipant(participant_id, props) {
        let participant = this.participants[participant_id];
        if (participant !== undefined) {
            for (let property in props) {
                console.log(property);
                if (property in participant) {
                    participant[property] = props[property];
                }
            }
            this.participants[participant_id] = participant;
            this.save();
        }
    }

    removeParticipant(participant_id) {
        if (participant_id in this.participants) {
            delete this.participants[participant_id];
            this.save();
        }
    }

    getParticipant(participant_id) {
        return this.participants[participant_id];
    }

    setStartDateTime(datetime) {
        this.params['datetime'] = datetime;
        this.save()
    }

    setSaleTimeout(millis) {
        this.params['timeout'] = millis;
        this.save();
    }

    setCountingTime(millis) {
        this.params['counting_time'] = millis;
    }

    setPause(millis) {
        this.params['pause'] = millis;
        this.save();
    }

    getStartDatetime() {
        return moment(new Date(parseInt(this.params.datetime))).format('YYYY-MM-DDTHH:mm');
    }

    getParams() {
        return {
            datetime: this.getStartDatetime(),
            timeout: this.params.timeout,
            pause: this.params.pause,
            interval: this.params.counting_time
        }
    }

    save() {
        fs.writeFile(FILENAME, JSON.stringify(this), (err) => {
            if (err) throw err;
            console.log('The file has been saved!');
        });
    }
}