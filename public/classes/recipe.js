import { Item } from "./item.js";
class Recipe {
    // Might be issue with results being strings
    focus;
    silver;
    time;
    // formatted as item id followed by amount of resources
    resources = [];
    // amount is amount crafted
    amount = 1;
    // Whether or not the recipe can return resources
    canReturn = true;
    /**
     *
     * @param {string} focus
     * @param {string} silver
     * @param {string} time
     * @param {CraftResource[]} resources Resources, as obtained from the item json
     */
    constructor(focus, silver, time, resources) {
        this.focus = parseFloat(focus);
        this.silver = parseFloat(silver);
        this.time = parseFloat(time);
        for (const resource of resources) {
            this.addResource(Item.getPriceId(resource["@uniquename"]), parseInt(resource["@count"]));
        }
    }
    addResource(priceId, count) {
        this.resources.push({ "priceId": priceId, "count": count });
    }
    calculateCraftingCost(items, timespan, city) {
    }
}
export { Recipe };
