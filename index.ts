import express from "express";

const app = express();

app.use(express.static("web"))

app.listen(3000, () => {
    console.log("[*] Server Running at :3000.")
    console.log("i love hananene, mitskou, aoiaoi")
});