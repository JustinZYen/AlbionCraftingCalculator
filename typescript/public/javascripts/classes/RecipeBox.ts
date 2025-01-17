import { ItemBox } from "./ItemBox.js";

class RecipeBox {
    craftedItems: ItemBox[] = []; // The item array that this recipe is used to craft (ItemBox)
    private currentBox; // The box corresponding to this recipe
    boundedItems: ItemBox[] = []; // The items that this recipebox contains
    index; // Index of recipe box to allow for quicker referencing in nodes list
    private width: number; // Used to position the recipe box correctly inside the force directed graph (otherwise, positions based on top left corner)
    private height: number;
    //static BOX_WIDTH = 200;
    /**
     * 
     * @param {Item} craftedItem 
     */
    constructor(craftedItem: ItemBox | null,container:HTMLElement) {
        if (craftedItem != null) {
            this.craftedItems.push(craftedItem);
        }
        this.currentBox = document.createElement("div");
        this.currentBox.classList.add("recipe-box");
        container.appendChild(this.currentBox);
        const boxStyles = getComputedStyle(this.currentBox);
        this.setHeight(ItemBox.BOX_HEIGHT_PX + this.parsePX(boxStyles.borderTopWidth) + this.parsePX(boxStyles.borderBottomWidth));
        this.setWidth(this.parsePX(boxStyles.borderLeftWidth)+this.parsePX(boxStyles.borderRightWidth));
        this.index = -1;
    }

    insertItem(itemBox:ItemBox) {
        itemBox.addToRecipeBox(this.currentBox);
        this.boundedItems.push(itemBox);
        this.setWidth(this.width+ItemBox.BOX_WIDTH_PX);
    }

    setX(x: number) {
        this.currentBox.style.left = x + "px";
    }

    setY(y: number) {
        this.currentBox.style.top = y + "px";
    }

    private setWidth(width: number) {
        this.width = width;
    }
    private setHeight(height: number) {
        this.height = height;
    }

    getWidth() {
        return this.width;
    }

    getHeight() {
        return this.height;
    }

    private parsePX(styleValue:string) {
        // Make sure style value really ends with a "px"
        if (styleValue.substring(styleValue.length-2) != "px") {
            console.error(`Style value of ${styleValue} does not end with a "px" - numbers may not accurate`);
        }
        return parseFloat(styleValue.substring(0,styleValue.length-2));
    }
}

export { RecipeBox }