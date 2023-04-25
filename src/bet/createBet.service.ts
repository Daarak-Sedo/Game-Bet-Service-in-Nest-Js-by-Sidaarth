import { HttpException, Injectable } from '@nestjs/common';
import { BetOptions, CreateBet, CreateBetRoulette } from './dto/createBet.dto';
import { literal, Op, QueryTypes } from 'sequelize';
import { ErrorConfig } from 'common-services/utils/config';
// import { ThirdPartyService } from 'common-services/services/third-party.service';
import * as _ from 'lodash';

@Injectable()
export class CreateBetService {
    // Await Count : 9 -> 3
    async RegularTeenPatti(body: CreateBet) {
        const { req_user_id, req_client_data, game_round_id, amount, option } =
            body;

        if (amount <= 0)
            throw new HttpException(
                {
                    ...ErrorConfig.BET_GREATER_THAN_ZERO,
                    statusCode: 400,
                },
                400,
            );

        const [gameRound, user] = await Promise.all([
            global.DB.GameRound.findOne({
                where: { id: game_round_id, betting_status: '1' },
            }),
            global.DB.User.findOne({
                where: { id: req_user_id },
                attributes: [
                    'id',
                    'full_name',
                    'wallet_balance',
                    'exposure_balance',
                    'token',
                ],
            }),
        ]);

        // Check if Game Exist
        if (!gameRound)
            throw new HttpException(
                {
                    ...ErrorConfig.GAME_NOT_FOUND_OR_BETTING_CLOSED,
                    statusCode: 400,
                },
                400,
            );

        const odd = await global.DB.Odd.findOne({
            where: {
                name: option,
                game_id: gameRound.game_id,
                status: '1',
            },
        });

        // if (req_client_data) {
        //     const walletData = await this.thirdPartyService.callApiForClient({
        //         apiReq: {
        //             headers: {
        //                 Authorization: `Bearer ${user.token}`,
        //             },
        //             body: {},
        //         },
        //         apiType: 'GET_WALLET',
        //         domain: req_client_data.domain,
        //     });
        //     user.update({
        //         wallet_balance: walletData.response.data.wallet_balance,
        //     });
        // }

        if (user.wallet_balance - user.exposure_balance < amount)
            throw new HttpException(
                {
                    ...ErrorConfig.NOT_ENOUGH_BALANCE,
                    statusCode: 400,
                },
                400,
            );

        if (!odd)
            throw new HttpException(
                {
                    //...ErrorConfig.NOT_ENOUGH_BALANCE,
                    message: 'The Options provided is not Available',
                    statusCode: 400,
                },
                400,
            );

        const [bet] = await Promise.all([
            global.DB.Bet.create({
                game_id: gameRound.game_id,
                game_round_id,
                user_id: req_user_id,
                amount,
                bet_info: {
                    odds: odd.odds,
                    option: odd.name,
                },
                odd_id: odd.id,
            }),
            user.update({
                exposure_balance: literal(`exposure_balance + ${amount}`),
            }),
        ]);

        if (req_client_data) {
            // We need to call client API
            // const bets = [
            //     {
            //         bet_id: bet.id,
            //         odd_id: bet.odd_id,
            //         bet_info: bet.bet_info,
            //         bet_amount: bet.amount,
            //         bet_timestamp: bet.createdAt,
            //     },
            // ];
            // this.thirdPartyService.callApiForClient({
            //     apiReq: {
            //         headers: {
            //             Authorization: `Bearer ${user.token}`,
            //         },
            //         body: {
            //             game_id: gameRound.game_id, //1,
            //             game_round_id: gameRound.id, //1001,
            //             bets,
            //         },
            //     },
            //     apiType: 'BET_PLACE',
            //     domain: req_client_data.domain,
            // });
        }

        return {
            message: 'Bet Placed Successfully',
            data: { betData: bet },
        };
    }

    // Await Count: 11 -> 3
    async RouletteGame(body: CreateBetRoulette) {
        const { req_user_id, req_client_data, game_round_id } = body;
        let bet_options: BetOptions[] = body.bet_options;
        const user_id = req_user_id;
        const betsToCreate = [];
        let totalExposureAmount = 0;
        const options = _.uniq(_.map(bet_options, 'option'));

        if (bet_options && bet_options.length <= 0) {
            return {
                message: 'Bet Placed Successfully',
                data: [],
            };
        }

        const [gameRound, user] = await Promise.all([
            global.DB.GameRound.findOne({
                where: { id: game_round_id, betting_status: '1' },
            }),
            global.DB.User.findOne({
                where: { id: user_id },
                attributes: [
                    'id',
                    'full_name',
                    'wallet_balance',
                    'exposure_balance',
                    'token',
                ],
            }),
        ]);

        // Check if Game Exist
        if (!gameRound)
            throw new HttpException(
                {
                    ...ErrorConfig.GAME_NOT_FOUND_OR_BETTING_CLOSED,
                    statusCode: 400,
                },
                400,
            );

        const odd = await global.DB.Odd.findAll({
            where: {
                name: { [Op.in]: options },
                game_id: gameRound.game_id,
                status: '1',
            },
        });

        let totalAmount = 0;
        bet_options = bet_options.map((item: BetOptions) => {
            item.amount = Number(Number(item.amount).toFixed(2));
            if (!item.amount || item.amount <= 0)
                throw new HttpException(
                    {
                        ...ErrorConfig.BET_GREATER_THAN_ZERO,
                        statusCode: 400,
                    },
                    400,
                );
            totalAmount += item.amount;
            return item;
        });

        // if (req_client_data) {
        //     const walletData = await this.thirdPartyService.callApiForClient({
        //         apiReq: {
        //             headers: {
        //                 Authorization: `Bearer ${user.token}`,
        //             },
        //             body: {},
        //         },
        //         apiType: 'GET_WALLET',
        //         domain: req_client_data.domain,
        //     });
        //     user.update({
        //         wallet_balance: walletData.response.data.wallet_balance,
        //     });
        // }

        if (user.wallet_balance - user.exposure_balance < totalAmount)
            throw new HttpException(
                {
                    totalAmount,
                    ...ErrorConfig.NOT_ENOUGH_BALANCE,
                    statusCode: 400,
                },
                400,
            );

        // If Option is not Valid
        if (options.length != odd.length)
            throw new HttpException(
                {
                    //...ErrorConfig.NOT_ENOUGH_BALANCE,
                    message: 'The Option provided is not Available',
                    statusCode: 400,
                },
                400,
            );

        for (const bet of bet_options) {
            const { option, amount } = bet;

            const odd_data = odd.filter((item: any) => item.name === option)[0];

            betsToCreate.push({
                game_id: gameRound.game_id,
                game_round_id,
                user_id,
                odd_id: odd_data.id,
                bet_info: {
                    odds: odd_data.odds,
                    option: odd_data.name,
                },
                amount: Number(amount),
            });

            totalExposureAmount += Number(amount);
        }

        const query = `
        UPDATE users 
        SET exposure_balance = 
        CASE 
        	WHEN (wallet_balance - exposure_balance) >=  ${totalExposureAmount.toFixed(
                2,
            )}
            THEN exposure_balance + ${totalExposureAmount.toFixed(2)} 
            ELSE exposure_balance
        END
        where id = ${user.id};
        `;

        const isBalanceUpdated = await global.DB.sequelize.query(query, {
            type: QueryTypes.UPDATE,
        });

        if (!isBalanceUpdated[1])
            throw new HttpException(
                {
                    totalAmount,
                    ...ErrorConfig.NOT_ENOUGH_BALANCE,
                    statusCode: 400,
                },
                400,
            );

        const [bets] = await Promise.all([
            global.DB.Bet.bulkCreate(betsToCreate),
        ]);

        // if (req_client_data) {
        //     // We need to call client API

        //     const betData = [];
        //     for (let item of bets) {
        //         betData.push({
        //             bet_id: item.id,
        //             odd_id: item.odd_id,
        //             bet_info: item.bet_info,
        //             bet_amount: item.amount,
        //             bet_timestamp: item.createdAt,
        //         });
        //     }

        //     this.thirdPartyService.callApiForClient({
        //         apiReq: {
        //             headers: {
        //                 Authorization: `Bearer ${user.token}`,
        //             },
        //             body: {
        //                 game_id: gameRound.game_id, //1,
        //                 game_round_id: gameRound.id, //1001,
        //                 betData,
        //             },
        //         },
        //         apiType: 'BET_PLACE',
        //         domain: req_client_data.domain,
        //     });
        // }

        return {
            message: 'Bet Placed Successfully',
            data: bets,
        };
    }
}
