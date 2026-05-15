import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Task Management API',
      version: '1.0.0',
      description: 'A production-ready task management API with real-time updates',
    },
    servers: [{ url: `http://localhost:${process.env.PORT || 3001}` }],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'access_token',
          description: 'JWT stored in httpOnly cookie. Note: Swagger UI cannot send httpOnly cookies. Use the curl examples or Postman with pre-request scripts instead.',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' },
                field: { type: 'string' },
                retryAfter: { type: 'number' },
              },
              required: ['code', 'message'],
            },
          },
        },
        Task: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            status: { type: 'string', enum: ['pending', 'in-progress', 'completed'] },
            creator_id: { type: 'string' },
            assignee_id: { type: 'string' },
            deadline: { type: 'string', format: 'date-time' },
            version: { type: 'number' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            email: { type: 'string' },
          },
        },
      },
    },
    security: [{ cookieAuth: [] }],
  },
  apis: ['./src/routes/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
