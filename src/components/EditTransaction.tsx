import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { IonButton, IonCol, IonContent, IonDatetime, IonFooter, IonGrid, IonHeader, IonIcon, IonInput, IonItem, IonLabel, IonModal, IonPopover, IonRow, IonSegment, IonSegmentButton, IonSelect, IonSelectOption, IonTextarea, IonTitle, IonToolbar } from '@ionic/react';
import ImageCompression from 'browser-image-compression';
import { getAuth } from 'firebase/auth';
import { collection, deleteDoc, doc, getDoc, onSnapshot, or, query, Timestamp, updateDoc, where } from 'firebase/firestore';
import { addOutline, calendar, chevronBack, closeCircle } from 'ionicons/icons';
import { useEffect, useState } from 'react';
import { database } from '../configurations/firebase';
import './EditTransaction.css';
import GlobalToast from './GlobalToast';

interface EditTransactionProps {
    isOpen: boolean;
    onClose: () => void;
    transaction: Transaction | null;
}

interface Transaction {
    transaction_id: string,
    user_id: string,
    type: string,
    category_id: string,
    account_id: string,
    amount: number,
    currency: string,
    date: Timestamp,
    note: string,
    image: string[]
}

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

const EditTransaction: React.FC<EditTransactionProps> = ({ isOpen, onClose, transaction }) => {
    const [type, setType] = useState('gasto');
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [selectedAccount, setSelectedAccount] = useState<string | undefined>();
    const [amount, setAmount] = useState(0);
    const [selectedDate, setSelectedDate] = useState('');
    const [isDatePickerOpen, setDatePickerOpen] = useState(false);
    const [note, setNote] = useState('');
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
    const [images, setImages] = useState<string[]>([]);

    /* Notificación global */
    const [toastConfig, setToastConfig] = useState<{
        isOpen: boolean;
        message: string;
        type: 'success' | 'error';
    }>({ isOpen: false, message: '', type: 'error' });

    /* Actualizamos los campos con la información de la transacción seleccionada */
    useEffect(() => {
        if (transaction) {
            setType(transaction.type);
            setSelectedAccount(transaction.account_id);
            setAmount(parseFloat(transaction.amount.toFixed(2)));
            setSelectedDate(transaction.date.toDate().toISOString());
            setNote(transaction.note);
            setSelectedCategory(transaction.category_id);
            setImages(transaction.image);
        }
    }, [transaction]);


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

    /* Filtramos las categorías según el tipo de la transacción */
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

    /* Seleccionamos las fotos haciendo una foto con la cámara o escogiéndolas de la galería */
    const handlePhoto = async () => {
        if (images.length >= 5) {
            setToastConfig({ isOpen: true, message: 'No puedes añadir más de 5 imágenes', type: 'error' });
            return;
        }

        try {
            const photo = await Camera.getPhoto({
                resultType: CameraResultType.Uri,
                source: CameraSource.Prompt,
                quality: 90,
            });

            if (photo?.webPath) {
                const imageBlob = await fetch(photo.webPath).then(res => res.blob());
                const fileName = "transaction-photo.jpg";
                const imageFile = new File([imageBlob], fileName, { type: imageBlob.type });

                const options = {
                    maxSizeMB: 0.5,
                    maxWidthOrHeight: 800,
                    useWebWorker: true,
                };

                const compressedImage = await ImageCompression(imageFile, options);

                const reader = new FileReader();
                reader.onloadend = () => {
                    const base64Image = reader.result as string;
                    setImages(prevImages => [...prevImages, base64Image]);
                };
                reader.readAsDataURL(compressedImage);
            }
        } catch (error) {
            console.error('Error al obtener o comprimir la foto:', error);
        }
    };

    const removeImage = (index: number) => {
        setImages(prevImages => prevImages.filter((_, i) => i !== index));
    };

    const handleSaveTransaction = async () => {
        try {

            if (!transaction?.transaction_id) {
                throw new Error("El ID de la transacción no está definido");
            }

            if (!selectedAccount) {
                throw new Error("Por favor selecciona una cuenta");
            }

            const accountRef = doc(database, 'accounts', selectedAccount);
            const transactionsRef = doc(database, 'transactions', transaction?.transaction_id);

            /* Buscamos la cuenta asociada a la transacción */
            const accountSnapshot = await getDoc(accountRef);
            const accountData = accountSnapshot.data() as Account;

            /* Calculamos la diferencia de saldo de la cuenta */
            const oldType = transaction.type;
            const oldAmount = transaction.amount;

            let updatedBalance = accountData.balance + oldAmount * (oldType === 'gasto' ? 1 : -1);

            updatedBalance += amount * (type === 'gasto' ? -1 : 1);

            const updateTransaction = {
                type: type,
                category_id: selectedCategory,
                account_id: selectedAccount,
                amount: parseFloat(amount.toFixed(2)),
                date: Timestamp.fromDate(new Date(selectedDate)),
                note: note,
                image: images,
            }

            /* Guardamos la cuenta editada en la base de datos */
            await updateDoc(transactionsRef, updateTransaction);

            /* Actualizamos el saldo de la cuenta con la nueva modificación */
            await updateDoc(accountRef, { balance: updatedBalance });

            setToastConfig({ isOpen: true, message: 'Transacción editada con éxito', type: 'success' });

            /* Cerramos el modal automáticamente al editar la transacción */
            onClose();
        } catch (error) {
            setToastConfig({ isOpen: true, message: 'No se pudo editar la transacción', type: 'error' });
        }
    }

    const handleDeleteTransaction = async () => {
        try {

            if (!transaction?.transaction_id) {
                throw new Error("El ID de la transacción no está definido");
            }

            const accountRef = doc(database, 'accounts', transaction.account_id);
            const transactionRef = doc(database, 'transactions', transaction?.transaction_id);

            /* Buscamos la cuenta asociada a la transacción */
            const accountSnapshot = await getDoc(accountRef);
            const accountData = accountSnapshot.data() as Account;

            if (!accountData) {
                throw new Error("No se pudo obtener la cuenta asociada");
            }

            /* Calculamos nuevamente el saldo de la cuenta */
            const updatedBalance = accountData.balance + transaction.amount * (transaction.type === 'gasto' ? 1 : -1);

            /* Eliminamos la transacción de la base de datos */
            await deleteDoc(transactionRef);

            /* Actualizamos el saldo de la cuenta como si nunca se hubiera realizado dicha transacción */
            await updateDoc(accountRef, { balance: updatedBalance });

            setToastConfig({ isOpen: true, message: 'Transacción eliminada con éxito', type: 'success' });

            /* Cerramos el modal automáticamente al eliminar la cuenta */
            onClose();
        } catch (error) {
            setToastConfig({ isOpen: true, message: 'No se pudo eliminar la transacción', type: 'error' });
        }
    }

    return (
        <>
            <IonModal isOpen={isOpen} onDidDismiss={onClose}>
                <IonHeader>
                    <IonToolbar>
                        <IonTitle>Editar transacción</IonTitle>
                        <IonButton slot="start" onClick={onClose} fill='clear'>
                            <IonIcon icon={chevronBack}></IonIcon>
                        </IonButton>
                    </IonToolbar>
                </IonHeader>
                <IonContent>

                    {/* Seleccionamos el tipo de transacción */}
                    <IonSegment value={type} onIonChange={(e: CustomEvent) => setType(e.detail.value)}>
                        <IonSegmentButton value="gasto">
                            <IonLabel>Gasto</IonLabel>
                        </IonSegmentButton>
                        <IonSegmentButton value="ingreso">
                            <IonLabel>Ingreso</IonLabel>
                        </IonSegmentButton>
                    </IonSegment>

                    <IonGrid>

                        {/* Campo para seleccionar la cuenta de la transacción */}
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

                        {/* Campo para añadir el monto de la transacción */}
                        <IonRow>
                            <IonCol size="12" size-md="8" offset-md="2">
                                <IonItem>
                                    <IonInput label='Monto' labelPlacement='floating' placeholder='Monto' type="number" value={amount} onIonInput={(e) => setAmount(parseFloat(e.detail.value!))} required />
                                </IonItem>
                            </IonCol>
                        </IonRow>
                    </IonGrid>

                    {/* Campo para seleccionar la categoría de la transacción */}
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

                    {/* Campo para seleccionar la fecha de la transacción */}
                    <IonRow>
                        <IonCol size="12" size-md="8" offset-md="2">
                            <IonItem>
                                <IonInput label='Fecha' labelPlacement='floating' placeholder='Selecciona una fecha' readonly value={selectedDate}></IonInput>

                                {/* Abrir el popover para seleccionar la fecha de la transacción */}
                                <IonIcon slot='end' icon={calendar} onClick={() => setDatePickerOpen(true)}></IonIcon>
                            </IonItem>
                        </IonCol>
                    </IonRow>

                    {/* Campo para añadir una nota o descripción de la transacción */}
                    <IonRow>
                        <IonCol size="12" size-md="8" offset-md="2">
                            <IonItem>
                                <IonTextarea label='Nota' labelPlacement='floating' placeholder='Introduce una descripción' value={note} onIonInput={(e) => setNote(e.detail.value!)}></IonTextarea>
                            </IonItem>
                        </IonCol>
                    </IonRow>

                    {/* Campo añadir fotos de la cámara o galería */}
                    <IonRow>
                        <IonCol size="12" size-md="8" offset-md="2">
                            <div className="image-container">
                                {images.map((image, index) => (
                                    <div key={index} className="image-preview">
                                        <img src={image} alt={`Imagen ${index + 1}`} />
                                        <IonIcon icon={closeCircle} className="close-icon" onClick={() => removeImage(index)} />
                                    </div>
                                ))}
                                {images.length < 5 && (
                                    <div className="add-image-button" onClick={handlePhoto}>
                                        <IonIcon icon={addOutline} />
                                    </div>
                                )}
                            </div>
                        </IonCol>
                    </IonRow>

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

                            {/* Botón para guardar la transacción */}
                            <IonButton onClick={handleSaveTransaction}>Guardar transacción</IonButton>

                            {/* Botón para eliminar la cuenta */}
                            <IonButton className='handle-delete-transaction-button' color='danger' onClick={handleDeleteTransaction}>Eliminar transacción</IonButton>
                        </div>
                    </IonToolbar>
                </IonFooter>
            </IonModal>
            <GlobalToast isOpen={toastConfig.isOpen} message={toastConfig.message} type={toastConfig.type} onDidDismiss={() => { setToastConfig({ ...toastConfig, isOpen: false }); }}></GlobalToast>
        </>
    );
}

export default EditTransaction;