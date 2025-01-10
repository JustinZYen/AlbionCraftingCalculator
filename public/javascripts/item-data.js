import { DateEnum, Item } from "./classes/item.js";
import { reverseCity } from "./globals/constants.js";
import { nameToId, patchData } from "./external-data.js";
class ItemData {
    // HashMap of all Items so far (for saving prices)
    // Uses priceIds as keys
    checkedItems = new Set();
    items = new Map();
    /**
     * Loads prices for items that have not had their prices loaded yet
     * @param ids
     */
    async getProfits(ids) {
        // Set containing all strings for which prices need to be determined
        let uncheckedItems = new Map();
        // Stack containing items that still need to be determined whether a price check is needed
        let itemStack = [];
        // Set up stack with all items in ids array
        for (const priceId of ids) {
            itemStack.push(new Item(priceId, this.items));
        }
        while (itemStack.length > 0) {
            const currentItem = itemStack.pop();
            // console.log(`current item: ${currentItem}`);
            // If current item is not in checked or unchecked items
            if (!this.checkedItems.has(currentItem)) {
                //console.log(`currentItem: ${typeof currentItem}`);
                for (const recipe of currentItem.recipes) {
                    for (const resource of recipe.getResources()) {
                        itemStack.push(resource.item);
                    }
                }
                uncheckedItems.set(currentItem.priceId, currentItem);
                this.items.set(currentItem.priceId, currentItem);
                this.checkedItems.add(currentItem);
            }
        }
        //console.log(uncheckedItems)
        console.log("setting prices");
        await this.#setPrices(uncheckedItems);
        //getAveragePrices();
    }
    /**
     *
     * @param uncheckedItems A Map containing price ids and Items for all items for which prices have not yet been calculated
     * @returns
     */
    async #setPrices(uncheckedItems) {
        const PRICE_URL_START = "https://west.albion-online-data.com/api/v2/stats/history/";
        const PRICE_URL_END_OLD = await this.#previousDateString() + "&locations=0007,1002,2004,3005,3008,4002,5003&time-scale=";
        const PRICE_URL_END_NEW = await this.#currentDateString() + "&locations=0007,1002,2004,3005,3008,4002,5003&time-scale=";
        const MAX_URL_LENGTH = 4096;
        // Note: Missing time scale so that I can test out all 3 possible timescales
        let currentItemString = "";
        let index = 0;
        const promises = [];
        for (const [currentPriceId, currentItem] of uncheckedItems) {
            // Check if more prices can fit into current URL
            if (currentItemString.length + currentPriceId.length < MAX_URL_LENGTH) {
                if (currentItemString.length == 0) {
                    currentItemString = currentPriceId;
                }
                else {
                    currentItemString += ("," + currentPriceId);
                }
            }
            else {
                promises.push(...this.#getPrices(PRICE_URL_START + currentItemString + PRICE_URL_END_OLD, DateEnum.OLD));
                promises.push(...this.#getPrices(PRICE_URL_START + currentItemString + PRICE_URL_END_NEW, DateEnum.NEW));
                currentItemString = currentItem.id;
            }
            index++;
        }
        if (currentItemString === "") {
            console.log("No more new prices to collect.");
            return;
        }
        promises.push(...this.#getPrices(PRICE_URL_START + currentItemString + PRICE_URL_END_OLD, DateEnum.OLD));
        promises.push(...this.#getPrices(PRICE_URL_START + currentItemString + PRICE_URL_END_NEW, DateEnum.NEW));
        await Promise.all(promises);
        uncheckedItems.clear();
    }
    /**
     *
     * @param priceURL URL needed for api, not including timescale
     * @param timeSpan OLD or NEW, representing previous patch or current patch, respectively
     * @returns An array of Promises representing each currently active price fetch
     */
    #getPrices(priceURL, timeSpan) {
        function fixLocation(initialLocation) {
            let cityString;
            if (initialLocation == "5003") {
                cityString = "Brecilien";
            }
            else {
                cityString = initialLocation;
            }
            const resultCity = reverseCity[cityString];
            if (resultCity == undefined) {
                throw `city string ${initialLocation} could not match any of the saved city names`;
            }
            else {
                return resultCity;
            }
        }
        console.log("Price url: " + priceURL);
        const timescales = [1, 6, 24];
        const promises = [];
        for (const timescale of timescales) {
            const priceContents = fetch(priceURL + timescale).then((response) => {
                return response.json();
            }).then((priceContentsJSON) => {
                // Check timescale and update prices if timescale is higher
                for (const currentItem of priceContentsJSON) {
                    const currentPriceId = currentItem.item_id;
                    let targetItem;
                    if (!this.items.has(currentPriceId)) {
                        console.log("priceId " + currentPriceId + " was not added to checkedItems");
                        targetItem = new Item(currentPriceId, this.items);
                        this.items.set(currentPriceId, targetItem);
                    }
                    else {
                        targetItem = this.items.get(currentPriceId);
                    }
                    // Get prices; set to appropriate location
                    const location = fixLocation(currentItem["location"]);
                    const quality = currentItem["quality"];
                    //console.log("target item: "+targetItem);
                    const priceInfo = targetItem.priceInfos.get(timeSpan);
                    if (quality <= 2) {
                        if (!priceInfo.priceQualities.has(location) || quality >= priceInfo.priceQualities.get(location)) {
                            // add price if timescale is better
                            const data = currentItem["data"];
                            // Find timescale difference
                            const startDate = data[0]["timestamp"];
                            const endDate = data[data.length - 1]["timestamp"];
                            const timescale = (Date.parse(endDate) - Date.parse(startDate));
                            // console.log(`start date: ${startDate}, end date: ${endDate}`);
                            if (!priceInfo.priceTimescale.has(location) || timescale > priceInfo.priceTimescale.get(location)) {
                                let total = 0;
                                for (const timestampData of data) {
                                    total += timestampData["avg_price"];
                                }
                                const average = total / data.length;
                                //console.log("average: "+average);
                                priceInfo.price.set(location, average);
                                //console.log("Updating with new prices")
                            }
                            // Find timescale
                        }
                    }
                }
            });
            promises.push(priceContents);
            //console.log("Done with timescale " + timescale);
        }
        return promises;
    }
    async #previousDateString() {
        const previousPatchDateDate = new Date(patchData.previousPatchDate);
        const previousPatchDateString = previousPatchDateDate.getUTCFullYear() + "-" +
            (previousPatchDateDate.getUTCMonth() + 1) + "-" +
            (previousPatchDateDate.getUTCDate());
        const currentPatchDate = new Date(patchData.currentPatchDate);
        const patchDateString = currentPatchDate.getUTCFullYear() + "-" +
            (currentPatchDate.getUTCMonth() + 1) + "-" +
            (currentPatchDate.getUTCDate());
        return this.#dateString(previousPatchDateString, patchDateString);
    }
    async #currentDateString() {
        const currentPatchDate = new Date(patchData.currentPatchDate);
        const patchDateString = currentPatchDate.getUTCFullYear() + "-" +
            (currentPatchDate.getUTCMonth() + 1) + "-" +
            (currentPatchDate.getUTCDate());
        const currentDateDate = new Date();
        const currentDateString = currentDateDate.getUTCFullYear() + "-" +
            (currentDateDate.getUTCMonth() + 1) + "-" +
            (currentDateDate.getUTCDate());
        return this.#dateString(patchDateString, currentDateString);
    }
    #dateString(startDate, endDate) {
        return "?date=" + startDate + "&end_date=" + endDate;
    }
    /**
     *
     * @param {String} itemName
     * @returns An array containing item ids of all weapons that share the name in the tree
     */
    static async getItemIds(itemName) {
        const MIN_TIER = 4;
        const MAX_TIER = 8;
        let ids = structuredClone(nameToId[itemName]);
        ids.forEach((element, _, array) => {
            const secondValue = parseInt(element.charAt(1));
            if (element.charAt(0) === "T" && !Number.isNaN(secondValue)) {
                // Current item has different tiers since it is T-some number
                const stringRemainder = element.slice(2);
                for (let i = MIN_TIER; i <= MAX_TIER; i++) {
                    if (i != secondValue) {
                        array.push("T" + i + stringRemainder);
                    }
                }
            }
        });
        ids.sort();
        return ids;
    }
}
export { ItemData };
