/* eslint-disable @next/next/no-img-element */

import React, { useContext, useEffect, useState } from 'react';
import AppMenuitem from './AppMenuitem';
import { LayoutContext } from './context/layoutcontext';
import { MenuProvider } from './context/menucontext';
import { AppMenuItem } from '@/types';
import { useSession } from 'next-auth/react';

type Role = 'admin' | 'user';

interface SessionUser {
    id?: string;
    name?: string;
    email?: string;
    role?: Role;
}

const adminMenu: AppMenuItem[] = [
    {
        label: 'Home',
        items: [{ label: 'Dashboard Admin', icon: 'pi pi-fw pi-home', to: '/admin/' }]
    },
    {
        label: 'KELOLA',
        items: [
            { label: 'Karyawan', icon: 'pi pi-fw pi-check-square', to: '/admin/DataKaryawan' },
            { label: 'Data Jabatan', icon: 'pi pi-fw pi-briefcase', to: '/admin/Datajabatan' },
            {
                label: 'Absensi',
                icon: 'pi pi-fw pi-list',
                items: [
                    { label: 'Hadir', icon: 'pi pi-fw pi-info-circle', to: '/admin/Hadir' },
                    { label: 'cuti', icon: 'pi pi-fw pi-info-circle', to: '/admin/Cuti' }
                ]
            },
            { label: 'Task', icon: 'pi pi-fw pi-book', to: '/admin/Task' },
            { label: 'Kinerja Karyawan', icon: 'pi pi-fw pi-book', to: '/admin/Kinerjakaryawan' },
            { label: 'Payroll', icon: 'pi pi-fw pi-money-bill', to: '/admin/Payroll' },
            { label: 'User Login', icon: 'pi pi-fw pi-users', to: '/admin/UserData' }
        ]
    }
];

const userMenu: AppMenuItem[] = [
    {
        label: 'Home',
        items: [{ label: 'Dashboard User', icon: 'pi pi-fw pi-home', to: '/user/' }]
    },
    {
        label: 'KELOLA',
        items: [
            {
                label: 'Absensi',
                icon: 'pi pi-fw pi-list',
                items: [
                    { label: 'Hadir', icon: 'pi pi-fw pi-info-circle', to: '/user/Hadir' },
                    { label: 'Cuti', icon: 'pi pi-fw pi-info-circle', to: '/user/Cuti' }
                ]
            },
            { label: 'Task', icon: 'pi pi-fw pi-book', to: '/user/task' },
            { label: 'Kinerja Perbulan', icon: 'pi pi-fw pi-book', to: '/user/Kinerjaperbulan' },
            { label: 'Slip Gaji', icon: 'pi pi-fw pi-wallet', to: '/user/SlipGaji' },
            { label: 'Profile', icon: 'pi pi-fw pi-user', to: '/user/Profile' }
        ]
    }
];

const AppMenu: React.FC = () => {
    const { layoutConfig } = useContext(LayoutContext);
    const { data: session } = useSession();
    const [menu, setMenu] = useState<AppMenuItem[]>([]);

    useEffect(() => {
        const user = session?.user as SessionUser;

        if (user?.role === 'admin') {
            setMenu(adminMenu);
        } else if (user?.role === 'user') {
            setMenu(userMenu);
        }
    }, [session]);

    return (
        <MenuProvider>
            <ul className="layout-menu">{menu.map((item, i) => (!item?.seperator ? <AppMenuitem item={item} root={true} index={i} key={item.label} /> : <li className="menu-separator" key={`sep-${i}`}></li>))}</ul>
        </MenuProvider>
    );
};

export default AppMenu;
