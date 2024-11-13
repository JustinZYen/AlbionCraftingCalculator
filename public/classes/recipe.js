import { Item } from "./item.js";
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
            if (Object.hasOwn(craftResource, "@maxreturnamount")) {
                currentResource["returned"] = false;
            }
            else {
                currentResource["returned"] = true;
            }
            Object.freeze(currentResource);
            this.resources.push(currentResource);
        }
    }
    calculateCraftingCost(items, timespan, city) {
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
class CraftingBonusRecipe extends Recipe {
    focus;
    city;
    constructor(silver, focus, city, resources) {
        super(silver, resources);
        this.focus = focus;
        this.city = city;
    }
}
class MultiRecipe extends CraftingBonusRecipe {
    amount;
    constructor(silver, focus, city, amount, resources) {
        super(silver, focus, city, resources);
        this.amount = amount;
    }
}
class ButcherRecipe extends MultiRecipe {
}
class EnchantmentRecipe extends Recipe {
    addLowerEnchantment(priceId) {
        const currentResource = Object.create(null);
        currentResource["priceId"] = priceId;
        currentResource["count"] = 1;
        currentResource["returned"] = false;
        Object.freeze(currentResource);
        this.resources.push(currentResource);
    }
}
export { Recipe, CraftingBonusRecipe, MultiRecipe, ButcherRecipe, EnchantmentRecipe };
