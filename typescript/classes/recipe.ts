import { CraftResource, DateEnum, Item } from "./item";

class Recipe {
    // Might be issue with results being strings
    focus;
    silver;
    time;
    // formatted as item id followed by amount of resources
    resources:{priceId:string,count:number}[] = [];
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
    constructor (focus:string,silver:string,time:string,resources:CraftResource[]) {
        this.focus = parseFloat(focus);
        this.silver = parseFloat(silver);
        this.time = parseFloat(time);
        for (const resource of resources) {
            this.addResource(Item.getPriceId(resource["@uniquename"]),parseInt(resource["@count"]));
        }
    }

    addResource(priceId:string,count:number) {
        this.resources.push({"priceId":priceId,"count":count});
    }

    calculateCraftingCost(items:Map<string,Item>,timespan:DateEnum, city:string) {

    }
}

export {Recipe};