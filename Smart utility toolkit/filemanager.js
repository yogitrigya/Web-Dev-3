const fs = require("fs");
const path = require("path");

const fileName = path.join(__dirname, "test.txt");
const operation = process.argv[2];
const content = process.argv.slice(3).join(" ");

console.log("Starting file manager...");
console.log("Operation:", operation);

async function manageFile() {
    try {
        switch (operation) {
            case "create":
                if (!content) {
                    console.log("Please provide content to create the file.");
                    return;
                }
                await fs.promises.writeFile(fileName, content, { flag: "wx" });
                console.log("File Created");
                break;

            case "read": {
                const data = await fs.promises.readFile(fileName, "utf8");
                console.log("Reading File...");
                console.log(data);
                break;
            }

            case "update":
                if (!content) {
                    console.log("Please provide content to append.");
                    return;
                }
                await fs.promises.appendFile(fileName, "\\n" + content);
                console.log("File Updated");
                break;

            case "delete":
                await fs.promises.unlink(fileName);
                console.log("File Deleted");
                break;

            default:
                console.log("Invalid operation.");
                console.log(
                    "Usage: node fileManager.js <create|read|update|delete> [content]"
                );
        }
    } catch (error) {
        if (error.code === "ENOENT") {
            console.log("Error: File does not exist.");
        } else if (error.code === "EEXIST") {
            console.log("Error: File already exists.");
        } else {
            console.log("File operation failed:", error.message);
        }
    } finally {
        console.log("File manager operation completed.");
    }
}

manageFile();
