import { getStorage, ref, getDownloadURL } from "firebase/storage";

const storage = getStorage();
getDownloadURL(ref(storage, 'firebasetxt.txt'))
  .then((url) => {
    // `url` is the download URL for 'images/stars.jpg'

    // This can be downloaded directly:
    const xhr = new XMLHttpRequest();
    xhr.responseType = 'blob';
    xhr.onload = (event) => {
      const blob = xhr.response;
    };
    xhr.open('GET', url);
    xhr.send();

    // Or inserted into an <img> element
    const img = document.getElementById('myimg');
    img.setAttribute('src', url);
  })
  .catch((error) => {
    // Handle any errors
  });


const movement = (event) => {
    //alert("moved");
    if (mouseDown) {
        ctx.lineTo(event.offsetX,event.offsetY);
        ctx.stroke();
    } else {
        ctx.beginPath();
    }
}
async function logJSON() {
    const response = await fetch("https://west.albion-online-data.com/api/v2/stats/prices/T4_BAG,T5_BAG?locations=Caerleon,Bridgewatch&qualities=2");
    const theJSON = await response.json();
    console.log(theJSON);
}
//alert("hello");
logJSON();
const myCanvas = document.getElementById("testCanvas");
const ctx = myCanvas.getContext("2d");
ctx.beginPath();
ctx.moveTo(0,0);
let mouseDown = false;
myCanvas.addEventListener('mousemove',movement,false);
document.body.onmousedown = () => mouseDown = true;
document.body.onmouseup = () => mouseDown = false;
