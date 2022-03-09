export const constants = {
    discord: {
        clientID: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        scope: process.env.SCOPE,
        authUrl: 'https://discord.com/api/oauth2/authorize',
        tokenUrl: 'https://discord.com/api/oauth2/token',
        userUrl: 'https://discord.com/api/users/@me'
    },
    host: {
        redirectUrl: process.env.REDIRECT_URL,
        entryPoint: process.env.ENTRY_POINT,
        domain: process.env.DOMAIN
    },
    mongo: {
        mongoUrl: process.env.MONGO_URL,
        dbName: process.env.DB_NAME
    },
    session: {
        secret: process.env.SECRET
    }
};
