import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import MySqlDB from '../model/mySql/index';
// import MongoDB from '../model/mongo/index';
import { ValidationPipe } from '@nestjs/common';
import * as morgan from 'morgan';

async function bootstrap() {
    await MySqlDB();
    // await MongoDB();
    const app = await NestFactory.create(AppModule);
    app.enableCors({ origin: '*' });
    app.setGlobalPrefix('api');

    app.use(morgan('tiny'));

    app.useGlobalPipes(new ValidationPipe({}));
    await app.listen(4501);
}
bootstrap();
