const BLANK_IMAGE = 'https://www.sdprg.com/files/images/property-default-photo.png';

export class Participant {
    constructor (name, cash_reserve, image_url=BLANK_IMAGE) {
        this.name = name;
        this.cash_reserve = cash_reserve;
        this.image_url = image_url;
    }
}