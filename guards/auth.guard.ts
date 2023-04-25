import {
    Injectable,
    CanActivate,
    ExecutionContext,
    HttpException,
} from '@nestjs/common';
import { ErrorConfig } from 'common-services/utils/config';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthGuard implements CanActivate {
    async canActivate(context: ExecutionContext) {
        const req = context.switchToHttp().getRequest();
        let token = null;
        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith('Bearer')
        ) {
            token = req.headers.authorization.split(' ')[1];
        }
        // console.log(req.headers);

        if (!token) {
            throw new HttpException(
                {
                    ...ErrorConfig.NO_TOKEN_FOUND,
                    statusCode: 401,
                },
                401,
            );
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const { id } = decoded;

            const user = await global.DB.User.findOne({
                where: { id },
                attributes: [
                    'id',
                    'client_id',
                    'client_user_id',
                    // 'full_name',
                    // 'email',
                    // 'wallet_balance',
                    // 'exposure_balance',
                ],
            });

            if (!user)
                throw new HttpException(
                    {
                        ...ErrorConfig.NO_USER_FOUND,
                        statusCode: 401,
                    },
                    401,
                );

            if (user.client_id && user.client_user_id) {
                const client = await global.DB.Client.findOne({
                    where: {
                        id: user.client_id,
                    },
                });

                if (!client) {
                    throw new HttpException(
                        {
                            message: 'No client found',
                            statusCode: 401,
                        },
                        401,
                    );
                }
                req['client_data'] = client.toJSON();
            }
            req.user = user;
            return true;
        } catch (error) {
            throw new HttpException(
                {
                    ...ErrorConfig.INVALID_TOKEN,
                    statusCode: 401,
                },
                401,
            );
        }
    }
}
