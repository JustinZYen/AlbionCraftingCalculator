import { nameToID } from "./external-data.js";
import { db } from "./firebaseScripts.js";
import { DateEnum, Item } from "./item.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
class ItemData {
    // HashMap of all Items so far (for saving prices)
    // Uses priceIds as keys
    checkedItems = new Map();
    async getProfits(ids) {
        // Set containing all strings for which prices need to be determined
        let uncheckedItems = new Map();
        // Stack containing items that still need to be determined whether a price check is needed
        let itemStack = [];
        // Set up stack with all items in ids array
        for (const priceId of ids) {
            itemStack.push(new Item(priceId));
        }
        while (itemStack.length > 0) {
            const currentItem = itemStack.pop();
            // console.log(`current item: ${currentItem}`);
            // If current item is not in checked or unchecked items
            if (!uncheckedItems.has(currentItem.priceId) && !this.checkedItems.has(currentItem.priceId)) {
                //console.log(`currentItem: ${typeof currentItem}`);
                for (const recipe of currentItem.recipes) {
                    for (const resource of recipe.resources) {
                        itemStack.push(new Item(resource.priceId));
                    }
                }
                uncheckedItems.set(currentItem.priceId, currentItem);
                this.checkedItems.set(currentItem.priceId, currentItem);
            }
        }
        //console.log(uncheckedItems)
        console.log("setting prices");
        await this.setPrices(uncheckedItems);
        //getAveragePrices();
    }
    /**
 *
 * @param {string} priceURL URL needed for api, not including timescale
 * @param {DateEnum} timeSpan OLD or NEW, representing previous patch or current patch, respectively
 */
    async getPrices(priceURL, timeSpan) {
        function fixLocation(initialLocation) {
            if (initialLocation == "5003") {
                return "Brecilien";
            }
            else {
                return initialLocation;
            }
        }
        console.log("Price url: " + priceURL);
        const timescales = [1, 6, 24];
        for (const timescale of timescales) {
            let priceContents = await fetch(priceURL + timescale);
            let priceContentsJSON = await priceContents.json();
            // Check timescale and update prices if timescale is higher
            for (const currentItem of priceContentsJSON) {
                const currentPriceId = currentItem.item_id;
                let targetItem;
                if (!this.checkedItems.has(currentPriceId)) {
                    console.log("priceId " + currentPriceId + " was not added to checkedItems");
                    targetItem = new Item(currentPriceId);
                    this.checkedItems.set(currentPriceId, targetItem);
                }
                else {
                    targetItem = this.checkedItems.get(currentPriceId);
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
            console.log("Done with timescale " + timescale);
        }
    }
    /**
     *
     * @param {Set} uncheckedItems A set containing Items representing all items for which prices have not yet been calculated
     */
    async setPrices(uncheckedItems) {
        const PRICE_URL_START = "https://west.albion-online-data.com/api/v2/stats/history/";
        const PRICE_URL_END_OLD = await this.#previousDateString() + "&locations=0007,1002,2004,3005,3008,4002,5003&time-scale=";
        const PRICE_URL_END_NEW = await this.#currentDateString() + "&locations=0007,1002,2004,3005,3008,4002,5003&time-scale=";
        const startStringLength = PRICE_URL_START.length;
        const endStringLength = Math.max(PRICE_URL_END_OLD.length, PRICE_URL_END_NEW.length);
        const MAX_URL_LENGTH = 4096;
        // Note: Missing time scale so that I can test out all 3 possible timescales
        let currentItemString = "";
        uncheckedItems.forEach(async (currentItem) => {
            // Check if more prices can fit into current URL
            let currentPriceId = currentItem.priceId;
            if (currentItemString.length + currentPriceId.length < MAX_URL_LENGTH) {
                if (currentItemString.length == 0) {
                    currentItemString = currentPriceId;
                }
                else {
                    currentItemString += ("," + currentPriceId);
                }
            }
            else {
                await this.getPrices(PRICE_URL_START + currentItemString + PRICE_URL_END_OLD, DateEnum.OLD);
                await this.getPrices(PRICE_URL_START + currentItemString + PRICE_URL_END_NEW, DateEnum.NEW);
                currentItemString = currentItem.id;
            }
        });
        if (currentItemString === "") {
            console.log("No more new prices to collect.");
            return;
        }
        await this.getPrices(PRICE_URL_START + currentItemString + PRICE_URL_END_OLD, DateEnum.OLD);
        await this.getPrices(PRICE_URL_START + currentItemString + PRICE_URL_END_NEW, DateEnum.NEW);
        uncheckedItems.clear();
    }
    async #previousDateString() {
        const patchDateDoc = await getDoc(doc(db, "General/Patch Data"));
        const patchDates = await patchDateDoc.data();
        const previousPatchDateDate = new Date(patchDates["Previous Date"]);
        const previousPatchDateString = previousPatchDateDate.getUTCFullYear() + "-" +
            (previousPatchDateDate.getUTCMonth() + 1) + "-" +
            (previousPatchDateDate.getUTCDate());
        const patchDateDate = new Date(patchDates.Date);
        const patchDateString = patchDateDate.getUTCFullYear() + "-" +
            (patchDateDate.getUTCMonth() + 1) + "-" +
            (patchDateDate.getUTCDate());
        return this.#dateString(previousPatchDateString, patchDateString);
    }
    async #currentDateString() {
        const patchDateDoc = await getDoc(doc(db, "General/Patch Data"));
        const patchDates = await patchDateDoc.data();
        const previousPatchDateDate = new Date(patchDates.Date);
        const previousPatchDateString = previousPatchDateDate.getUTCFullYear() + "-" +
            (previousPatchDateDate.getUTCMonth() + 1) + "-" +
            (previousPatchDateDate.getUTCDate());
        const currentDateDate = new Date();
        const currentDateString = currentDateDate.getUTCFullYear() + "-" +
            (currentDateDate.getUTCMonth() + 1) + "-" +
            (currentDateDate.getUTCDate());
        return this.#dateString(previousPatchDateString, currentDateString);
    }
    #dateString(startDate, endDate) {
        return "?date=" + startDate + "&end_date=" + endDate;
    }
    /**
     *
     * @param {String} itemId
     * @returns An array containing item ids of all weapons that share the name in the tree
     */
    static getItemIds(itemId) {
        const MIN_TIER = 4;
        const MAX_TIER = 8;
        let ids = structuredClone(nameToID[itemId]);
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
