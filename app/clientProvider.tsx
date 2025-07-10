'use client';

import { PrimeReactProvider } from 'primereact/api';
import { SessionProvider } from 'next-auth/react';
import { LayoutProvider } from '../layout/context/layoutcontext';

export default function ClientProviders({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <PrimeReactProvider>
                <LayoutProvider>{children}</LayoutProvider>
            </PrimeReactProvider>
        </SessionProvider>
    );
}
