import { Item } from "./item.js";
import { baseCityBonus, cityBonuses, reverseCityBonuses, reverseStation } from "../globals/constants.js";
class Recipe {
    // Might be issue with results being strings
    silver;
    // formatted as item id followed by amount of resources
    resources = [];
    // amount is amount crafted
    constructor(silver, resources) {
        this.silver = silver;
        for (const craftResource of resources) {
            const currentResource = Object.create(null);
            currentResource["priceId"] = Item.getPriceId(craftResource["@uniquename"]);
            currentResource["count"] = parseInt(Item.getPriceId(craftResource["@count"]));
            if (Object.hasOwn(craftResource, "@maxreturnamount")) { // Assuming that if @maxreturnamount property exists that item is not returned
                currentResource["returned"] = false;
            }
            else {
                currentResource["returned"] = true;
            }
            Object.freeze(currentResource);
            this.resources.push(currentResource);
        }
    }
    getCraftingCost(items, timespan, city) {
        let totalCost = this.silver;
        for (const resource of this.resources) {
            const resourceCost = items.get(resource.priceId).getCost(items, timespan, city);
            if (resourceCost == undefined) { // One of the resources doesn't have a cost
                return undefined;
            }
            totalCost += resourceCost * resource.count;
        }
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
    getItemValue(items) {
        let itemValue = 0;
        for (const resource of this.resources) {
            itemValue += items.get(resource.priceId).getItemValue(items) * resource.count;
        }
        return itemValue;
    }
}
/**
 * Recipes that are craftable at a crafting station
 */
class CraftingStationRecipe extends Recipe {
    focus;
    stationName;
    constructor(silver, focus, resources) {
        super(silver, resources);
        this.focus = focus;
    }
    getCraftingCost(items, timespan, city) {
        //a
        // Calculate crafting station cost
        const returnRate = this.getReturnRate(city);
        let totalCost = this.silver;
        for (const resource of this.resources) {
            const resourceCost = items.get(resource.priceId).getCost(items, timespan, city);
            if (resourceCost == undefined) { // One of the resources doesn't have a cost
                return undefined;
            }
            if (resource.returned == true) {
                totalCost += resourceCost * (1 - returnRate) * resource.count;
            }
            else {
                totalCost += resourceCost * resource.count;
            }
        }
        return totalCost;
    }
    /**
     * Calculate the return rate, given a production bonus
     * @param productionBonus The production bonus, as a fraction out of 1
     * @returns
     */
    static TO_RETURN_RATE(productionBonus) {
        return 1 - 1 / (1 + productionBonus);
    }
    getReturnRate(_currentCity) {
        let productionBonus = baseCityBonus;
        return CraftingStationRecipe.TO_RETURN_RATE(productionBonus);
    }
}
/**
 * Mounts (they do not have a city that provides them with crafting bonuses)
 */
class MountRecipe extends CraftingStationRecipe {
    static CRAFTING_CATEGORY = "mounts"; // Technically not a real craftingcategory
    constructor(silver, focus, resources) {
        super(silver, focus, resources);
        this.stationName = reverseStation[MountRecipe.CRAFTING_CATEGORY];
    }
}
/**
 * Recipes that have a crafting category and so receive a crafting bonus at some city
 */
class CityBonusRecipe extends CraftingStationRecipe {
    city;
    station;
    productionBonus;
    constructor(silver, focus, craftingcategory, resources) {
        super(silver, focus, resources);
        this.city = this.toCity(craftingcategory);
        this.station = this.toStation(craftingcategory);
        this.productionBonus = this.toProductionBonus(craftingcategory);
    }
    toCity(craftingcategory) {
        return reverseCityBonuses[craftingcategory];
    }
    toStation(craftingcategory) {
        return reverseStation[craftingcategory];
    }
    toProductionBonus(craftingcategory) {
        return cityBonuses[this.city][craftingcategory];
    }
    getReturnRate(currentCity) {
        let productionBonus = baseCityBonus;
        if (currentCity == this.city) {
            productionBonus += this.productionBonus;
        }
        return CraftingStationRecipe.TO_RETURN_RATE(productionBonus);
    }
}
/**
 * Offhands (their crafting category does not include enough information to determine which station uses them)
 */
class OffhandRecipe extends CityBonusRecipe {
    static CRAFTING_CATEGORY = "offhand";
    constructor(silver, focus, shopsubcategory1, resources) {
        super(silver, focus, shopsubcategory1, resources);
    }
    toCity(_craftingcategory) {
        return reverseCityBonuses[OffhandRecipe.CRAFTING_CATEGORY];
    }
    toProductionBonus(_craftingcategory) {
        console.log("using override method");
        return cityBonuses[this.city][OffhandRecipe.CRAFTING_CATEGORY];
    }
    getReturnRate(currentCity) {
        let productionBonus = baseCityBonus;
        if (currentCity == this.city) {
            productionBonus += this.productionBonus;
        }
        return CraftingStationRecipe.TO_RETURN_RATE(productionBonus);
    }
}
/**
 * Potions and butcher products
 */
class MultiRecipe extends CityBonusRecipe {
    amount;
    constructor(silver, focus, craftingcategory, amount, resources) {
        super(silver, focus, craftingcategory, resources);
        this.amount = amount;
    }
    getCraftingCost(items, timespan, city) {
        const batchCost = super.getCraftingCost(items, timespan, city);
        if (batchCost == undefined) {
            return undefined;
        }
        else {
            return batchCost / this.amount;
        }
    }
}
/**
 * Butcher products (their product is returned as part of the return rate rather than the ingredients)
 */
class ButcherRecipe extends MultiRecipe {
    getCraftingCost(items, timespan, city) {
        const returnRate = this.getReturnRate(city);
        let totalCost = this.silver;
        for (const resource of this.resources) {
            const resourceCost = items.get(resource.priceId).getCost(items, timespan, city);
            if (resourceCost == undefined) { // One of the resources doesn't have a cost
                return undefined;
            }
            totalCost += resourceCost * resource.count;
        }
        return totalCost / (this.amount * (1 + returnRate));
    }
}
/**
 * Recipes that take items of lower enchantments in order to craft higher-enchantment products
 */
class EnchantmentRecipe extends Recipe {
    constructor(silver, resources, lowerEnchantmentId) {
        super(silver, resources);
        this.addLowerEnchantment(lowerEnchantmentId);
    }
    /**
     * Add the item of the lower enchantment level that is used for this enchantment recipe
     * @param priceId The price ID of the lower enchantment level item
     */
    addLowerEnchantment(priceId) {
        const currentResource = Object.create(null);
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
export { Recipe, CraftingStationRecipe, CityBonusRecipe, MultiRecipe, ButcherRecipe, EnchantmentRecipe, MerchantRecipe, OffhandRecipe, MountRecipe };
