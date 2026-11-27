import express from "express";
import fs from "fs";

const app = express();

app.use(express.static("web"))

function parseRoute(route="") {
    let index = fs.readFileSync(__dirname + "/" + "web" + "/app.html").toString();

    var routePath = __dirname + "/" + "web" + "/routes" + "/" + route + ".html";

    let exist = fs.existsSync(routePath);

    if(exist){
        // no action
    }else{
        route = "404";
        routePath = __dirname + "/" + "web" + "/routes" + "/" + route + ".html";
    }

    let filePath = fs.readFileSync(routePath).toString();

    return index.replaceAll(`{${route}}`, "active").replace("{maincontent}", filePath);
}

app.get("/", (req,res) => {
    res.send(parseRoute("home"));
});

app.get("/:route", (req, res) => {
    res.send(parseRoute(req.params.route));
})

app.listen(3000, () => {
    console.log("[*] Server Running at :3000.")
    console.log("i love hananene, mitskou, aoiaoi")
});