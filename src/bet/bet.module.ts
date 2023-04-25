import { Module } from '@nestjs/common';
import { BetService } from './bet.service';
import { BetController } from './bet.controller';
import { CreateBetService } from './createBet.service';

@Module({
    imports: [],
    controllers: [BetController],
    providers: [BetService, CreateBetService],
})
export class BetModule {}
