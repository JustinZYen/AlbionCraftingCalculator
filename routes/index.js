import { Router } from 'express';
import { stationNames, cityBonuses } from "../public/javascripts/globals/constants.js";
var indexRouter = Router();
/* GET home page. */
indexRouter.get('/', function (_req, res, _next) {
    res.render('index', { stationNames: stationNames, cityBonuses: cityBonuses });
});
export { indexRouter };
