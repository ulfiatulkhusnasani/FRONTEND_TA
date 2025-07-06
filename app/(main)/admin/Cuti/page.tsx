'use client';

import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Toast } from 'primereact/toast';
import { Calendar } from 'primereact/calendar';
import axios, { AxiosError } from 'axios';
import Swal from 'sweetalert2';
import { useSession } from 'next-auth/react';
import { Image } from 'primereact/image';

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

const Cuti = () => {
    const [requests, setRequests] = useState<LeaveRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [karyawanList, setKaryawanList] = useState<Karyawan[]>([]);
    const [dialogVisible, setDialogVisible] = useState(false);
     const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [newRequest, setNewRequest] = useState<LeaveRequest>({
        id: 0,
        id_karyawan: '',
        tgl_mulai: '',
        tgl_selesai: '',
        alasan: '',
        keterangan: '',
        status: 'pending',
        lampiran: ''
    });
    const [isEdit, setIsEdit] = useState(false);
    const { status, data: session } = useSession();
    const toast = useRef<Toast>(null);

    const statusOptions = [
        { label: 'Pending', value: 'pending' },
        { label: 'Disetujui', value: 'disetujui' },
        { label: 'Ditolak', value: 'ditolak' }
    ] as const;

    const statusColors: Record<Status, { bg: string; text: string }> = {
        pending: { bg: '#feedaf', text: '#8a5340' },
        disetujui: { bg: '#c8e6c9', text: '#256029' },
        ditolak: { bg: '#ffcdd2', text: '#c63737' }
    };

    const statusBodyTemplate = (rowData: LeaveRequest) => {
        return (
            <div className="flex align-items-center gap-2">
                <span
                    className="status-badge"
                    style={{
                        backgroundColor: statusColors[rowData.status].bg,
                        color: statusColors[rowData.status].text,
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.25rem',
                        fontSize: '0.875rem'
                    }}
                >
                    {rowData.status}
                </span>
                <Dropdown
                    value={rowData.status}
                    options={statusOptions.map((option) => ({
                        label: option.label,
                        value: option.value
                    }))}
                    onChange={(e) => handleStatusChange(e, rowData)}
                    className="w-8rem"
                />
            </div>
        );
    };

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const token = (session?.user as any).token;
            const response = await axios.post('http://127.0.0.1:8000/api/izin', {}, { headers: { Authorization: `Bearer ${token}` } });
            setRequests(response.data);
        } catch (error) {
            handleAxiosError(error, 'permohonan cuti');
        } finally {
            setLoading(false);
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
            setKaryawanList(response.data);
        } catch (error) {
            handleAxiosError(error, 'data karyawan');
        } finally {
            setLoading(false);
        }
    };

    const handleAxiosError = (error: unknown, context: string) => {
        if (axios.isAxiosError(error)) {
            const err = error as AxiosError<ErrorResponse>;
            const errorMessage = err.response?.data.message || err.message;
            toast.current?.show({
                severity: 'error',
                summary: `Gagal memuat ${context}`,
                detail: errorMessage,
                life: 3000
            });
        } else {
            console.error('Terjadi kesalahan:', error);
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: 'Terjadi kesalahan tidak diketahui',
                life: 3000
            });
        }
    };

    useEffect(() => {
        if (session?.user) {
            fetchRequests();
            fetchKaryawanList();
        }
    }, [session]);

    const handleOpenDialog = () => {
        if (karyawanList.length === 0) {
            toast.current?.show({
                severity: 'warn',
                summary: 'Data Belum Siap',
                detail: 'Mohon tunggu data karyawan selesai dimuat',
                life: 3000
            });
            return;
        }
        resetNewRequest();
        setDialogVisible(true);
    };

    const handleSubmit = async () => {
        const token = (session?.user as any).token;

        try {
            const formData = new FormData();
            formData.append('id_karyawan', newRequest.id_karyawan);
            formData.append('tgl_mulai', newRequest.tgl_mulai);
            formData.append('tgl_selesai', newRequest.tgl_selesai);
            formData.append('alasan', newRequest.alasan);
            formData.append('keterangan', newRequest.keterangan);
            formData.append('status', newRequest.status);
            if (newRequest.lampiran) {
                formData.append('lampiran', newRequest.lampiran);
            }

            const config = {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            };

            const response = isEdit ? await axios.put(`http://127.0.0.1:8000/api/izin/${newRequest.id}`, formData, config) : await axios.post('http://127.0.0.1:8000/api/izin/store', formData, config);

            await fetchRequests();
            setDialogVisible(false);
            resetNewRequest();

            Swal.fire({
                title: 'Berhasil!',
                text: isEdit ? 'Permohonan cuti berhasil diperbarui.' : 'Permohonan cuti berhasil ditambahkan.',
                icon: 'success'
            });
        } catch (error) {
            handleAxiosError(error, 'menyimpan permohonan izin');
        }
    };

    const resetNewRequest = () => {
        setNewRequest({
            id: 0,
            id_karyawan: karyawanList[0]?.id || '',
            tgl_mulai: '',
            tgl_selesai: '',
            alasan: '',
            keterangan: '',
            status: 'pending',
            lampiran: ''
        });
        setIsEdit(false);
    };

    const handleStatusChange = async (e: { value: Status }, rowData: LeaveRequest) => {
        const updatedRequest = { ...rowData, status: e.value };
        const token = (session?.user as any).token;

        try {
            await axios.put(`http://127.0.0.1:8000/api/izin/${updatedRequest.id}`, updatedRequest, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setRequests((prev) => prev.map((req) => (req.id === updatedRequest.id ? updatedRequest : req)));

            Swal.fire({
                title: 'Berhasil!',
                text: `Status berhasil diubah menjadi ${e.value}.`,
                icon: 'success'
            });
        } catch (error) {
            handleAxiosError(error, 'mengubah status');
        }
    };

    const handleDelete = async (id: number) => {
        const token = (session?.user as any).token;

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
                await axios.delete(`http://127.0.0.1:8000/api/izin/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                await fetchRequests();
                Swal.fire('Dihapus!', 'Data berhasil dihapus.', 'success');
            }
        } catch (error) {
            handleAxiosError(error, 'menghapus data');
        }
    };

    const getNamaKaryawan = (id: string) => {
        return karyawanList.find((k) => k.id === id)?.nama_karyawan || 'Tidak Diketahui';
    };

    const handleEdit = (rowData: LeaveRequest) => {
        setNewRequest(rowData);
        setIsEdit(true);
        setDialogVisible(true);
    };

    return (
        <div className="grid">
            <Toast ref={toast} />

            <div className="col-12">
                <div className="card">
                    <DataTable value={requests} loading={loading} responsiveLayout="scroll" paginator rows={10}>
                        <Column header="No" body={(_, { rowIndex }) => rowIndex + 1} />
                        <Column header="Nama Karyawan" body={(rowData: LeaveRequest) => getNamaKaryawan(rowData.id_karyawan)} />
                        <Column field="tgl_mulai" header="Mulai" />
                        <Column field="tgl_selesai" header="Selesai" />
                        <Column field="alasan" header="Jenis Izin" />
                        <Column field="keterangan" header="Keterangan" />
                        <Column header="Status" body={statusBodyTemplate} style={{ minWidth: '200px' }} />
                        <Column header="lampiran" body={(rowData: LeaveRequest) => (rowData.lampiran ? <Image width="150" height="80" preview src={`data:image/png;base64,${rowData.lampiran}`} /> : 'Tidak Ada')} />
                        <Column
                            header="Aksi"
                            body={(rowData: LeaveRequest) => (
                                <div className="flex gap-1">
                                    <Button icon="pi pi-pencil" className="p-button-success p-button-rounded p-button-sm" onClick={() => handleEdit(rowData)} />
                                    <Button icon="pi pi-trash" className="p-button-danger p-button-rounded p-button-sm" onClick={() => handleDelete(rowData.id)} />
                                </div>
                            )}
                        />
                    </DataTable>

                    <Dialog header={isEdit ? 'Edit Permohonan' : 'Buat Permohonan Baru'} visible={dialogVisible} style={{ width: '50vw', maxWidth: '600px' }} onHide={() => setDialogVisible(false)}>
                        <div className="p-fluid grid formgrid p-3 gap-2">
                            <div className="field col-12">
                                <div className="flex flex-column gap-1">
                                    <label>Karyawan</label>
                                    <InputText value={karyawanList[0]?.nama_karyawan} disabled className="p-inputtext-sm" />
                                </div>
                            </div>

                            <div className="field col-12 md:col-12">
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

                            <div className="field col-12 md:col-12">
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
                                        options={[
                                            { label: 'Cuti', value: 'cuti' },
                                            { label: 'Izin', value: 'izin' }
                                        ]}
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
