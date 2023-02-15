import type { AxiosResponse } from 'axios';
import axios from 'axios';
import type { DiscordAuthData } from 'express-session';
import type { Collection, Document, MongoClient } from 'mongodb';
import qs from 'qs';

import { constants } from './constants';
import type { DiscordTokenData } from './types';

/**
 * Validates the required environment variables and throws an error if any are invalid.
 */
export function validateEnvironmentVariables(): void {
    if (!constants.discord.clientID) {
        throw new Error('Required environment variable `CLIENT_ID` is not set.');
    }

    if (!constants.discord.clientSecret) {
        throw new Error('Required environment variable `CLIENT_SECRET` is not set.');
    }

    if (!constants.mongo.mongoUrl) {
        throw new Error('Required environment variable `MONGO_URL` is not set.');
    }

    if (!constants.mongo.dbName) {
        throw new Error('Required environment variable `DB_NAME` is not set.');
    }

    if (!constants.session.secret) {
        throw new Error('Required environment variable `SECRET` is not set.');
    }

    if (!constants.host.redirectUrl) {
        throw new Error('Required environment variable `REDIRECT_URL` is not set.');
    }

    if (!constants.host.entryPoint) {
        throw new Error('Required environment variable `ENTRY_POINT` is not set.');
    }

    if (!constants.host.domain) {
        throw new Error('Required environment variable `DOMAIN` is not set.');
    }

    if (!constants.server.port) {
        throw new Error('Required environment variable `PORT` is not set.');
    }
}

/**
 * Authenticates a client against a whitelist given its authentication data.
 * @param mongoClient The mongodb client used to connect to the database.
 * @param discord_id The discord ID of the user.
 * @returns True if the client was successfully authenticated.
 */
export async function authenticateClient(mongoClient: MongoClient, discord_id: string): Promise<boolean> {
    try {
        let whitelist: Collection;
        let user: Document | null;

        whitelist = mongoClient.db(constants.mongo.dbName).collection('whitelist');

        user = await whitelist.findOne({ discord_id });
        return !!user;
    } catch {
        return false;
    }
}

/**
 * Performs an access token exchange.
 * @param code The code used to perform an access token exchange.
 * @returns The discord token data.
 */
export async function accessTokenExchange(code: string): Promise<DiscordAuthData | undefined> {
    let discordTokenResponse: AxiosResponse<DiscordTokenData> | undefined;

    try {
        discordTokenResponse = await axios.post<DiscordTokenData>(
            constants.discord.tokenUrl,
            qs.stringify({
                client_id: constants.discord.clientID!,
                client_secret: constants.discord.clientSecret!,
                grant_type: 'authorization_code',
                code,
                redirect_uri: constants.host.redirectUrl
            }),
            {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            }
        );
    } catch {
        return undefined;
    }

    return validateDiscordTokenResponse(discordTokenResponse);
}

/**
 * Performs a refresh token exchange.
 * @param discordAuthData The current authentication data containing an expired access token.
 * @returns The new discord authentication data containing a fresh access token.
 */
export async function refreshTokenExchange(discordAuthData: DiscordAuthData): Promise<DiscordAuthData | undefined> {
    let discordTokenResponse: AxiosResponse<DiscordTokenData> | undefined;

    try {
        discordTokenResponse = await axios.post<DiscordTokenData>(
            constants.discord.tokenUrl,
            qs.stringify({
                client_id: constants.discord.clientID!,
                client_secret: constants.discord.clientSecret!,
                grant_type: 'refresh_token',
                refresh_token: discordAuthData.refresh_token
            }),
            {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            }
        );
    } catch {
        return undefined;
    }

    return validateDiscordTokenResponse(discordTokenResponse);
}

/**
 * Validates the discord token response.
 * @param discordTokenResponse The discord token response.
 * @returns The discord authentication data if the response is valid.
 */
function validateDiscordTokenResponse(
    discordTokenResponse: AxiosResponse<DiscordTokenData>
): DiscordAuthData | undefined {
    if (
        discordTokenResponse.data.access_token &&
        discordTokenResponse.data.expires_in &&
        discordTokenResponse.data.refresh_token &&
        discordTokenResponse.data.scope &&
        discordTokenResponse.data.token_type
    ) {
        return {
            access_token: discordTokenResponse.data.access_token,
            expires_on: Date.now() + discordTokenResponse.data.expires_in * 1000,
            refresh_token: discordTokenResponse.data.refresh_token,
            scope: discordTokenResponse.data.scope,
            token_type: discordTokenResponse.data.token_type
        };
    } else {
        return undefined;
    }
}
