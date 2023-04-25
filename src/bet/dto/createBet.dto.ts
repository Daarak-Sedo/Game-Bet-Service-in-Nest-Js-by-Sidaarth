import { IsNotEmpty, IsNumber, IsPositive, IsString } from 'class-validator';
export class CreateBet {
    @IsNotEmpty()
    req_user_id: number;

    req_client_data: any;

    @IsNotEmpty()
    @IsNumber()
    amount: number;

    @IsNotEmpty()
    @IsNumber()
    game_round_id: number;

    @IsNotEmpty()
    @IsString()
    option: string;
}

export class BetOptions {
    @IsNotEmpty()
    option: string;

    @IsNumber()
    @IsNotEmpty()
    amount: number;
}

export class CreateBetRoulette {
    @IsNotEmpty()
    req_user_id: number;

    req_client_data: any;

    @IsNotEmpty()
    @IsNumber()
    game_round_id: number;

    @IsNotEmpty()
    bet_options: BetOptions[];
}

export class BetResult {
    @IsNotEmpty()
    req_user_id: number;
}

export class BetReportQueryDto {
    bets_type: string;
    game_id: number;
    game_round_id: number;
    bet_result: string;
    created_at_start: string;
    created_at_end: string;
    limit: number;
    page: number;
}

export class BetReportBodyDto {
    @IsNotEmpty()
    req_user_id: number;
}
