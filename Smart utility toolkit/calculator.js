const args = process.argv.slice(2);

const operation = args[0];
const num1 = Number(args[1]);
const num2 = Number(args[2]);

console.log("Starting calculator...");
console.log("Operation:", operation);
console.log("Numbers:", num1, num2);

if (
    args.length !== 3 ||
    !["add", "subtract", "multiply", "divide"].includes(operation) ||
    args[1].trim() === "" ||
    args[2].trim() === "" ||
    !Number.isFinite(num1) ||
    !Number.isFinite(num2)
) {
    console.log("Invalid input.");
    console.log("Usage: node calculator.js <operation> <num1> <num2>");
    console.log("Operations: add, subtract, multiply, divide");
} else {
    let result;

    switch (operation) {
        case "add":
            result = num1 + num2;
            break;
        case "subtract":
            result = num1 - num2;
            break;
        case "multiply":
            result = num1 * num2;
            break;
        case "divide":
            if (num2 === 0) {
                console.log("Error: Division by zero is not allowed.");
                process.exitCode = 1;
            } else {
                result = num1 / num2;
            }
            break;
    }

    if (result !== undefined) {
        console.log("Result:", result);
    }
}

console.log("Calculator finished.");
