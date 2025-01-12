# Order Management API Documentation

## Base URL
`http://localhost:8000`

## Endpoints Overview
| Method   | Endpoint      | Description                                  |
|----------|---------------|----------------------------------------------|
| GET      | /orders       | List all orders (without items)              |
| GET      | /order/{id}   | Get a specific order with its items          |
| POST     | /order        | Create a new order                           |
| PUT      | /order/{id}   | Update an existing order                     |
| DELETE   | /order/{id}   | Delete an order                             |

## Detailed Endpoint Specifications

### 1. List Orders (GET /orders)

Retrieves a list of all orders without their items.

#### Query Parameters
| Parameter  | Type     | Required | Description                           |
|------------|----------|----------|---------------------------------------|
| date       | string   | No       | Filter by date (YYYY-MM-DD)          |
| recipient  | string   | No       | Filter by recipient name             |

#### Response
```json
{
    "status": "success",
    "data": {
        "orders": [
            {
                "id": 1,
                "date": "2024-03-20",
                "recipient": "Jin Jin",
                "owner": "John Doe",
                "created_at": "2024-03-20T10:00:00Z",
                "updated_at": "2024-03-20T10:00:00Z"
            }
        ]
    }
}
```

### 2. Get Order Details (GET /order/{id})

Retrieves a specific order with all its items.

#### Path Parameters
| Parameter | Type    | Required | Description     |
|-----------|---------|----------|-----------------|
| id        | integer | Yes      | Order ID        |

#### Response
```json
{
    "status": "success",
    "data": {
        "id": 1,
        "date": "2024-03-20",
        "recipient": "Jin Jin",
        "items": [
            {
                "product_name": "Chicken Rice",
                "quantity": 2,
                "unit": "skids",
                "description": "Extra spicy",
                "unit_price": 12.99
            }
        ],
        "created_at": "2024-03-20T10:00:00Z",
        "updated_at": "2024-03-20T10:00:00Z"
    }
}
```

#### Error Responses
- 400: Invalid ID format
- 404: Order not found
- 500: Database error

### 3. Create Order (POST /order)

Creates a new order.

#### Request Body
```json
{
    "date": "2024-03-20",
    "recipient": "Jin Jin",
    "owner": "John Doe",
    "items": [
        {
            "product_name": "Chicken Rice",
            "quantity": 2,
            "unit": "boxes"
        }
    ]
}
```

#### Required Fields
| Field               | Type    | Description                    |
|---------------------|---------|--------------------------------|
| date                | string  | Order date (YYYY-MM-DD)        |
| recipient           | string  | Name of recipient              |
| owner               | string  | Person in charge of delivery   |
| items               | array   | Array of order items           |
| items.product_name  | string  | Name of the product           |
| items.quantity      | integer | Quantity ordered              |

#### Response
```json
{
    "status": "success",
    "data": {
        "id": 1,
        "date": "2024-03-20",
        "recipient": "Jin Jin",
        "items": [
            {
                "product_name": "Chicken Rice",
                "quantity": 2,
                "unit": "boxes"
            }
        ],
        "created_at": "2024-03-20T10:00:00Z",
        "updated_at": "2024-03-20T10:00:00Z"
    }
}
```

### 4. Update Order (PUT /order/{id})

Updates an existing order.

#### Path Parameters
| Parameter | Type    | Required | Description     |
|-----------|---------|----------|-----------------|
| id        | integer | Yes      | Order ID        |

#### Request Body (all fields optional)
```json
{
    "date": "2024-03-21",
    "recipient": "Jin Jin Updated",
    "items": [
        {
            "product_name": "Chicken Rice",
            "quantity": 3,
            "unit": "boxes",
            "description": "Extra spicy",
            "unit_price": 12.99
        }
    ]
}
```

#### Response
```json
{
    "status": "success",
    "message": "Order updated successfully"
}
```


### 5. Delete Order (DELETE /order/{id})

Deletes an order and all its items.

#### Path Parameters
| Parameter | Type    | Required | Description     |
|-----------|---------|----------|-----------------|
| id        | integer | Yes      | Order ID        |

#### Response
```json
{
    "status": "success",
    "message": "Order deleted successfully"
}
```

### 6. Delete Order Items (DELETE /order/{id}/items)

Deletes specific items from an order.

#### Path Parameters
| Parameter | Type    | Required | Description     |
|-----------|---------|----------|-----------------|
| id        | integer | Yes      | Order ID        |

#### Request Body
```json
{
    "item_ids": [1, 2, 3]  // Array of item IDs to delete
}
```

#### Response
```json
{
    "status": "success",
    "message": "Items deleted successfully",
    "data": {
        "deleted_items": [1, 2, 3]
    }
}
```

#### Error Responses
- 400: Invalid order ID or item IDs
- 404: Order not found
- 500: Database error

## Error Response Format

All endpoints return errors in the following format:

```json
{
    "status": "error",
    "message": "Detailed error message",
    "code": "ERROR_CODE"
}
```

### Common Error Codes
- INVALID_REQUEST: Invalid request body or parameters
- INVALID_ID: Invalid order ID format
- NOT_FOUND: Order not found
- DB_ERROR: Database error
- DELETE_ERROR: Error during deletion





```javascript
// Response from the AI endpoint
const response = {
    "id": "98abe9c9-44e7-44ae-9b29-e69c5af29868",
    "object": "chat.completion",
    "created": 1731980262,
    "model": "grok-beta",
    "choices": [
        {
            "index": 0,
            "message": {
                "role": "assistant",
                "content": "```json\n{\n  \"recipient\": \"金金Food\",\n  \"orders\": [\n    {\"洋葱\": 5},\n    {\"苹果\": 1},\n    {\"油菜\": 1},\n    {\"米粉\": 10}\n  ],\n  \"originalMessage\": \"金金Food 洋葱五箱 苹果一箱，油菜一箱，米粉10箱\"\n}\n```",
                "refusal": null
            },
            "finish_reason": "stop"
        }
    ],
    "usage": {
        "prompt_tokens": 267,
        "completion_tokens": 91,
        "total_tokens": 358
    },
    "system_fingerprint": "fp_be475d80cf"
};

// Step 1: Extract the message content
let content = response.choices[0].message.content;

// Step 2: Remove code block markers
content = content.replace(/```json\n|```/g, '');

// Step 3: Parse the cleaned JSON string
const jsonObject = JSON.parse(content);

// Step 4: Access the JSON object
console.log(jsonObject);



```