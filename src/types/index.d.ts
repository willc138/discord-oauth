export declare module 'express-session' {
    /**
     * Declaration merging for additional properties on the SessionData interface.
     */
    interface SessionData {
        /**
         * Authentication data from discord.
         */
        discord: DiscordAuthData | undefined;

        /**
         * OAuth2 data for the Authorization Code Grant flow.
         */
        oauth2: OAuth2Data;

        /**
         * The discord ID of the user.
         */
        discord_id: string;
    }

    /**
     * Interface to hold data to be stored for discord authentication.
     */
    interface DiscordAuthData {
        /**
         * The access token.
         */
        access_token: string;

        /**
         * The date time (in milliseconds since epoch) the access token expires.
         */
        expires_on: number;

        /**
         * The refresh token.
         */
        refresh_token: string;

        /**
         * The scope(s) provided by the access token.
         */
        scope: string;

        /**
         * The type of the access token.
         */
        token_type: string;
    }

    /**
     * Interface to hold the data for the Authorization Code Grant flow.
     */
    interface OAuth2Data {
        /**
         * The state parameter used for preventing CSRF attacks and for maintaining state between request and callback.
         */
        state: string | undefined;
    }
}

/**
 * Interface to hold token data returned from an access token exchange.
 */
export interface DiscordTokenData {
    /**
     * The access token.
     */
    access_token: string | undefined;

    /**
     * The time in seconds until the access token expires.
     */
    expires_in: number | undefined;

    /**
     * The refresh token.
     */
    refresh_token: string | undefined;

    /**
     * The scope(s) provided by the access token.
     */
    scope: string | undefined;

    /**
     * The type of the access token.
     */
    token_type: string | undefined;
}

/**
 * Interface to hold the discord user data when getting the user object.
 * Only the `id` field is included as the other fields are not used.
 */
export interface DiscordUserData {
    /**
     * The user id.
     */
    id: string | undefined;
}
