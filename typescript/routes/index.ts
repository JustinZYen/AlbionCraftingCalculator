import { Router } from 'express';
import {stationNames} from "../public/javascripts/globals/constants.js"

var router = Router();

/* GET home page. */
router.get('/', function(_req, res, _next) {
  res.render('index', { stationNames: stationNames });
});

export default router;
