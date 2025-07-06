'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import axios from 'axios';
import Swal from 'sweetalert2';
import { useSession } from 'next-auth/react';
import { Calendar } from 'primereact/calendar';

interface KinerjaData {
    id: number;
    id_karyawan: string;
    namaKaryawan: string;
    izinCount: number;
    cutiCount: number;
    kehadiranCount: number;
    gajiPokok: number;
    uangKehadiran: number;
    uangMakan: number;
    tunjangan: number;
    bonus: number;
    tanggal: Date | null | any;
    potongan: number;
    totalgaji: number;
    slipGaji: string | null;
}

const DataPayrollKaryawan = () => {
    const [kinerjas, setKinerja] = useState<KinerjaData[]>([]);
    const [karyawanList, setKaryawanList] = useState<any[]>([]);

    const [dialogVisible, setDialogVisible] = useState(false);
    const [editDialogVisible, setEditDialogVisible] = useState(false);
    const [request, setRequest] = useState({
        id: 0,
        id_karyawan: '',
        id_direktur: '',
        namaKaryawan: '',
        tanggal: new Date() as any,
        target_absensi: 0 as any,
        target_produktivitas: 0 as any,
        hari_produktif: 0 as any
    });
    const [editRequest, setEditRequest] = useState({
        id: 0,
        id_karyawan: '',
        id_direktur: '',
        namaKaryawan: '',
        tanggal: new Date() as any,
        target_absensi: 0 as any,
        target_produktivitas: 0 as any,
        hari_produktif: 0 as any
    });
    const [loading, setLoading] = useState(false);
    const toastRef = useRef<Toast>(null);
    const { status, data: session } = useSession();

    const handleAxiosError = (error: any, source: string) => {
        console.error(`Error occurred while fetching ${source}:`, error);
        if (toastRef.current) {
            toastRef.current.show({
                severity: 'error',
                summary: 'Error',
                detail: `Gagal mengambil data ${source}.`,
                life: 3000
            });
        }
    };

    const fetchKinerjaData = async () => {
        const token = (session?.user as any).token;
        try {
            const response = await axios.get('http://127.0.0.1:8000/api/kinerja-summary', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            console.log(response.data.payroll_summaries);
            const kinerjaData = response.data.payroll_summaries.map((employee: any) => ({
                id: employee.id_payroll,
                id_karyawan: employee.id_karyawan,
                namaKaryawan: employee.nama_karyawan,
                izinCount: employee.izin_count || 0,
                tanggal: employee.tanggal || 0,
                cutiCount: employee.cuti_count || 0,
                kehadiranCount: employee.kehadiran_count || 0,
                gajiPokok: employee.gaji_pokok || 0,
                uangKehadiran: employee.uang_harian || 0,
                uangMakan: employee.uang_makan || 0,
                tunjangan: employee.tunjangan || 0,
                bonus: employee.bonus || 0,
                bulan: employee.bulan || 0,
                kinerja: employee.kinerja || 0,
                potongan: employee.potongan || 0,
                totalgaji: employee.total_gaji || 0,
                totalpointkehadiran: employee.total_point_kehadiran || 0,
                totalpointtask: employee.total_point_task || 0,
                slipGaji: employee.slip_gaji || ''
            }));
            setKinerja(kinerjaData);
        } catch (error) {
            handleAxiosError(error, 'kinerja');
        }
    };

    const fetchKaryawanList = async () => {
        setLoading(true);
        try {
            const token = (session?.user as any).token;
            const response = await axios.post(
                'http://127.0.0.1:8000/api/karyawan',
                {},
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            const data = response.data || [];

            const karyawan = setKaryawanList(response.data);
        } catch (error) {
            handleAxiosError(error, 'data karyawan');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (session?.user) {
            fetchKinerjaData();
            fetchKaryawanList();
        }
    }, [session]);

    const handleSubmit = async () => {
        const token = (session?.user as any).token;
        const mappedData = {
            tanggal: request.tanggal,
            id_karyawan: request.id_karyawan,
            id_direktur: request.id_direktur,
            target_absensi: request.target_absensi,
            target_produktivitas: request.target_produktivitas,
            hari_produktif: request.hari_produktif
        };

        // Validasi input
        if (!request.id_karyawan) {
            toastRef.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: 'Nama karyawan harus diisi.',
                life: 3000
            });
            return;
        }

        if (request.target_absensi === null || request.target_absensi === undefined) {
            toastRef.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: 'Target absensi harus diisi.',
                life: 3000
            });
            return;
        }

        if (request.target_produktivitas === null || request.target_produktivitas === undefined) {
            toastRef.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: 'Target produktivitas harus diisi.',
                life: 3000
            });
            return;
        }
        if (request.hari_produktif === null || request.hari_produktif === undefined) {
            toastRef.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: 'Hari produktif harus diisi.',
                life: 3000
            });
            return;
        }

        try {
            await axios.post('http://127.0.0.1:8000/api/kinerja-store', mappedData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            fetchKinerjaData();
            setDialogVisible(false);
            toastRef.current?.show({
                severity: 'success',
                summary: 'Berhasil',
                detail: 'Data kinerja karyawan berhasil disimpan'
            });
        } catch (error: any) {
            const e = error?.response?.data;
            console.error('Error saving kinerja:', error);
            toastRef.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: e.error || error.message || 'Gagal menyimpan data kinerja',
                life: 3000
            });
        }
    };

    const handleEdit = (kinerja: KinerjaData) => {
        setEditRequest({
            id: kinerja.id,
            id_karyawan: kinerja.id_karyawan,
            id_direktur: '', // You might need to fetch this from the kinerja data
            namaKaryawan: kinerja.namaKaryawan,
            tanggal: kinerja.tanggal ? new Date(kinerja.tanggal) : new Date(),
            target_absensi: 0, // You might need to fetch these from the kinerja data
            target_produktivitas: 0,
            hari_produktif: 0
        });
        setEditDialogVisible(true);
    };

    const handleUpdate = async () => {
        const token = (session?.user as any).token;
        const mappedData = {
            id_payroll: editRequest.id,
            tanggal: editRequest.tanggal,
            id_karyawan: editRequest.id_karyawan,
            id_direktur: editRequest.id_direktur,
            target_absensi: editRequest.target_absensi,
            target_produktivitas: editRequest.target_produktivitas,
            hari_produktif: editRequest.hari_produktif
        };

        // Validasi input
        if (!editRequest.id_karyawan) {
            toastRef.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: 'Nama karyawan harus diisi.',
                life: 3000
            });
            return;
        }

        if (editRequest.target_absensi === null || editRequest.target_absensi === undefined) {
            toastRef.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: 'Target absensi harus diisi.',
                life: 3000
            });
            return;
        }

        if (editRequest.target_produktivitas === null || editRequest.target_produktivitas === undefined) {
            toastRef.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: 'Target produktivitas harus diisi.',
                life: 3000
            });
            return;
        }
        if (editRequest.hari_produktif === null || editRequest.hari_produktif === undefined) {
            toastRef.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: 'Hari produktif harus diisi.',
                life: 3000
            });
            return;
        }

        try {
            await axios.put(`http://127.0.0.1:8000/api/kinerja-update/${editRequest.id}`, mappedData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            fetchKinerjaData();
            setEditDialogVisible(false);
            toastRef.current?.show({
                severity: 'success',
                summary: 'Berhasil',
                detail: 'Data kinerja karyawan berhasil diperbarui'
            });
        } catch (error: any) {
            const e = error?.response?.data;
            console.error('Error saving kinerja:', error);
            toastRef.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: e.error || error.message || 'Gagal menyimpan data kinerja',
                life: 3000
            });
        }
    };

    return (
        <div className="datatable-templating-demo">
            <Toast ref={toastRef} />
            <div className="card">
                <div className="flex justify-content-between align-items-center mb-5">
                    <h5>Data kinerja</h5>
                    <Button label="Tambah" icon="pi pi-plus" className="p-button-raised p-button-sm" onClick={() => setDialogVisible(true)} />
                </div>

                <DataTable value={kinerjas} responsiveLayout="scroll" loading={loading} paginator rows={10} rowsPerPageOptions={[5, 10, 25]}>
                    <Column field="id" header="ID" style={{ width: '5%' }} />
                    <Column field="tanggal" header="Tanggal" style={{ width: '5%' }} />
                    <Column field="namaKaryawan" header="Nama Karyawan" style={{ width: '10%' }} />
                    <Column field="izinCount" header="Izin" style={{ width: '5%' }} />
                    <Column field="cutiCount" header="Cuti" style={{ width: '5%' }} />
                    <Column field="kehadiranCount" header="Kehadiran" style={{ width: '8%' }} />
                    <Column field="totalpointkehadiran" header="Total Point Kehadiran" style={{ width: '8%' }} />
                    <Column field="totalpointtask" header="Total Point Task" style={{ width: '8%' }} />
                    <Column field="kinerja" header="Kinerja" style={{ width: '8%' }} />

                    <Column
                        header="Aksi"
                        body={(data) => (
                            <div className="flex gap-2">
                                <Button icon="pi pi-pencil" className="p-button-sm p-button-warning" onClick={() => handleEdit(data)} />
                            </div>
                        )}
                        style={{ width: '8%' }}
                    />
                </DataTable>

                {/* Add Dialog */}
                <Dialog header={'Tambah kinerja'} visible={dialogVisible} style={{ width: '50vw' }} onHide={() => setDialogVisible(false)}>
                    <div className="p-fluid">
                        <div className="field">
                            <label htmlFor="id_karyawan">Karyawan</label>
                            <Dropdown
                                value={request.id_karyawan}
                                options={karyawanList}
                                itemTemplate={(item) => (
                                    <>
                                        {item.nama_karyawan} ({item.jabatan})
                                    </>
                                )}
                                optionValue="id"
                                optionLabel="nama_karyawan"
                                onChange={(e) => setRequest({ ...request, id_karyawan: e.value })}
                                placeholder="Pilih Karyawan"
                            />
                        </div>

                        <div className="field">
                            <label htmlFor="tanggal">Tanggal</label>
                            <Calendar id="tanggal" value={request.tanggal ? new Date(request.tanggal) : null} onChange={(e) => setRequest({ ...request, tanggal: e.value })} dateFormat="yy-mm-dd" showIcon placeholder="Pilih Tanggal" />
                        </div>

                        <div className="field">
                            <label htmlFor="target_absensi">Target Point Karyawan Perbulan </label>
                            <InputNumber
                                id="target_absensi"
                                value={request.target_absensi}
                                onValueChange={(e) => setRequest({ ...request, target_absensi: e.value })}
                                mode="decimal"
                                min={0}
                                showButtons
                                placeholder="Masukkan Point Karyawan Perbulan"
                                className="w-full"
                            />
                        </div>

                        <div className="field">
                            <label htmlFor="hari_produktif">Hari Efektif/Bulan</label>
                            <InputNumber
                                id="hari_produktif"
                                value={request.hari_produktif}
                                onValueChange={(e) => setRequest({ ...request, hari_produktif: e.value })}
                                mode="decimal"
                                min={0}
                                max={31}
                                showButtons
                                placeholder="Masukkan hari produktif"
                                className="w-full"
                            />
                        </div>

                        <div className="p-mt-3 flex justify-content-end">
                            <Button label="Simpan" icon="pi pi-check" className="p-button-success" onClick={handleSubmit} />
                        </div>
                    </div>
                </Dialog>

                {/* Edit Dialog */}
                <Dialog header={'Edit kinerja'} visible={editDialogVisible} style={{ width: '50vw' }} onHide={() => setEditDialogVisible(false)}>
                    <div className="p-fluid">
                        <div className="field">
                            <label htmlFor="id_karyawan">Karyawan</label>
                            <Dropdown
                                value={editRequest.id_karyawan}
                                options={karyawanList}
                                itemTemplate={(item) => (
                                    <>
                                        {item.nama_karyawan} ({item.jabatan})
                                    </>
                                )}
                                optionValue="id"
                                optionLabel="nama_karyawan"
                                onChange={(e) => setEditRequest({ ...editRequest, id_karyawan: e.value })}
                                placeholder="Pilih Karyawan"
                            />
                        </div>

                        <div className="field">
                            <label htmlFor="tanggal">Tanggal</label>
                            <Calendar id="tanggal" value={editRequest.tanggal ? new Date(editRequest.tanggal) : null} onChange={(e) => setEditRequest({ ...editRequest, tanggal: e.value })} dateFormat="yy-mm-dd" showIcon placeholder="Pilih Tanggal" />
                        </div>

                        <div className="field">
                            <label htmlFor="target_absensi">Target Absensi </label>
                            <InputNumber
                                id="target_absensi"
                                value={editRequest.target_absensi}
                                onValueChange={(e) => setEditRequest({ ...editRequest, target_absensi: e.value })}
                                mode="decimal"
                                min={0}
                                showButtons
                                placeholder="Masukkan Target Absensi"
                                className="w-full"
                            />
                        </div>

                        <div className="field">
                            <label htmlFor="hari_produktif">Hari Efektif/Bulan</label>
                            <InputNumber
                                id="hari_produktif"
                                value={editRequest.hari_produktif}
                                onValueChange={(e) => setEditRequest({ ...editRequest, hari_produktif: e.value })}
                                mode="decimal"
                                min={0}
                                max={31}
                                showButtons
                                placeholder="Masukkan hari produktif"
                                className="w-full"
                            />
                        </div>

                        <div className="p-mt-3 flex justify-content-end gap-2">
                            <Button label="Batal" icon="pi pi-times" className="p-button-secondary" onClick={() => setEditDialogVisible(false)} />
                            <Button label="Simpan" icon="pi pi-check" className="p-button-success" onClick={handleUpdate} />
                        </div>
                    </div>
                </Dialog>
            </div>
        </div>
    );
};

export default DataPayrollKaryawan;
