import { City } from "../globals/constants.js";
import { recipesWithT, recipesWithoutT, itemsJSON } from "../external-data.js";
import { MultiRecipe, ButcherRecipe, EnchantmentRecipe, MerchantRecipe, OffhandRecipe, MountRecipe, CityBonusRecipe } from "./recipe.js";
var DateEnum;
(function (DateEnum) {
    DateEnum[DateEnum["OLD"] = 0] = "OLD";
    DateEnum[DateEnum["NEW"] = 1] = "NEW";
})(DateEnum || (DateEnum = {}));
class Item {
    priceInfos = new Map([
        [DateEnum.OLD, new ExtendedPriceInfo()],
        [DateEnum.NEW, new ExtendedPriceInfo()]
    ]);
    craftedPriceInfos = new Map([
        [DateEnum.OLD, new PriceInfo()],
        [DateEnum.NEW, new PriceInfo()]
    ]);
    priceCalculated = new Map([
        [DateEnum.OLD, new Map()],
        [DateEnum.NEW, new Map()],
    ]);
    overridePrice = undefined;
    tier = undefined;
    enchantment = 0;
    id;
    priceId;
    itemValue = undefined;
    recipes = [];
    /**
     * To be compared with priceCalculated to check to see if crafted prices are up-to-date
     */
    static mostRecent = 0;
    /*
    category:string;
    subcategory:string;
    */
    constructor(priceId, items) {
        this.priceId = priceId;
        this.id = Item.getBaseId(priceId);
        for (const [_, map] of this.priceCalculated) {
            for (const city of Object.values(City)) {
                map.set(city, Item.mostRecent - 1); // Initially set all priceCalculated to invalid
            }
        }
        this.#setTier();
        this.#setEnchantment();
        this.#setRecipesAndCategories(items);
    }
    /**
     * Invalidates all currently stored calculated prices for all items
     */
    static invalidatePrices() {
        Item.mostRecent++;
    }
    getCost(timespan, city, stationFees, productionBonuses) {
        if (this.overridePrice != undefined) { // Return override price no matter what the other prices
            return this.overridePrice;
        }
        else {
            if (this.priceCalculated.get(timespan).get(city) != Item.mostRecent) { // Check if the given timespan + city has already had its price calculated
                this.calculateCraftingCost(timespan, city, stationFees, productionBonuses);
            }
            const marketPrice = this.priceInfos.get(timespan).price.get(city);
            const craftedPrice = this.craftedPriceInfos.get(timespan).price.get(city);
            if (marketPrice == undefined && craftedPrice == undefined) {
                return undefined;
            }
            else if (marketPrice != undefined && craftedPrice != undefined) {
                return Math.min(marketPrice, craftedPrice);
            }
            else if (marketPrice != undefined) {
                return marketPrice;
            }
            else {
                return craftedPrice;
            }
        }
    }
    calculateCraftingCost(timespan, city, stationFees, productionBonuses) {
        let minCraftingCost = -1;
        for (const recipe of this.recipes) {
            // For each item in the recipe, if crafting cost is not yet determined, determine its crafting cost first
            //recipe.calculateCraftingCost(items,????);
            const currentCraftingCost = recipe.getCraftingCost(timespan, city, stationFees, productionBonuses);
            if (currentCraftingCost != undefined) {
                if (minCraftingCost == -1) {
                    minCraftingCost = currentCraftingCost;
                }
                else {
                    minCraftingCost = Math.min(minCraftingCost, currentCraftingCost);
                }
            }
        }
        if (minCraftingCost != -1) {
            this.craftedPriceInfos.get(timespan).price.set(city, minCraftingCost); // Set the crafting cost for this timespan + city combination
        }
        this.priceCalculated.get(timespan).set(city, Item.mostRecent); // Mark this timespan + city combination as calculated
    }
    #setTier() {
        const secondValue = parseInt(this.id.charAt(1));
        if (this.id.charAt(0) === "T" && !Number.isNaN(secondValue)) {
            this.tier = secondValue;
        }
        else {
            console.log(`Id ${this.priceId} has no tier found`);
        }
    }
    #setEnchantment() {
        const lastVal = parseInt(this.priceId.charAt(this.priceId.length - 1));
        if (!isNaN(lastVal) && this.priceId.charAt(this.priceId.length - 2) == "@") {
            this.enchantment = lastVal;
        }
    }
    /**
     * Sets recipes and item value if it exists
     * @returns
     */
    #setRecipesAndCategories(items) {
        let path;
        if (this.id.charAt(0) == "T") {
            path = recipesWithT[this.id];
        }
        else {
            path = recipesWithoutT[this.id];
        }
        if (path == null) {
            console.log(`No path found for id ${this.id}`);
            return;
        }
        let current = itemsJSON;
        for (const pathElement of path) {
            current = current[pathElement];
        }
        /**
         * Adds a recipe for an item that receives a city bonus (decides which type of CraftingBonusRecipe internally)
         * @param craftingCategory
         * @param craftingRequirement
         */
        const addCraftingBonusRecipe = (craftingCategory, craftingRequirement) => {
            // Determine which city this item receives the crafting bonus for
            let resources = craftingRequirement.craftresource;
            if (!Array.isArray(resources)) {
                resources = [resources];
            }
            let newRecipe;
            let silverRequirement;
            if (Object.hasOwn(craftingRequirement, "@silver")) {
                silverRequirement = parseInt(craftingRequirement["@silver"]);
            }
            else {
                silverRequirement = 0;
            }
            if (Object.hasOwn(craftingRequirement, "@amountcrafted")) { // Multi recipe
                if (Object.hasOwn(craftingRequirement, "@returnproductnotresource")) { // Butcher recipe
                    newRecipe = new ButcherRecipe(silverRequirement, parseInt(craftingRequirement["@craftingfocus"]), craftingCategory, parseInt(craftingRequirement["@amountcrafted"]), resources, items);
                }
                else {
                    newRecipe = new MultiRecipe(silverRequirement, parseInt(craftingRequirement["@craftingfocus"]), craftingCategory, parseInt(craftingRequirement["@amountcrafted"]), resources, items);
                }
            }
            else {
                newRecipe = new CityBonusRecipe(silverRequirement, parseInt(craftingRequirement["@craftingfocus"]), craftingCategory, resources, items);
            }
            this.recipes.push(newRecipe);
        };
        /**
         * Adds an enchantment recipe for an item that can be crafted using runes/etc + item of a lower enchantment
         * @param previousId
         * @param craftResources
         */
        const addEnchantmentRecipe = (previousId, craftResources) => {
            const newRecipe = new EnchantmentRecipe(0, craftResources, items, previousId);
            this.recipes.push(newRecipe);
        };
        /**
         * Adds a merchant recipe for an item that can be bought
         *
         * !!! WILL NOT CREATE RECIPE IF CRAFTING REQUIREMENT INCLUDES A 'currency' FIELD !!!
         * @param craftingRequirement
         * @returns
         */
        const addMerchantRecipe = (craftingRequirement) => {
            if (Object.hasOwn(craftingRequirement, "currency")) {
                return; // Object has a currency like faction points, which is difficult to convert to silver
            }
            // Might or might not have resources involved in the recipe
            let resources = craftingRequirement.craftresource;
            if (resources == undefined) {
                resources = [];
            }
            else if (!Array.isArray(resources)) {
                resources = [resources];
            }
            const newRecipe = new MerchantRecipe(Object.hasOwn(craftingRequirement, "@silver") ? parseInt(craftingRequirement["@silver"]) : 0, resources, items);
            this.recipes.push(newRecipe);
        };
        const addOffhandRecipe = (shobsubcategory1, craftingRequirement) => {
            let resources = craftingRequirement.craftresource;
            if (!Array.isArray(resources)) {
                resources = [resources];
            }
            const newRecipe = new OffhandRecipe(Object.hasOwn(craftingRequirement, "@silver") ? parseInt(craftingRequirement["@silver"]) : 0, parseInt(craftingRequirement["@craftingfocus"]), shobsubcategory1, resources, items);
            this.recipes.push(newRecipe);
        };
        const addMountRecipe = (craftingRequirement) => {
            let resources = craftingRequirement.craftresource;
            if (!Array.isArray(resources)) {
                resources = [resources];
            }
            const newRecipe = new MountRecipe(Object.hasOwn(craftingRequirement, "@silver") ? parseInt(craftingRequirement["@silver"]) : 0, parseInt(craftingRequirement["@craftingfocus"]), resources, items);
            this.recipes.push(newRecipe);
        };
        let itemInfo = current;
        if (Object.hasOwn(itemInfo, "@itemvalue")) {
            this.itemValue = parseInt(itemInfo["@itemvalue"]);
        }
        else {
            this.itemValue = 0;
        }
        if (Object.hasOwn(itemInfo, "enchantments") && this.enchantment > 0) { // Check if enchanted item
            const enchantmentInfo = itemInfo.enchantments.enchantment[this.enchantment - 1];
            // Add crafting requirements (using enchanted materials)
            const craftingRequirements = enchantmentInfo.craftingrequirements;
            let category = itemInfo["@craftingcategory"];
            let addingFunction;
            if (category == "offhand") {
                addingFunction = addOffhandRecipe;
                category = itemInfo["@shopsubcategory1"];
            }
            else {
                addingFunction = addCraftingBonusRecipe;
            }
            if (Array.isArray(craftingRequirements)) {
                for (const craftingRequirement of craftingRequirements) {
                    addingFunction(category, craftingRequirement);
                }
            }
            else {
                addingFunction(category, craftingRequirements);
            }
            // Add upgrade requirements, if they exist
            if (Object.hasOwn(enchantmentInfo, "upgraderequirements")) {
                let previousId;
                if (this.enchantment === 1) {
                    previousId = this.priceId.slice(0, -2);
                }
                else {
                    previousId = this.priceId.slice(0, -1) + (this.enchantment - 1);
                }
                addEnchantmentRecipe(previousId, [enchantmentInfo.upgraderequirements.upgraderesource]);
            }
        }
        else {
            if (!Object.hasOwn(itemInfo, "craftingrequirements")) {
                console.log(`ID ${this.id} cannot be crafted`);
                return;
            }
            if (itemInfo["@shopcategory"] == "artefacts") {
                return; // Artifacts have a crafting recipe, but it is based on random chance, so we will not consider it
            }
            // Add crafting requirements
            const craftingRequirements = itemInfo.craftingrequirements;
            if (Object.hasOwn(itemInfo, "@craftingcategory")) {
                let category = itemInfo["@craftingcategory"];
                let addingFunction;
                if (category == "offhand") {
                    addingFunction = addOffhandRecipe;
                    category = itemInfo["@shopsubcategory1"];
                }
                else {
                    addingFunction = addCraftingBonusRecipe;
                }
                if (Array.isArray(craftingRequirements)) {
                    for (const craftingRequirement of craftingRequirements) {
                        addingFunction(category, craftingRequirement);
                    }
                }
                else {
                    addingFunction(category, craftingRequirements);
                }
            }
            else if (itemInfo["@shopcategory"] == "mounts") {
                if (Array.isArray(craftingRequirements)) {
                    for (const craftingRequirement of craftingRequirements) {
                        addMountRecipe(craftingRequirement);
                    }
                }
                else {
                    addMountRecipe(craftingRequirements);
                }
            }
            else {
                if (Array.isArray(craftingRequirements)) {
                    for (const craftingRequirement of craftingRequirements) {
                        addMerchantRecipe(craftingRequirement);
                    }
                }
                else {
                    addMerchantRecipe(craftingRequirements);
                }
            }
        }
    }
    /**
     * Gets the item value of this item. If there is no item value calculated yet, calculates item value based off of item values of recipe
     */
    getItemValue() {
        if (this.itemValue != undefined) {
            return this.itemValue;
        }
        for (const recipe of this.recipes) {
            if (recipe instanceof CityBonusRecipe) {
                let calculatedValue = 0;
                for (const resource of recipe.resources) {
                    const resourceValue = resource.item.getItemValue();
                    calculatedValue += resourceValue * resource.count;
                }
                this.itemValue = calculatedValue;
                return calculatedValue;
            }
        }
        throw `Item ${this.priceId} did not have a crafting bonus recipe`;
    }
    /*
    toString() {
        let oldPriceData = Array.from(this.priceInfos.get(DateEnum.Old)!.price);
        let newPriceData = Array.from(this.priceInfos.get(DateEnum.New)!.price);
        return `name: ${idToName[Item.getPriceId(this.id)]},
        id: ${this.id},
        category: ${this.category},
        subcategory: ${this.subcategory},
        tier: ${this.tier},
        enchantment: ${this.enchantment},
        old price: ${oldPriceData},
        new price: ${newPriceData}`;
    }
    */
    static getPriceId(s) {
        if (s.endsWith("LEVEL", s.length - 1)) {
            // Convert resources ending with LEVEL# (T4_PLANKS_LEVEL1) to LEVEL#@# (T4_PLANKS_LEVEL1@1)
            // Add exceptions for FISHSAUCE and ALCHEMY_EXTRACT
            if (!s.startsWith("FISHSAUCE", 3) && !s.startsWith("ALCHEMY_EXTRACT", 3)) {
                return s + "@" + s.charAt(s.length - 1);
            }
        }
        else if (s.startsWith("RANDOM_DUNGEON", 3)) {
            const lastValue = parseInt(s.charAt(s.length - 1));
            if (lastValue > 1) {
                return s + "@" + (lastValue - 1);
            }
        }
        else if (s.startsWith("UNIQUE_LOOTCHEST_COMMUNITY") && s.endsWith("PREMIUM")) {
            return s + "@1";
        }
        // Cover edge cases
        const enchantedMounts = [
            "T8_MOUNT_MAMMOTH_BATTLE",
            "T8_MOUNT_HORSE_UNDEAD",
            "T5_MOUNT_COUGAR_KEEPER",
            "T8_MOUNT_COUGAR_KEEPER",
            "T8_MOUNT_ARMORED_HORSE_MORGANA",
            "T8_MOUNT_RABBIT_EASTER_DARK"
        ];
        if (enchantedMounts.includes(s)) {
            return s + "@1";
        }
        const enchantedDeco1 = [
            "UNIQUE_FURNITUREITEM_TELLAFRIEND_CHEST_A",
            "UNIQUE_FURNITUREITEM_TELLAFRIEND_CHEST_B",
            "UNIQUE_FURNITUREITEM_TELLAFRIEND_CHEST_C",
            "UNIQUE_FURNITUREITEM_TELLAFRIEND_CHEST_COMPANION",
            "UNIQUE_FURNITUREITEM_TELLAFRIEND_CHEST_BARREL",
            "UNIQUE_FURNITUREITEM_TELLAFRIEND_CHEST_MERLINCUBE",
            "UNIQUE_FURNITUREITEM_TELLAFRIEND_CHEST_BARREL_B",
            "UNIQUE_FURNITUREITEM_MORGANA_TORCH_C",
            "UNIQUE_FURNITUREITEM_MORGANA_FIREBOWL_C"
        ];
        if (enchantedDeco1.includes(s)) {
            return s + "@1";
        }
        const enchantedDeco2 = [
            "UNIQUE_FURNITUREITEM_MORGANA_CAMPFIRE_D",
            "UNIQUE_FURNITUREITEM_MORGANA_SIEGE_BALLISTA_A",
            "UNIQUE_FURNITUREITEM_MORGANA_WEAPONCRATE_A"
        ];
        if (enchantedDeco2.includes(s)) {
            return s + "@2";
        }
        const enchantedDeco3 = [
            "UNIQUE_FURNITUREITEM_MORGANA_PENTAGRAM",
            "UNIQUE_FURNITUREITEM_MORGANA_PRISON_CELL_C",
            "UNIQUE_FURNITUREITEM_MORGANA_TENT_A"
        ];
        if (enchantedDeco3.includes(s)) {
            return s + "@3";
        }
        if (s.startsWith("JOURNAL", 3)) {
            return s + "_EMPTY";
        }
        return s;
    }
    static getBaseId(s) {
        if (s.charAt(s.length - 2) === "@") {
            return s.slice(0, s.length - 2);
        }
        else if (s.startsWith("JOURNAL", 3) && (s.endsWith("EMPTY") || s.endsWith("FULL"))) {
            console.log(s);
            console.log(s.slice(0, s.lastIndexOf("_")));
            return s.slice(0, s.lastIndexOf("_"));
        }
        return s;
    }
}
/**
 * Just contains a price field for storing city name-price pairs
 */
class PriceInfo {
    price = new Map(); // City name, price value 
}
/**
 * This class used to store additional price info of timescale and quality so that price fetch calculations can be more accurate
 */
class ExtendedPriceInfo extends PriceInfo {
    priceTimescale = new Map(); // City name, timescale covered
    // Price qualities so that items with variable quality are saved as quality 2 if possible
    priceQualities = new Map(); // City name, quality number
}
export { DateEnum, Item };
