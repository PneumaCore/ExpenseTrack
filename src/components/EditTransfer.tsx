import { faCalendar, faFloppyDisk, faTrashCan } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IonAlert, IonButton, IonCol, IonContent, IonDatetime, IonGrid, IonHeader, IonIcon, IonInput, IonItem, IonLabel, IonModal, IonPopover, IonRow, IonSelect, IonSelectOption, IonTextarea, IonTitle, IonToolbar } from '@ionic/react';
import axios from 'axios';
import { getAuth } from 'firebase/auth';
import { collection, deleteDoc, doc, onSnapshot, query, Timestamp, updateDoc, where } from 'firebase/firestore';
import { chevronBack } from 'ionicons/icons';
import { useEffect, useState } from 'react';
import { database } from '../configurations/firebase';
import './EditTransfer.css';
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

interface Transfer {
    transfer_id: string,
    user_id: string,
    source_account_id: string,
    destination_account_id: string,
    amount: number,
    converted_amount: number,
    source_currency: string,
    destination_currency: string,
    date: Timestamp,
    note: string
};

interface AddTransferProps {
    isOpen: boolean;
    onClose: () => void;
    transfer: Transfer | null;
}

const EditTransfer: React.FC<AddTransferProps> = ({ isOpen, onClose, transfer }) => {
    const [error, setError] = useState<string>('');
    const [showAlert, setShowAlert] = useState(false);
    const [showUpdateAlert, setShowUpdateAlert] = useState(false);
    const [showDeleteAlert, setShowDeleteAlert] = useState(false);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [selectedSourceAccount, setSelectedSourceAccount] = useState<string | undefined>();
    const [selectedDestinationAccount, setSelectedDestinationAccount] = useState<string | undefined>();
    const [amount, setAmount] = useState(0);
    const [selectedDate, setSelectedDate] = useState('');
    const [isDatePickerOpen, setDatePickerOpen] = useState(false);
    const [note, setNote] = useState('');

    /* Notificación global */
    const [toastConfig, setToastConfig] = useState<{
        isOpen: boolean;
        message: string;
        type: 'success' | 'error';
    }>({ isOpen: false, message: '', type: 'error' });

    /* Actualizamos los campos con la información de la transferencia seleccionada */
    useEffect(() => {
        if (transfer) {
            setSelectedSourceAccount(transfer.source_account_id);
            setSelectedDestinationAccount(transfer.destination_account_id);
            setAmount(transfer.amount);
            setSelectedDate(transfer.date.toDate().toISOString());
            setNote(transfer.note);
        }
    }, [transfer]);

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

    /* Guardamos la fecha en el formato por defecto */
    const handleDateChange = (e: CustomEvent) => {
        setSelectedDate(e.detail.value!);
        setDatePickerOpen(false);
    };

    const handleSaveTransfer = async () => {

        /* Buscamos las cuentas de origen y de destino en la base de datos */
        const sourceAccount = accounts.find(account => account.account_id === selectedSourceAccount);
        const destinationAccount = accounts.find(account => account.account_id === selectedDestinationAccount);

        /* Validamos que los datos sean válidos */
        if (!selectedSourceAccount) {
            setError('Selecciona una cuenta de origen para la transferencia');
            setShowAlert(true);
            return;
        }

        if (!sourceAccount) {
            setError('Cuenta de origen no encontrada');
            setShowAlert(true);
            return;
        }

        if (sourceAccount?.balance < amount) {
            setError('Saldo insuficiente en la cuenta de origen para la transferencia');
            setShowAlert(true);
            return;
        }

        if (!selectedDestinationAccount) {
            setError('Selecciona una cuenta de destino para la transferencia');
            setShowAlert(true);
            return;
        }

        if (!destinationAccount) {
            setError('Cuenta de destino no encontrada');
            setShowAlert(true);
            return;
        }

        if (selectedSourceAccount === selectedDestinationAccount) {
            setError('No puedes transferir entre la misma cuenta');
            setShowAlert(true);
            return;
        }

        if (amount <= 0) {
            setError('Introduce un monto válido para la transacción');
            setShowAlert(true);
            return;
        }

        if (!selectedDate) {
            setError('Selecciona una fecha para la transferencia');
            setShowAlert(true);
            return;
        }

        if (!transfer) {
            setError('Transferencia no encontrada');
            setShowAlert(true);
            return;
        }

        try {

            /* Calculamos nuevamente el saldo de las cuentas revirtiendo la transferencia antes de ser editada */
            const originalAmount = transfer.amount;
            const updatedSourceBalance = sourceAccount.balance + originalAmount - amount;
            const updatedDestinationBalance = destinationAccount.balance - transfer.converted_amount + (amount * (destinationAccount.currency === sourceAccount.currency ? 1 : await axios.get(`https://api.exchangerate-api.com/v4/latest/${sourceAccount.currency}`).then(response => response.data.rates[destinationAccount.currency]))); // Revertir la conversión original

            if (updatedSourceBalance < 0) {
                setToastConfig({ isOpen: true, message: 'Saldo insuficiente en la cuenta de origen', type: 'error' });
                return;
            }

            /* Convertimos el monto de la transferencia a la divisa de la cuenta de destino con una API para consultar el valor de las divisas */
            let convertedAmount = amount;
            if (sourceAccount.currency !== destinationAccount.currency) {
                const response = await axios.get(`https://api.exchangerate-api.com/v4/latest/${sourceAccount.currency}`);
                const rates = response.data.rates;
                const conversionRate = rates[destinationAccount.currency];

                if (!conversionRate) {
                    throw new Error('Error al obtener la tasa de cambio');
                }

                convertedAmount = amount * conversionRate;
            }

            /* Actualizamos el saldo de las cuentas de origen y de destino */
            const sourceAccountRef = doc(database, 'accounts', sourceAccount.account_id);
            const destinationAccountRef = doc(database, 'accounts', destinationAccount.account_id);

            const transferRef = doc(database, 'transfers', transfer.transfer_id);

            const updatedTransfer = {
                source_account_id: sourceAccount.account_id,
                destination_account_id: destinationAccount.account_id,
                amount: parseFloat(amount.toFixed(2)),
                converted_amount: parseFloat(convertedAmount.toFixed(2)),
                source_currency: sourceAccount.currency,
                destination_currency: destinationAccount.currency,
                date: Timestamp.fromDate(new Date(selectedDate)),
                note: note,
            };

            await Promise.all([
                updateDoc(transferRef, updatedTransfer),
                updateDoc(sourceAccountRef, { balance: updatedSourceBalance }),
                updateDoc(destinationAccountRef, { balance: updatedDestinationBalance }),
            ]);

            setToastConfig({ isOpen: true, message: 'Transferencia editada con éxito', type: 'success' });

            /* Cerramos el modal automáticamente al editar la transferencia */
            setShowUpdateAlert(false);
            onClose();
        } catch (error) {
            setToastConfig({ isOpen: true, message: 'No se pudo editar la transferencia', type: 'error' });
            console.error(error);
        }
    };

    const handleDeleteTransfer = async () => {
        try {
            if (!transfer) {
                throw new Error("El ID de la transacción no está definido");
            }

            /* Buscamos la transferencia en la base de datos */
            const transferRef = doc(database, 'transfers', transfer.transfer_id);

            /* Eliminamos la transferencia de la base de datos */
            await deleteDoc(transferRef);

            setToastConfig({ isOpen: true, message: 'Transferencia eliminada con éxito', type: 'success' });

            /* Cerramos el modal automáticamente al eliminar la transferencia */
            setShowDeleteAlert(false);
            onClose();
        } catch (error) {
            setToastConfig({ isOpen: true, message: 'No se pudo eliminar la transferencia', type: 'error' });
        }
    }

    return (
        <>
            <IonModal isOpen={isOpen} onDidDismiss={onClose}>
                <IonHeader>
                    <IonToolbar>
                        <IonTitle>Editar transferencia</IonTitle>
                        <IonButton slot="start" onClick={onClose} fill='clear'>
                            <IonIcon icon={chevronBack}></IonIcon>
                        </IonButton>

                        {/* Botón para guardar la transferencia */}
                        <IonButton slot='end' fill='clear' onClick={() => setShowUpdateAlert(true)}>
                            <FontAwesomeIcon icon={faFloppyDisk}></FontAwesomeIcon>
                        </IonButton>

                        {/* Botón para eliminar la transferencia */}
                        <IonButton slot='end' className='handle-delete-transfer-button' color='danger' fill='clear' onClick={() => setShowDeleteAlert(true)}>
                            <FontAwesomeIcon icon={faTrashCan}></FontAwesomeIcon>
                        </IonButton>
                    </IonToolbar>
                </IonHeader>
                <IonContent>
                    {showAlert && (<IonAlert isOpen={showAlert} onDidDismiss={() => setShowAlert(false)} header={'Datos inválidos'} message={error} buttons={['Aceptar']} />)}

                    <IonGrid>
                        {/* Campo para seleccionar la cuenta de origen */}
                        <IonRow>
                            <IonCol size="12" size-md="8" offset-md="2">
                                <IonItem>
                                    <IonSelect interface="popover" label="Cuenta de origen" labelPlacement="floating" placeholder="Selecciona la cuenta de origen" value={selectedSourceAccount} onIonChange={(e) => setSelectedSourceAccount(e.detail.value)}>
                                        {accounts.map(account => (
                                            <IonSelectOption key={account.account_id} value={account.account_id}>
                                                <IonLabel>{account.name} ({account.balance.toFixed(2)} {account.currency})</IonLabel>
                                            </IonSelectOption>
                                        ))}
                                    </IonSelect>
                                </IonItem>
                            </IonCol>
                        </IonRow>

                        {/* Campo para seleccionar la cuenta de destino */}
                        <IonRow>
                            <IonCol size="12" size-md="8" offset-md="2">
                                <IonItem>
                                    <IonSelect interface="popover" label="Cuenta de destino" labelPlacement="floating" placeholder="Selecciona la cuenta de destino" value={selectedDestinationAccount} onIonChange={(e) => setSelectedDestinationAccount(e.detail.value)}>
                                        {accounts.map(account => (
                                            <IonSelectOption key={account.account_id} value={account.account_id}>
                                                <IonLabel>{account.name} ({account.balance.toFixed(2)} {account.currency})</IonLabel>
                                            </IonSelectOption>
                                        ))}
                                    </IonSelect>
                                </IonItem>
                            </IonCol>
                        </IonRow>

                        {/* Campo para añadir el monto de la transferencia */}
                        <IonRow>
                            <IonCol size="12" size-md="8" offset-md="2">
                                <IonItem>
                                    <IonInput label='Monto' labelPlacement='floating' placeholder='Monto' type="number" value={amount} onIonInput={(e) => setAmount(parseFloat(e.detail.value!))} required />
                                </IonItem>
                            </IonCol>
                        </IonRow>

                        {/* Campo para seleccionar la fecha de la transacción */}
                        <IonRow>
                            <IonCol size="12" size-md="8" offset-md="2">
                                <IonItem>
                                    <IonInput label='Fecha' labelPlacement='floating' placeholder='Selecciona una fecha' readonly value={selectedDate}></IonInput>

                                    {/* Abrir el popover para seleccionar la fecha de la transacción */}
                                    <div slot='end'>
                                        <FontAwesomeIcon icon={faCalendar} onClick={() => setDatePickerOpen(true)}></FontAwesomeIcon>
                                    </div>
                                </IonItem>
                            </IonCol>
                        </IonRow>

                        {/* Campo para añadir una nota o descripción de la transacción */}
                        <IonRow>
                            <IonCol size="12" size-md="8" offset-md="2">
                                <IonItem>
                                    <IonTextarea label='Nota' labelPlacement='floating' placeholder='Introduce una descripción' rows={5} value={note} onIonInput={(e) => setNote(e.detail.value!)}></IonTextarea>
                                </IonItem>
                            </IonCol>
                        </IonRow>
                    </IonGrid>

                    {/* Popover para seleccionar la fecha de la transacción */}
                    {/* Cerrar el popover para seleccionar la fecha de la transacción */}
                    <IonPopover isOpen={isDatePickerOpen} onDidDismiss={() => setDatePickerOpen(false)}>
                        <IonDatetime locale='es-ES' value={selectedDate} onIonChange={handleDateChange} max={new Date().toISOString().split('T')[0]} />
                        <IonButton expand="block" onClick={() => setDatePickerOpen(false)}>Cerrar</IonButton>
                    </IonPopover>
                </IonContent>

                {/* Alerta para confirmar la edición de la transferencia */}
                <IonAlert isOpen={showUpdateAlert} onDidDismiss={() => setShowAlert(false)} header={'Editar transferencia'} message={'¿Estás seguro de que quieres editar la transferencia?'} buttons={[{ text: 'Cancelar', role: 'cancel', handler: () => { setShowUpdateAlert(false); } }, { text: 'Editar', handler: () => { handleSaveTransfer(); } }]} />

                {/* Alerta para confirmar la eliminación de la transferencia */}
                <IonAlert isOpen={showDeleteAlert} onDidDismiss={() => setShowAlert(false)} header={'Eliminar transferencia'} message={'¿Estás seguro de que quieres eliminar la transferencia?'} buttons={[{ text: 'Cancelar', role: 'cancel', handler: () => { setShowDeleteAlert(false); } }, { text: 'Eliminar', handler: () => { handleDeleteTransfer(); } }]} />
            </IonModal>
            <GlobalToast isOpen={toastConfig.isOpen} message={toastConfig.message} type={toastConfig.type} onDidDismiss={() => { setToastConfig({ ...toastConfig, isOpen: false }); }}></GlobalToast>
        </>
    );
}


export default EditTransfer;