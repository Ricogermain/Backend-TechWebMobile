import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { join } from 'path';
import { AppModule } from './app.module';
import { Console } from 'console';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.use(helmet());

  app.enableCors({
    origin: '*', // Accepter toutes les origines
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    credentials: false,
  });

  // Sert les photos uploadées (ex: /uploads/vehicules/xxx.jpg).
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads/' });
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  );

  const config = new DocumentBuilder()
    .setTitle('API Gestion de commande et livraison de voiture')
    .setDescription('API REST NestJS pour tech web avec Flutter')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
  const port = process.env.PORT ?? 3000;
  console.log(`Server is running on http://localhost:${port}`);
  console.log(`Android emulator: http://10.0.2.2:${port}`);
}
bootstrap();
