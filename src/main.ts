import * as express from 'express'
import { AppModule } from './app.module'
import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'

async function bootstrap() {
  const PORT: number = parseInt(process.env.PORT, 10) || 2004
  const app = await NestFactory.create(AppModule)

  app.enableCors({
    origin: [
      `http://localhost:3000`,
      `http://localhost:3001`,
      `http://localhost:${PORT}`,
      `https://lggc8kc.mordules.com`,
      `https://github.com/Hynitr/omega-food-server`,
    ],
    credentials: true,
    optionsSuccessStatus: 200,
    methods: 'GET,PATCH,POST,PUT,DELETE',
  })
  app.use(express.json({ limit: 250 << 20 }))
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
  }))

  const swaggerOptions = new DocumentBuilder()
    .setTitle('Omega Documentation')
    .setDescription('All API Endpoints')
    .setVersion('1.0.1')
    .addServer('https://omega-loan-server.onrender.com', 'Staging')
    .addServer(`http://localhost:${PORT}`, 'Local environment')
    .addBearerAuth()
    .build()

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerOptions)
  SwaggerModule.setup('docs', app, swaggerDocument)

  try {
    await app.listen(PORT)
    console.log(`http://localhost:${PORT}`)
  } catch (err) {
    console.error(err.message)
  }
}
bootstrap()