import database from "../services/database.js";
import {
    ScanCommand,
    PutCommand,
    GetCommand,
    UpdateCommand,
    DeleteCommand,
} from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";
import pledgeSchema from "../models/pledge.js";


async function getAllPledges(req, res, next) {
    try {
        const params = {
            TableName: "Pledges",
        };
        const command = new ScanCommand(params);
        const result = await database.send(command);
        res.status(200).json(result.Items);
    } catch (err) {
        next(err);
    }
}

async function createPledge(req, res, next) {
    try {
        const uuid = uuidv4();
        req.body.id = uuid;
        const { error, value } = pledgeSchema.validate(req.body);

        if (error) {
            res.status(400).json({ error: error.details[0].message});
            return;
        }

        const { id, owner, pledge, completion_date, team, completed } = value;

        const params = {
            TableName: "Pledges",
            Item: {
                id,
                owner,
                pledge,
                completion_date,
                team,
                completed,
            },
        };

        const command = new PutCommand(params);

        await database.send(command);

        res
            .status(201)
            .json({ message: "successfully created pledge", data: params.Item });
    } catch (err) {
        next(err);
    }
}


async function getPledgeById(req, res, next) {
    const pledgeId = req.params.id;
    try {
        const params = {
            TableName: "Pledges",
            Key: { id: pledgeId },
        };
        const command = GetCommand(params);
        const result = await database.send(command);
        if (!result.Item) {
            return res.status(404).json({ message: "No pledge found" });
        }
        res.status(200).json(result.Item);
    } catch (err) {
        next(err);
    }
}

async function updatePledgeById(req, res, next) {
    try {
        const pledgeId = req.params.id;
        req.body.id = pledgeId;
        const { error, value } = pledgeSchema.validate(req.body);

        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }

        const { owner, pledge, completion_date, team, completed } = value;

        const getParams = {
            TableName: "Pledges",
            Key: { id: pledgeId },
        };

        const getCommand = new GetCommand(getParams);

        const result = await database.send(getCommand);

        const account = result.Item;

        if (!account) {
            return res.status(404).json({ message: "no pledge found" });
        }

        const updateParams = {
            TableName: "Pledges",
            Key: { id: pledgeId },
            UpdateExpression:
                " set #owner = :owner, #pledge = :pledge, #completion_date = :completion_date, #team = :team, #completed = :completed",
            ExpressionAttributeNames: {
                "#owner": "owner",
                "#pledge": "pledge",
                '#completion_date': "completion_date",
                '#team': 'team',
                '#completed': 'completed',
            },
            ExpressionAttributeValues: {
                ":owner": owner,
                ":pledge": pledge,
                ":completion_date": completion_date,
                ":team": team,
                ":completed": completed,
            },
            ReturnValues: "ALL_NEW",
        };
        const updateCommand = new UpdateCommand(updateParams);
        const updatedAccount = await database.send(updateCommand);

        res.status(200).json(updatedAccount.Attributes);
    } catch (err) {
        next(err);
    }
}

async function deletePledgeById(req, res, next) {
    const pledgeId = req.params.id;
    try {
        const params = {
            TableName: "Pledges",
            Key: { id: pledgeId },
            ReturnValues: "ALL_OLD",
        };
        const command = new DeleteCommand(params);
        const result = await database.send(command);

        if (!result.Attributes) {
            return res.status(404).json({ message: "no pledge found"});
        }
        res.status(200).json({ 
            message: `Pledge successfully deleted`,
            data: result.Attributes,
         });
    } catch (err) {
        next(err);
    }
}

export default {
    getAllPledges,
    createPledge,
    getPledgeById,
    updatePledgeById,
    deletePledgeById,
};