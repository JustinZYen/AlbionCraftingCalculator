import { City } from "../globals/constants.js";
import { idToName } from "../external-data.js";
import { DateEnum, Item } from "./item.js";
class RecipeBox {
    craftedItems:ItemBox[] = []; // The item array that this recipe is used to craft (ItemBox)
    currentBox; // The box corresponding to this recipe
    boundedItems:ItemBox[] = []; // The items that this recipebox contains
    index; // Index of recipe box to allow for quicker referencing in nodes list
    x = 0;
    y = 0;
    width:number;
    height:number;
    //static BOX_WIDTH = 200;
    /**
     * 
     * @param {Item} craftedItem 
     */
    constructor(craftedItem:ItemBox|null) {
        if (craftedItem != null) {
            this.craftedItems.push(craftedItem);
        }
        this.currentBox = document.createElement("div");
        this.setHeight(ItemBox.BOX_HEIGHT+4.8);
        this.index = -1;
    }

    setX(x:number) {
        this.x = x;
        this.currentBox.style.left = x+"px";
    }

    setY(y:number) {
        this.y = y;
        this.currentBox.style.top = y+"px";
    }
    setWidth(width:number) {
        this.width = width;
        this.currentBox.style.width = width+"px";
    }
    setHeight(height:number) {
        this.height = height;
        this.currentBox.style.height = height+"px";
    }
}

class ItemBox {
    boundingRecipe:RecipeBox; // The box that contains this item (RecipeBox)
    currentBox:HTMLDivElement; // The box corresponding to this item
    item; // Item object
    craftingRecipes = [];
    offset;
    craftingCost:number;
    private craftingCostSpan:HTMLSpanElement;
    private marketPriceSpan:HTMLSpanElement;
    private overrideInput:HTMLInputElement;
    links = new Map(); 
    count;
    static BOX_WIDTH = 200;
    static BOX_HEIGHT = 100;

    constructor(boundingRecipe:RecipeBox, item:Item, offset:number,count:number) {
        this.boundingRecipe = boundingRecipe;
        this.boundingRecipe.boundedItems.push(this);
        
        this.item = item;
        this.offset = offset;
        this.count = count;
        // Create box sections
        this.intializeItemBox(offset,count);        
    }

    private intializeItemBox(offset:number,count:number) {
        this.currentBox = document.createElement("div");
        this.currentBox.classList.add("item-box");
        this.currentBox.style.left = offset+"px";
        this.currentBox.style.width = ItemBox.BOX_WIDTH+"px";
        this.currentBox.style.height = ItemBox.BOX_HEIGHT+"px";

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
        this.overrideInput= document.createElement("input");
        this.overrideInput.type = "text";
        override.appendChild(this.overrideInput)
        this.currentBox.appendChild(override);
    }

    loadItemData(timespan:DateEnum,city:City,stationFees:Map<string,number>, productionBonuses:Map<string,number>) {
        if (city != undefined) {
            this.item.calculateCraftingCost(timespan,city,stationFees,productionBonuses);
            const numberFormat = Intl.NumberFormat("en-US",{
                maximumFractionDigits: 2
            })
            const craftingCost = this.item.craftedPriceInfos.get(timespan)!.price.get(city);
            if (craftingCost != undefined) {
                this.craftingCostSpan.innerText = numberFormat.format(craftingCost);
            } else {
                this.craftingCostSpan.innerText = "N/A";
            }
            const marketPrice = this.item.priceInfos.get(timespan)!.price.get(city);
            if (marketPrice != undefined) {
                this.marketPriceSpan.innerText = numberFormat.format(marketPrice);
            } else {
                this.marketPriceSpan.innerText = "N/A";
            }
        }
    }

    setCraftingCost(newCost:number) {
        this.craftingCost = newCost;
        this.craftingCostSpan.innerText = newCost.toString();
    }

    toString() {
        return "Item box for "+this.item;
    }
}

export {RecipeBox,ItemBox};