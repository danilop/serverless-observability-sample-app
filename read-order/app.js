const AWSXRay = require('aws-xray-sdk');
// const AWS = require('aws-sdk');
const AWS = AWSXRay.captureAWS(require('aws-sdk'));
const documentClient = new AWS.DynamoDB.DocumentClient();

const ORDERS_TABLE = process.env.ORDERS_TABLE;

exports.lambdaHandler = async (event, context) => {
    console.log(event)

    let response;

    let orderId = event.pathParameters.id;

    if (orderId == null || orderId.length == 0) {
        response = {
            'statusCode': 400,
            'body': 'wrong order id'
        };
    } else {
        order = await readOrder(orderId)
        if (order == null) {
            response = {
                'statusCode': 404,
                'body': 'order not found'
            };
        } else {
            response = {
                'statusCode': 200,
                'body': JSON.stringify({ order: order })
            };
        }
    }

    return response;
}

async function readOrder(orderId) {
    let data = await documentClient.get({
        TableName: ORDERS_TABLE,
        Key: { id: orderId }
    }).promise();

    console.log(data);

    const order = data.Item;

    return order;
}