import { CraftResource, DateEnum, Item } from "./item.js";
import {City} from "../globals/constants.js";
import { isJSDocOverrideTag } from "typescript";
class Recipe {
    // Might be issue with results being strings
    protected silver;
    // formatted as item id followed by amount of resources
    protected resources:{priceId:string,count:number,returned:boolean}[] = [];
    // amount is amount crafted
    constructor (silver:number,resources:CraftResource[]) {
        this.silver = silver;
        for (const craftResource of resources) {
            const currentResource:{priceId:string,count:number,returned:boolean} = Object.create(null);
            currentResource["priceId"] = Item.getPriceId(craftResource["@uniquename"]);
            currentResource["count"] = parseInt(Item.getPriceId(craftResource["@count"]));
            if (Object.hasOwn(craftResource,"@maxreturnamount")) {
                currentResource["returned"] = false;
            } else {
                currentResource["returned"] = true;
            }
            Object.freeze(currentResource);
            this.resources.push(currentResource);
        }
    }

    calculateCraftingCost(items:Map<string,Item>,timespan:DateEnum, city:string) {
        let totalCost = 0;
        return totalCost;
    }

    getResources() {
        if (!Object.isFrozen(this.resources)) {
            Object.freeze(this.resources);
        }
        return this.resources;
    }
}

class CraftingBonusRecipe extends Recipe { // Recipes that have a city that gives them a crafting bonus recipe
    protected focus:number;
    protected city:City;
    constructor(silver:number,focus:number,city:City,resources:CraftResource[]) {
        super(silver,resources)
        this.focus = focus;
        this.city = city;
    }
}

class MultiRecipe extends CraftingBonusRecipe { //  Potions and butcher products
    protected amount:number
    constructor(silver:number,focus:number,city:City,amount:number,resources:CraftResource[]) {
        super(silver,focus,city,resources);
        this.amount = amount;
    }
}

class ButcherRecipe extends MultiRecipe { // Butcher recipes return their product as part of the crafting bonus rather than materials

}

class EnchantmentRecipe extends Recipe {
    addLowerEnchantment(priceId:string) {
        const currentResource:{priceId:string,count:number,returned:boolean} = Object.create(null);
        currentResource["priceId"] = priceId;
        currentResource["count"] = 1;
        currentResource["returned"] = false;
        Object.freeze(currentResource);
        this.resources.push(currentResource);
    }
}
export {Recipe,CraftingBonusRecipe,MultiRecipe,ButcherRecipe,EnchantmentRecipe};