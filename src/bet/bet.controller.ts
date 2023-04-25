import {
    Body,
    Controller,
    Get,
    HttpCode,
    Param,
    Post,
    Query,
    Req,
    UseFilters,
} from '@nestjs/common';
import { GlobalExceptionsFilter } from 'exception/GlobalException.filter';
import { HttpExceptionFilter } from 'exception/HttpException.filter';
import { Request } from 'express';
import { BetService } from './bet.service';
import { CreateBetService } from './createBet.service';
import {
    BetReportBodyDto,
    BetReportQueryDto,
    BetResult,
    CreateBet,
    CreateBetRoulette,
} from './dto/createBet.dto';

@Controller('bet')
@UseFilters(GlobalExceptionsFilter, HttpExceptionFilter)
export class BetController {
    constructor(
        private readonly betService: BetService,
        private readonly createBetService: CreateBetService,
    ) {}

    @Post('/place/Regular%20Teen%20Patti')
    @HttpCode(202)
    async createBetRegularTeenPatti(
        @Body() body: CreateBet,
        @Req() req: Request,
    ) {
        return await this.createBetService.RegularTeenPatti(body);
    }

    @Post('/place/Roulette%20Game')
    @HttpCode(202)
    async createBetRoulette(
        @Body() body: CreateBetRoulette,
        @Req() req: Request,
    ) {
        return await this.createBetService.RouletteGame(body);
    }

    @Get('/result/:game_round_id')
    @HttpCode(200)
    async betResults(
        @Param('game_round_id') game_round_id: string,
        @Body() body: BetResult,
    ) {
        return await this.betService.betResults(+game_round_id, body);
    }

    // @Get('/report')
    // @HttpCode(200)
    // async betReport(
    //     @Query() query: BetReportQueryDto,
    //     @Body() body: BetReportBodyDto,
    // ) {
    //     return await this.betService.betReport(query, body);
    // }

    @Get('/report/roulette')
    @HttpCode(200)
    async betReportRoulette(
        @Query() query: BetReportQueryDto,
        @Body() body: BetReportBodyDto,
    ) {
        return await this.betService.betReport(query, body);
    }

    @Post('/history/roulette')
    @HttpCode(200)
    async createBetHistoryRoulette(@Body() body: any) {
        return await this.betService.createBetHistory(body);
    }
}
