import express from "express"; //express 패키지를 express 라는 이름으로 import
import morgan from "morgan";
import session from "express-session";
import MongoStore from "connect-mongo";
import rootRouter from "./routers/rootRouter";
import userRouter from "./routers/userRouter";
import videoRouter from "./routers/videoRouter";
import { localsMiddleware } from "./middlewares";
import apiRouter from "./routers/apiRouter";
import flash from "express-flash";

const app = express(); //express application 생성
const logger = morgan("dev");

app.use(logger);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set("view engine", "pug");
app.set("views", process.cwd() + "/src/views");

app.use(
  session({
    secret: process.env.COOKIE_SECRET,
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({ mongoUrl: process.env.DB_URL }),
  })
);

app.get("/add-one", (req, res, next) => {
  req.session.potato += 1;
  return res.send(`${req.session.id}`);
});

app.use(flash());
app.use(localsMiddleware);
app.use("/uploads", express.static("uploads"));
app.use("/static", express.static("assets"));
app.use("/", rootRouter);
app.use("/videos", videoRouter);
app.use("/users", userRouter);
app.use("/api", apiRouter);

export default app;
