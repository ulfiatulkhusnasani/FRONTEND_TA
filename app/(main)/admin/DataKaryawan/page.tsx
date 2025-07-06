'use client';

import React, { useEffect, useState } from 'react';

import { Panel } from 'primereact/panel';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { ConfirmDialog } from 'primereact/confirmdialog';
import axios from 'axios';
import Swal from 'sweetalert2';
import { useSession } from 'next-auth/react';
import { Dropdown } from 'primereact/dropdown';

const DataKaryawan: React.FC = () => {
    const [karyawanList, setKaryawanList] = useState<any[]>([]);
    const [jabatanList, setJabatanList] = useState<any[]>([]);
    const [userList, setUserList] = useState<any[]>([]);
    const [karyawanBaru, setKaryawanBaru] = useState<any>({
        nip: '',
        nik: '',
        email: '',
        no_handphone: '',
        alamat: '',
        jabatan_id: '',
        status: 'nonactive'
    });
    const [dialogVisible, setDialogVisible] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [id, setId] = useState<number | null>(null); // ID karyawan
    const { status, data: session } = useSession();

    // API base URLs for karyawan and jabatan
    const karyawanApiBaseUrl = 'http://127.0.0.1:8000/api/karyawan';
    const jabatanApiBaseUrl = 'http://127.0.0.1:8000/api/jabatan';
    const UserApiBaseUrl = 'http://127.0.0.1:8000/api/user/get';

    useEffect(() => {
        if (session?.user) {
            fetchKaryawan();
            fetchJabatan();
            fetchUser();
        }
    }, [session]);

    // Create axios instance for karyawan with authorization header

    const fetchKaryawan = async () => {
        try {
            const token = (session?.user as any).token;

            const response = await axios.post(
                karyawanApiBaseUrl,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            setKaryawanList(response.data);
        } catch (error) {
            console.error('Gagal memuat data karyawan:', error);
            Swal.fire({
                icon: 'error',
                title: 'Gagal Memuat',
                text: 'Tidak dapat memuat data karyawan. Coba lagi nanti.'
            });
        }
    };

    const fetchJabatan = async () => {
        try {
            const token = (session?.user as any).token;

            const response = await axios.get(jabatanApiBaseUrl, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            setJabatanList(response.data);
        } catch (error) {
            console.error('Gagal memuat data jabatan:', error);
            Swal.fire({
                icon: 'error',
                title: 'Gagal Memuat',
                text: 'Tidak dapat memuat data jabatan. Coba lagi nanti.'
            });
        }
    };

    const fetchUser = async () => {
        try {
            const token = (session?.user as any).token;

            const response = await axios.get(UserApiBaseUrl, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            setUserList(response.data);
        } catch (error) {
            console.error('Gagal memuat data user:', error);
            Swal.fire({
                icon: 'error',
                title: 'Gagal Memuat',
                text: 'Tidak dapat memuat data user. Coba lagi nanti.'
            });
        }
    };
    // Show dialog for adding or editing karyawan
    const tampilkanDialog = (karyawan: any = null) => {
        if (karyawan) {
            setEditMode(true);
            setKaryawanBaru(karyawan);
            setId(karyawan.id); // Set id karyawan untuk mode edit
        } else {
            setEditMode(false);
            setKaryawanBaru({
                nip: '',
                nik: '',
                email: '',
                no_handphone: '',
                alamat: '',
                jabatan_id: '',
                status: 'nonactive'
            });
            setId(null); // Reset id saat tambah karyawan baru
        }
        setDialogVisible(true);
    };

    // Hide dialog
    const sembunyikanDialog = () => {
        setDialogVisible(false);
    };

    const simpanKaryawan = async () => {
        try {
            // Validate required fields
            const token = (session?.user as any).token;

            if (!karyawanBaru.jabatan_id || !karyawanBaru.nip || !karyawanBaru.nik) {
                Swal.fire({
                    icon: 'error',
                    title: 'Validasi Gagal',
                    text: 'NIP, NIK, dan Jabatan harus diisi!'
                });
                return;
            }

            if (editMode && id) {
                // Update karyawan
                console.log(karyawanBaru)
                const response = await axios.put(`${karyawanApiBaseUrl}/${id}`, karyawanBaru, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                Swal.fire({
                    icon: 'success',
                    title: 'Berhasil',
                    text: 'Data karyawan berhasil diperbarui!'
                });
            } else {
                // Tambah karyawan
                const response = await axios.post(`${karyawanApiBaseUrl}/created`, karyawanBaru, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                Swal.fire({
                    icon: 'success',
                    title: 'Berhasil',
                    text: 'Data karyawan berhasil ditambahkan!'
                });
            }

            // Fetch data setelah penyimpanan
            await fetchKaryawan();

            console.log('test')

            // Tutup dialog
            sembunyikanDialog();
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || 'Terjadi kesalahan saat menyimpan data karyawan!';
            Swal.fire({
                icon: 'error',
                title: 'Gagal',
                text: `Error: ${errorMessage}`
            });
            console.log(error.response?.data);
        }
    };

    const hapusKaryawan = (id: number) => {
        Swal.fire({
            title: 'Apakah Anda yakin?',
            text: 'Data karyawan akan dihapus dan tidak bisa dikembalikan!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Ya, hapus!',
            cancelButtonText: 'Batal'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    // Hapus karyawan
                    const token = (session?.user as any).token;

                    const response = await axios.delete(`${karyawanApiBaseUrl}/${id}`, {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    });

                    Swal.fire({
                        icon: 'success',
                        title: 'Berhasil',
                        text: 'Data karyawan berhasil dihapus!'
                    });

                    // Refresh data
                    fetchKaryawan();
                } catch (error) {
                    console.error('Gagal menghapus data karyawan:', error);
                    Swal.fire({
                        icon: 'error',
                        title: 'Gagal',
                        text: 'Terjadi kesalahan saat menghapus data karyawan!'
                    });
                }
            }
        });
    };

    return (
        <Panel header="Data Karyawan">
            <ConfirmDialog />
            <DataTable
                value={karyawanList}
                responsiveLayout="scroll"
                paginator
                rows={10} // Number of rows per page
                rowsPerPageOptions={[5, 10, 25]} // Options for rows per page
            >
                <Column field="nama_karyawan" header="Nama"></Column>
                <Column field="nip" header="NIP"></Column>
                <Column field="nik" header="NIK"></Column>
                <Column field="email" header="Email"></Column>
                <Column field="no_handphone" header="No HP"></Column>
                <Column field="alamat" header="Alamat"></Column>
                <Column field="jabatan" header="Jabatan"></Column>
                <Column field="status" header="Status"></Column>
                <Column field="sisa_cuti" header="Sisa cuti"></Column>

                <Column
                    header="Aksi"
                    body={(rowData) => (
                        <div className="p-buttonset">
                            <Button
                                icon="pi pi-pencil"
                                className="p-button-success"
                                onClick={() => tampilkanDialog(rowData)} // Aksi Edit
                            />
                            <Button
                                icon="pi pi-trash"
                                className="p-button-danger"
                                onClick={() => hapusKaryawan(rowData.id)} // Aksi Hapus
                            />
                        </div>
                    )}
                ></Column>
            </DataTable>

            <Dialog header={editMode ? 'Edit Data Karyawan' : 'Tambah Data Karyawan'} visible={dialogVisible} onHide={sembunyikanDialog} style={{ width: '600px' }}>
                <div className="p-fluid">
                    {/* Email */}
                    <div className="p-field">
                        <label htmlFor="Email">Email</label>

                        <Dropdown value={karyawanBaru.email} onChange={(e) => setKaryawanBaru({ ...karyawanBaru, email: e.value })} options={userList} optionLabel="email" optionValue="email" />
                    </div>
                    {/* NIP */}
                    <div className="p-field">
                        <label htmlFor="NIP">NIP</label>
                        <InputText id="NIP" value={karyawanBaru.nip} onChange={(e) => setKaryawanBaru({ ...karyawanBaru, nip: e.target.value })} placeholder="8 karakter" />
                    </div>

                    {/* NIK */}
                    <div className="p-field">
                        <label htmlFor="NIK">NIK</label>
                        <InputText id="NIK" value={karyawanBaru.nik} onChange={(e) => setKaryawanBaru({ ...karyawanBaru, nik: e.target.value })} placeholder="16 karakter" />
                    </div>

                    {/* No Handphone */}
                    <div className="p-field">
                        <label htmlFor="No Handphone">No Handphone</label>
                        <InputText id="No_Handphone" value={karyawanBaru.no_handphone} onChange={(e) => setKaryawanBaru({ ...karyawanBaru, no_handphone: e.target.value })} placeholder="masukkan No Handphone" />
                    </div>

                    {/* Alamat */}
                    <div className="p-field">
                        <label htmlFor="Alamat">Alamat</label>
                        <InputText id="Alamat" value={karyawanBaru.alamat} onChange={(e) => setKaryawanBaru({ ...karyawanBaru, alamat: e.target.value })} placeholder="masukkan alamat" />
                    </div>

                    <div className="p-field">
                        <label htmlFor="Status">Status</label>

                        <Dropdown value={karyawanBaru.status} onChange={(e) => setKaryawanBaru({ ...karyawanBaru, status: e.value })} options={['active', 'nonactive']} />
                    </div>

                    {/* Jabatan */}
                    <div className="p-field">
                        <label htmlFor="Jabatan">Jabatan</label>

                        <Dropdown value={karyawanBaru.jabatan_id} onChange={(e) => setKaryawanBaru({ ...karyawanBaru, jabatan_id: e.value })} options={jabatanList} optionLabel="jabatan" optionValue="id" />
                    </div>
                    {/* Tombol Simpan */}
                    <div className="p-field">
                        <Button label="Simpan" onClick={simpanKaryawan} style={{ marginTop: '1rem' }} />
                    </div>
                </div>
            </Dialog>
        </Panel>
    );
};

export default DataKaryawan;
