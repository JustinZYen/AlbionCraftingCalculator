import { Item } from "./item.js";
import { baseCityBonus, cityBonuses, reverseCityBonuses, reverseStation } from "../globals/constants.js";
class Recipe {
    // Might be issue with results being strings
    silver;
    // formatted as item id followed by amount of resources
    resources = [];
    // amount is amount crafted
    constructor(silver, resources, items) {
        this.silver = silver;
        for (const craftResource of resources) {
            const currentResource = Object.create(null);
            const priceId = Item.getPriceId(craftResource["@uniquename"]);
            if (items.has(priceId)) {
                currentResource["item"] = items.get(priceId);
            }
            else {
                const newItem = new Item(priceId, items);
                items.set(priceId, newItem);
                currentResource["item"] = newItem;
            }
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
    /**
     * Calculate crafting cost based off of silver cost plus cost of materials
     * @param items
     * @param timespan
     * @param city
     * @returns
     */
    getCraftingCost(timespan, city, stationFees, productionBonuses) {
        let totalCost = this.silver;
        if (Number.isNaN(totalCost)) {
            console.log("silver for base recipe NaN, for some reason");
        }
        const materialsCost = this.getMaterialsCost(timespan, city, stationFees, productionBonuses);
        if (materialsCost == undefined) {
            return undefined;
        }
        totalCost += materialsCost;
        return totalCost;
    }
    getMaterialsCost(timespan, city, stationFees, productionBonuses) {
        let materialsCost = 0;
        for (const resource of this.resources) {
            const resourceCost = resource.item.getCost(timespan, city, stationFees, productionBonuses);
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
    getItemValue() {
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
                result += ", ";
            }
            result += resource.item + " | " + resource.count;
            first = false;
        }
        return result + "]";
    }
}
/**
 * Recipes that are craftable at a crafting station
 */
class CraftingStationRecipe extends Recipe {
    focus;
    stationName;
    constructor(silver, focus, resources, items) {
        super(silver, resources, items);
        this.focus = focus;
    }
    /**
     * Calculate crafting cost based off of silver cost + cost of materials + crafting station cost
     * @param items
     * @param timespan
     * @param city
     * @returns
     */
    getCraftingCost(timespan, city, stationFees, productionBonuses) {
        let totalCost = super.getCraftingCost(timespan, city, stationFees, productionBonuses);
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
    static TO_RETURN_RATE(productionBonus) {
        return 1 - 1 / (1 + productionBonus);
    }
    getReturnRate(_currentCity, _productionBonuses) {
        let productionBonus = baseCityBonus;
        return CraftingStationRecipe.TO_RETURN_RATE(productionBonus);
    }
    getCraftingStationCost(stationFees) {
        if (stationFees.has(this.stationName)) {
            // Get total item value
            let itemValue = 0;
            for (const resource of this.resources) {
                const currentItemValue = resource.item.getItemValue();
                itemValue += currentItemValue * resource.count;
            }
            const nutritionCost = itemValue * 0.1125; // Amount of nutrition needed
            // Get station fee cost
            const costPerNutrition = stationFees.get(this.stationName) / 100; // Because stationFees has values per 100 nutrition
            return nutritionCost * costPerNutrition;
        }
        else {
            throw `Station with name ${this.stationName} does not exist`;
        }
    }
    getMaterialsCost(timespan, city, stationFees, productionBonuses) {
        let materialsCost = 0;
        const returnRate = this.getReturnRate(city, productionBonuses);
        for (const resource of this.resources) {
            const resourceCost = resource.item.getCost(timespan, city, stationFees, productionBonuses);
            if (resourceCost == undefined) { // One of the resources doesn't have a cost
                return undefined;
            }
            if (resource.returned == true) {
                materialsCost += resourceCost * (1 - returnRate) * resource.count;
            }
            else {
                materialsCost += resourceCost * resource.count;
            }
        }
        return materialsCost;
    }
}
/**
 * Mounts (they do not have a city that provides them with crafting bonuses)
 */
class MountRecipe extends CraftingStationRecipe {
    static CRAFTING_CATEGORY = "mounts"; // Technically not a real craftingcategory
    constructor(silver, focus, resources, items) {
        super(silver, focus, resources, items);
        this.stationName = reverseStation[MountRecipe.CRAFTING_CATEGORY];
    }
}
/**
 * Recipes that have a crafting category and so receive a crafting bonus at some city
 */
class CityBonusRecipe extends CraftingStationRecipe {
    city;
    productionBonus;
    craftingCategory;
    constructor(silver, focus, craftingcategory, resources, items) {
        super(silver, focus, resources, items);
        this.city = this.toCity(craftingcategory);
        this.stationName = this.toStation(craftingcategory);
        this.productionBonus = this.toProductionBonus(craftingcategory);
        this.craftingCategory = craftingcategory;
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
    getReturnRate(currentCity, productionBonuses) {
        let productionBonus = baseCityBonus;
        if (currentCity == this.city) {
            productionBonus += this.productionBonus;
        }
        if (productionBonuses.has(this.craftingCategory)) {
            productionBonus += productionBonuses.get(this.craftingCategory) / 100; // Production bonus map stores a percentage (out of 100)
        }
        return CraftingStationRecipe.TO_RETURN_RATE(productionBonus);
    }
}
/**
 * Offhands (their crafting category does not include enough information to determine which station uses them)
 */
class OffhandRecipe extends CityBonusRecipe {
    static CRAFTING_CATEGORY = "offhand";
    constructor(silver, focus, shopsubcategory1, resources, items) {
        super(silver, focus, shopsubcategory1, resources, items);
    }
    toCity(_craftingcategory) {
        return reverseCityBonuses[OffhandRecipe.CRAFTING_CATEGORY];
    }
    toProductionBonus(_craftingcategory) {
        return cityBonuses[this.city][OffhandRecipe.CRAFTING_CATEGORY];
    }
}
/**
 * Potions and butcher products
 */
class MultiRecipe extends CityBonusRecipe {
    amount;
    constructor(silver, focus, craftingcategory, amount, resources, items) {
        super(silver, focus, craftingcategory, resources, items);
        this.amount = amount;
    }
    /**
     * Calculate crafting cost based off of silver cost + materials cost + crafting station cost, divided by the amount that is crafted
     * @param items
     * @param timespan
     * @param city
     * @returns
     */
    getCraftingCost(timespan, city, stationFees, productionBonuses) {
        const batchCost = super.getCraftingCost(timespan, city, stationFees, productionBonuses);
        if (batchCost == undefined) {
            return undefined;
        }
        else {
            return this.distributeCosts(batchCost, city, productionBonuses);
        }
    }
    distributeCosts(batchCost, _city, _productionBonuses) {
        return batchCost / this.amount;
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
    getMaterialsCost(timespan, city, stationFees, productionBonuses) {
        let materialsCost = 0;
        for (const resource of this.resources) {
            const resourceCost = resource.item.getCost(timespan, city, stationFees, productionBonuses);
            if (resourceCost == undefined) { // One of the resources doesn't have a cost
                return undefined;
            }
            materialsCost += resourceCost * resource.count;
        }
        return materialsCost;
    }
    distributeCosts(batchCost, city, productionBonuses) {
        return batchCost / (this.amount * (1 + this.getReturnRate(city, productionBonuses)));
    }
}
/**
 * Recipes that take items of lower enchantments in order to craft higher-enchantment products
 */
class EnchantmentRecipe extends Recipe {
    constructor(silver, resources, items, lowerEnchantmentId) {
        super(silver, resources, items);
        if (items.has(lowerEnchantmentId)) {
            this.addLowerEnchantment(items.get(lowerEnchantmentId));
        }
        else {
            const newItem = new Item(lowerEnchantmentId, items);
            items.set(lowerEnchantmentId, newItem);
            this.addLowerEnchantment(newItem);
        }
    }
    /**
     * Add the item of the lower enchantment level that is used for this enchantment recipe
     * @param priceId The price ID of the lower enchantment level item
     */
    addLowerEnchantment(item) {
        const currentResource = Object.create(null);
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
export { Recipe, CraftingStationRecipe, CityBonusRecipe, MultiRecipe, ButcherRecipe, EnchantmentRecipe, MerchantRecipe, OffhandRecipe, MountRecipe };
