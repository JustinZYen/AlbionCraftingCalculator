import { idToName } from "../external-data.js";
class RecipeBox {
    craftedItems = []; // The item array that this recipe is used to craft (ItemBox)
    currentBox; // The box corresponding to this recipe
    boundedItems = []; // The items that this recipebox contains
    index; // Index of recipe box to allow for quicker referencing in nodes list
    x = 0;
    y = 0;
    width;
    height;
    //static BOX_WIDTH = 200;
    /**
     *
     * @param {Item} craftedItem
     */
    constructor(craftedItem) {
        if (craftedItem != null) {
            this.craftedItems.push(craftedItem);
        }
        this.currentBox = document.createElement("div");
        this.setHeight(ItemBox.BOX_HEIGHT + 4.8);
        this.index = -1;
    }
    setX(x) {
        this.x = x;
        this.currentBox.style.left = x + "px";
    }
    setY(y) {
        this.y = y;
        this.currentBox.style.top = y + "px";
    }
    setWidth(width) {
        this.width = width;
        this.currentBox.style.width = width + "px";
    }
    setHeight(height) {
        this.height = height;
        this.currentBox.style.height = height + "px";
    }
}
class ItemBox {
    boundingRecipe; // The box that contains this item (RecipeBox)
    currentBox; // The box corresponding to this item
    item; // Item object
    craftingRecipes = [];
    offset;
    craftingCost;
    craftingCostSpan;
    marketPriceSpan;
    overrideInput;
    links = new Map();
    count;
    static BOX_WIDTH = 200;
    static BOX_HEIGHT = 100;
    constructor(boundingRecipe, item, offset, count) {
        this.boundingRecipe = boundingRecipe;
        this.boundingRecipe.boundedItems.push(this);
        this.item = item;
        this.offset = offset;
        this.count = count;
        // Create box sections
        this.intializeItemBox(offset, count);
    }
    intializeItemBox(offset, count) {
        this.currentBox = document.createElement("div");
        this.currentBox.classList.add("item-box");
        this.currentBox.style.left = offset + "px";
        this.currentBox.style.width = ItemBox.BOX_WIDTH + "px";
        this.currentBox.style.height = ItemBox.BOX_HEIGHT + "px";
        const descriptor = document.createElement("p");
        descriptor.innerText = `${idToName[this.item.priceId]} (${this.item.tier}.${this.item.enchantment}) (x${count})`;
        this.currentBox.appendChild(descriptor);
        const craftCost = document.createElement("p");
        craftCost.innerText = "Crafting cost: ";
        this.craftingCostSpan = document.createElement("span");
        craftCost.appendChild(this.craftingCostSpan);
        this.currentBox.appendChild(craftCost);
        const buyCost = document.createElement("p");
        buyCost.innerText = "Market price: ";
        this.marketPriceSpan = document.createElement("span");
        buyCost.appendChild(this.marketPriceSpan);
        this.currentBox.appendChild(buyCost);
        const override = document.createElement("p");
        override.innerText = "Override: ";
        this.overrideInput = document.createElement("input");
        this.overrideInput.type = "number";
        this.overrideInput.addEventListener("change", (event) => {
            const overrideValue = parseFloat(event.currentTarget.value);
            console.log("override value: " + overrideValue);
            if (Number.isNaN(overrideValue)) {
                console.log("1");
                this.item.overridePrice = undefined;
            }
            else {
                console.log("2");
                this.item.overridePrice = overrideValue;
            }
        });
        override.appendChild(this.overrideInput);
        this.currentBox.appendChild(override);
    }
    loadItemData(timespan, city, stationFees, productionBonuses) {
        if (city != undefined) {
            this.item.calculateCraftingCost(timespan, city, stationFees, productionBonuses);
            const numberFormat = Intl.NumberFormat("en-US", {
                maximumFractionDigits: 2
            });
            const craftingCost = this.item.craftedPriceInfos.get(timespan).price.get(city);
            if (craftingCost != undefined) {
                this.craftingCostSpan.innerText = numberFormat.format(craftingCost);
            }
            else {
                this.craftingCostSpan.innerText = "N/A";
            }
            const marketPrice = this.item.priceInfos.get(timespan).price.get(city);
            if (marketPrice != undefined) {
                this.marketPriceSpan.innerText = numberFormat.format(marketPrice);
            }
            else {
                this.marketPriceSpan.innerText = "N/A";
            }
            const overridePrice = this.item.overridePrice;
            if (overridePrice != undefined) {
                this.overrideInput.value = overridePrice.toString();
            }
        }
    }
    setCraftingCost(newCost) {
        this.craftingCost = newCost;
        this.craftingCostSpan.innerText = newCost.toString();
    }
    toString() {
        return "Item box for " + this.item;
    }
}
export { RecipeBox, ItemBox };
