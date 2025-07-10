'use client';

import React, { useEffect, useState, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { Toast } from 'primereact/toast';
import { InputText } from 'primereact/inputtext';
import { Dialog } from 'primereact/dialog';
import axios from 'axios';
import Swal from 'sweetalert2';
import { CSSTransition } from 'react-transition-group';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useSession } from 'next-auth/react';

const MapContainer = dynamic(() => import('react-leaflet').then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then((mod) => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then((mod) => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then((mod) => mod.Popup), { ssr: false });

interface AttendanceEntry {
    id: number;
    email_karyawan: string;
    nama_karyawan: string;
    tanggal: string;
    jam_masuk: string;
    foto_masuk: string;
    latitude_masuk: number;
    longitude_masuk: number;
    status: string;
    jam_pulang?: string;
    foto_pulang?: string;
    latitude_pulang?: number;
    longitude_pulang?: number;
}

interface Entry {
    id?: number;
    email_karyawan: string | null | undefined;
    tanggal: Date | null;
    jam_masuk: Date;
    jam_pulang?: Date;
    foto_masuk?: string | File | null;
    foto_pulang?: string | File | null;
    latitude_masuk: number;
    latitude_pulang?: number;
    longitude_masuk: number;
    longitude_pulang?: number;
    status: string;
}

interface Employee {
    id: string;
    nama_karyawan: string;
}

const Hadir = () => {
    // Konfigurasi Peta
    let pinIcon: L.Icon | null = null;
    if (typeof window !== 'undefined') {
        const L = require('leaflet');
        pinIcon = new L.Icon({
            iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [0, -41]
        });
    }

    // State Management
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [attendance, setAttendance] = useState<AttendanceEntry[]>([]);
    const [filteredAttendance, setFilteredAttendance] = useState<AttendanceEntry[]>([]);
    const [globalFilter, setGlobalFilter] = useState<string>('');
    const [monthFilter, setMonthFilter] = useState<number | null>(null);
    const [isFormVisible, setFormVisible] = useState(false);
    const [formType, setFormType] = useState<'masuk' | 'pulang'>('masuk');
    const [selectedLocation, setSelectedLocation] = useState<{ latitude: number; longitude: number } | null>(null);
    const [isEditing, setIsEditing] = useState(false);

    const [newEntry, setNewEntry] = useState<Entry>({
        email_karyawan: '',
        tanggal: new Date(),
        jam_masuk: new Date(),
        jam_pulang: new Date(),
        status: 'Tepat Waktu',
        foto_masuk: null,
        foto_pulang: null,
        latitude_masuk: -7.636952968680463,
        latitude_pulang: 0,
        longitude_masuk: 111.54260035904063,
        longitude_pulang: 0
    });

    // Refs
    const toast = useRef<Toast>(null);
    const formRef = useRef<HTMLDivElement>(null);
    const { data: session } = useSession();

    // Opsi filter bulan
    const monthOptions = [
        { label: 'Semua Bulan', value: null },
        { label: 'Januari', value: 1 },
        { label: 'Februari', value: 2 },
        { label: 'Maret', value: 3 },
        { label: 'April', value: 4 },
        { label: 'Mei', value: 5 },
        { label: 'Juni', value: 6 },
        { label: 'Juli', value: 7 },
        { label: 'Agustus', value: 8 },
        { label: 'September', value: 9 },
        { label: 'Oktober', value: 10 },
        { label: 'November', value: 11 },
        { label: 'Desember', value: 12 }
    ];

    // Fetch Data
    useEffect(() => {
        if (session?.user) {
            fetchEmployees();
            fetchAttendance();
            setNewEntry((p) => ({ ...p, email_karyawan: session?.user?.email }));
        }
    }, [session]);

    // Filter data when globalFilter, monthFilter or attendance changes
    useEffect(() => {
        let filtered = attendance;

        // Filter berdasarkan pencarian global
        if (globalFilter) {
            filtered = filtered.filter((entry) => Object.values(entry).some((val) => val && val.toString().toLowerCase().includes(globalFilter.toLowerCase())));
        }

        // Filter berdasarkan bulan
        if (monthFilter !== null) {
            filtered = filtered.filter((entry) => {
                const date = new Date(entry.tanggal);
                return date.getMonth() + 1 === monthFilter;
            });
        } else {
            filtered = attendance;
        }
        console.log(filtered);
        setFilteredAttendance(filtered);
    }, [globalFilter, monthFilter, attendance]);

    const fetchEmployees = async () => {
        const token = (session?.user as any)?.token;
        try {
            const response = await axios.post(
                'http://127.0.0.1:8000/api/karyawan',
                {},
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            setEmployees(response.data);
        } catch (error) {
            handleError('Gagal mengambil data karyawan', error);
        }
    };

    const fetchAttendance = async () => {
        const token = (session?.user as any)?.token;
        try {
            const response = await axios.post(
                'http://127.0.0.1:8000/api/absensi',
                {},
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            setAttendance(response.data.map(formatAttendanceData));
        } catch (error) {
            handleError('Gagal mengambil data absensi', error);
        }
    };

    // Helper Functions
    const formatAttendanceData = (entry: any) => ({
        id: entry.id,
        email_karyawan: entry.email_karyawan,
        nama_karyawan: entry.nama_karyawan,
        tanggal: entry.tanggal,
        jam_masuk: entry.jam_masuk,
        foto_masuk: entry.foto_masuk,
        latitude_masuk: entry.latitude_masuk,
        longitude_masuk: entry.longitude_masuk,
        status: entry.status,
        jam_pulang: entry.jam_pulang,
        foto_pulang: entry.foto_pulang,
        latitude_pulang: entry.latitude_pulang,
        longitude_pulang: entry.longitude_pulang
    });

    const handleError = (message: string, error: any) => {
        console.error(message, error);
        toast.current?.show({
            severity: 'error',
            summary: 'Error',
            detail: message,
            life: 3000
        });
    };

    // Form Handlers
    const handleShowForm = (type: 'masuk' | 'pulang') => {
        setFormType(type);
        setIsEditing(false);
        setFormVisible(true);
        resetForm();
    };

    const resetForm = () => {
        setNewEntry({
            id: 0,
            email_karyawan: session?.user?.email,
            tanggal: new Date(),
            jam_masuk: new Date(),
            jam_pulang: new Date(),
            status: 'Tepat Waktu',
            foto_masuk: null,
            foto_pulang: null,
            latitude_masuk: -7.636952968680463,
            latitude_pulang: 0,
            longitude_masuk: 111.54260035904063,
            longitude_pulang: 0
        });
    };

    // Location Handlers
    const getCurrentLocation = (type: 'masuk' | 'pulang') => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const newLocation = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    };

                    if (type === 'masuk') {
                        setNewEntry((prev) => ({
                            ...prev,
                            latitude_masuk: newLocation.latitude,
                            longitude_masuk: newLocation.longitude
                        }));
                        setSelectedLocation(newLocation);
                    } else {
                        setNewEntry((prev) => ({
                            ...prev,
                            latitude_pulang: newLocation.latitude,
                            longitude_pulang: newLocation.longitude
                        }));
                        setSelectedLocation(newLocation);
                    }
                },
                (error) => {
                    handleError('Gagal mendapatkan lokasi', error);
                }
            );
        }
    };

    // Submit Handlers
    const handleSubmit = async () => {
        if (!validateForm()) return;

        const formData = await prepareFormDataMasuk();
        const token = (session?.user as any)?.token;

        try {
            const response = await axios.post('http://127.0.0.1:8000/api/absensi/created', formData, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if ([200, 201].includes(response.status)) {
                handleSuccess();
            }
        } catch (error: any) {
            handleSubmitError(error);
        }
    };

    const handleSaveAbsensipulang = async () => {
        try {
            if (!newEntry.email_karyawan || !newEntry.jam_pulang) {
                toast.current?.show({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Karyawan dan jam pulang wajib diisi!',
                    life: 3000
                });
                return;
            }

            if (!newEntry.foto_pulang) {
                toast.current?.show({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Foto pulang wajib diupload!',
                    life: 3000
                });
                return;
            }

            const formData = await prepareFormDatapulang();

            const token = (session?.user as any)?.token;
            const response = await axios.post(`http://127.0.0.1:8000/api/absensi/${newEntry.id}/pulang`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.status === 200) {
                toast.current?.show({
                    severity: 'success',
                    summary: 'Berhasil',
                    detail: 'Absensi pulang berhasil dicatat',
                    life: 3000
                });
                setFormVisible(false);
                fetchAttendance();
                resetForm();
            }
        } catch (error: any) {
            console.error('Error saving absensi pulang:', error);
            toast.current?.show({
                severity: 'error',
                summary: 'Gagal',
                detail: error.response?.data?.message || 'Gagal menyimpan absensi pulang',
                life: 3000
            });
        }
    };

    const validateForm = () => {
        if (!newEntry.email_karyawan || (formType === 'masuk' && !newEntry.tanggal) || !newEntry.jam_masuk) {
            console.log(newEntry.email_karyawan);
            toast.current?.show({
                severity: 'warn',
                summary: 'Peringatan',
                detail: 'Semua field wajib diisi!',
                life: 3000
            });
            return false;
        }
        return true;
    };

    const prepareFormDataMasuk = async () => {
        let fotoMasukBase64 = '';
        if (newEntry.foto_masuk instanceof File) {
            if (newEntry.foto_masuk.size > 20 * 1024 * 1024) {
                toast.current?.show({
                    severity: 'warn',
                    summary: 'Peringatan',
                    detail: 'Ukuran foto melebihi 20MB!',
                    life: 3000
                });
                throw new Error('File too large');
            }
            fotoMasukBase64 = (await convertToBase64(newEntry.foto_masuk)) as string;
        }

        return {
            email_karyawan: newEntry.email_karyawan,
            tanggal: newEntry.tanggal?.toISOString().split('T')[0],
            jam_masuk: newEntry.jam_masuk.toTimeString().split(' ')[0].slice(0, 5),
            foto_masuk: fotoMasukBase64,
            latitude_masuk: Number(newEntry.latitude_masuk),
            longitude_masuk: Number(newEntry.longitude_masuk)
        };
    };

    const prepareFormDatapulang = async () => {
        let fotopulangBase64 = '';
        if (newEntry.foto_pulang instanceof File) {
            if (newEntry.foto_pulang.size > 20 * 1024 * 1024) {
                toast.current?.show({
                    severity: 'warn',
                    summary: 'Peringatan',
                    detail: 'Ukuran foto melebihi 20MB!',
                    life: 3000
                });
                throw new Error('File too large');
            }
            fotopulangBase64 = (await convertToBase64(newEntry.foto_pulang)) as string;
        }

        return {
            email_karyawan: newEntry.email_karyawan,
            jam_pulang: newEntry.jam_pulang?.toTimeString().split(' ')[0].slice(0, 5),
            foto_pulang: fotopulangBase64,
            latitude_pulang: Number(newEntry.latitude_pulang),
            longitude_pulang: Number(newEntry.longitude_pulang)
        };
    };

    const handleSuccess = () => {
        fetchAttendance();
        setFormVisible(false);
        resetForm();
        Swal.fire({
            title: 'Berhasil!',
            text: isEditing ? 'Data berhasil diperbarui!' : 'Data berhasil disimpan!',
            icon: 'success',
            confirmButtonText: 'OK'
        });
    };

    const handleSubmitError = (error: any) => {
        console.error('Error:', error);
        const errorMessage = error.response?.data?.message || 'Terjadi kesalahan saat menyimpan data';
        toast.current?.show({
            severity: 'error',
            summary: 'Error',
            detail: errorMessage,
            life: 3000
        });
    };

    // Utility Functions
    const convertToBase64 = (file: File) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = (error) => reject(error);
        });
    };

    const getEmployeeNameById = (email_karyawan: string) => {
        const employee = employees.find((emp) => emp.id.toString() === email_karyawan);
        return employee?.nama_karyawan || 'Tidak Diketahui';
    };

    return (
        <div className="grid">
            <Toast ref={toast} />

            {/* Header Buttons */}
            <div className="col-12 flex justify-content-end gap-2 mb-3">{/* <Button label="Absensi Masuk" icon="pi pi-sign-in" className="p-button-sm" onClick={() => handleShowForm('masuk')} /> */}</div>

            {/* Integrated Absensi Form */}
            <CSSTransition nodeRef={formRef} in={isFormVisible} timeout={300} classNames="fade" unmountOnExit>
                <div ref={formRef}>
                    <Dialog visible={isFormVisible} style={{ width: '55vw', minWidth: '320px' }} header={`Form Absensi ${formType === 'masuk' ? 'Masuk' : 'pulang'}`} modal onHide={() => setFormVisible(false)}>
                        <div className="p-fluid grid formgrid p-3 gap-3">
                            {/* Dynamic Form Content */}
                            {formType === 'masuk' ? (
                                // Form Masuk
                                <>
                                    <div className="field col-12 md:col-6">
                                        <div className="flex flex-column gap-1">
                                            <label htmlFor="tanggal">Tanggal</label>
                                            <Calendar
                                                id="tanggal"
                                                value={newEntry.tanggal}
                                                onChange={(e) =>
                                                    setNewEntry({
                                                        ...newEntry,
                                                        tanggal: e.value || null
                                                    })
                                                }
                                                dateFormat="yy-mm-dd"
                                                showIcon
                                                readOnlyInput
                                                className="p-inputtext-sm"
                                            />
                                        </div>
                                    </div>

                                    <div className="field col-12 md:col-6">
                                        <div className="flex flex-column gap-1">
                                            <label htmlFor="jamMasuk">Jam Masuk</label>
                                            <Calendar
                                                id="jamMasuk"
                                                value={newEntry.jam_masuk}
                                                onChange={(e) =>
                                                    setNewEntry({
                                                        ...newEntry,
                                                        jam_masuk: e.value || new Date()
                                                    })
                                                }
                                                timeOnly
                                                hourFormat="24"
                                                showTime
                                                className="p-inputtext-sm"
                                            />
                                        </div>
                                    </div>

                                    <div className="field col-12">
                                        <div className="flex flex-column gap-1">
                                            <label htmlFor="fotoMasuk">Upload Foto Masuk</label>
                                            <input
                                                type="file"
                                                id="fotoMasuk"
                                                accept="image/*"
                                                className="p-inputtext p-component p-inputtext-sm w-full"
                                                onChange={(e) =>
                                                    setNewEntry({
                                                        ...newEntry,
                                                        foto_masuk: e.target.files?.[0] || null
                                                    })
                                                }
                                            />
                                        </div>
                                    </div>

                                    <div className="field col-12">
                                        <div className="flex flex-column gap-1">
                                            <label>Lokasi Masuk</label>
                                            <div className="flex gap-2">
                                                <InputText value={newEntry.latitude_masuk.toString()} placeholder="Latitude" className="p-inputtext-sm" readOnly />
                                                <InputText value={newEntry.longitude_masuk.toString()} placeholder="Longitude" className="p-inputtext-sm" readOnly />
                                                <Button icon="pi pi-map-marker" className="p-button-sm" onClick={() => getCurrentLocation('masuk')} tooltip="Dapatkan Lokasi Saat Ini" />
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                // Form pulang
                                <>
                                    <div className="field col-12">
                                        <div className="flex flex-column gap-1">
                                            <label htmlFor="jampulang">Jam pulang</label>
                                            <Calendar
                                                id="jampulang"
                                                value={newEntry.jam_pulang}
                                                onChange={(e) =>
                                                    setNewEntry({
                                                        ...newEntry,
                                                        jam_pulang: e.value || new Date()
                                                    })
                                                }
                                                timeOnly
                                                hourFormat="24"
                                                showTime
                                                className="p-inputtext-sm"
                                            />
                                        </div>
                                    </div>

                                    <div className="field col-12">
                                        <div className="flex flex-column gap-1">
                                            <label htmlFor="fotopulang">Upload Foto pulang</label>
                                            <input
                                                type="file"
                                                id="fotopulang"
                                                accept="image/*"
                                                className="p-inputtext p-component p-inputtext-sm w-full"
                                                onChange={(e) =>
                                                    setNewEntry({
                                                        ...newEntry,
                                                        foto_pulang: e.target.files?.[0] || null
                                                    })
                                                }
                                            />
                                        </div>
                                    </div>

                                    <div className="field col-12">
                                        <div className="flex flex-column gap-1">
                                            <label>Lokasi pulang</label>
                                            <div className="flex gap-2">
                                                <InputText value={newEntry.latitude_pulang?.toString() || ''} placeholder="Latitude" className="p-inputtext-sm" readOnly />
                                                <InputText value={newEntry.longitude_pulang?.toString() || ''} placeholder="Longitude" className="p-inputtext-sm" readOnly />
                                                <Button icon="pi pi-map-marker" className="p-button-sm" onClick={() => getCurrentLocation('pulang')} tooltip="Dapatkan Lokasi Saat Ini" />
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Action Buttons */}
                            <div className="field col-12 flex justify-content-end gap-2 mt-3">
                                <Button label="Batal" icon="pi pi-times" className="p-button-secondary p-button-sm" onClick={() => setFormVisible(false)} />
                                <Button label="Simpan" icon="pi pi-check" className="p-button-sm p-button-raised" onClick={formType == 'masuk' ? handleSubmit : handleSaveAbsensipulang} />
                            </div>
                        </div>
                    </Dialog>
                </div>
            </CSSTransition>

            {/* Data Table with Global Search */}
            <div className="col-12">
                <div className="card">
                    <div className="flex justify-content-between align-items-center mb-3">
                        <h2 className="m-0">Daftar Absensi</h2>
                        <div className="flex gap-2">
                            <Dropdown value={monthFilter} options={monthOptions} onChange={(e) => setMonthFilter(e.value)} placeholder="Filter Bulan" className="p-inputtext-sm" optionValue="value" optionLabel="label" style={{ width: '150px' }} />
                            <span className="p-input-icon-left">
                                <i className="pi pi-search" />
                                <InputText type="search" value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} placeholder="Cari data..." className="p-inputtext-sm" />
                            </span>
                        </div>
                    </div>

                    <DataTable value={filteredAttendance} paginator rows={10} rowsPerPageOptions={[5, 10, 25]} responsiveLayout="scroll" className="mt-3" globalFilter={globalFilter}>
                        <Column field="nama_karyawan" header="Karyawan" />
                        <Column field="tanggal" header="Tanggal" />
                        <Column field="jam_masuk" header="Jam Masuk" />
                        <Column field="jam_pulang" header="Jam pulang" />
                        <Column field="status" header="Status" />

                        <Column field="foto_masuk" header="Foto Masuk" body={(rowData) => <img src={rowData.foto_masuk} alt="Foto Masuk" className="shadow-2 border-round" style={{ width: '80px', height: '80px', objectFit: 'cover' }} />} />

                        <Column
                            field="foto_pulang"
                            header="Foto pulang"
                            body={(rowData) => (rowData.foto_pulang ? <img src={rowData.foto_pulang} alt="Foto pulang" className="shadow-2 border-round" style={{ width: '80px', height: '80px', objectFit: 'cover' }} /> : '-')}
                        />

                        <Column field="latitude_masuk" header="Latitude Masuk" />
                        <Column field="longitude_masuk" header="Longitude Masuk" />
                        <Column field="latitude_pulang" header="Latitude pulang" />
                        <Column field="longitude_pulang" header="Longitude pulang" />

                        <Column
                            header="Lokasi Masuk"
                            body={(rowData) =>
                                rowData.latitude_masuk && rowData.longitude_masuk ? (
                                    <Button
                                        label="Lihat Peta"
                                        icon="pi pi-map"
                                        className="p-button-info p-button-sm"
                                        onClick={() =>
                                            setSelectedLocation({
                                                latitude: rowData.latitude_masuk,
                                                longitude: rowData.longitude_masuk
                                            })
                                        }
                                    />
                                ) : (
                                    '-'
                                )
                            }
                        />

                        <Column
                            header="Lokasi pulang"
                            body={(rowData) =>
                                rowData.latitude_pulang && rowData.longitude_pulang ? (
                                    <Button
                                        label="Lihat Peta"
                                        icon="pi pi-map"
                                        className="p-button-info p-button-sm"
                                        onClick={() =>
                                            setSelectedLocation({
                                                latitude: rowData.latitude_pulang,
                                                longitude: rowData.longitude_pulang
                                            })
                                        }
                                    />
                                ) : (
                                    '-'
                                )
                            }
                        />
                    </DataTable>
                </div>
            </div>

            {/* Map Dialog */}
            <Dialog visible={!!selectedLocation} style={{ width: '50vw', minWidth: '300px' }} header="Lokasi Absensi" modal onHide={() => setSelectedLocation(null)}>
                {selectedLocation && pinIcon && (
                    <div style={{ height: '400px', width: '100%' }}>
                        <MapContainer center={[selectedLocation.latitude, selectedLocation.longitude]} zoom={15} style={{ height: '100%', width: '100%' }}>
                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
                            <Marker position={[selectedLocation.latitude, selectedLocation.longitude]} icon={pinIcon}>
                                <Popup>
                                    <div className="text-center">
                                        <strong>Lokasi Absensi</strong>
                                        <br />
                                        Latitude: {selectedLocation.latitude}
                                        <br />
                                        Longitude: {selectedLocation.longitude}
                                    </div>
                                </Popup>
                            </Marker>
                        </MapContainer>
                    </div>
                )}
            </Dialog>
        </div>
    );
};

export default Hadir;
