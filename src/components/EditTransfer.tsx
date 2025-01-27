import { faCalendar } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IonButton, IonCol, IonContent, IonDatetime, IonFooter, IonGrid, IonHeader, IonIcon, IonInput, IonItem, IonLabel, IonModal, IonPopover, IonRow, IonSelect, IonSelectOption, IonTextarea, IonTitle, IonToolbar } from '@ionic/react';
import axios from 'axios';
import { getAuth } from 'firebase/auth';
import { collection, deleteDoc, doc, getDoc, onSnapshot, query, Timestamp, updateDoc, where } from 'firebase/firestore';
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
        try {
            if (!transfer) {
                throw new Error("El ID de la transacción no está definido");
            }

            if (!selectedSourceAccount || !selectedDestinationAccount) {
                setToastConfig({ isOpen: true, message: 'Selecciona ambas cuentas', type: 'error' });
                return;
            }

            if (selectedSourceAccount === selectedDestinationAccount) {
                setToastConfig({ isOpen: true, message: 'No puedes transferir entre la misma cuenta', type: 'error' });
                return;
            }

            /* Buscamos las cuentas de origen y de destino en la base de datos */
            const sourceAccount = accounts.find(account => account.account_id === selectedSourceAccount);
            const destinationAccount = accounts.find(account => account.account_id === selectedDestinationAccount);

            if (!sourceAccount || !destinationAccount) {
                setToastConfig({ isOpen: true, message: 'Cuentas no encontradas', type: 'error' });
                return;
            }

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

            /* Cerramos el modal automáticamente al editar la transferencia */
            setToastConfig({ isOpen: true, message: 'Transferencia editada con éxito', type: 'success' });
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

            /* Cerramos el modal automáticamente al eliminar la transferencia */
            setToastConfig({ isOpen: true, message: 'Transferencia eliminada con éxito', type: 'success' });
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
                    </IonToolbar>
                </IonHeader>
                <IonContent>

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
                                    <IonInput label='Monto' labelPlacement='floating' placeholder='Monto' type="number" value={amount} onIonChange={(e) => setAmount(parseFloat(e.detail.value!))} required />
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
                                    <IonTextarea label='Nota' labelPlacement='floating' placeholder='Introduce una descripción' value={note} onIonChange={(e) => setNote(e.detail.value!)}></IonTextarea>
                                </IonItem>
                            </IonCol>
                        </IonRow>

                    </IonGrid>

                    {/* Popover para seleccionar la fecha de la transacción */}
                    {/* Cerrar el popover para seleccionar la fecha de la transacción */}
                    <IonPopover isOpen={isDatePickerOpen} onDidDismiss={() => setDatePickerOpen(false)}>
                        <IonDatetime locale='es-ES' value={selectedDate} onIonChange={handleDateChange} />
                        <IonButton expand="block" onClick={() => setDatePickerOpen(false)}>Cerrar</IonButton>
                    </IonPopover>
                </IonContent>
                <IonFooter>
                    <IonToolbar>
                        <div className='add-transaction-footer'>

                            {/* Botón para guardar la transferencia */}
                            <IonButton onClick={handleSaveTransfer}>Guardar transferencia</IonButton>

                            {/* Botón para eliminar la transferencia */}
                            <IonButton className='handle-delete-transfer-button' color='danger' onClick={handleDeleteTransfer}>Eliminar transferencia</IonButton>
                        </div>
                    </IonToolbar>
                </IonFooter>
            </IonModal>
            <GlobalToast isOpen={toastConfig.isOpen} message={toastConfig.message} type={toastConfig.type} onDidDismiss={() => { setToastConfig({ ...toastConfig, isOpen: false }); }}></GlobalToast>

        </>
    );
}


export default EditTransfer;