const crypto = require("crypto");

const args = process.argv.slice(2);
const rolls = args.length === 0 ? 1 : Number(args[0]);

console.log("Starting dice generator...");

if (
    args.length > 1 ||
    !Number.isSafeInteger(rolls) ||
    rolls < 1 ||
    rolls > 1000
) {
    console.log("Invalid number of rolls.");
    console.log("Usage: node dice.js [numberOfRolls]");
} else {
    for (let i = 1; i <= rolls; i++) {
        const diceValue = crypto.randomInt(1, 7);
        console.log(`Roll ${i}: Dice Rolled: ${diceValue}`);
    }
}

console.log("Dice generator completed.");
