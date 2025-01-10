import { Router } from 'express';
import { Db } from 'mongodb';
var dataRouter = Router();

/* Testing route */
dataRouter.get('/patch-data', async function (req, res, _next) {
    const patchDataCollection = (<Db>req.app.locals.db).collection("PatchData");
    const patchData = (await patchDataCollection.findOne({})); // Should be guaranteed to have patch data
    if (patchData != null) {
        res.json({
            currentPatchDate:patchData.currentPatchDate,
            previousPatchDate:patchData.previousPatchDate
        });
    } else {
        res.json({ // Patch date info was undefined
            currentPatchDate:undefined,
            previousPatchDate:undefined
        })
    }
    
});

export { dataRouter };