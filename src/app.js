import express from 'express';
import { resolve } from "path";
import ejs from 'ejs';
import appRouter from "./routes/router.js";
 
const app = express();
const port = 3000;
 
app.set("view engine", 'ejs');
app.set("views", resolve("./views"));
app.use(express.static(resolve("./public")));
app.use(express.urlencoded({ extended: true }));
 
// Middleware de layout: inyecta cada vista dentro de views/layouts/main.ejs
app.use((req, res, next) => {
    const originalRender = res.render.bind(res);
    res.render = function(view, options = {}) {
        ejs.renderFile(resolve(`./views/${view}.ejs`), options, {}, (err, body) => {
            if (err) return next(err);
            originalRender('layouts/main', { ...options, body });
        });
    };
    next();
});
 
app.use("/", appRouter);
 
app.listen(port, () => {
    console.log(`FarmaTrack 🚀  http://localhost:${port}`);
});