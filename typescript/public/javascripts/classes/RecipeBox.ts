import { ItemBox } from "./ItemBox.js";

class RecipeBox {
    craftedItems: ItemBox[] = []; // The item array that this recipe is used to craft (ItemBox)
    private currentBox; // The box corresponding to this recipe
    boundedItems: ItemBox[] = []; // The items that this recipebox contains
    index; // Index of recipe box to allow for quicker referencing in nodes list
    x = 0;
    y = 0;
    width: number;
    height: number;
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
        this.setHeight(ItemBox.BOX_HEIGHT + 4.8);
        this.setWidth(0);
        this.index = -1;
    }

    insertItem(itemBox:ItemBox) {
        itemBox.addToRecipeBox(this.currentBox);
        this.setWidth(this.width+ItemBox.BOX_WIDTH);
    }

    setX(x: number) {
        this.x = x;
        this.currentBox.style.left = x + "px";
    }

    setY(y: number) {
        this.y = y;
        this.currentBox.style.top = y + "px";
    }
    private setWidth(width: number) {
        this.width = width;
        this.currentBox.style.width = width + "px";
    }
    private setHeight(height: number) {
        this.height = height;
        this.currentBox.style.height = height + "px";
    }
}

export { RecipeBox }