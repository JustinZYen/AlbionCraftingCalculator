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
    currentBox; // The box corresponding to this item
    item; // Item object
    craftingRecipes = [];
    offset;
    craftingCost:number;
    craftingCostSpan;
    links = new Map(); 
    count;
    static BOX_WIDTH = 200;
    static BOX_HEIGHT = 100;
    /**
     * 
     * @param {RecipeBox} boundingRecipe 
     * @param {Item} item 
     * @param {Number} offset 
     * @param {Boolean} allowInput
     */
    constructor(boundingRecipe:RecipeBox, item:Item, offset:number,count:number) {
        this.boundingRecipe = boundingRecipe;
        this.boundingRecipe.boundedItems.push(this);
        this.currentBox = document.createElement("div");
        this.currentBox.classList.add("item-box");
        this.currentBox.style.left = offset+"px";
        this.currentBox.style.width = ItemBox.BOX_WIDTH+"px";
        this.currentBox.style.height = ItemBox.BOX_HEIGHT+"px";
        this.item = item;
        this.offset = offset;
        this.count = count;
        // Create box sections
        const descriptor = document.createElement("p");
        descriptor.innerText = `${idToName[this.item.priceId]} (${this.item.tier}.${this.item.enchantment}) (x${count})`;
        this.currentBox.appendChild(descriptor);

        const craftCost = document.createElement("p");
        craftCost.innerText = "Crafting cost: ";
        this.craftingCostSpan = document.createElement("span");
        this.craftingCostSpan.innerText = "N/A";
        craftCost.appendChild(this.craftingCostSpan);
        this.currentBox.appendChild(craftCost);

        const buyCost = document.createElement("p");
        buyCost.innerText = "Market price: ";
        const inputBox = document.createElement("input");
        inputBox.type = "text";
        let priceInfos = null;
        if (!$("#date-selector").is(":checked")) {
            priceInfos = item.priceInfos.get(DateEnum.Old)!;
        } else {
            priceInfos = item.priceInfos.get(DateEnum.New)!;
        }
        const cityPrice = priceInfos.price.get((<HTMLInputElement>document.getElementById("city-selector"))!.value);
        if (cityPrice) {
            inputBox.placeholder = cityPrice.toString();
        } else {
            inputBox.placeholder = "Undefined";
        }
        buyCost.appendChild(inputBox)
        this.currentBox.appendChild(buyCost);
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