// import {
//   ExceptionFilter,
//   Catch,
//   ArgumentsHost,
//   HttpException,
//   Logger,
// } from '@nestjs/common';
// import { Request, Response } from 'express';

// @Catch(HttpException)
// export class HttpExceptionFilter implements ExceptionFilter {
//   constructor(private logger: Logger) {}
//   catch(exception: HttpException, host: ArgumentsHost) {
//     const ctx = host.switchToHttp();
//     const response = ctx.getResponse<Response>();
//     const request = ctx.getRequest<Request>();
//     const status = exception.getStatus();

//     this.logger.error(
//       ` ${request.originalUrl} ${status}  ${exception.message}`,
//       // ${request.method}
//     );

//     const errorDetails = exception.getResponse();
//     response.status(status).json({
//       error: true,
//       errorDetails,
//     });
//   }
// }

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { GqlArgumentsHost } from '@nestjs/graphql';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private logger: Logger) {}

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctxType = host.getType() as 'http' | 'rpc' | 'ws' | 'graphql';

    if (ctxType === 'http') {
      const ctx = host.switchToHttp();
      const response = ctx.getResponse<Response>();
      const request = ctx.getRequest<Request>();
      const status = exception.getStatus();

      this.logger.error(
        `${request.method}  ${request.originalUrl} ${status}  ${exception.message}`,
      );

      const errorDetails = exception.getResponse();
      response.status(status).json({
        error: true,
        errorDetails,
      });
    } else if (ctxType === 'graphql') {
      // GraphQL context
      const gqlHost = GqlArgumentsHost.create(host);
      const info = gqlHost.getInfo(); // contains GraphQL field info
      const status = exception.getStatus ? exception.getStatus() : 500;

      this.logger.error(
        `GraphQL ${info.parentType.name}.${info.fieldName} ${status} ${exception.message}`,
      );

      // Just throw the exception; Apollo Server will handle the response
      throw exception;
    }
  }
}
