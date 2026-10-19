const express = require("express");
const studentRoutes = require("./routes/studentRoutes");
const logger = require("./middleware/logger");

const app = express();
const PORT = 3000;

// Built-in Express middleware to parse JSON request bodies.
app.use(express.json());

// Custom logger middleware.
app.use(logger);

// Mount student routes.
app.use("/students", studentRoutes);

// Handle requests to unknown routes.
app.use((req, res) => {
    res.status(404).json({
        error: "Route not found"
    });
});

// Central error handler for malformed JSON and unexpected errors.
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
        return res.status(400).json({
            error: "Invalid JSON in request body"
        });
    }

    console.error("Server error:", err.message);
    res.status(500).json({
        error: "Internal server error"
    });
});

app.listen(PORT, () => {
    console.log(`Student Management API running at http://localhost:${PORT}`);
});
