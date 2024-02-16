const movement = (event) => {
    //alert("moved");
    if (mouseDown) {
        ctx.lineTo(event.offsetX,event.offsetY);
        ctx.stroke();
    } else {
        ctx.beginPath();
    }
}
//alert("hello");
const myCanvas = document.getElementById("testCanvas");
const ctx = myCanvas.getContext("2d");
ctx.beginPath();
ctx.moveTo(0,0);
let mouseDown = false;
myCanvas.addEventListener('mousemove',movement,false);
document.body.onmousedown = () => mouseDown = true;
document.body.onmouseup = () => mouseDown = false;