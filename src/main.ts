import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { Logger, VersioningType } from '@nestjs/common';
import { json, raw } from 'express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

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

    app.use('/api/v1/payments/webhook', raw({ type: 'application/json' }));

    // All other routes: normal JSON parsing
    app.use(json());

    // FOR SETTING THE API VERSIONING
    const loggerInstance = app.get(Logger);
    app.useGlobalFilters(new HttpExceptionFilter(loggerInstance));
    app.setGlobalPrefix('api');
    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: '1',
    });

    // FOR SWAGGER DOCUMENTATION
    const config = new DocumentBuilder()
      .setTitle('Jumia API')
      .setDescription('Ecommerce API just like jumia')
      .setVersion('1.0')
      .addBearerAuth()
      // .addTag('cats')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document, {
      useGlobalPrefix: true,
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
