const { app, initialize } = require("./app");

const PORT = process.env.PORT || 3000;

async function start() {
    try {
        await initialize();

        app.listen(PORT, () => {
            console.log(
                `Jessie Collection API berjalan di http://localhost:${PORT}`
            );
        });
    } catch (error) {
        console.error(
            "Gagal menyiapkan database:",
            error.message
        );

        process.exit(1);
    }
}

start();