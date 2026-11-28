import express from "express";
import fs from "fs";
import { Database } from "bun:sqlite"

const app = express();

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
    INSERT OR IGNORE INTO visitors (id, count)
    VALUES (1, 0)
`);

app.use(express.static("web"))

function parseRoute(route="") {
    let index = fs.readFileSync(__dirname + "/" + "web" + "/app.html").toString();

    var routePath = __dirname + "/" + "web" + "/routes" + "/" + route + ".html";

    let exist = fs.existsSync(routePath);
    var visitors = 0;

    if(route == "home"){
        visitors = (db.query("SELECT count FROM visitors WHERE id = 1").get()as any)?.count!;
    }

    if(exist){
        // no action
    }else{
        route = "404";
        routePath = __dirname + "/" + "web" + "/routes" + "/" + route + ".html";
    }

    let filePath = fs.readFileSync(routePath).toString();

    return index.replaceAll(`{${route}}`, "active").replace("{maincontent}", filePath).replace("{visitors}", visitors.toString());
}

app.get("/", (req,res) => {
    db.run("UPDATE visitors SET count = count + 1 WHERE id = 1");
    res.send(parseRoute("home"));
});

app.get("/:route", (req, res) => {
    res.send(parseRoute(req.params.route));
})

app.listen(process.env['PORT'], () => {
    console.log("[*] Server Running at :" + process.env['PORT'])
    console.log("i love hananene, mitskou, aoiaoi")
});