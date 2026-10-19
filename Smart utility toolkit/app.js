const isEven = require("./modules/isEven");
const log = require("./modules/logger");

log("Starting custom module demonstration.");

const numbers = [2, 7, 10, 15, 24];

for (const number of numbers) {
    log(`${number} is ${isEven(number) ? "even" : "odd"}.`);
}

log("Custom module demonstration completed.");
