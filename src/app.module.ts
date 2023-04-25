import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BetModule } from './bet/bet.module';

@Module({
    imports: [ConfigModule.forRoot(), BetModule],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
