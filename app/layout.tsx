import 'primereact/resources/primereact.css';
import 'primeflex/primeflex.css';
import 'primeicons/primeicons.css';
import '../styles/layout/layout.scss';
import '../styles/demo/Demos.scss';

import { Suspense } from 'react';
import ClientProviders from './clientProvider'; // kita buat file ini di bawah

export const metadata = {
    title: 'PrimeReact Sakai',
    description: 'Your description here'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <link id="theme-css" href={`/themes/lara-light-indigo/theme.css`} rel="stylesheet" />
            </head>
            <body>
                <Suspense fallback={null}>
                    <ClientProviders>{children}</ClientProviders>
                </Suspense>
            </body>
        </html>
    );
}
