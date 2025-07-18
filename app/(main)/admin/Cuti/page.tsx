'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Toast } from 'primereact/toast';
import { Calendar } from 'primereact/calendar';
import { Image } from 'primereact/image';
import axios, { AxiosError } from 'axios';
import Swal from 'sweetalert2';
import { useSession } from 'next-auth/react';

// ================ Tipe Data ================
type Status = 'pending' | 'disetujui' | 'ditolak';

interface LeaveRequest {
    id: number;
    id_karyawan: string;
    tgl_mulai: string;
    tgl_selesai: string;
    alasan: string;
    keterangan: string;
    status: Status;
    lampiran: string;
}

interface Karyawan {
    id: string;
    nama_karyawan: string;
}

interface ErrorResponse {
    message: string;
}

// ================ Komponen Utama ================
const Cuti = () => {
    const [requests, setRequests] = useState<LeaveRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [karyawanList, setKaryawanList] = useState<Karyawan[]>([]);
    const [dialogVisible, setDialogVisible] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [newRequest, setNewRequest] = useState<Omit<LeaveRequest, 'id'>>({
        id_karyawan: '',
        tgl_mulai: '',
        tgl_selesai: '',
        alasan: '',
        keterangan: '',
        status: 'pending',
        lampiran: ''
    });
    const [editId, setEditId] = useState<number | null>(null);
    const { data: session } = useSession();
    const toast = useRef<Toast>(null);

    // ================ Konstanta ================
    const statusOptions = [
        { label: 'Pending', value: 'pending' },
        { label: 'Disetujui', value: 'disetujui' },
        { label: 'Ditolak', value: 'ditolak' }
    ];

    const leaveTypes = [
        { label: 'Cuti', value: 'cuti' },
        { label: 'Izin', value: 'izin' }
    ];

    const statusColors: Record<Status, { bg: string; text: string }> = {
        pending: { bg: '#feedaf', text: '#8a5340' },
        disetujui: { bg: '#c8e6c9', text: '#256029' },
        ditolak: { bg: '#ffcdd2', text: '#c63737' }
    };

    // ================ API Handler ================
    const apiClient = useCallback(() => {
        const token = (session?.user as any)?.token;

        return axios.create({
            baseURL: 'http://127.0.0.1:8000/api',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'multipart/form-data'
            }
        });
    }, [session]);

    // ================ Fetch Data ================
    const fetchData = useCallback(async () => {
        if (!session) return;

        setLoading(true);
        try {
            const client = apiClient();
            const [cutiRes, karyawanRes] = await Promise.all([client.post('/izin'), client.post('/karyawan')]);

            setRequests(cutiRes.data);
            setKaryawanList(karyawanRes.data);
        } catch (error) {
            handleAxiosError(error, 'data');
        } finally {
            setLoading(false);
        }
    }, [session, apiClient]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // ================ Error Handler ================
    const handleAxiosError = useCallback((error: unknown, context: string) => {
        const errorMessage = axios.isAxiosError(error) ? error.response?.data?.message || error.message : 'Terjadi kesalahan tidak diketahui';

        toast.current?.show({
            severity: 'error',
            summary: `Gagal memuat ${context}`,
            detail: errorMessage,
            life: 3000
        });
    }, []);

    // ================ Dialog Handler ================
    const handleOpenDialog = () => {
        if (!karyawanList.length) {
            toast.current?.show({
                severity: 'warn',
                summary: 'Data Belum Siap',
                detail: 'Mohon tunggu data karyawan selesai dimuat',
                life: 3000
            });
            return;
        }
        resetForm();
        setDialogVisible(true);
    };

    const resetForm = () => {
        setNewRequest({
            id_karyawan: karyawanList[0]?.id || '',
            tgl_mulai: '',
            tgl_selesai: '',
            alasan: '',
            keterangan: '',
            status: 'pending',
            lampiran: ''
        });
        setSelectedFile(null);
        setEditId(null);
    };

    // ================ CRUD Operations ================
    const handleSubmit = async () => {
        try {
            const client = apiClient();
            const formData = new FormData();

            // Tambahkan field ke formData
            Object.entries(newRequest).forEach(([key, value]) => {
                if (value !== undefined && key !== 'lampiran') {
                    formData.append(key, value);
                }
            });

            if (selectedFile) {
                formData.append('lampiran', selectedFile);
            }

            if (editId) {
                await client.post(`/izin/${editId}/update`, formData);
                setDialogVisible(false);
                Swal.fire('Berhasil!', 'Permohonan cuti berhasil diperbarui.', 'success');
            } else {
                await client.post('/izin/store', formData);
                setDialogVisible(false);
                Swal.fire('Berhasil!', 'Permohonan cuti berhasil ditambahkan.', 'success');
            }

            await fetchData();
        } catch (error) {
            handleAxiosError(error, 'menyimpan permohonan izin');
        }
    };

    const handleDelete = async (id: number) => {
        try {
            const confirm = await Swal.fire({
                title: 'Anda yakin?',
                text: 'Data akan dihapus permanen!',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Ya, Hapus!'
            });

            if (confirm.isConfirmed) {
                await apiClient().delete(`/izin/${id}`);
                await fetchData();
                Swal.fire('Dihapus!', 'Data berhasil dihapus.', 'success');
            }
        } catch (error) {
            handleAxiosError(error, 'menghapus data');
        }
    };

    const handleEdit = (rowData: LeaveRequest) => {
        const { id, ...rest } = rowData;
        setNewRequest(rest);
        setEditId(id);
        setDialogVisible(true);
    };

    // ================ Status Handler ================
    const handleStatusChange = async (e: { value: Status }, rowData: LeaveRequest) => {
        try {
            const updatedRequest = { ...rowData, status: e.value };
            await apiClient().post(`/izin/${updatedRequest.id}/update`, { ...updatedRequest, lampiran: null });

            setRequests((prev) => prev.map((req) => (req.id === updatedRequest.id ? updatedRequest : req)));

            await fetchData();
            Swal.fire('Berhasil!', `Status berhasil diubah menjadi ${e.value}.`, 'success');
        } catch (error) {
            handleAxiosError(error, 'mengubah status');
        }
    };

    // ================ Template Components ================
    const StatusBadge = ({ status }: { status: Status }) => (
        <span
            className="status-badge"
            style={{
                backgroundColor: statusColors[status].bg,
                color: statusColors[status].text,
                padding: '0.25rem 0.5rem',
                borderRadius: '0.25rem',
                fontSize: '0.875rem'
            }}
        >
            {status}
        </span>
    );

    const StatusTemplate = (rowData: LeaveRequest) => (
        <div className="flex align-items-center gap-2">
            <StatusBadge status={rowData.status} />
            <Dropdown value={rowData.status} options={statusOptions} onChange={(e) => handleStatusChange(e, rowData)} className="w-8rem" />
        </div>
    );

    const AttachmentTemplate = (rowData: LeaveRequest) => (rowData.lampiran ? <Image width="150" height="80" preview src={`data:image/png;base64,${rowData.lampiran}`} alt="Lampiran" /> : 'Tidak Ada');

    const ActionTemplate = (rowData: LeaveRequest) => (
        <div className="flex gap-1">
            <Button icon="pi pi-pencil" className="p-button-success p-button-rounded p-button-sm" onClick={() => handleEdit(rowData)} />
            <Button icon="pi pi-trash" className="p-button-danger p-button-rounded p-button-sm" onClick={() => handleDelete(rowData.id)} />
        </div>
    );

    const getNamaKaryawan = (id: string) => {
        return karyawanList.find((k) => k.id === id)?.nama_karyawan || 'Tidak Diketahui';
    };

    // ================ Render ================
    return (
        <div className="grid">
            <Toast ref={toast} />

            <div className="col-12">
                <div className="card">
                    <div className="" style={{ marginBottom: '20px', display: 'flex', width: '100%', justifyContent: 'end' }}>
                        <Button label="Tambah" icon="pi pi-plus" className="p-button-primary" onClick={handleOpenDialog} />
                    </div>
                    <DataTable value={requests} loading={loading} responsiveLayout="scroll" paginator rows={10}>
                        <Column header="No" body={(_, { rowIndex }) => rowIndex + 1} />
                        <Column header="Nama Karyawan" body={(rowData: LeaveRequest) => getNamaKaryawan(rowData.id_karyawan)} />
                        <Column field="tgl_mulai" header="Mulai" />
                        <Column field="tgl_selesai" header="Selesai" />
                        <Column field="alasan" header="Jenis Izin" />
                        <Column field="keterangan" header="Keterangan" />
                        <Column header="Status" body={StatusTemplate} style={{ minWidth: '200px' }} />
                        <Column header="Lampiran" body={AttachmentTemplate} />
                        <Column header="Aksi" body={ActionTemplate} />
                    </DataTable>

                    <Dialog header={editId ? 'Edit Permohonan' : 'Buat Permohonan Baru'} visible={dialogVisible} style={{ width: '50vw', maxWidth: '600px' }} onHide={() => setDialogVisible(false)}>
                        <div className="p-fluid grid formgrid p-3 gap-2">
                            <div className="field col-12">
                                <div className="flex flex-column gap-1">
                                    <label>Karyawan</label>
                                    <InputText value={getNamaKaryawan(newRequest.id_karyawan)} disabled className="p-inputtext-sm" />
                                </div>
                            </div>

                            <div className="field col-12 md:col-6">
                                <div className="flex flex-column gap-1 w-full">
                                    <label>Tanggal Mulai</label>
                                    <Calendar
                                        value={newRequest.tgl_mulai ? new Date(newRequest.tgl_mulai) : null}
                                        onChange={(e) =>
                                            setNewRequest({
                                                ...newRequest,
                                                tgl_mulai: e.value?.toISOString().split('T')[0] || ''
                                            })
                                        }
                                        dateFormat="yy-mm-dd"
                                        showIcon
                                        className="p-inputtext-sm w-full"
                                    />
                                </div>
                            </div>

                            <div className="field col-12 md:col-6">
                                <div className="flex flex-column gap-1 w-full">
                                    <label>Tanggal Selesai</label>
                                    <Calendar
                                        value={newRequest.tgl_selesai ? new Date(newRequest.tgl_selesai) : null}
                                        onChange={(e) =>
                                            setNewRequest({
                                                ...newRequest,
                                                tgl_selesai: e.value?.toISOString().split('T')[0] || ''
                                            })
                                        }
                                        dateFormat="yy-mm-dd"
                                        showIcon
                                        className="p-inputtext-sm w-full"
                                    />
                                </div>
                            </div>

                            <div className="field col-12">
                                <div className="flex flex-column gap-1">
                                    <label>Jenis Izin</label>
                                    <Dropdown
                                        value={newRequest.alasan}
                                        options={leaveTypes}
                                        onChange={(e) =>
                                            setNewRequest({
                                                ...newRequest,
                                                alasan: e.value
                                            })
                                        }
                                        placeholder="Pilih Jenis"
                                        className="p-inputtext-sm"
                                    />
                                </div>
                            </div>

                            <div className="field col-12">
                                <div className="flex flex-column gap-3">
                                    <label htmlFor="uploadlampiran" className="font-bold">
                                        Upload lampiran
                                    </label>
                                    <div className="p-fileupload-choose relative border-round cursor-pointer">
                                        <input id="uploadlampiran" type="file" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} className="absolute w-full h-full opacity-0" accept="image/*" />
                                        <div className="flex align-items-center gap-3 p-3 border-1 border-300 border-round hover:border-primary transition-colors transition-duration-300">
                                            <i className="pi pi-cloud-upload text-2xl text-400" />
                                            <div className="flex flex-column">
                                                <span className="font-medium">{selectedFile ? selectedFile.name : 'Pilih File'}</span>
                                                <small className="text-500">Seret file kesini atau klik untuk upload</small>
                                            </div>
                                        </div>
                                    </div>

                                    {selectedFile && (
                                        <div className="mt-2">
                                            <img src={URL.createObjectURL(selectedFile)} alt="Preview" className="border-round shadow-2" style={{ maxWidth: '200px', maxHeight: '200px' }} />
                                        </div>
                                    )}

                                    <small className="text-color-secondary">Format file: JPG, PNG, JPEG (Maks. 5MB)</small>
                                </div>
                            </div>

                            <div className="field col-12">
                                <div className="flex flex-column gap-1">
                                    <label>Keterangan</label>
                                    <InputText
                                        value={newRequest.keterangan}
                                        onChange={(e) =>
                                            setNewRequest({
                                                ...newRequest,
                                                keterangan: e.target.value
                                            })
                                        }
                                        className="p-inputtext-sm"
                                    />
                                </div>
                            </div>

                            <div className="field col-12 flex justify-content-end gap-2 mt-3">
                                <Button label="Batal" icon="pi pi-times" className="p-button-secondary p-button-sm" onClick={() => setDialogVisible(false)} />
                                <Button label="Simpan" icon="pi pi-check" className="p-button-sm p-button-raised" onClick={handleSubmit} />
                            </div>
                        </div>
                    </Dialog>
                </div>
            </div>
        </div>
    );
};

export default Cuti;
