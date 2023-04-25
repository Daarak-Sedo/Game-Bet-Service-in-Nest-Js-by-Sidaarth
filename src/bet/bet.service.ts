import { Injectable } from '@nestjs/common';
import {
    BetReportBodyDto,
    BetReportQueryDto,
    BetResult,
} from './dto/createBet.dto';
import { Op } from 'sequelize';
import { PAGINATION } from 'common-services/utils/config';
import * as _ from 'lodash';
import Roulette from 'common-services/utils/roulette';
@Injectable()
export class BetService {
    async betResults(game_round_id: number, body: BetResult) {
        const { req_user_id } = body;
        const userBets = await global.DB.Bet.findAll({
            where: {
                user_id: req_user_id,
                game_round_id,
            },
            attributes: [
                'id',
                'game_round_id',
                'bet_result',
                'odd_id',
                'amount',
                'user_id',
                'bet_info',
            ],
        });

        return {
            message: 'Bet Results fetched successfully',
            data: userBets,
        };
    }

    findWinners(number: number, roulette: Roulette): string[] {
        const winners = [];

        if (number != 0) {
            winners.push(
                `${
                    roulette.Red_Numbers.includes(`${number}`) ? 'Red' : 'Black'
                }`,
            );
            winners.push(`${number % 2 === 0 ? 'Even' : 'Odd'}`);

            winners.push(
                `${
                    number <= 12 ? 'Dozen1' : number <= 24 ? 'Dozen2' : 'Dozen3'
                }`,
            );

            winners.push(`${number <= 18 ? 'Eighteen1' : 'Eighteen2'}`);

            winners.push(
                `${
                    number % 3 === 1
                        ? 'Column1'
                        : number % 3 === 2
                        ? 'Column2'
                        : 'Column3'
                }`,
            );
        }
        return winners;
    }

    async betReport(query: BetReportQueryDto, body: BetReportBodyDto) {
        const { req_user_id } = body;
        const { game_round_id, bet_result, created_at_start, created_at_end } =
            query;
        let { limit, page } = query;

        limit = Number(limit) || PAGINATION.LIMIT;
        page = Number(page) || PAGINATION.PAGE;

        // Setting Filters
        const filterObj: any = {
            game_id: 2,
            user_id: req_user_id,
        };
        if (game_round_id) filterObj.game_round_id = game_round_id;
        if (bet_result) filterObj.bet_result = bet_result;
        if (created_at_start && created_at_end)
            filterObj.created_at = {
                [Op.between]: [created_at_start, created_at_end],
            };

        // PAGINATION

        const totalItems = await global.DB.BetHistory.count({
            where: filterObj,
        });
        const offset = limit * (page - 1);
        const totalPages = Math.ceil(totalItems / limit);

        const includesArr = [
            {
                model: global.DB.Game,
                as: 'game_data',
                attributes: ['id', 'name'],
            },
            {
                model: global.DB.GameRound,
                as: 'game_round_data',
                attributes: ['id', 'data'],
            },
        ];

        const userBets = await global.DB.BetHistory.findAll({
            where: filterObj,
            attributes: [
                'id',
                'game_round_id',
                'amount',
                'bet_result',
                'bet_info',
                'created_at',
                'max_win',
                'net_amount',
                'payout_amount',
            ],
            include: includesArr,
            ...(limit ? { limit } : {}),
            offset,
            order: [['game_round_id', 'desc']],
        });

        return {
            message: 'Bets data fetched successfully',
            data: userBets,
            limit,
            page,
            totalItems,
            totalPages,
        };
    }
    async createBetHistory(body: any) {
        const { game_round_id } = body;
        console.log('CreateBetHistory Called: ', game_round_id);

        const bets = await global.DB.Bet.findAll({
            where: { game_round_id, status: '0' },
        });

        const uniqueUsers = _.uniqBy(bets, 'user_id').map(
            (item) => item.user_id,
        );
        const resData = [];

        for (const user_id of uniqueUsers) {
            const userBets = bets.filter((item) => item.user_id == user_id);

            const roulette = new Roulette();
            const betOptionsData = {};
            const maxWinData = [];
            userBets.map((item) => {
                const amount =
                    betOptionsData[item.bet_info.option]?.amount || 0;

                betOptionsData[item.bet_info.option] = {
                    amount: amount + item.amount,
                };
                betOptionsData[item.bet_info.option] = {
                    ...betOptionsData[item.bet_info.option],
                    winAmount:
                        betOptionsData[item.bet_info.option].amount *
                        item.bet_info.odds,
                };
            });

            for (let i = 0; i < 37; i++) {
                const tempObj = {
                    winning_amount: 0,
                    number: i,
                };
                const realWinners = [];
                const winners = this.findWinners(i, roulette);

                for (const option in betOptionsData) {
                    const colonSplit = option.split(':');
                    if (colonSplit.length > 1) {
                        const numbers = colonSplit[1].split(',');
                        if (numbers.includes(`${i}`)) realWinners.push(option);
                    } else if (winners.includes(option))
                        realWinners.push(option);
                }
                for (const option of realWinners) {
                    tempObj.winning_amount =
                        tempObj.winning_amount +
                        betOptionsData[option].winAmount;
                }
                maxWinData.push(tempObj);
            }
            const sortedData = _.orderBy(
                maxWinData,
                'winning_amount',
                'desc',
            )[0];
            const obj = {
                amount: 0,
                payout_amount: 0,
                net_amount: 0,
                option: [],
            };
            for (const item of userBets) {
                obj.amount += item.amount;

                obj.payout_amount =
                    item.bet_result == 'win'
                        ? obj.payout_amount +
                          item.amount * (item.bet_info.odds - 1)
                        : item.bet_result == 'lose'
                        ? obj.payout_amount - item.amount
                        : obj.payout_amount;

                obj.net_amount =
                    item.bet_result == 'win'
                        ? obj.net_amount + item.amount * item.bet_info.odds
                        : obj.net_amount;
                obj.option.push(item.bet_info.option);
            }

            const temp = {
                game_id: userBets[0].game_id,
                game_round_id,
                user_id,
                max_win: sortedData.winning_amount,
                amount: obj.amount,
                payout_amount: obj.payout_amount,
                net_amount: obj.net_amount,
                bet_result: obj.payout_amount > 0 ? 'win' : 'lose',
                bet_info: {
                    option: obj.option.join('::'),
                },
            };
            resData.push(temp);
        }

        await global.DB.BetHistory.bulkCreate(resData);

        return {
            success: true,
            message: 'Bets history Created Successfully',
            data: {},
        };
    }
}
