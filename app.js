import createError from 'http-errors';
import express, { json, urlencoded } from 'express';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import helmet from "helmet";
import { indexRouter } from './routes/index.js';
import { MongoClient, ServerApiVersion } from 'mongodb';
import { dataRouter } from './routes/data.js';
var app = express();
const __dirname = dirname(fileURLToPath(import.meta.url));
// view engine setup
app.set('views', join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            frameAncestors: ["https://justinyen.azurewebsites.net/"], // Allow my portfolio website to embed this site as iframe
            scriptSrc: [
                "'self'",
                "https://ajax.googleapis.com/ajax/libs/jquery/3.7.1/jquery.min.js",
                "https://code.jquery.com/ui/1.13.2/jquery-ui.js",
                "https://cdn.jsdelivr.net/npm/d3@7",
            ],
            defaultSrc: helmet.contentSecurityPolicy.dangerouslyDisableDefaultSrc // Didn't want to deal with inputting all the firebase urls as I am planning on removing the firebase component
        }
    }
}));
app.use(logger('dev'));
app.use(json());
app.use(urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(join(__dirname, 'public')));
app.use('/', indexRouter);
app.use("/data", dataRouter);
// catch 404 and forward to error handler
app.use(function (_req, _res, next) {
    next(createError(404));
});
const uri = `mongodb+srv://justzyen:${process.env.MONGODB_PASS}@cluster0.mlg66.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});
await client.connect();
app.locals.db = client.db("AlbionOnline");
export default app;
