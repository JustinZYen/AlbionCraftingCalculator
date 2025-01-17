import { idToName } from "../external-data.js";
import { City } from "../globals/constants.js";
import { DateEnum, Item } from "./Item.js";
import { RecipeBox } from "./RecipeBox.js";

class ItemBox {
    boundingRecipe:RecipeBox; // The box that contains this item (RecipeBox)
    private currentBox:HTMLDivElement; // The box corresponding to this item
    item; // Item object
    craftingRecipes = [];
    offset;
    craftingCost:number;
    private craftingCostSpan:HTMLSpanElement;
    private marketPriceSpan:HTMLSpanElement;
    private overrideInput:HTMLInputElement;
    links = new Map(); 
    count;
    static BOX_WIDTH_PX = 200;
    static BOX_HEIGHT_PX = 100;

    constructor(boundingRecipe:RecipeBox, item:Item, offset:number,count:number) {
        this.boundingRecipe = boundingRecipe;
        this.boundingRecipe.boundedItems.push(this);
        
        this.item = item;
        this.offset = offset;
        this.count = count;
        // Create box sections
        this.intializeItemBox(offset,count);      
    }

    /**
     * Add this item box to a recipe box. This method should only be called by the RecipeBox object that will be containing this Itembox.
     * @param container 
     */
    addToRecipeBox(container:HTMLElement) {
        container.appendChild(this.currentBox);
    }

    private intializeItemBox(offset:number,count:number) {
        this.currentBox = document.createElement("div");
        this.currentBox.classList.add("item-box");
        this.currentBox.style.left = offset+"px";
        this.currentBox.style.width = ItemBox.BOX_WIDTH_PX+"px";
        this.currentBox.style.height = ItemBox.BOX_HEIGHT_PX+"px";

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
        this.overrideInput.type = "number";
        this.overrideInput.addEventListener("change",(event)=> {
            const overrideValue = parseFloat((<HTMLInputElement>event.currentTarget).value);
            if (Number.isNaN(overrideValue)) {
                this.item.overridePrice = undefined;
            } else {
                this.item.overridePrice = overrideValue;
            }
        })
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
            const overridePrice = this.item.overridePrice;
            if (overridePrice != undefined) {
                this.overrideInput.value = overridePrice.toString();
            }
        }
    }

    setCraftingCost(newCost:number) {
        this.craftingCost = newCost;
        this.craftingCostSpan.innerText = newCost.toString();
    }

    makeMainItem() {
        this.currentBox.style.backgroundColor = "gold";
    }

    toString() {
        return "Item box for "+this.item;
    }
}

export {ItemBox};