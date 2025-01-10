import { Router } from 'express';
var dataRouter = Router();
/* Testing route */
dataRouter.get('/patch-data', async function (req, res, _next) {
    const patchDataCollection = req.app.locals.db.collection("PatchData");
    const patchData = (await patchDataCollection.findOne({})); // Should be guaranteed to have patch data
    if (patchData != null) {
        res.json({
            currentPatchDate: patchData.currentPatchDate,
            previousPatchDate: patchData.previousPatchDate
        });
    }
    else {
        res.json({
            currentPatchDate: undefined,
            previousPatchDate: undefined
        });
    }
});
export { dataRouter };
