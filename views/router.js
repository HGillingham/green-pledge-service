import express from "express";
import pledgesController from "../controllers/pledgesController.js";

const Router = express.Router();

Router.route("/pledges")
    .get(pledgesController.getAllPledges)
    .post(pledgesController.createPledge);

Router.route("/pledges/:id")
    .get(pledgesController.getPledgeById)
    .put(pledgesController.updatePledgeById)
    .delete(pledgesController.deletePledgeById);

export default Router;