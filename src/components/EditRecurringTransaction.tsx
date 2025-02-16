import { faCalendar, faFloppyDisk, faTrashCan } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IonAlert, IonButton, IonCol, IonContent, IonDatetime, IonGrid, IonHeader, IonIcon, IonInput, IonItem, IonLabel, IonModal, IonPopover, IonRow, IonSegment, IonSegmentButton, IonSelect, IonSelectOption, IonTitle, IonToolbar } from '@ionic/react';
import { getAuth } from 'firebase/auth';
import { collection, deleteDoc, doc, onSnapshot, or, query, Timestamp, updateDoc, where } from 'firebase/firestore';
import { chevronBack } from 'ionicons/icons';
import React, { useEffect, useState } from 'react';
import { database } from '../configurations/firebase';
import './EditRecurringTransaction.css';
import GlobalToast from './GlobalToast';

interface Account {
    account_id: string,
    user_id: string,
    name: string,
    currency: string,
    balance: number,
    icon: string,
    color: string
}

interface Category {
    category_id: string,
    user_id: string,
    name: string,
    mensualBudget: number,
    type: string,
    icon: string,
    color: string
}

interface RecurringTransaction {
    recurring_transaction_id: string,
    user_id: string,
    type: string,
    name: string,
    category_id: string,
    account_id: string,
    amount: number,
    currency: number,
    date: Timestamp,
    frequency: string,
    next_execution: Timestamp
}

interface EditRecurringTransactionProps {
    isOpen: boolean;
    onClose: () => void;
    recurringTransaction: RecurringTransaction | null;
}

const EditRecurringTransaction: React.FC<EditRecurringTransactionProps> = ({ isOpen, onClose, recurringTransaction }) => {
    const [error, setError] = useState<string>('');
    const [showAlert, setShowAlert] = useState(false);
    const [showUpdateAlert, setShowUpdateAlert] = useState(false);
    const [showDeleteAlert, setShowDeleteAlert] = useState(false);
    const [type, setType] = useState('gasto');
    const [name, setName] = useState('');
    const [selectedAccount, setSelectedAccount] = useState<string | undefined>();
    const [amount, setAmount] = useState(0);
    const [frequency, setFrequency] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
    const [selectedDate, setSelectedDate] = useState('');
    const [isDatePickerOpen, setDatePickerOpen] = useState(false);
    const [nextExecutionDate, setNextExecutionDate] = useState('');
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);

    /* Notificación global */
    const [toastConfig, setToastConfig] = useState<{
        isOpen: boolean;
        message: string;
        type: 'success' | 'error';
    }>({ isOpen: false, message: '', type: 'error' });

    /* Actualizamos los campos con la información del pago recurrente seleccionado */
    useEffect(() => {
        if (recurringTransaction) {
            setType(recurringTransaction.type);
            setName(recurringTransaction.name);
            setSelectedAccount(recurringTransaction.account_id);
            setAmount(parseFloat(recurringTransaction.amount.toFixed(2)));
            setFrequency(recurringTransaction.frequency);
            setSelectedDate(recurringTransaction.date.toDate().toISOString());
            setSelectedCategory(recurringTransaction.category_id);
            setNextExecutionDate(recurringTransaction.next_execution.toDate().toISOString());
        }
    }, [recurringTransaction]);

    /* Leemos las cuentas asociadas al usuario de la base de datos */
    useEffect(() => {
        const fetchAccounts = () => {
            try {

                /* Obtenemos los datos del usuario autenticado */
                const auth = getAuth();
                const currentUser = auth.currentUser;

                /* Obtenemos las categorías asociadas al usuario autenticado */
                const accountsRef = collection(database, 'accounts');
                const q = query(accountsRef, where('user_id', '==', currentUser?.uid));

                const unsubscribe = onSnapshot(q, (querySnapshot) => {
                    const fetchedAccounts = querySnapshot.docs.map((doc) => ({
                        ...doc.data(),
                        account_id: doc.id,
                    })) as Account[];
                    setAccounts(fetchedAccounts);
                });
                return unsubscribe;

            } catch (error) {
                console.error("Error al obtener las transacciones: ", error);
            }
        };
        const unsubscribe = fetchAccounts();
        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, []);

    /* Filtramos las categorías según el tipo del pago recurrente */
    const filteredCategories = categories.filter(category => category.type === type);

    /* Leemos las categorías de las transacciones de la base de datos */
    useEffect(() => {
        const fetchCategories = () => {
            try {

                /* Obtenemos los datos del usuario autenticado */
                const auth = getAuth();
                const currentUser = auth.currentUser;

                /* Obtenemos las categorías asociadas al usuario autenticado y los globales */
                const categoriesRef = collection(database, 'categories');
                const q = query(
                    categoriesRef,
                    or(
                        where('user_id', '==', currentUser?.uid),
                        where('user_id', '==', null)
                    )
                );

                const unsubscribe = onSnapshot(q, (querySnapshot) => {
                    const fetchedCategories = querySnapshot.docs.map((doc) => ({
                        ...doc.data(),
                        category_id: doc.id,
                    })) as Category[];
                    setCategories(fetchedCategories);
                });
                return unsubscribe;
            } catch (error) {
                console.error("Error al obtener las categorías: ", error);
            }
        };
        const unsubscribe = fetchCategories();
        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, []);

    /* Guardamos la fecha en el formato por defecto */
    const handleDateChange = (e: CustomEvent) => {
        setSelectedDate(e.detail.value!);
        setDatePickerOpen(false);
    };

    /* Guardamos la transacción en la base de datos */
    const handleSaveRecurringTransaction = async () => {

        /* Validamos que los datos sean válidos */
        if (!selectedAccount) {
            setError('Selecciona una cuenta para la transacción');
            setShowAlert(true);
            return;
        }

        if (amount <= 0) {
            setError('Introduce un monto válido para la transacción');
            setShowAlert(true);
            return;
        }

        if (frequency === '') {
            setError('Selecciona una frecuencia para la transacción');
            setShowAlert(true);
            return;
        }

        if (!selectedCategory) {
            setError('Selecciona una categoría para la transacción');
            setShowAlert(true);
            return;
        }

        if (!selectedDate) {
            setError('Selecciona una fecha para la transacción');
            setShowAlert(true);
            return;
        }

        try {

            if (!recurringTransaction?.recurring_transaction_id) {
                throw new Error("El ID del pago recurrente no está definido");
            }

            const recurringTransactionsRef = doc(database, 'recurringTransactions', recurringTransaction?.recurring_transaction_id);

            /* Buscamos la cuenta seleccionada, para posteriormente acceder a su id y su divisa */
            const account = accounts.find((acc) => acc.account_id === selectedAccount);
            if (!account) {
                setToastConfig({ isOpen: true, message: 'La cuenta seleccionada no es válida', type: 'error' });
                return;
            }

            const updateRecurringTransaction = {
                type: type,
                name: name,
                category_id: selectedCategory,
                account_id: account.account_id,
                amount: parseFloat(amount.toFixed(2)),
                currency: account.currency,
                date: Timestamp.fromDate(new Date(selectedDate)),
                frequency: frequency,
                next_execution: Timestamp.fromDate(new Date(selectedDate))
            }

            /* Guardamos el pago recurrente en la base de datos */
            await updateDoc(recurringTransactionsRef, updateRecurringTransaction);

            setToastConfig({ isOpen: true, message: 'Pago recurrente añadida con éxito', type: 'success' });

            /* Cerramos el modal automáticamente al guardar el pago recurrente */
            setShowUpdateAlert(false);
            onClose();

        } catch (error) {
            setToastConfig({ isOpen: true, message: 'No se pudo añadir el pago recurrente', type: 'error' });
        }
    };

    const handleDeleteRecurringTransaction = async () => {
        try {

            if (!recurringTransaction?.recurring_transaction_id) {
                throw new Error("El ID del pago recurrente no está definido");
            }

            const recurringTransactionRef = doc(database, 'recurringTransactions', recurringTransaction?.recurring_transaction_id);

            /* Eliminamos el pago recurrente de la base de datos */
            await deleteDoc(recurringTransactionRef);

            setToastConfig({ isOpen: true, message: 'Pago recurrente eliminado con éxito', type: 'success' });

            /* Cerramos el modal automáticamente al eliminar el pago recurrente */
            setShowDeleteAlert(false);
            onClose();
        } catch (error) {
            setToastConfig({ isOpen: true, message: 'No se pudo eliminar el pago recurrente', type: 'error' });
        }
    }

    return (
        <>
            <IonModal isOpen={isOpen} onDidDismiss={onClose}>
                <IonHeader>
                    <IonToolbar>
                        <IonTitle>Editar pago recurrente</IonTitle>
                        <IonButton slot="start" onClick={onClose} fill='clear'>
                            <IonIcon icon={chevronBack}></IonIcon>
                        </IonButton>

                        {/* Botón para guardar la transacción */}
                        <IonButton slot='end' fill='clear' onClick={() => setShowUpdateAlert(true)}>
                            <FontAwesomeIcon icon={faFloppyDisk} />
                        </IonButton>

                        {/* Botón para eliminar la cuenta */}
                        <IonButton slot='end' className='handle-delete-transaction-button' color='danger' fill='clear' onClick={() => setShowDeleteAlert(true)}>
                            <FontAwesomeIcon icon={faTrashCan} />
                        </IonButton>
                    </IonToolbar>
                </IonHeader>
                <IonContent>
                    {showAlert && (<IonAlert isOpen={showAlert} onDidDismiss={() => setShowAlert(false)} header={'Datos inválidos'} message={error} buttons={['Aceptar']} />)}
                    <IonGrid>

                        {/* Seleccionamos el tipo de pago recurrente */}
                        <IonRow>
                            <IonCol size="12" size-md="8" offset-md="2">
                                <IonSegment className='edit-recurring-transaction-segment' color="medium" value={type} onIonChange={(e: CustomEvent) => setType(e.detail.value)}>
                                    <IonSegmentButton className='edit-recurring-transaction-segment-button' value="gasto">
                                        <IonLabel><b>Gasto</b></IonLabel>
                                    </IonSegmentButton>
                                    <IonSegmentButton className='edit-recurring-transaction-segment-button' value="ingreso">
                                        <IonLabel><b>Ingreso</b></IonLabel>
                                    </IonSegmentButton>
                                </IonSegment>
                            </IonCol>
                        </IonRow>

                        {/* Campo para añadir el nombre del pago recurrente */}
                        <IonRow>
                            <IonCol size="12" size-md="8" offset-md="2">
                                <IonItem>
                                    <IonInput label='Nombre' labelPlacement='floating' placeholder='Nombre' value={name} onIonInput={(e) => setName(e.detail.value!)} required />
                                </IonItem>
                            </IonCol>
                        </IonRow>

                        {/* Campo para seleccionar la cuenta del pago recurrente */}
                        <IonRow>
                            <IonCol size="12" size-md="8" offset-md="2">
                                <IonItem>
                                    <IonSelect interface="popover" label="Cuenta" labelPlacement="floating" placeholder="Selecciona una cuenta" value={selectedAccount} onIonChange={(e) => setSelectedAccount(e.detail.value)}>
                                        {accounts.map(account => (
                                            <IonSelectOption key={account.account_id} value={account.account_id}>
                                                <IonLabel>{account.name} ({account.balance.toFixed(2)} {account.currency})</IonLabel>
                                            </IonSelectOption>
                                        ))}
                                    </IonSelect>
                                </IonItem>
                            </IonCol>
                        </IonRow>

                        {/* Campo para añadir el monto del pago recurrente */}
                        <IonRow>
                            <IonCol size="12" size-md="8" offset-md="2">
                                <IonItem>
                                    <IonInput label='Monto' labelPlacement='floating' placeholder='Monto' type="number" value={amount} onIonInput={(e) => setAmount(parseFloat(e.detail.value!))} required />
                                </IonItem>
                            </IonCol>
                        </IonRow>

                        {/* Campo para añadir la frecuencia del pago recurrente */}
                        <IonRow>
                            <IonCol size="12" size-md="8" offset-md="2">
                                <IonItem>
                                    <IonSelect interface="popover" label="Frecuencia" labelPlacement="floating" placeholder="Selecciona una frecuencia" value={frequency} onIonChange={(e) => setFrequency(e.detail.value)}>
                                        <IonSelectOption value="diaria">Diaria</IonSelectOption>
                                        <IonSelectOption value="semanal">Semanal</IonSelectOption>
                                        <IonSelectOption value="mensual">Mensual</IonSelectOption>
                                    </IonSelect>
                                </IonItem>
                            </IonCol>
                        </IonRow>

                        {/* Campo para seleccionar la categoría del pago recurrente */}
                        <IonRow>
                            <IonCol size="12" size-md="8" offset-md="2">
                                <IonItem>
                                    <IonSelect interface="popover" label="Categoría" labelPlacement="floating" placeholder="Selecciona una categoría" value={selectedCategory} onIonChange={(e) => setSelectedCategory(e.detail.value)}>
                                        {filteredCategories.map(category => (
                                            <IonSelectOption key={category.category_id} value={category.category_id}>
                                                {category.name}
                                            </IonSelectOption>
                                        ))}
                                    </IonSelect>
                                </IonItem>
                            </IonCol>
                        </IonRow>

                        {/* Campo para seleccionar la fecha del pago recurrente */}
                        <IonRow>
                            <IonCol size="12" size-md="8" offset-md="2">
                                <IonItem>
                                    <IonInput label='Fecha' labelPlacement='floating' placeholder='Selecciona una fecha' readonly value={selectedDate ? new Date(selectedDate).toLocaleString('es-ES') : ''}></IonInput>

                                    {/* Abrir el popover para seleccionar la fecha del pago recurrente */}
                                    <div slot='end'>
                                        <FontAwesomeIcon icon={faCalendar} onClick={() => setDatePickerOpen(true)}></FontAwesomeIcon>
                                    </div>
                                </IonItem>
                            </IonCol>
                        </IonRow>

                        {/* Campo para visualizar la próxima fecha del pago recurrente */}
                        <IonRow>
                            <IonCol size="12" size-md="8" offset-md="2">
                                <IonItem>
                                    <IonInput label='Próxima fecha' labelPlacement='floating' placeholder='Próxima fecha' readonly value={nextExecutionDate ? new Date(nextExecutionDate).toLocaleString('es-ES') : ''} />
                                </IonItem>
                            </IonCol>
                        </IonRow>
                    </IonGrid>

                    {/* Popover para seleccionar la fecha del pago recurrente */}
                    {/* Cerrar el popover para seleccionar la fecha del pago recurrente */}
                    <IonPopover isOpen={isDatePickerOpen} onDidDismiss={() => setDatePickerOpen(false)}>
                        <IonDatetime locale='es-ES' value={selectedDate} onIonChange={handleDateChange} max={new Date().toISOString().split('T')[0]} />
                        <IonButton expand="block" onClick={() => setDatePickerOpen(false)}>Cerrar</IonButton>
                    </IonPopover>
                </IonContent>

                {/* Alerta para confirmar la edición de la transacción */}
                <IonAlert isOpen={showUpdateAlert} onDidDismiss={() => setShowAlert(false)} header={'Editar pago recurrente'} message={'¿Estás seguro de que quieres editar el pago recurrente?'} buttons={[{ text: 'Cancelar', role: 'cancel', handler: () => { setShowUpdateAlert(false); } }, { text: 'Editar', handler: () => { handleSaveRecurringTransaction(); } }]} />

                {/* Alerta para confirmar la eliminación de la transacción */}
                <IonAlert isOpen={showDeleteAlert} onDidDismiss={() => setShowAlert(false)} header={'Eliminar pago recurrente'} message={'¿Estás seguro de que quieres eliminar el pago recurrente?'} buttons={[{ text: 'Cancelar', role: 'cancel', handler: () => { setShowDeleteAlert(false); } }, { text: 'Eliminar', handler: () => { handleDeleteRecurringTransaction(); } }]} />
            </IonModal>
            <GlobalToast isOpen={toastConfig.isOpen} message={toastConfig.message} type={toastConfig.type} onDidDismiss={() => { setToastConfig({ ...toastConfig, isOpen: false }); }}></GlobalToast>
        </>
    );
};

export default EditRecurringTransaction;