# Recipe Sharing Platform API Documentation

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Authentication](#authentication)
4. [API Conventions](#api-conventions)
5. [Error Handling](#error-handling)
6. [Rate Limiting](#rate-limiting)
7. [Endpoints](#endpoints)
   - [Authentication](#authentication-endpoints)
   - [Recipes](#recipe-endpoints)
   - [Users](#user-endpoints)
   - [Reviews](#review-endpoints)
   - [Shopping List](#shopping-list-endpoints)
8. [Data Models](#data-models)
9. [Examples](#examples)
10. [Changelog](#changelog)

## Introduction

Welcome to the Recipe Sharing Platform API documentation. This RESTful API provides comprehensive functionality for managing recipes, users, reviews, and shopping lists. The API is designed to be simple, intuitive, and powerful enough to support modern web and mobile applications.

### Base URL

```
Development: http://localhost:5000/api
```

### API Version

Current version: **v1.0.0**

## Getting Started

### Prerequisites

1. Register an account to obtain authentication credentials
2. Use a tool like Postman, cURL, or any HTTP client library
3. All requests must include appropriate headers

### Quick Start Example

```bash
# Register a new user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"chef123","email":"chef@example.com","password":"Pass123!"}'

# Use the returned token for authenticated requests
curl -X GET http://localhost:5000/api/recipes \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Authentication

The API uses JWT (JSON Web Token) authentication. Tokens are valid for 30 days.

### Obtaining a Token

1. Register a new account via `/api/auth/register`
2. Login with credentials via `/api/auth/login`
3. Include the token in the Authorization header for protected routes

### Authorization Header Format

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Protected vs Public Endpoints

- **Public**: No authentication required
- **Protected**: Requires valid JWT token
- **Owner Only**: Requires token and resource ownership

## API Conventions

### HTTP Methods

- `GET` - Retrieve resources
- `POST` - Create new resources
- `PUT` - Update existing resources
- `DELETE` - Remove resources

### Request Format

- **Content-Type**: `application/json` for JSON payloads
- **Content-Type**: `multipart/form-data` for file uploads

### Response Format

All responses follow this structure:

```json
{
  "success": true|false,
  "data": { ... } | null,
  "message": "Success message" | "Error description",
  "errors": [ ... ] //only for validation errors
}
```

### Pagination

Paginated endpoints return:

```json
{
  "success": true,
  "recipes": {
    "docs": [ ... ],
    "totalDocs": 156,
    "limit": 12,
    "totalPages": 13,
    "page": 1,
    "pagingCounter": 1,
    "hasPrevPage": false,
    "hasNextPage": true,
    "prevPage": null,
    "nextPage": 2
  }
}
```

## Error Handling

### HTTP Status Codes

| Status Code | Description |
|------------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Invalid/missing token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found |
| 429 | Too Many Requests |
| 500 | Internal Server Error |

### Error Response Format

```json
{
  "success": false,
  "message": "Descriptive error message",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

## Rate Limiting

- **Limit**: 100 requests per 15 minutes per IP
- **Headers**: Rate limit info included in response headers
  - `X-RateLimit-Limit`: Request limit
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Reset timestamp

## Endpoints

### Authentication Endpoints

#### Register New User

```http
POST /api/auth/register
```

**Request Body:**
```json
{
  "username": "chef123",
  "email": "chef@example.com",
  "password": "Pass123!"
}
```

**Validation Rules:**
- Username: 3-30 characters, alphanumeric and underscore only
- Email: Valid email format
- Password: Minimum 6 characters, must contain at least 1 number

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "chef123",
    "email": "chef@example.com",
    "profileImage": ""
  }
}
```

#### Login

```http
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "chef@example.com",
  "password": "Pass123!"
}
```

**Response:** Same as registration

#### Get Current User

```http
GET /api/auth/me
```

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "chef123",
    "email": "chef@example.com",
    "bio": "Passionate about Italian cuisine",
    "profileImage": "https://...",
    "favorites": [...],
    "followers": [...],
    "following": [...],
    "createdRecipes": [...],
    "collections": [...]
  }
}
```

#### Update Password

```http
PUT /api/auth/update-password
```

**Request Body:**
```json
{
  "currentPassword": "Pass123!",
  "newPassword": "NewPass456!"
}
```

### Recipe Endpoints

#### Get All Recipes

```http
GET /api/recipes
```

**Query Parameters:**
| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| page | number | Page number (default: 1) | `page=2` |
| limit | number | Items per page (default: 12) | `limit=20` |
| category | string | Filter by category | `category=dinner` |
| cuisine | string | Filter by cuisine | `cuisine=Italian` |
| difficulty | string | Filter by difficulty | `difficulty=easy` |
| diet | string/array | Filter by dietary restrictions | `diet=vegan` |
| maxTime | number | Maximum total time (minutes) | `maxTime=30` |
| minRating | number | Minimum average rating | `minRating=4` |
| search | string | Search in title, description, ingredients | `search=pasta` |
| sort | string | Sort order | `sort=-createdAt` |

**Category Values:** `breakfast`, `lunch`, `dinner`, `dessert`, `snack`, `beverage`, `appetizer`

**Difficulty Values:** `easy`, `medium`, `hard`

**Diet Values:** `vegetarian`, `vegan`, `gluten-free`, `dairy-free`, `keto`, `paleo`

**Sort Options:**
- `-createdAt` - Newest first (default)
- `createdAt` - Oldest first
- `-averageRating` - Highest rated first
- `title` - Alphabetical
- `-views` - Most viewed first

**Example Request:**
```
GET /api/recipes?category=dinner&cuisine=Italian&diet=vegetarian&maxTime=45&page=1
```

#### Get Single Recipe

```http
GET /api/recipes/:id
```

**Response:**
```json
{
  "success": true,
  "recipe": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Homemade Margherita Pizza",
    "description": "Classic Italian pizza with fresh basil",
    "author": {
      "_id": "507f1f77bcf86cd799439012",
      "username": "chef123",
      "profileImage": "https://..."
    },
    "images": [
      {
        "url": "https://cloudinary.com/...",
        "publicId": "recipes/pizza123"
      }
    ],
    "ingredients": [
      {
        "name": "pizza dough",
        "amount": 1,
        "unit": "pound"
      }
    ],
    "instructions": [
      {
        "step": 1,
        "description": "Preheat oven to 475°F"
      }
    ],
    "prepTime": 20,
    "cookTime": 15,
    "servings": 4,
    "category": "dinner",
    "cuisine": "Italian",
    "difficulty": "medium",
    "tags": ["pizza", "italian", "vegetarian"],
    "diet": ["vegetarian"],
    "nutrition": {
      "calories": 285,
      "protein": 12,
      "carbohydrates": 35,
      "fat": 11
    },
    "averageRating": 4.5,
    "totalRatings": 23,
    "views": 456,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-16T14:20:00Z"
  }
}
```

#### Create Recipe

```http
POST /api/recipes
```

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: multipart/form-data
```

**Form Data Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| title | string | Yes | Recipe title (max 100 chars) |
| description | string | Yes | Brief description (max 500 chars) |
| ingredients | JSON string | Yes | Array of ingredient objects |
| instructions | JSON string | Yes | Array of instruction objects |
| prepTime | number | Yes | Preparation time in minutes |
| cookTime | number | Yes | Cooking time in minutes |
| servings | number | Yes | Number of servings |
| category | string | Yes | Recipe category |
| cuisine | string | Yes | Cuisine type |
| difficulty | string | No | Difficulty level |
| tags | JSON string | No | Array of tags |
| diet | JSON string | No | Array of dietary restrictions |
| nutrition | JSON string | No | Nutrition information object |
| images | file(s) | No | Up to 5 images, max 5MB each |

**Ingredients Format:**
```json
[
  {
    "name": "flour",
    "amount": 2,
    "unit": "cups"
  }
]
```

**Instructions Format:**
```json
[
  {
    "step": 1,
    "description": "Mix dry ingredients"
  }
]
```

**Example cURL:**
```bash
curl -X POST http://localhost:5000/api/recipes \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "title=Chocolate Cake" \
  -F "description=Rich and moist chocolate cake" \
  -F 'ingredients=[{"name":"flour","amount":2,"unit":"cups"}]' \
  -F 'instructions=[{"step":1,"description":"Preheat oven"}]' \
  -F "prepTime=20" \
  -F "cookTime=30" \
  -F "servings=8" \
  -F "category=dessert" \
  -F "cuisine=American" \
  -F "images=@/path/to/image.jpg"
```

#### Update Recipe

```http
PUT /api/recipes/:id
```

Same format as create, but all fields are optional. Only the recipe owner can update.

#### Delete Recipe

```http
DELETE /api/recipes/:id
```

Only the recipe owner can delete. This also:
- Removes the recipe from all favorites
- Removes the recipe from all collections
- Deletes associated images from cloud storage

#### Search Recipes

```http
GET /api/recipes/search
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| q | string | Text search query |
| ingredients | string | Comma-separated ingredients to include |
| excludeIngredients | string | Comma-separated ingredients to exclude |
| tags | string | Comma-separated tags |
| minTime | number | Minimum total time |
| maxTime | number | Maximum total time |
| minCalories | number | Minimum calories |
| maxCalories | number | Maximum calories |

**Example:**
```
GET /api/recipes/search?q=chocolate&ingredients=flour,sugar&excludeIngredients=nuts&maxCalories=300
```

#### Get User's Recipes

```http
GET /api/recipes/user/:userId
```

Returns all public recipes by a specific user. If authenticated as the user, also returns unpublished recipes.

### User Endpoints

#### Get User Profile

```http
GET /api/users/profile/:userId
```

#### Update Profile

```http
PUT /api/users/profile
```

**Form Data:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| username | string | No | New username |
| bio | string | No | Profile bio (max 500 chars) |
| profileImage | file | No | Profile picture |

#### Toggle Favorite

```http
POST /api/users/favorites/:recipeId
```

Adds or removes a recipe from favorites.

**Response:**
```json
{
  "success": true,
  "isFavorited": true,
  "message": "Added to favorites"
}
```

#### Get Favorites

```http
GET /api/users/favorites
GET /api/users/favorites/:userId
```

**Query Parameters:**
- `page` - Page number
- `limit` - Items per page

#### Follow/Unfollow User

```http
POST /api/users/follow/:userId
```

**Response:**
```json
{
  "success": true,
  "isFollowing": true,
  "message": "Followed successfully"
}
```

#### Collections

##### Create Collection

```http
POST /api/users/collections
```

**Request Body:**
```json
{
  "name": "Italian Favorites",
  "description": "My favorite Italian recipes",
  "isPublic": true
}
```

##### Get Collections

```http
GET /api/users/collections
GET /api/users/collections/:userId
```

##### Add Recipe to Collection

```http
POST /api/users/collections/:collectionId/recipes/:recipeId
```

##### Remove Recipe from Collection

```http
DELETE /api/users/collections/:collectionId/recipes/:recipeId
```

##### Delete Collection

```http
DELETE /api/users/collections/:collectionId
```

### Review Endpoints

#### Create Review

```http
POST /api/reviews/recipe/:recipeId
```

**Form Data:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| rating | number | Yes | Rating 1-5 |
| comment | string | Yes | Review text (max 1000 chars) |
| images | file(s) | No | Up to 3 images |

**Note:** Users can only review each recipe once.

#### Get Recipe Reviews

```http
GET /api/reviews/recipe/:recipeId
```

**Query Parameters:**
- `page` - Page number
- `limit` - Reviews per page
- `sort` - Sort order (`-createdAt`, `-helpful`, `-rating`)

#### Update Review

```http
PUT /api/reviews/:reviewId
```

**Request Body:**
```json
{
  "rating": 4,
  "comment": "Updated review text"
}
```

#### Delete Review

```http
DELETE /api/reviews/:reviewId
```

#### Mark Review as Helpful

```http
POST /api/reviews/:reviewId/helpful
```

Toggles the helpful status of a review.

### Shopping List Endpoints

#### Generate Shopping List

```http
POST /api/shopping-list/generate
```

**Request Body:**
```json
{
  "recipeIds": ["id1", "id2", "id3"],
  "servingsAdjustment": {
    "id1": 2,
    "id2": 1,
    "id3": 0.5
  }
}
```

**Response:**
```json
{
  "success": true,
  "shoppingList": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "My Shopping List",
    "items": [
      {
        "_id": "507f1f77bcf86cd799439012",
        "ingredient": {
          "name": "flour",
          "amount": 4,
          "unit": "cups"
        },
        "recipe": {
          "_id": "507f1f77bcf86cd799439013",
          "title": "Chocolate Cake"
        },
        "checked": false,
        "category": "pantry"
      }
    ]
  }
}
```

#### Get Active Shopping List

```http
GET /api/shopping-list
```

#### Update Shopping List Item

```http
PUT /api/shopping-list/items/:itemId
```

**Request Body:**
```json
{
  "checked": true
}
```

#### Clear Shopping List

```http
DELETE /api/shopping-list/clear
```

Archives the current shopping list and marks it as inactive.

## Data Models

### User Model

```javascript
{
  _id: ObjectId,
  username: String (3-30 chars, unique),
  email: String (unique),
  password: String (hashed),
  profileImage: String (URL),
  bio: String (max 500 chars),
  favorites: [ObjectId], //recipe references
  following: [ObjectId], //user references
  followers: [ObjectId], //user references
  createdRecipes: [ObjectId], //recipe references
  collections: [{
    name: String,
    description: String,
    recipes: [ObjectId],
    isPublic: Boolean
  }],
  createdAt: Date,
  updatedAt: Date
}
```

### Recipe Model

```javascript
{
  _id: ObjectId,
  title: String (max 100 chars),
  description: String (max 500 chars),
  author: ObjectId (User reference),
  images: [{
    url: String,
    publicId: String
  }],
  ingredients: [{
    name: String,
    amount: Number,
    unit: String,
    notes: String (optional)
  }],
  instructions: [{
    step: Number,
    description: String
  }],
  prepTime: Number (minutes),
  cookTime: Number (minutes),
  servings: Number,
  category: String (enum),
  cuisine: String,
  difficulty: String (enum: easy, medium, hard),
  tags: [String],
  diet: [String],
  nutrition: {
    calories: Number,
    protein: Number,
    carbohydrates: Number,
    fat: Number,
    fiber: Number,
    sugar: Number,
    sodium: Number
  },
  ratings: [{
    user: ObjectId,
    rating: Number (1-5)
  }],
  averageRating: Number,
  totalRatings: Number,
  views: Number,
  isPublished: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Review Model

```javascript
{
  _id: ObjectId,
  recipe: ObjectId (Recipe reference),
  user: ObjectId (User reference),
  rating: Number (1-5),
  comment: String (max 1000 chars),
  images: [{
    url: String,
    publicId: String
  }],
  helpful: [ObjectId], //user references who found it helpful
  createdAt: Date,
  updatedAt: Date
}
```

### Shopping List Model

```javascript
{
  _id: ObjectId,
  user: ObjectId (User reference),
  name: String,
  items: [{
    ingredient: {
      name: String,
      amount: Number,
      unit: String
    },
    recipe: ObjectId (Recipe reference),
    checked: Boolean,
    category: String (enum: produce, dairy, meat, pantry, frozen, bakery, other)
  }],
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

## Examples

### Complete Recipe Creation Flow

```javascript
//1. Register/Login to get token
const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'chef@example.com',
    password: 'Pass123!'
  })
});
const { token } = await loginResponse.json();

//2. Create recipe with image
const formData = new FormData();
formData.append('title', 'Homemade Pizza');
formData.append('description', 'Delicious homemade pizza');
formData.append('ingredients', JSON.stringify([
  { name: 'flour', amount: 500, unit: 'grams' },
  { name: 'yeast', amount: 7, unit: 'grams' }
]));
formData.append('instructions', JSON.stringify([
  { step: 1, description: 'Mix flour and yeast' },
  { step: 2, description: 'Knead for 10 minutes' }
]));
formData.append('prepTime', '30');
formData.append('cookTime', '15');
formData.append('servings', '4');
formData.append('category', 'dinner');
formData.append('cuisine', 'Italian');
formData.append('images', pizzaImageFile);

const recipeResponse = await fetch('http://localhost:5000/api/recipes', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

const { recipe } = await recipeResponse.json();
console.log('Created recipe:', recipe);
```

### Search and Filter Example

```javascript
//search for vegetarian Italian recipes under 30 minutes with 4+ rating
const searchParams = new URLSearchParams({
  category: 'dinner',
  cuisine: 'Italian',
  diet: 'vegetarian',
  maxTime: 30,
  minRating: 4,
  sort: '-averageRating'
});

const response = await fetch(`http://localhost:5000/api/recipes?${searchParams}`);
const { recipes } = await response.json();

console.log(`Found ${recipes.totalDocs} recipes`);
recipes.docs.forEach(recipe => {
  console.log(`- ${recipe.title} (${recipe.averageRating} stars)`);
});
```

### Shopping List Generation

```javascript
//generate shopping list from multiple recipes
const response = await fetch('http://localhost:5000/api/shopping-list/generate', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    recipeIds: ['recipe1Id', 'recipe2Id', 'recipe3Id'],
    servingsAdjustment: {
      'recipe1Id': 2,  //double servings
      'recipe2Id': 1,  //normal servings
      'recipe3Id': 0.5 //half servings
    }
  })
});

const { shoppingList } = await response.json();

//group items by category
const itemsByCategory = shoppingList.items.reduce((acc, item) => {
  if (!acc[item.category]) acc[item.category] = [];
  acc[item.category].push(item);
  return acc;
}, {});

console.log('Shopping List by Category:', itemsByCategory);
```

## Changelog

### Version 1.0.0 (Initial Release)
- User authentication with JWT
- Complete CRUD operations for recipes
- Image upload functionality
- Advanced search and filtering
- User profiles and social features
- Reviews and ratings system
- Shopping list generation
- Recipe collections
