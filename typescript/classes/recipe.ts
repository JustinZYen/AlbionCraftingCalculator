import { CraftResource, DateEnum, Item } from "./item.js";
import {City} from "../globals/constants.js";

abstract class Recipe {
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
            if (Object.hasOwn(craftResource,"@maxreturnamount")) { // Assuming that if @maxreturnamount property exists that item is not returned
                currentResource["returned"] = false;
            } else {
                currentResource["returned"] = true;
            }
            Object.freeze(currentResource);
            this.resources.push(currentResource);
        }
    }

    calculateCraftingCost(items:Map<string,Item>,timespan:DateEnum, city:City) {
        let totalCost = this.silver;
        return totalCost;
    }

    /**
     * 
     * @returns Array of all the resources used to craft the item
     */
    getResources() {
        if (!Object.isFrozen(this.resources)) {
            Object.freeze(this.resources);
        }
        return this.resources;
    }
}

/**
 * Recipes that have a city that gives them a crafting bonus
 */
class CraftingBonusRecipe extends Recipe {
    protected focus:number;
    protected city:City;
    constructor(silver:number,focus:number,city:City,resources:CraftResource[]) {
        super(silver,resources)
        this.focus = focus;
        this.city = city;
    }

    override calculateCraftingCost(items: Map<string, Item>, timespan: DateEnum, city: City): number {
        return -1;
    }
}

/**
 * Potions and butcher products
 */
class MultiRecipe extends CraftingBonusRecipe { 
    protected amount:number
    constructor(silver:number,focus:number,city:City,amount:number,resources:CraftResource[]) {
        super(silver,focus,city,resources);
        this.amount = amount;
    }

    override calculateCraftingCost(items: Map<string, Item>, timespan: DateEnum, city: City): number {
        return -1;
    }
}

/**
 * Butcher products (their product is returned as part of the return rate rather than the ingredients)
 */
class ButcherRecipe extends MultiRecipe { 
    override calculateCraftingCost(items: Map<string, Item>, timespan: DateEnum, city: City): number {
        return -1;
    }
}

/**
 * Recipes that take items of lower enchantments in order to craft higher-enchantment products
 */
class EnchantmentRecipe extends Recipe {
    constructor(silver:number,resources:CraftResource[],lowerEnchantmentId:string) {
        super(silver,resources);
        this.addLowerEnchantment(lowerEnchantmentId);
    }
    /**
     * Add the item of the lower enchantment level that is used for this enchantment recipe
     * @param priceId The price ID of the lower enchantment level item
     */
    private addLowerEnchantment(priceId:string) {
        const currentResource:{priceId:string,count:number,returned:boolean} = Object.create(null);
        currentResource["priceId"] = priceId;
        currentResource["count"] = 1;
        currentResource["returned"] = false;
        Object.freeze(currentResource);
        this.resources.push(currentResource);
    }
}

/**
 * Recipes that are just bought from a merchant (May still require materials, such as faction hearts)
 */
class MerchantRecipe extends Recipe { 
    
}
export {Recipe,CraftingBonusRecipe,MultiRecipe,ButcherRecipe,EnchantmentRecipe,MerchantRecipe};