const canvas = require('canvas');
const fs = require('fs-extra');

const colours = {
    'january': '#0d0df4',
    'february': '#1a9ef2',
    'march': '#66e0c8',
    'april': '#19e479',
    'may': '#b6df12',
    'june': '#ffc333',
    'july': '#e6711b',
    'august': '#d8192b',
    'september': '#e6256c',
    'october': '#e4a4bb',
    'november': '#8b14a1',
    'december': '#4c20c9'
}

const getRGBColor = (hex) => {
    let colorValue;
    hex = hex.substr(1);
    colorValue = parseInt(hex, 16);

    return {
        r: colorValue >> 16,
        g: (colorValue >> 8) & 255,
        b: colorValue & 255
    }
}

const generateMainImage = async(playlist, image) => {
    const canvi = canvas.createCanvas(1280, 720);
    const ctx = canvi.getContext('2d');

    console.log('generating image for', playlist.title);
    ctx.drawImage(image, 0, 0, 1280, 720);

    // create duotone gradient
    const canvasData = ctx.getImageData(0, 0, 1280, 720);
    const data = canvasData.data;
    let gradient = [];
    const minValue = 0;
    const maxValue = 250;
    const from = getRGBColor('#111111');
    const to = getRGBColor(colours[playlist.month.toLowerCase()]);

    for (var i = minValue; i <= maxValue; i++) {
        const intensityB = i;
        const intensityA = maxValue - intensityB;
        gradient[i] = {
            r: (intensityA*from.r + intensityB*to.r) / maxValue,
            g: (intensityA*from.g + intensityB*to.g) / maxValue,
            b: (intensityA*from.b + intensityB*to.b) / maxValue
        }
    }

    const offset = 256 - maxValue;

    for (var i = 0; i <= offset; i++) {
        if (offset / 4 > i) {
            gradient.unshift(gradient[0]);
        } else {
            gradient.push(gradient[gradient.length - 1]);
        }
    }

    // convert pixels to greyscale then map on to graident
    for (var i = 0; i < data.length; i+=4) {
        const redValue = data[i];
        const greenValue = data[i+1];
        const blueValue = data[i+2];
        let grey = Math.floor(0.2126 * redValue + 0.7152 * greenValue + 0.0722 * blueValue); 

        data[i] = gradient[grey].r;
        data[i+1] = gradient[grey].g;
        data[i+2] = gradient[grey].b;
        data[i+3] = 255;
    }

    ctx.putImageData(canvasData, 0, 0);

    // write image
    const buffer = canvi.toBuffer('image/jpeg', { quality: 0.8 });
    fs.writeFileSync('./images/' + playlist.title.toLowerCase().replace(/ /g, '-') + '.jpeg', buffer);

    return canvasData;
}

const generateDSPImage = async(playlist, baseImage) => {
    console.log('generating dsp image for', playlist.title);

    // setup canvas and draw the baseImage
    const canvi = canvas.createCanvas(720, 720);
    const ctx = canvi.getContext('2d');
    ctx.putImageData(baseImage, -280, 0);

    // draw the logo 
    const logoBase64 = fs.readFileSync("./src/images/logo.png", "base64");
    const logo = new canvas.Image();
    logo.src = `data:image/png;base64,${logoBase64}`;
    ctx.drawImage(logo, 20, 20, 200, 146); // magic numbers are half size of logo in assets folder

    // add name of playlist
    canvas.registerFont("./src/fonts/AdelleSans-Bold.ttf", { family: "Adelle" });
    ctx.font = '100px "Adelle"';
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    let x = 55;

    // draw month
    for (const letter of playlist.month.toUpperCase()) {
        ctx.save();
        ctx.translate(x, 565);
        const randomAngle = (Math.random() * 35) - 17.5;
        ctx.rotate(randomAngle * Math.PI / 180);
        ctx.fillText(letter, 0, 0);
        ctx.restore();
        x += ctx.measureText(letter).width + 10;
    }

    x = 55;

    // draw year
    for (const number of playlist.year) {
        ctx.save();
        ctx.translate(x, 665);
        const randomAngle = (Math.random() * 35) - 17.5;
        ctx.rotate(randomAngle * Math.PI / 180);
        ctx.fillText(number, 0, 0);
        ctx.restore();
        x += ctx.measureText(number).width + 10;
    }

    // write image
    const buffer = canvi.toBuffer('image/jpeg', { quality: 0.8 });
    fs.writeFileSync('./images/' + playlist.title.toLowerCase().replace(/ /g, '-') + '--dsp.jpeg', buffer);
}

module.exports = {
    generateFor: async(playlist) => {
        const image = await canvas.loadImage(playlist.cover);

        console.log(image);

        const mainImage = await generateMainImage(playlist, image);
        await generateDSPImage(playlist, mainImage);
    }
}