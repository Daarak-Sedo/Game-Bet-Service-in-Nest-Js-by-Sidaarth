import {
    Injectable,
    CanActivate,
    ExecutionContext,
    HttpException,
} from '@nestjs/common';
const jwt = require('jsonwebtoken');

import { QueryTypes, Sequelize } from 'sequelize';

@Injectable()
export class PermissionGuard implements CanActivate {
    // readonly permissionValues = { create: 1, read: 2, update: 3, delete: 4 };
    constructor(readonly permissionType: any) {}

    async canActivate(context: ExecutionContext) {
        const req = context.switchToHttp().getRequest();

        // const permission_id = this.permissionValues[this.permissionType];

        const query = `
            select user_id, ur.role_id, permission_id from user_roles as ur
            left join roles_permissions as rp
            on rp.role_id = ur.role_id
            left join permissions as per
            on per.id = rp.permission_id
            where user_id = ${req.user.id} AND per.name = '${this.permissionType}';
        `;

        const data = await global.DB.sequelize.query(query, {
            type: QueryTypes.SELECT,
        });

        if (!data || data.length === 0) {
            throw new HttpException(
                `You do not have "${this.permissionType}" Access!!`,
                401,
            );
        }

        return true;
    }
}
