import { CraftResource, DateEnum, Item } from "./item.js";
import {baseCityBonus, City, cityBonuses, reverseCityBonuses, reverseStation} from "../globals/constants.js";

abstract class Recipe {
    // Might be issue with results being strings
    protected silver;
    // formatted as item id followed by amount of resources
    resources:{item:Item,count:number,returned:boolean}[] = [];
    // amount is amount crafted
    constructor (silver:number,resources:CraftResource[],items:Map<string,Item>) {
        this.silver = silver;
        for (const craftResource of resources) {
            const currentResource:{item:Item,count:number,returned:boolean} = Object.create(null);
            const priceId = Item.getPriceId(craftResource["@uniquename"]);
            if (items.has(priceId)) {
                currentResource["item"] = items.get(priceId)!;
            } else {
                const newItem = new Item(priceId,items);
                items.set(priceId,newItem);
                currentResource["item"] = newItem;
            }
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

    /**
     * Calculate crafting cost based off of silver cost plus cost of materials
     * @param items 
     * @param timespan 
     * @param city 
     * @returns 
     */
    getCraftingCost(timespan:DateEnum, city:City, stationFees:Map<string,number>, productionBonuses:Map<string,number>) {
        let totalCost = this.silver;
        if (Number.isNaN(totalCost)) {
            console.log("silver for base recipe NaN, for some reason")
        }
        const materialsCost = this.getMaterialsCost(timespan,city,stationFees,productionBonuses);
        if (materialsCost == undefined) {
            return undefined;
        }
        totalCost += materialsCost;
        return totalCost;
    }

    protected getMaterialsCost(timespan:DateEnum, city:City,stationFees:Map<string,number>, productionBonuses:Map<string,number>) {
        let materialsCost = 0;
        for (const resource of this.resources) {
            const resourceCost = resource.item.getCost(timespan,city,stationFees,productionBonuses);
            if (resourceCost == undefined) { // One of the resources doesn't have a cost
                return undefined;
            }
            materialsCost += resourceCost * resource.count;
        }
        return materialsCost;
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

    protected getItemValue() {
        let itemValue = 0;
        for (const resource of this.resources) {
            itemValue += resource.item.getItemValue() * resource.count;
        }
        return itemValue;
    }

    toString() {
        let result = "[";
        let first = true;
        for (const resource of this.resources) {
            if (!first) {
                result += ", "
            }
            result += resource.item + " | " + resource.count;
            first = false;
        }
        return result+"]";
    }
}

/**
 * Recipes that are craftable at a crafting station
 */
abstract class CraftingStationRecipe extends Recipe {
    protected focus:number;
    protected stationName:string;
    constructor(silver:number,focus:number,resources:CraftResource[],items:Map<string,Item>) {
        super(silver,resources,items)
        this.focus = focus;
    }

    /**
     * Calculate crafting cost based off of silver cost + cost of materials + crafting station cost
     * @param items 
     * @param timespan 
     * @param city 
     * @returns 
     */
    override getCraftingCost(timespan: DateEnum, city: City, stationFees:Map<string,number>, productionBonuses:Map<string,number>) {
        let totalCost = super.getCraftingCost(timespan,city,stationFees,productionBonuses);
        if (totalCost == undefined) {
            return undefined;
        }
        totalCost += this.getCraftingStationCost(stationFees);
        return totalCost;
    }

    /**
     * Calculate the return rate, given a production bonus
     * @param productionBonus The production bonus, as a fraction out of 1
     * @returns 
     */
    protected static TO_RETURN_RATE(productionBonus:number) {
        return 1-1/(1+productionBonus);
    }

    protected getReturnRate(_currentCity:City,_productionBonuses:Map<string,number>) {
        let productionBonus = baseCityBonus;
        return CraftingStationRecipe.TO_RETURN_RATE(productionBonus);
    }

    protected getCraftingStationCost(stationFees:Map<string,number>) {
        if (stationFees.has(this.stationName)) {
            // Get total item value
            let itemValue = 0;
            for (const resource of this.resources) {
                const currentItemValue = resource.item.getItemValue();
                itemValue += currentItemValue * resource.count;
            }
            const nutritionCost = itemValue * 0.1125; // Amount of nutrition needed
            // Get station fee cost
            const costPerNutrition = stationFees.get(this.stationName)!/100; // Because stationFees has values per 100 nutrition
            return nutritionCost * costPerNutrition;
        } else {
            throw `Station with name ${this.stationName} does not exist`;
        }
    }

    override getMaterialsCost(timespan: DateEnum, city: City,stationFees:Map<string,number>, productionBonuses:Map<string,number>) {
        let materialsCost = 0;
        const returnRate = this.getReturnRate(city,productionBonuses);
        for (const resource of this.resources) {
            const resourceCost = resource.item.getCost(timespan,city,stationFees,productionBonuses);
            if (resourceCost == undefined) { // One of the resources doesn't have a cost
                return undefined;
            }
            if (resource.returned == true) {
                materialsCost += resourceCost*(1-returnRate)*resource.count;
            } else {
                materialsCost += resourceCost*resource.count;
            }
        }
        return materialsCost;
    }
}

/**
 * Mounts (they do not have a city that provides them with crafting bonuses)
 */
class MountRecipe extends CraftingStationRecipe {
    private static readonly CRAFTING_CATEGORY = "mounts"; // Technically not a real craftingcategory
    constructor(silver:number,focus:number,resources:CraftResource[],items:Map<string,Item>) {
        super(silver,focus,resources,items);
        this.stationName = reverseStation[MountRecipe.CRAFTING_CATEGORY]!;
    }
}

/**
 * Recipes that have a crafting category and so receive a crafting bonus at some city
 */
class CityBonusRecipe extends CraftingStationRecipe {
    protected city: City;
    protected productionBonus: number;
    protected craftingCategory: string;
    constructor(silver:number,focus:number,craftingcategory:string,resources:CraftResource[],items:Map<string,Item>) {
        super(silver,focus,resources,items);
        this.city = this.toCity(craftingcategory);
        this.stationName = this.toStation(craftingcategory);
        this.productionBonus = this.toProductionBonus(craftingcategory);
        this.craftingCategory = craftingcategory;
    }

    protected toCity(craftingcategory:string) {
        return reverseCityBonuses[craftingcategory]!;
    }

    protected toStation(craftingcategory:string) {
        return reverseStation[craftingcategory]!;
    }

    protected toProductionBonus(craftingcategory:string) {
        return cityBonuses[this.city][craftingcategory]!
    }

    override getReturnRate(currentCity:City,productionBonuses:Map<string,number>) {
        let productionBonus = baseCityBonus;
        if (currentCity == this.city) {
            productionBonus += this.productionBonus;
        }
        if (productionBonuses.has(this.craftingCategory)) {
            productionBonus += productionBonuses.get(this.craftingCategory)!/100; // Production bonus map stores a percentage (out of 100)
        }
        return CraftingStationRecipe.TO_RETURN_RATE(productionBonus);
    }


}
/**
 * Offhands (their crafting category does not include enough information to determine which station uses them)
 */
class OffhandRecipe extends CityBonusRecipe {
    private static readonly CRAFTING_CATEGORY = "offhand";
    constructor(silver:number,focus:number,shopsubcategory1:string,resources:CraftResource[],items:Map<string,Item>) {
        super(silver,focus,shopsubcategory1,resources,items);
    }

    override toCity(_craftingcategory:string) {
        return reverseCityBonuses[OffhandRecipe.CRAFTING_CATEGORY]!;
    }

    override toProductionBonus(_craftingcategory:string) {
        return cityBonuses[this.city][OffhandRecipe.CRAFTING_CATEGORY]!;
    }
}

/**
 * Potions and butcher products
 */
class MultiRecipe extends CityBonusRecipe { 
    protected amount:number
    constructor(silver:number,focus:number,craftingcategory:string,amount:number,resources:CraftResource[],items:Map<string,Item>) {
        super(silver,focus,craftingcategory,resources,items);
        this.amount = amount;
    }

    /**
     * Calculate crafting cost based off of silver cost + materials cost + crafting station cost, divided by the amount that is crafted
     * @param items 
     * @param timespan 
     * @param city 
     * @returns 
     */
    override getCraftingCost(timespan: DateEnum, city: City, stationFees:Map<string,number>, productionBonuses:Map<string,number>) {
        const batchCost = super.getCraftingCost(timespan,city,stationFees,productionBonuses);
        if (batchCost == undefined) {
            return undefined;
        } else {
            return this.distributeCosts(batchCost,city,productionBonuses);
        }
    }

    protected distributeCosts(batchCost:number,_city:City,_productionBonuses:Map<string,number>) {
        return batchCost/this.amount;
    }
}

/**
 * Butcher products (their product is returned as part of the return rate rather than the ingredients)
 */
class ButcherRecipe extends MultiRecipe {

    /**
     * Get the cost of materials for a butcher recipe (the return rate is not incorporated here)
     * @param items 
     * @param timespan 
     * @param city 
     * @returns 
     */
    override getMaterialsCost(timespan: DateEnum, city: City,stationFees:Map<string,number>, productionBonuses:Map<string,number>) {
        let materialsCost = 0;
        for (const resource of this.resources) {
            const resourceCost = resource.item.getCost(timespan,city,stationFees,productionBonuses);
            if (resourceCost == undefined) { // One of the resources doesn't have a cost
                return undefined;
            }
            materialsCost += resourceCost*resource.count;
        }
        return materialsCost;
    }

    override distributeCosts(batchCost: number,city:City,productionBonuses:Map<string,number>){
        return batchCost/(this.amount * (1+this.getReturnRate(city,productionBonuses)));
    }
}

/**
 * Recipes that take items of lower enchantments in order to craft higher-enchantment products
 */
class EnchantmentRecipe extends Recipe {
    constructor(silver:number,resources:CraftResource[],items:Map<string,Item>,lowerEnchantmentId:string) {
        super(silver,resources,items);
        if (items.has(lowerEnchantmentId)) {
            this.addLowerEnchantment(items.get(lowerEnchantmentId)!);
        } else {
            const newItem = new Item(lowerEnchantmentId,items);
            items.set(lowerEnchantmentId,newItem);
            this.addLowerEnchantment(newItem);
        }
    }
    /**
     * Add the item of the lower enchantment level that is used for this enchantment recipe
     * @param priceId The price ID of the lower enchantment level item
     */
    private addLowerEnchantment(item:Item) {
        const currentResource:{item:Item,count:number,returned:boolean} = Object.create(null);
        currentResource["item"] = item;
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
export {Recipe,CraftingStationRecipe,CityBonusRecipe,MultiRecipe,ButcherRecipe,EnchantmentRecipe,MerchantRecipe,OffhandRecipe,MountRecipe};