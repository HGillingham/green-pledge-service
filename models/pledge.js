import joi from "joi";

const pledgeSchema = joi.object({
    id: joi.string().required(),
    owner: joi.string().required(),
    pledge: joi.string().required(),
    completion_date: joi.string().isoDate().required(),
    team: joi.string().required(),
    completed: joi.boolean(),
});

export default pledgeSchema;