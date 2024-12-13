# NestJS Application Setup Instructions

This guide provides step-by-step instructions to set up and run the NestJS application locally or in a production environment.

## Prerequisites

Ensure you have the following installed on your system:

- [Node.js](https://nodejs.org/) (v20 or later recommended)
- [npm](https://www.npmjs.com/) (comes with Node.js)
- [Git](https://git-scm.com/)

## Clone the Repository

```bash
git clone https://github.com/Olusoladeboy/playerapp-be.git
cd playerapp-be
```

## Install Dependencies

Install the necessary dependencies by running:

```bash
npm install
```

## Configuration

1. Create a `.env` file in the root directory (if not already present).
2. Add the following environment variables:

   ```env
    AWS_REGION= "values"
    AWS_ACCESS_KEY_ID= "values"
    AWS_ACCESS_KEY_SECRET= "values"
    AWS_BUCKET_NAME= "values"
    DYNAMODB_PLAYER_TABLE = "values"
    DYNAMODB_FEED_TABLE = "values"
    JWT_SECRET = "values"
    CLOUDFRONT_DOMAIN = "values"
   ```

   Update these values based on the environment variables provided.

## Run the Application

### Development Mode

To start the application in development mode (with hot-reloading):

```bash
npm run start:dev
```

### Production Mode

1. Build the application:

   ```bash
   npm run build
   ```

2. Start the application:

   ```bash
   npm run start:prod
   ```

### Running with Docker

1. Build the Docker image:

   ```bash
   docker build -t playerapp-be .
   ```

2. Run the container:

   ```bash
   docker run -p 3000:3000 playerapp-be
   ```

