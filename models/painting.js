const BLANK_IMAGE = 'https://www.sdprg.com/files/images/property-default-photo.png';

export class Painting {
    constructor(title, author, description, starting_price, min_step, max_step, image_url=BLANK_IMAGE) {
        this.title = title;
        this.author = author;
        this.description = description;
        this.image_url = image_url;
        this.starting_price = starting_price;
        this.min_step = min_step;
        this.max_step = max_step;
        this.participate_in_auction = false;
    }

    putUpForAuction() {
        this.participate_in_auction = true;
    }

    withdrawFromAuction() {
        this.participate_in_auction = false;
    }
}
