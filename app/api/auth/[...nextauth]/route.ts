import axios from 'axios';
import { randomUUID } from 'crypto';
import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';


const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: { label: 'email', type: 'text' },
                password: { label: 'password', type: 'password' }
            },
            async authorize(credentials) {
              console.log('halo')
                if (!credentials?.email || !credentials?.password) {
                    throw new Error('Email dan password wajib diisi');
                }

                try {
                    const res = await axios.post(`${process.env.API_URL}/api/login`, {
                        email: credentials.email,
                        password: credentials.password
                    });


                    if (res.data && res.data.user) {
                      const { email, role, token } = res.data.user;
                
                      return {
                        id: randomUUID(), 
                        email,
                        role,
                        token
                      };
                    }

                    return null;
                } catch (error: any) {
                    const errorMessage = error?.response?.data?.message || error?.message || 'Login gagal';
                    throw new Error(errorMessage);
                }
            }
        })
    ],
    session: {
        strategy: 'jwt',
        maxAge: 60 * 60 * 24
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.email = (user as any).email;
                token.role = (user as any).role;
                token.token = (user as any).token;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.email = token.email as string;
                (session.user as any).role = token.role;
                (session.user as any).token = token.token;
            }
            return session;
        }
    },
    pages: {
        signIn: '/auth/login'
    },
    secret: process.env.NEXTAUTH_SECRET
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
