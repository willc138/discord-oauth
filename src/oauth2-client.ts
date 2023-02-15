import type { AxiosResponse } from 'axios';
import axios from 'axios';
import MongoStore from 'connect-mongo';
import cors from 'cors';
import express from 'express';
import type expressCore from 'express-serve-static-core';
import session from 'express-session';
import { MongoClient } from 'mongodb';
import crypto from 'node:crypto';
import url from 'whatwg-url';

import { constants } from './constants';
import { accessTokenExchange, authenticateClient, validateEnvironmentVariables } from './helpers';
import type { DiscordUserData } from './types';

validateEnvironmentVariables();

const server: expressCore.Express = express();
let mongoClient: MongoClient;

void (async () => {
    mongoClient = await new MongoClient(constants.mongo.mongoUrl!).connect();
})();

server.use(cors());

server.use(
    session({
        secret: constants.session.secret!,
        saveUninitialized: true,
        resave: false,
        store: MongoStore.create({
            dbName: constants.mongo.dbName,
            mongoUrl: constants.mongo.mongoUrl
        }),
        cookie: {
            domain: `.${constants.host.domain!}`,
            expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365 * 10), // 10 years.
            sameSite: 'lax'
        }
    })
);

server.get('/', async (expressRequest, expressResponse) => {
    if (expressRequest.session.discord_id && expressRequest.session.discord) {
        if (await authenticateClient(mongoClient, expressRequest.session.discord_id)) {
            expressResponse.status(200).send('OK');
        } else {
            expressResponse.status(403).send('KO');
        }
    } else {
        expressResponse.redirect('/login');
    }
});

server.get('/login', (expressRequest, expressResponse) => {
    let state: string;
    let authUrl: url.URL;

    state = crypto.randomBytes(16).toString('base64url');
    expressRequest.session.oauth2 = { state };

    authUrl = new url.URL(constants.discord.authUrl);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('client_id', constants.discord.clientID!);
    authUrl.searchParams.append('redirect_url', constants.host.redirectUrl!);
    authUrl.searchParams.append('scope', constants.discord.scope ?? 'identify');
    authUrl.searchParams.append('state', state);

    expressResponse.redirect(authUrl.href);
});

server.get('/callback', async (expressRequest, expressResponse) => {
    let code: string | undefined;
    let state: string | undefined;

    state = expressRequest.query.state?.toString();
    code = expressRequest.query.code?.toString();

    if (expressRequest.session.oauth2?.state === state && code) {
        expressRequest.session.discord = await accessTokenExchange(code);
        if (expressRequest.session.discord) {
            let discordUserResponse: AxiosResponse<DiscordUserData> | undefined;

            try {
                discordUserResponse = await axios.get<DiscordUserData>(constants.discord.userUrl, {
                    headers: { Authorization: `Bearer ${expressRequest.session.discord.access_token}` }
                });
            } catch {
                expressResponse.status(400).send();
            }

            if (discordUserResponse?.data.id) {
                expressRequest.session.discord_id = discordUserResponse.data.id;
                expressResponse.redirect(constants.host.entryPoint!);
            }
        } else {
            expressResponse.status(400).send();
        }
    } else {
        expressResponse.status(400).send();
    }
});

server.listen(constants.server.port!);
process.on('SIGINT', async () => mongoClient.close().finally(process.exit(0)));
process.on('SIGTERM', async () => mongoClient.close().finally(process.exit(0)));
