import { ItemBox } from "./ItemBox.js";
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
export { RecipeBox };
