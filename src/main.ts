import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { Logger, VersioningType } from '@nestjs/common';

let isBootstrapping = false;

async function bootstrap() {
  // Prevent multiple simultaneous bootstrap attempts
  if (isBootstrapping) {
    console.log('⚠️  Bootstrap already in progress, skipping...');
    return;
  }

  isBootstrapping = true;

  try {
    const app = await NestFactory.create(AppModule);
    const loggerInstance = app.get(Logger);
    app.useGlobalFilters(new HttpExceptionFilter(loggerInstance));
    app.setGlobalPrefix('api');
    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: '1',
    });

    const port = process.env.PORT ?? 4000;

    await app.listen(port);
    console.log(`✅ Application successfully started on port ${port}`);
    // Handle graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('SIGTERM signal received: closing HTTP server');
      await app.close();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      console.log('SIGINT signal received: closing HTTP server');
      await app.close();
      process.exit(0);
    });

    isBootstrapping = false;
  } catch (error) {
    console.error('❌ Failed to start application:', error.message);
    isBootstrapping = false;
    process.exit(1);
  }
}

bootstrap();
