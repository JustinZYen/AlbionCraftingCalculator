import { Item } from "./item.js";
import { baseCityBonus, cityBonuses, reverseCityBonuses } from "../globals/constants.js";
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
    /**
     * Calculate the return rate, given a production bonus
     * @param productionBonus The production bonus, as a fraction out of 1
     * @returns
     */
    static GET_RETURN_RATE(productionBonus) {
        return 1 - 1 / (productionBonus);
    }
}
/**
 * Recipes that have a city that gives them a crafting bonus
 */
class CraftingBonusRecipe extends Recipe {
    focus;
    city;
    productionBonus;
    constructor(silver, focus, craftingcategory, resources) {
        super(silver, resources);
        this.focus = focus;
        this.city = reverseCityBonuses[craftingcategory];
        this.productionBonus = cityBonuses[this.city][craftingcategory];
    }
    getCraftingCost(items, timespan, city) {
        let craftingBonus = baseCityBonus;
        if (this.city == city) {
            craftingBonus += this.productionBonus;
        }
        const returnRate = CraftingBonusRecipe.GET_RETURN_RATE(craftingBonus);
        let totalCost = this.silver;
        for (const resource of this.resources) {
            const resourceCost = items.get(resource.priceId).getCost(items, timespan, city);
            if (resourceCost == undefined) { // One of the resources doesn't have a cost
                return undefined;
            }
            if (resource.returned == true) {
                totalCost += resourceCost * (1 - returnRate);
            }
            else {
                totalCost += resourceCost;
            }
        }
        return totalCost;
    }
}
/**
 * Potions and butcher products
 */
class MultiRecipe extends CraftingBonusRecipe {
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
        let craftingBonus = baseCityBonus;
        if (this.city == city) {
            craftingBonus += this.productionBonus;
        }
        const returnRate = CraftingBonusRecipe.GET_RETURN_RATE(craftingBonus);
        let totalCost = this.silver;
        for (const resource of this.resources) {
            const resourceCost = items.get(resource.priceId).getCost(items, timespan, city);
            if (resourceCost == undefined) { // One of the resources doesn't have a cost
                return undefined;
            }
            totalCost += resourceCost;
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
export { Recipe, CraftingBonusRecipe, MultiRecipe, ButcherRecipe, EnchantmentRecipe, MerchantRecipe };
