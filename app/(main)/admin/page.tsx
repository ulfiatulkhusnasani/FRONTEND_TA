'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Button } from 'primereact/button';
import { Menu } from 'primereact/menu';
import { Calendar } from 'primereact/calendar';
import 'leaflet/dist/leaflet.css';
import { LatLngExpression } from 'leaflet';
import L from 'leaflet';
import { addLocale, locale } from 'primereact/api';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Toast } from 'primereact/toast';
import dynamic from 'next/dynamic';
import { useSession } from 'next-auth/react';
const MapContainer = dynamic(() => import('react-leaflet').then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then((mod) => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then((mod) => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then((mod) => mod.Popup), { ssr: false });

const DashboardAdmin = () => {
    let pinIcon = null;
    if (typeof window !== 'undefined') {
        const L = require('leaflet');
        pinIcon = new L.Icon({
            iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [0, -41]
        });
    }

    const toast = useRef<Toast>(null);
    const { status, data: session } = useSession();
    const router = useRouter();
    const [hadirCount, setHadirCount] = useState<number>(0);
    const [cutiCount, setCutiCount] = useState<number>(0);
    const [karyawanCount, setKaryawanCount] = useState<number>(0);
    const [tahun, setTahun] = useState(new Date().getFullYear());
    const [load, setload] = useState<boolean>(true);

    const [locations, setLocations] = useState<{
        id: number;
        nama_kantor: string;
        latitude: number;
        longitude: number;
    }>({ id: 1, nama_kantor: '', latitude: 0, longitude: 0 });

    const fetchDataKantor = async () => {
        const token = (session?.user as any).token;
        try {
            const { data: res } = await axios.post(
                'http://127.0.0.1:8000/api/datakantor/get',
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            console.log(res.data);
            setLocations({
                id: res.data.id as number,
                nama_kantor: res.data.nama_kantor as string,
                latitude: res.data.latitude_kantor as number,
                longitude: res.data.longitude_kantor as number
            });
        } catch (error: any) {
            console.error('Error fetching employees:', error);
            const e = error?.response?.data || error;
            toast.current?.show({ severity: 'error', summary: 'Error', detail: e?.message || 'Failed to fetch employee data.', life: 3000 });
        }
    };

    const fetchDataHadir = async () => {
        const token = (session?.user as any).token;
        try {
            const { data: res } = await axios.post(
                'http://127.0.0.1:8000/api/absensi',
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            console.log(res);
            setHadirCount(res.length);
        } catch (error: any) {
            console.error('Error fetching employees:', error);
            const e = error?.response?.data || error;
            toast.current?.show({ severity: 'error', summary: 'Error', detail: e?.message || 'Failed to fetch employee data.', life: 3000 });
        }
    };
    const fetchDataCuti = async () => {
        const token = (session?.user as any).token;
        try {
            const { data: res } = await axios.post(
                'http://127.0.0.1:8000/api/izin/tahunan',
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            console.log(res);
            setCutiCount(res.length);
        } catch (error: any) {
            console.error('Error fetching employees:', error);
            const e = error?.response?.data || error;
            toast.current?.show({ severity: 'error', summary: 'Error', detail: e?.message || 'Failed to fetch employee data.', life: 3000 });
        }
    };
    const fetchDataKaryawan = async () => {
        const token = (session?.user as any).token;
        try {
            const { data: res } = await axios.post(
                'http://127.0.0.1:8000/api/karyawan',
                { status: 'active' },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            console.log(res);
            setKaryawanCount(res.length);
        } catch (error: any) {
            console.error('Error fetching employees:', error);
            const e = error?.response?.data || error;
            toast.current?.show({ severity: 'error', summary: 'Error', detail: e?.message || 'Failed to fetch employee data.', life: 3000 });
        }
    };

    useEffect(() => {
        if (session?.user) {
            fetchDataKantor();
            fetchDataHadir();
            fetchDataCuti();
            fetchDataKaryawan();
        }
    }, [session]);

    return (
        <>
            <Toast ref={toast}></Toast>
            <div className="grid">
                {/* Container HADIR */}
                <div
                    className="col-12 lg:col-4 xl:col-4"
                    onClick={() => {
                        router.push('/admin/Hadir');
                    }}
                    style={{ cursor: 'pointer' }}
                >
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
                        <span className="text-green-500 font-medium">{hadirCount} </span>
                        <span className="text-500">Lihat selengkapnya</span>
                    </div>
                </div>

                {/* Container CUTI */}
                <div
                    className="col-12 lg:col-4 xl:col-4"
                    onClick={() => {
                        router.push('/admin/Cuti');
                    }}
                    style={{ cursor: 'pointer' }}
                >
                    <div className="card mb-0">
                        <div className="flex justify-content-between mb-3">
                            <div>
                                <span className="block text-500 font-medium mb-3">CUTI</span>
                                <div className="text-900 font-medium text-xl">{cutiCount}</div>
                            </div>
                            <div className="flex align-items-center justify-content-center" style={{ width: '2.5rem', height: '2.5rem', backgroundColor: '#7C96FF', borderRadius: '50%' }}>
                                <i className="pi pi-fw pi-exclamation-circle text-xl" />
                            </div>
                        </div>
                        <div className="flex flex-column gap-2">
                            <span className="text-green-500 font-medium">total semua cuti karyawan dalam tahun {tahun}</span>
                            <span className="text-500">Lihat selengkapnya</span>
                        </div>
                    </div>
                </div>

                {/* Container Karyawan */}
                <div
                    className="col-12 lg:col-4 xl:col-4"
                    onClick={() => {
                        router.push('/admin/DataKaryawan');
                    }}
                    style={{ cursor: 'pointer' }}
                >
                    <div className="card mb-0">
                        <div className="flex justify-content-between mb-3">
                            <div>
                                <span className="block text-500 font-medium mb-3">Karyawan</span>
                                <div className="text-900 font-medium text-xl">{karyawanCount}</div>
                            </div>
                            <div className="flex align-items-center justify-content-center" style={{ width: '2.5rem', height: '2.5rem', backgroundColor: '#FA6568', borderRadius: '50%' }}>
                                <i className="pi pi-users text-xl" />
                            </div>
                        </div>
                        <span className="text-green-500 font-medium">{karyawanCount} </span>
                        <span className="text-500">Lihat selengkapnya</span>
                    </div>
                </div>

                {/* Peta Lokasi */}
                <div className="col-12 xl:col-6">
                    <div className="card mb-0">
                        <div className="flex justify-content-between align-items-center mb-5">
                            <h5>LOKASI PERUSAHAAN</h5>
                        </div>
                        <div style={{ height: '400px', width: '100%' }}>
                            <MapContainer center={[-7.6369966, 111.5426286]} zoom={14} style={{ height: '100%', width: '100%' }}>
                                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' />
                                <Marker key={locations.id} position={[locations.latitude, locations.longitude]} icon={pinIcon}>
                                    <Popup>{locations.nama_kantor}</Popup>
                                </Marker>
                            </MapContainer>
                        </div>
                    </div>
                </div>

                {/* Calendar Card */}
                <div className="col-12 xl:col-6">
                    <div className="card mb-0">
                        <div className="flex justify-content-between align-items-center mb-5">
                            <h5>KALENDER</h5>
                        </div>
                        <div className="relative" style={{ width: '100%', height: '400px' }}>
                            <Calendar value={new Date()} dateFormat="dd/mm/yy" locale="en" inline style={{ width: '100%', height: '100%' }} />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default DashboardAdmin;
