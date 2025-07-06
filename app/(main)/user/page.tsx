'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Toast } from 'primereact/toast';
import { Calendar } from 'primereact/calendar';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import axios from 'axios';

const DashboardUser = () => {
    const toast = useRef<Toast>(null);
    const { data: session } = useSession();
    const router = useRouter();

    const [hadirCount, setHadirCount] = useState(0);
    const [tahun, setTahun] = useState(new Date().getFullYear());
    const [cutiCount, setCutiCount] = useState(0);
    const [currentTime, setCurrentTime] = useState<string>('08:00:00');
    const [jamPulang] = useState<string>('17:00:00');

    const fetchData = async () => {
        const token = (session?.user as any)?.token;
        const email = (session?.user as any)?.email;
        if (!token) return;

        try {
            // Mengambil data absensi dan izin berdasarkan rentang waktu bulan ini
            const [resHadir, resCuti] = await Promise.all([
                axios.get('http://127.0.0.1:8000/api/user/absensi', {
                    headers: { Authorization: `Bearer ${token}` },
                    params: { email: email }
                }),
                axios.post(
                    'http://127.0.0.1:8000/api/izin/tahunan',
                    { email: email },
                    {
                        headers: { Authorization: `Bearer ${token}` }
                    }
                )
            ]);

            // Menghitung jumlah hadir dalam sebulan
            setHadirCount(resHadir.data.length);

            // Menghitung jumlah cuti dalam sebulan
            setCutiCount(resCuti.data.length);
        } catch (error: any) {
            const msg = error?.response?.data?.message || 'Gagal mengambil data.';
            toast.current?.show({ severity: 'error', summary: 'Error', detail: msg, life: 3000 });
        }
    };

    useEffect(() => {
        if (session?.user) {
            fetchData();
        }
    }, [session]);

    return (
        <>
            <Toast ref={toast} />
            <div className="grid">
                <div className="grid col-6">
                    {/* HADIR */}
                    <div className="col-12 lg:col-6" onClick={() => router.push('/user/Hadir')} style={{ cursor: 'pointer' }}>
                        <div className="card mb-0">
                            <div className="flex justify-content-between mb-3">
                                <div>
                                    <span className="block text-500 font-medium mb-3">HADIR</span>
                                    <div className="text-900 font-medium text-xl">{hadirCount}</div>
                                </div>
                                <div className="flex align-items-center justify-content-center" style={{ width: '2.5rem', height: '2.5rem', backgroundColor: '#8FFF7C', borderRadius: '50%' }}>
                                    <i className="pi pi-clock text-xl" />
                                </div>
                            </div>
                            <span className="text-green-500 font-medium">{hadirCount}</span>
                            <span className="text-500"> Lihat selengkapnya</span>
                        </div>
                    </div>

                    {/* CUTI */}
                    <div className="col-12 lg:col-6" onClick={() => router.push('/user/Cuti')} style={{ cursor: 'pointer' }}>
                        <div className="card mb-0">
                            <div className="flex justify-content-between mb-3">
                                <div>
                                    <span className="block text-500 font-medium mb-3">CUTI</span>
                                    <div className="text-900 font-medium text-xl">{cutiCount} / 12</div>
                                </div>
                                <div className="flex align-items-center justify-content-center" style={{ width: '2.5rem', height: '2.5rem', backgroundColor: '#7C96FF', borderRadius: '50%' }}>
                                    <i className="pi pi-exclamation-circle text-xl" />
                                </div>
                            </div>
                            <span className="text-green-500 font-medium">
                                {cutiCount} cuti dalam tahun {tahun}
                            </span>
                            <span className="text-500"> Lihat selengkapnya</span>
                        </div>
                    </div>

                    {/* JAM MASUK & JAM PULANG */}
                    {/* <div className="flex justify-content-between"> */}
                    {/* JAM MASUK */}
                    {/* </div> */}
                </div>
                <div className="grid col-6">
                    <div className="col-12 lg:col-6">
                        <div className="card mb-0">
                            <div className="flex justify-content-between mb-3">
                                <div>
                                    <span className="block text-500 font-medium mb-3">JAM MASUK</span>
                                    <div className="text-900 font-medium text-xl">{currentTime}</div>
                                </div>
                                <div className="flex align-items-center justify-content-center" style={{ width: '2.5rem', height: '2.5rem', backgroundColor: '#FA6568', borderRadius: '50%' }}>
                                    <i className="pi pi-sign-in text-xl" />
                                </div>
                            </div>
                            <span className="text-green-500 font-medium">Jam Tetap</span>
                            <span className="text-500"> Ditentukan oleh sistem</span>
                        </div>
                    </div>

                    {/* JAM PULANG */}
                    <div className="col-12 lg:col-6">
                        <div className="card mb-0">
                            <div className="flex justify-content-between mb-3">
                                <div>
                                    <span className="block text-500 font-medium mb-3">JAM PULANG</span>
                                    <div className="text-900 font-medium text-xl">{jamPulang}</div>
                                </div>
                                <div className="flex align-items-center justify-content-center" style={{ width: '2.5rem', height: '2.5rem', backgroundColor: '#FAD56A', borderRadius: '50%' }}>
                                    <i className="pi pi-sign-out text-xl" />
                                </div>
                            </div>
                            <span className="text-green-500 font-medium">Jam Tetap</span>
                            <span className="text-500"> Ditentukan oleh sistem</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* KALENDER */}
            <div className="col-12 xl:col-12">
                <div className="card mb-0">
                    <div className="flex justify-content-between align-items-center mb-5">
                        <h5>KALENDER</h5>
                    </div>
                    <div className="relative" style={{ width: '100%', height: '400px' }}>
                        <Calendar value={new Date()} dateFormat="dd/mm/yy" locale="en" inline style={{ width: '100%', height: '100%' }} />
                    </div>
                </div>
            </div>
        </>
    );
};

export default DashboardUser;
