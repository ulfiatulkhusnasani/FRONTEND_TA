'use client';

import React, { useState, useEffect } from 'react';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import axios from 'axios';
import Swal from 'sweetalert2';
import { signOut, useSession } from 'next-auth/react';

interface EmployeeData {
    id: number;
    position: string;
    baseSalary: number;
    dailyAllowance: number;
    mealAllowance: number;
    bonus?: number;
    allowance?: number;
    deduction?: number;
}

const DataJabatan: React.FC = () => {
    const [employees, setEmployees] = useState<EmployeeData[]>([]);
    const [dialogVisible, setDialogVisible] = useState(false);
    const { data: session } = useSession();
    const [selectedEmployee, setSelectedEmployee] = useState<EmployeeData | null>(null);
    const [formData, setFormData] = useState<EmployeeData>({
        id: 0,
        position: '',
        baseSalary: 0,
        dailyAllowance: 0,
        mealAllowance: 0,
        bonus: 0,
        allowance: 0,
        deduction: 0
    });
    const toastRef = React.useRef<Toast>(null);

    useEffect(() => {
        if (session?.user) {
            fetchEmployees();
        }
    }, [session]);

    const fetchEmployees = async () => {
        const token = (session?.user as any)?.token;

        if (!token) {
            Swal.fire('Kesalahan!', 'Token tidak ditemukan! Anda harus login terlebih dahulu.', 'error');
            return;
        }

        try {
            const response = await axios.get('http://127.0.0.1:8000/api/jabatan', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (Array.isArray(response.data)) {
                const mappedData: EmployeeData[] = response.data.map((item) => ({
                    id: item.id,
                    position: item.jabatan,
                    baseSalary: parseFloat(item.gaji_pokok),
                    dailyAllowance: parseFloat(item.uang_kehadiran_perhari),
                    mealAllowance: parseFloat(item.uang_makan),
                    bonus: item.bonus ? parseFloat(item.bonus) : 0,
                    allowance: item.tunjangan ? parseFloat(item.tunjangan) : 0,
                    deduction: item.potongan ? parseFloat(item.potongan) : 0
                }));
                setEmployees(mappedData);
            } else {
                console.error('Expected an array but received:', response.data);
            }
        } catch (error) {
            handleError(error);
        }
    };

    const handleError = (error: any) => {
        if (error.response) {
            if (error.response.status === 401) {
                Swal.fire({
                    icon: 'error',
                    title: 'Unauthorized',
                    text: 'Sesi Anda telah berakhir, silakan login kembali.'
                }).then(() => {
                    signOut({ callbackUrl: '/auth/login' });
                });
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: error.response.data.message || 'Terjadi kesalahan tidak diketahui!'
                });
            }
        } else {
            console.error('Error fetching data:', error);
        }
    };

    const actionTemplate = (rowData: EmployeeData) => (
        <div>
            <Button icon="pi pi-pencil" className="p-button-rounded p-button-success p-mr-2" onClick={() => editEmployee(rowData)} />
            <Button icon="pi pi-trash" className="p-button-rounded p-button-danger" onClick={() => deleteEmployee(rowData.id)} />
        </div>
    );

    const editEmployee = (employee: EmployeeData) => {
        setFormData({ ...employee });
        setSelectedEmployee(employee);
        setDialogVisible(true);
    };

    const deleteEmployee = async (id: number) => {
        const token = (session?.user as any).token;
        if (!token) {
            Swal.fire('Kesalahan!', 'Token tidak ditemukan! Anda harus login terlebih dahulu.', 'error');
            return;
        }

        Swal.fire({
            title: 'Apakah Anda yakin?',
            text: 'Data jabatan ini akan dihapus!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Ya, hapus!'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await axios.delete(`http://127.0.0.1:8000/api/jabatan/${id}`, {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    });
                    setEmployees(employees.filter((employee) => employee.id !== id));
                    Swal.fire('Dihapus!', 'Data karyawan telah dihapus.', 'success');
                } catch (error) {
                    handleError(error);
                }
            }
        });
    };

    const saveEmployee = async () => {
        try {
            // Validasi form untuk memastikan semua field wajib diisi
            if (!formData.position || formData.baseSalary <= 0) {
                Swal.fire({
                    icon: 'error',
                    title: 'Form tidak lengkap!',
                    text: 'Pastikan semua field wajib diisi dan gaji pokok lebih besar dari 0.'
                });
                return; // Hentikan eksekusi jika form tidak valid
            }

            const payload = {
                jabatan: formData.position,
                gaji_pokok: formData.baseSalary,
                uang_kehadiran_perhari: formData.dailyAllowance,
                uang_makan: formData.mealAllowance,
                bonus: formData.bonus,
                tunjangan: formData.allowance,
                potongan: formData.deduction
            };

            const token = (session?.user as any)?.token;

            if (!token) {
                throw new Error('Token tidak ditemukan, silakan login ulang.');
            }

            if (selectedEmployee) {
                const response = await axios.put(`http://127.0.0.1:8000/api/jabatan/${selectedEmployee.id}`, payload, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                setEmployees(employees.map((employee) => (employee.id === selectedEmployee.id ? response.data : employee)));
            } else {
                const response = await axios.post('http://127.0.0.1:8000/api/jabatan', payload, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                setEmployees([...employees, response.data]);
            }

            setDialogVisible(false);
            fetchEmployees();
            Swal.fire({
                title: 'Berhasil!',
                text: selectedEmployee ? 'Data jabatan berhasil diperbarui.' : 'Data jabatan berhasil disimpan.',
                icon: 'success'
            });
        } catch (error) {
            handleError(error);
        }
    };

    const hideDialog = () => {
        setDialogVisible(false);
    };

    const onInputChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
        const value = e.target.value;
        if (['baseSalary', 'dailyAllowance', 'mealAllowance', 'bonus', 'allowance', 'deduction'].includes(field)) {
            setFormData({ ...formData, [field]: value ? parseFloat(value) : 0 });
        } else {
            setFormData({ ...formData, [field]: value });
        }
    };

    return (
        <div className="datatable-templating-demo">
            <div className="card">
                <h5>Data Jabatan</h5>
                <div className="" style={{ marginBottom: '20px', display: 'flex', width: '100%', justifyContent: 'end' }}>
                    <Button
                        label="Tambah Data Jabatan"
                        icon="pi pi-plus"
                        className="p-button-primary p-button-rounded"
                        style={{ width: '220px', borderRadius: '10px' }} // Menentukan lebar tombol secara langsung
                        onClick={() => {
                            setSelectedEmployee(null);
                            setFormData({
                                id: 0,
                                position: '',
                                baseSalary: 0,
                                dailyAllowance: 0,
                                mealAllowance: 0,
                                bonus: 0,
                                allowance: 0,
                                deduction: 0
                            });
                            setDialogVisible(true);
                        }}
                    />
                </div>

                <DataTable
                    value={employees}
                    responsiveLayout="scroll"
                    paginator
                    rows={10}
                    rowsPerPageOptions={[5, 10, 25]}
                    style={{ marginTop: '20px' }} // Menambah jarak di atas tabel
                >
                    <Column field="id" header="No" style={{ width: '10%' }}></Column>
                    <Column field="position" header="Jabatan" style={{ width: '20%' }}></Column>
                    <Column field="baseSalary" header="Gaji Pokok" body={(data) => (data.baseSalary ? `Rp. ${data.baseSalary.toLocaleString('id-ID')}` : 'Rp. 0')} style={{ width: '20%' }}></Column>
                    <Column field="dailyAllowance" header="Uang Kehadiran" body={(data) => (data.dailyAllowance ? `Rp. ${data.dailyAllowance.toLocaleString('id-ID')}` : 'Rp. 0')} style={{ width: '15%' }}></Column>
                    <Column field="mealAllowance" header="Uang Makan" body={(data) => (data.mealAllowance ? `Rp. ${data.mealAllowance.toLocaleString('id-ID')}` : 'Rp. 0')} style={{ width: '15%' }}></Column>
                    <Column field="bonus" header="Bonus" body={(data) => (data.bonus ? `Rp. ${data.bonus.toLocaleString('id-ID')}` : 'Rp. 0')} style={{ width: '15%' }}></Column>
                    <Column field="allowance" header="Tunjangan" body={(data) => (data.allowance ? `Rp. ${data.allowance.toLocaleString('id-ID')}` : 'Rp. 0')} style={{ width: '15%' }}></Column>
                    <Column field="deduction" header="Potongan" body={(data) => (data.deduction ? `Rp. ${data.deduction.toLocaleString('id-ID')}` : 'Rp. 0')} style={{ width: '15%' }}></Column>
                    <Column header="Aksi" body={actionTemplate} style={{ width: '10%' }}></Column>
                </DataTable>
            </div>

            <Dialog
                visible={dialogVisible}
                style={{ width: '600px' }}
                header={selectedEmployee ? 'Edit Jabatan' : 'Tambah Jabatan'}
                modal
                footer={
                    <div>
                        <Button label="Batal" icon="pi pi-times" onClick={hideDialog} />
                        <Button label="Simpan" icon="pi pi-check" onClick={saveEmployee} />
                    </div>
                }
                onHide={hideDialog}
            >
                <div className="p-fluid">
                    <div className="p-field">
                        <label htmlFor="position">Jabatan</label>
                        <InputText id="position" value={formData.position} onChange={(e) => onInputChange(e, 'position')} placeholder="Masukkan jabatan" required />
                    </div>
                    <div className="p-field">
                        <label htmlFor="baseSalary">Gaji Pokok</label>
                        <InputText id="baseSalary" value={formData.baseSalary.toString()} onChange={(e) => onInputChange(e, 'baseSalary')} placeholder="Masukkan gaji pokok" required />
                    </div>
                    <div className="p-field">
                        <label htmlFor="dailyAllowance">Uang Kehadiran</label>
                        <InputText id="dailyAllowance" value={formData.dailyAllowance.toString()} onChange={(e) => onInputChange(e, 'dailyAllowance')} placeholder="Masukkan uang kehadiran" />
                    </div>
                    <div className="p-field">
                        <label htmlFor="mealAllowance">Uang Makan</label>
                        <InputText id="mealAllowance" value={formData.mealAllowance.toString()} onChange={(e) => onInputChange(e, 'mealAllowance')} placeholder="Masukkan uang makan" />
                    </div>
                    <div className="p-field">
                        <label htmlFor="bonus">Bonus</label>
                        <InputText id="bonus" value={formData.bonus?.toString() || ''} onChange={(e) => onInputChange(e, 'bonus')} placeholder="Masukkan bonus (opsional)" />
                    </div>
                    <div className="p-field">
                        <label htmlFor="allowance">Tunjangan</label>
                        <InputText id="allowance" value={formData.allowance?.toString() || ''} onChange={(e) => onInputChange(e, 'allowance')} placeholder="Masukkan tunjangan (opsional)" />
                    </div>
                    <div className="p-field">
                        <label htmlFor="deduction">Potongan</label>
                        <InputText id="deduction" value={formData.deduction?.toString() || ''} onChange={(e) => onInputChange(e, 'deduction')} placeholder="Masukkan potongan (opsional)" />
                    </div>
                </div>
            </Dialog>

            <Toast ref={toastRef} />
        </div>
    );
};

export default DataJabatan;
