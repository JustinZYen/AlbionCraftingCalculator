import { recipesWithT,recipesWithoutT,itemsJSON,idToName } from "../external-data.js";
import {Recipe} from "./recipe.js";
enum DateEnum {
    OLD,
    NEW
}

type CraftingRequirement = {
    "@silver":string,
    "@time"?:string,
    "@craftingfocus"?:string,
    "@amountcrafted"?:string,
    "@returnproductnotresource"?:string // Applies to butcher products
    craftresource?: CraftResource[] | CraftResource // Farming items do not have any craft resources
}

type CraftResource = {
    "@uniquename":string,
    "@count":string
    "@maxreturnamount"?:string // I assume this is for specifying that weapons do not have artifacts returned
}

type EnchantmentRequirement = {
    "@enchantmentlevel": string
    "craftingrequirements": CraftingRequirement
    "upgraderequirements": {
        "upgraderesource": {
            "@uniquename": string
            "@count": string
        }
    }
}

type ItemData = {
    "@uniquename":string,
    "@tier"?: string // Skins do not have tier
    "@enchantment"?: string
    "@shopcategory"?: string // Certain skins do not have shopcategory or shopsubcategory
    "@shopsubcategory1"?: string
    "@itemvalue"?: string // itemvalue and craftingcategory seem to be mutually exclusive
    "@craftingcategory"?: string
    "craftingrequirements"?: CraftingRequirement | CraftingRequirement []
    "enchantments"?: {
        enchantment: EnchantmentRequirement[]
    }
}
class Item {
    priceInfos = new Map([
        [DateEnum.OLD,new ExtendedPriceInfo()],
        [DateEnum.NEW,new ExtendedPriceInfo()]
    ]);
    craftedPriceInfos = new Map([
        [DateEnum.OLD,new PriceInfo()],
        [DateEnum.NEW,new PriceInfo()]
    ]);
    priceCalculated = false;
    overridePrice = undefined;
    tier:number|undefined = undefined;
    enchantment = 0;
    id;
    priceId;
    // Recipes will be array of Recipe objects
    recipes:Recipe[] = [];
    category:string;
    subcategory:string;

    constructor(priceId:string) {
        this.priceId = priceId;
        this.id = Item.getBaseId(priceId);
        this.#setTier();
        this.#setEnchantment();
        this.#setRecipesAndCategories();
    }

    getMinCost(timespan:DateEnum,city:string) {
        if (this.overridePrice != undefined) {
            return this.overridePrice;
        } else {
            const marketPrice = this.priceInfos.get(timespan)!.price.get(city);
            const craftedPrice = this.craftedPriceInfos.get(timespan)!.price.get(city);
            if (marketPrice == undefined && craftedPrice == undefined) {
                return undefined;
            } else if (marketPrice != undefined && craftedPrice != undefined) {
                return Math.min(marketPrice,craftedPrice);
            } else if (marketPrice != undefined) {
                return marketPrice;
            } else {
                return craftedPrice;
            }
        }
    }

    calculateCraftingCost(items:Map<string,Item>) {
        // Go through recipes and update crafting costs each time?
        // Or go through dates and cities and go through each recipe each time
        for (const recipe of this.recipes) {
            // For each item in the recipe, if crafting cost is not yet determined, determine its crafting cost first
            //recipe.calculateCraftingCost(items,????);
        }
    }

    #setTier() {
        const secondValue = parseInt(this.id.charAt(1));
        if (this.id.charAt(0) === "T" && !Number.isNaN(secondValue)) {
            this.tier = secondValue;
        } else {
            console.log(`Id ${this.priceId} has no tier found`);
        }
    }

    #setEnchantment() {
        const lastVal = parseInt(this.priceId.charAt(this.priceId.length-1));
        if (!isNaN(lastVal) && this.priceId.charAt(this.priceId.length-2) == "@") {
            this.enchantment = lastVal;
        }
    }

    #setRecipesAndCategories() {
        let path;
        if (this.id.charAt(0)=="T") {
            path = recipesWithT[this.id];
        } else {
            path = recipesWithoutT[this.id];
        }
        if (path == null) {
            console.log(`No path found for id ${this.id}`);
            return;
        }
        let itemInfo = itemsJSON;
        for (const pathElement of path) {
            itemInfo = itemInfo[pathElement];
        }
        //console.log(itemInfo);
        
        this.category = itemInfo["@shopcategory"];

        this.subcategory = itemInfo["@shopsubcategory1"];
        if (itemInfo.hasOwnProperty("enchantments") && this.enchantment > 0) {
            itemInfo = itemInfo.enchantments.enchantment[this.enchantment-1];
        }
        if (!itemInfo.hasOwnProperty("craftingrequirements")) {
            console.log(`ID ${this.id} cannot be crafted`);
            return;
        }
        let craftingRequirements = itemInfo.craftingrequirements;
        // Add a recipe based on the contents of craftingrequirements
        
        const addRecipe= (element:CraftingRequirement) => {
            //console.log(`id: ${this.id}, addRecipe element: ${JSON.stringify(element)}`);
            if (element.hasOwnProperty("craftresource")) {
                let craftResource = element.craftresource;
                if (!Array.isArray(craftResource)) {
                    craftResource = [craftResource];
                }
                //console.log(`craftresource used to add to recipe: ${craftResource}`);
                let currentRecipe = new Recipe(element["@craftingfocus"],element["@silver"],element["@time"],craftResource);
                if (element.hasOwnProperty("@amountcrafted")) {
                    currentRecipe.amount = parseInt(element["@amountcrafted"]);
                }
                this.recipes.push(currentRecipe);
            }
        }
        if (Array.isArray(craftingRequirements)) {
            for (const craftingRequirement of craftingRequirements) {
                addRecipe(craftingRequirement);
            }
        } else {
            addRecipe(craftingRequirements);
        }
        
        // Item id must end with @number
        if (itemInfo.hasOwnProperty("upgraderequirements")) {
            //let upgradeRequirements = itemInfo.upgraderequirements;
            let previousId;
            if (this.enchantment === 1) {
                previousId = this.priceId.slice(0,-2);
            } else {
                previousId = this.priceId.slice(0,-1)+(this.enchantment-1);
            }
            let initialRecipe = new Recipe((0).toString(),(0).toString(),(0).toString(),[itemInfo.upgraderequirements.upgraderesource]);
            
            initialRecipe.addResource(previousId,1);
            this.recipes.push(initialRecipe);
        }
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
    static getPriceId(s:string) {
        if (s.endsWith("LEVEL",s.length-1)) {
            // Convert resources ending with LEVEL# (T4_PLANKS_LEVEL1) to LEVEL#@# (T4_PLANKS_LEVEL1@1)
            // Add exceptions for FISHSAUCE and ALCHEMY_EXTRACT
            if (!s.startsWith("FISHSAUCE",3) && !s.startsWith("ALCHEMY_EXTRACT",3)) {
                return s+"@"+s.charAt(s.length-1);
            }
        } 
        else if (s.startsWith("RANDOM_DUNGEON",3)) {
            const lastValue = parseInt(s.charAt(s.length-1));
            if (lastValue > 1) {
                return s+"@"+(lastValue-1);
            }
        }
        else if (s.startsWith("UNIQUE_LOOTCHEST_COMMUNITY") && s.endsWith("PREMIUM")) {
            return s+"@1";
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
        if(enchantedMounts.includes(s)) {
            return s+"@1";
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
            return s+"@1";
        }
        const enchantedDeco2 = [
            "UNIQUE_FURNITUREITEM_MORGANA_CAMPFIRE_D",
            "UNIQUE_FURNITUREITEM_MORGANA_SIEGE_BALLISTA_A",
            "UNIQUE_FURNITUREITEM_MORGANA_WEAPONCRATE_A"
        ];
        if (enchantedDeco2.includes(s)) {
            return s+"@2";
        }
        const enchantedDeco3 = [
            "UNIQUE_FURNITUREITEM_MORGANA_PENTAGRAM",
            "UNIQUE_FURNITUREITEM_MORGANA_PRISON_CELL_C",
            "UNIQUE_FURNITUREITEM_MORGANA_TENT_A"
        ];
        if (enchantedDeco3.includes(s)) {
            return s+"@3";
        }
        if (s.startsWith("JOURNAL",3)) {
            return s+"_EMPTY";
        }
        return s;
    }
    
    static getBaseId(s:string) {
        if (s.charAt(s.length-2)==="@") {
            return s.slice(0,s.length-2)
        }
        else if (s.startsWith("JOURNAL",3) && (s.endsWith("EMPTY") || s.endsWith("FULL"))) {
            console.log(s);
            console.log(s.slice(0,s.lastIndexOf("_")));
            return s.slice(0,s.lastIndexOf("_"));
        }
        return s;
    }
}

class PriceInfo {
    price = new Map<string,number>(); // City name, price value 
}

/**
 * This class used to store additional price info so that price fetch calculations can be more accurate
 */
class ExtendedPriceInfo extends PriceInfo{
    priceTimescale = new Map<string,number>(); // City name, timescale covered
    // Price qualities so that items with variable quality are saved as quality 2 if possible
    priceQualities = new Map<string,number>(); // City name, quality number
}


export {DateEnum,Item,CraftResource};