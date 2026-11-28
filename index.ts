import express from "express";
import fs from "fs";
import { Database } from "bun:sqlite"

import DOMPurify from "isomorphic-dompurify";

function purify(text: string) {
    if (typeof text !== "string") return "";

    return DOMPurify.sanitize(text, {
        ALLOWED_TAGS: [],
        ALLOWED_ATTR: []
    }).trim();
}

const app = express();

// initialize blacklist
let blacklist = [];

if (fs.existsSync("word-blacklist.json")) {
    blacklist = JSON.parse(fs.readFileSync("word-blacklist.json").toString());
} else if (fs.existsSync("word-blacklist.example.json")) {
    blacklist = JSON.parse(fs.readFileSync("word-blacklist.example.json").toString());
}


const db = new Database(process.env['DB'], {
    create: true
})

db.run(`
    CREATE TABLE IF NOT EXISTS visitors (
        id INTEGER PRIMARY KEY,
        count INTEGER NOT NULL DEFAULT 0
    )
`);

db.run(`
    CREATE TABLE IF NOT EXISTS notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`);

db.run(`
    INSERT OR IGNORE INTO visitors (id, count)
    VALUES (1, 0)
`);

app.use(express.static("web"))

function parseRoute(route = "") {
    let index = fs.readFileSync(__dirname + "/" + "web" + "/app.html").toString();

    var routePath = __dirname + "/" + "web" + "/routes" + "/" + route + ".html";

    let exist = fs.existsSync(routePath);
    var visitors = 0;

    if (route == "home") {
        visitors = (db.query("SELECT count FROM visitors WHERE id = 1").get() as any)?.count!;
    }

    if (exist) {
        // no action
    } else {
        route = "404";
        routePath = __dirname + "/" + "web" + "/routes" + "/" + route + ".html";
    }

    let names: Record<string, string> = {
        "home": "Home Sweet Home",
        "arts": "Some of Aidairo's Arts",
        "notes": "Guest Book with Notes?",
        "404": "I'm lost, where am I?"
    }


    let filePath = fs.readFileSync(routePath).toString();

    return index.replaceAll(`{${route}}`, "active").replace("{title}", names[route] ?? "404").replace("{maincontent}", filePath).replace("{visitors}", visitors.toString());
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }))

app.get("/", (req, res) => {
    db.run("UPDATE visitors SET count = count + 1 WHERE id = 1");
    res.send(parseRoute("home"));
});

app.get("/get-notes", (req, res) => {
    const notes = db.query(
        "SELECT * FROM notes ORDER BY id DESC"
    ).all();

    res.json(notes);
});

app.post("/post-note", (req, res) => {
    const { name, content } = req.body ?? {};

    let nacont = (name + content).split(" ");

    const isViolated = blacklist.some((word: string) =>
        name.toLowerCase().includes(word.toLowerCase()) ||
        content.toLowerCase().includes(word.toLowerCase())
    );

    if (isViolated == true) {
        res.status(400).json({
            success: false,
            message: "You just triggered the content protection!"
        });
        return;
    }

    if (
        typeof name !== "string" ||
        typeof content !== "string" ||
        !name.trim() ||
        !content.trim()
    ) {
        return res.status(400).json({
            success: false,
            message: "Name and content are required!"
        });
    }

    try {
        db.run(
            "INSERT INTO notes (name, content) VALUES (?, ?)",
            [purify(name.trim()), purify(content.trim())]
        );

        res.json({
            success: true,
            message: "Note posted successfully!"
        });
    } catch (err) {
        console.error(err);

        res.status(500).json({
            success: false,
            message: "Failed to post note."
        });
    }
});

app.get("/:route", (req, res) => {
    res.send(parseRoute(req.params.route));
})

app.listen(process.env['PORT'], () => {
    console.log("[*] Server Running at :" + process.env['PORT'])
    console.log("i love hananene, mitskou, aoiaoi")
});