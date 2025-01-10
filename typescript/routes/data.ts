import { Router } from 'express';
var dataRouter = Router();

/* Testing route */
dataRouter.get('/', async function (req, res, _next) {
    const patchData = req.app.locals.db.collection("PatchData");
    res.json(await patchData.findOne({}));
});

export { dataRouter };