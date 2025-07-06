'use client';

import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Calendar } from 'primereact/calendar';
import axios, { AxiosError } from 'axios';
import { Toast } from 'primereact/toast';
import Swal from 'sweetalert2';
import { Dropdown } from 'primereact/dropdown';
import { useSession } from 'next-auth/react';

interface Karyawan {
    id: number;
    nama_karyawan: string;
    nip: string;
    jabatan_nama: string;
}

interface Task {
    id_tugas: number; // Ganti id_tugas menjadi id_tugas
    status: string;
    judul_proyek: string;
    kegiatan: string;
    tgl_mulai: string;
    batas_penyelesaian: string;
    tgl_selesai: string | null;
    id_karyawan: number;
    point: number;
    nama_karyawan: string;
    jabatan_nama: string;
}

const TaskManager = () => {
    const [taskList, setTaskList] = useState<Task[]>([]);
    const [dialogVisible, setDialogVisible] = useState(false);
    const [newTask, setNewTask] = useState<Task>({
        id_tugas: 0,
        id_karyawan: 0,
        judul_proyek: '',
        kegiatan: '',
        status: 'belum dimulai',
        tgl_mulai: '',
        batas_penyelesaian: '',
        tgl_selesai: '',
        point: 0,
        nama_karyawan: '',
        jabatan_nama: ''
    });

    const [isEdit, setIsEdit] = useState(false);
    const [loading, setLoading] = useState(true);
    const [karyawanList, setKaryawanList] = useState<Karyawan[]>([]);
    const toast = useRef<Toast>(null);
    const { status, data: session } = useSession();

    const fetchTaskList = async () => {
        setLoading(true);
        try {
            const token = (session?.user as any).token;
            const response = await axios.post(
                'http://127.0.0.1:8000/api/tasks',
                {},
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            setTaskList(response.data);
        } catch (error) {
            handleAxiosError(error, 'memuat daftar tugas');
        } finally {
            setLoading(false);
        }
    };

    const fetchKaryawanList = async () => {
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
            handleAxiosError(error, 'memuat daftar karyawan');
        }
    };

    const handleAxiosError = (error: unknown, context: string) => {
        if (axios.isAxiosError(error)) {
            const err = error as AxiosError;
            const errorMessage = err.response?.data && typeof err.response.data === 'object' && 'message' in err.response.data ? (err.response.data as { message: string }).message : err.message;

            toast.current?.show({
                severity: 'error',
                summary: `Kesalahan saat ${context}`,
                detail: errorMessage,
                life: 3000
            });
        } else {
            console.error('Error:', error);
        }
    };

    const handleOpenDialog = () => {
        resetNewTask();
        setIsEdit(false);
        setDialogVisible(true);
    };

    const resetNewTask = () => {
        setNewTask({
            id_tugas: 0,
            judul_proyek: '',
            kegiatan: '',
            status: 'belum dimulai',
            tgl_mulai: '',
            batas_penyelesaian: '',
            tgl_selesai: '',
            id_karyawan: 0,
            point: 0,
            nama_karyawan: '',
            jabatan_nama: ''
        });
    };

    const handleSubmit = async () => {
        const token = (session?.user as any).token;

        try {
            const url = isEdit ? `http://127.0.0.1:8000/api/tasks/${newTask.id_tugas}` : 'http://127.0.0.1:8000/api/tasks/store';

            const method = isEdit ? axios.put : axios.post;

            // Cetak data newTask sebelum dikirim
            console.log('Data yang akan dikirim:', newTask);

            await method(url, newTask, {
                headers: { Authorization: `Bearer ${token}` }
            });

            await fetchTaskList();
            setDialogVisible(false);

            Swal.fire({
                title: 'Berhasil!',
                text: isEdit ? 'Tugas berhasil diperbarui.' : 'Tugas berhasil ditambahkan.',
                icon: 'success'
            });
        } catch (error) {
            handleAxiosError(error, isEdit ? 'mengubah data tugas' : 'menambahkan data tugas');
        }
    };

    const statusOptions = [
        { label: 'Belum Dimulai', value: 'belum dimulai' },
        { label: 'DalamProgres', value: 'dalam progres' },
        { label: 'Selesai', value: 'selesai' }
    ];

    const handleStatusChange = async (e: any, rowData: Task) => {
        const updatedTask = { ...rowData, status: e.value }; // Update the status

        console.log('Updated Task:', updatedTask); // Log the updated task object

        const token = (session?.user as any).token; // Authentication token
        console.log('Token:', token); // Log the token to ensure it's valid

        try {
            const response = await axios.put(`http://127.0.0.1:8000/api/tasks/${updatedTask.id_tugas}`, updatedTask, { headers: { Authorization: `Bearer ${token}` } });

            console.log('API Response:', response.data); // Log the API response

            setTaskList((prevTaskList: Task[]) => prevTaskList.map((task) => (task.id_tugas === updatedTask.id_tugas ? updatedTask : task)));

            Swal.fire({
                title: 'Berhasil!',
                text: `Status tugas berhasil diubah menjadi ${e.value}.`,
                icon: 'success'
            });
        } catch (error) {
            if (axios.isAxiosError(error)) {
                // Now TypeScript knows that `error` is an AxiosError
                console.error('API Error Response:', error.response?.data);
            } else {
                // Handle unexpected errors
                console.error('Unexpected error:', error);
            }
        }
    };

    const handleEdit = (task: Task) => {
        setNewTask(task);
        setIsEdit(true);
        setDialogVisible(true);
    };

    const handleDelete = async (id_tugas: number) => {
        const token = (session?.user as any).token;

        try {
            const confirmDelete = await Swal.fire({
                title: 'Anda yakin?',
                text: 'Data ini akan dihapus secara permanen!',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Ya, hapus!'
            });

            if (confirmDelete.isConfirmed) {
                await axios.delete(`http://127.0.0.1:8000/api/tasks/${id_tugas}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                await fetchTaskList();
                Swal.fire('Dihapus!', 'Data tugas berhasil dihapus.', 'success');
            }
        } catch (error) {
            handleAxiosError(error, 'menghapus data tugas');
        }
    };

    // Template untuk menampilkan nama karyawan dan jabatan
    // const karyawanNameTemplate = (rowData: Task) => {
    //     return rowData.karyawan ? `${rowData.karyawan.nama_karyawan} (${rowData.karyawan.jabatan_nama})` : 'Tidak diketahui';
    // };

    useEffect(() => {
        if (session?.user) {
            fetchTaskList();
            fetchKaryawanList();
        }
    }, [session]);

    return (
        <div className="grid">
            <Toast ref={toast} />
            <div className="col-12">
                <div className="card">
                    <h5>Daftar Tugas</h5>
                    <div className="p-mb-3">
                        <Button label="Tambah" icon="pi pi-plus" onClick={handleOpenDialog} />
                    </div>
                    <DataTable value={taskList} responsiveLayout="scroll" dataKey="id" className="p-datatable-sm">
                        <Column header="No" body={(rowData, { rowIndex }) => rowIndex + 1} />
                        <Column field="nama_karyawan" header="Nama Karyawan" />
                        <Column field="judul_proyek" header="Judul Proyek" />
                        <Column field="kegiatan" header="Kegiatan" />
                        <Column
                            field="status"
                            header="Status"
                            body={(rowData) => <Dropdown value={rowData.status} options={statusOptions} onChange={(e) => handleStatusChange(e, rowData)} optionLabel="label" className="p-dropdown" />}
                            style={{ width: '15%' }}
                        />
                        <Column field="tgl_mulai" header="Tanggal Mulai" />
                        <Column field="batas_penyelesaian" header="Batas Penyelesaian" />
                        <Column field="tgl_selesai" header="Tanggal Selesai" />
                        <Column field="point" header="Point" />
                        <Column
                            body={(rowData) => (
                                <div className="p-buttonset">
                                    <Button icon="pi pi-pencil" className="p-button-success" onClick={() => handleEdit(rowData)} />
                                    <Button icon="pi pi-trash" className="p-button-danger" onClick={() => handleDelete(rowData.id)} />
                                </div>
                            )}
                            header="Aksi"
                        />
                    </DataTable>
                    <Dialog header={isEdit ? 'Edit Tugas' : 'Tambah Tugas'} visible={dialogVisible} style={{ width: '50vw' }} onHide={() => setDialogVisible(false)}>
                        <div className="p-fluid">
                            <div className="field">
                                <label htmlFor="id_karyawan">Karyawan</label>
                                <Dropdown
                                    value={newTask.id_karyawan}
                                    options={karyawanList}
                                    itemTemplate={(item) => {
                                        return (
                                            <>
                                                {item.nama_karyawan} ({item.jabatan})
                                            </>
                                        );
                                    }}
                                    optionValue="id"
                                    optionLabel="nama_karyawan"
                                    onChange={(e) => setNewTask({ ...newTask, id_karyawan: e.value })}
                                />
                            </div>

                            <div className="field">
                                <label htmlFor="judul_proyek">Judul Proyek</label>
                                <InputText id="judul_proyek" value={newTask.judul_proyek} onChange={(e) => setNewTask({ ...newTask, judul_proyek: e.target.value })} />
                            </div>
                            <div className="field">
                                <label htmlFor="kegiatan">Kegiatan</label>
                                <InputText id="kegiatan" value={newTask.kegiatan} onChange={(e) => setNewTask({ ...newTask, kegiatan: e.target.value })} />
                            </div>
                            <div className="field">
                                <label htmlFor="status">Status</label>
                                <select id="status" value={newTask.status} onChange={(e) => setNewTask({ ...newTask, status: e.target.value })} className="p-inputtext">
                                    <option value="belum dimulai">Belum Dimulai</option>
                                    <option value="dalam progres">Dalam Progres</option>
                                    <option value="selesai">Selesai</option>
                                </select>
                            </div>
                            <div className="field">
                                <label htmlFor="tgl_mulai">Tanggal Mulai</label>
                                <Calendar
                                    id="tgl_mulai"
                                    value={newTask.tgl_mulai ? new Date(newTask.tgl_mulai) : null}
                                    onChange={(e) =>
                                        setNewTask({
                                            ...newTask,
                                            tgl_mulai: e.value ? e.value.toISOString().split('T')[0] : ''
                                        })
                                    }
                                    dateFormat="yy-mm-dd"
                                    showIcon
                                />
                            </div>
                            <div className="field">
                                <label htmlFor="batas_penyelesaian">Batas Penyelesaian</label>
                                <Calendar
                                    id="batas_penyelesaian"
                                    value={newTask.batas_penyelesaian ? new Date(newTask.batas_penyelesaian) : null}
                                    onChange={(e) =>
                                        setNewTask({
                                            ...newTask,
                                            batas_penyelesaian: e.value ? e.value.toISOString().split('T')[0] : ''
                                        })
                                    }
                                    dateFormat="yy-mm-dd"
                                    showIcon
                                />
                            </div>
                            <div className="field">
                                <label htmlFor="tgl_selesai">Tanggal Selesai</label>
                                <Calendar
                                    id="tgl_selesai"
                                    value={newTask.tgl_selesai ? new Date(newTask.tgl_selesai) : null}
                                    onChange={(e) =>
                                        setNewTask({
                                            ...newTask,
                                            tgl_selesai: e.value ? e.value.toISOString().split('T')[0] : ''
                                        })
                                    }
                                    dateFormat="yy-mm-dd"
                                    showIcon
                                />
                            </div>
                            <div className="field">
                                <label htmlFor="point">Point</label>
                                <InputText id="point" value={newTask.point !== undefined && newTask.point !== null ? newTask.point.toString() : ''} onChange={(e) => setNewTask({ ...newTask, point: Number(e.target.value) })} />
                            </div>
                            <div className="p-mt-3">
                                <Button label="Simpan" icon="pi pi-check" className="p-button-success" onClick={handleSubmit} />
                            </div>
                        </div>
                    </Dialog>
                </div>
            </div>
        </div>
    );
};

export default TaskManager;
