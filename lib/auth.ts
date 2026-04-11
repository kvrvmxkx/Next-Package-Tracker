import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";
import { customSession } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { hashPassword, verifyPassword } from "./password";

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
    emailAndPassword: {
        enabled: true,
        autoSignIn: false,
        password: {
            hash: hashPassword,
            verify: verifyPassword,
        },
    },
    user: {
        additionalFields: {
            firstname: { type: "string", input: true },
            lastname:  { type: "string", input: true },
            phone:     { type: "string", input: true },
            role: {
                type: "string",
                input: false,
                defaultValue: "AGENT_CHINE",
            },
            agenceId: {
                type: "number",
                input: true,
                required: false,
            },
            mustChangePassword: {
                type: "boolean",
                input: false,
                defaultValue: true,
            },
        },
    },
    plugins: [
        nextCookies(),
        customSession(async ({ user, session }) => {
            const userInfo = await prisma.user.findFirst({
                where: { id: user.id },
                include: { agence: true },
            });

            return {
                user: {
                    ...user,
                    firstname:         userInfo?.firstname,
                    lastname:          userInfo?.lastname,
                    role:              userInfo?.role,
                    agenceId:          userInfo?.agenceId,
                    agencePays:        userInfo?.agence?.pays,
                    mustChangePassword: userInfo?.mustChangePassword,
                },
                session,
            };
        }),
    ],
});
