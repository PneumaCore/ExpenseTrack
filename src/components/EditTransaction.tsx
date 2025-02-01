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
    const [images, setImages] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);

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
            const imagePreviews = transaction.image.map(img => img);
            setImagePreviews(imagePreviews);
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

                /* Obtenemos las categorías asociadas al usuario autenticado */
                const categoriesRef = collection(database, 'categories');
                const q = query(
                    categoriesRef,
                    or(
                        where('user_id', '==', currentUser?.uid),
                        where('user_id', '==', '')
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

    /* Guardamos la dirección de la imagen */
    const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {

        /* Almacenamos las imagenes de la galería del usuario */
        const files = event.target.files;
        if (files) {

            /* Pasamos la lista de imágenes a un array */
            const newImages = Array.from(files);

            /* Impedimos que el usuario introduzca más de cinco imágenes, ya que realmente no son necesarias tantas */
            if (images.length + newImages.length > 5) {
                setToastConfig({ isOpen: true, message: 'No puedes añadir más de cinco fotos', type: 'error' });
                return;
            }

            /* Comprimimos todas las imágenes */
            const compressedImages = await Promise.all(
                newImages.map(async (image) => {
                    const compressedImage = await compressImage(image);
                    return compressedImage;
                })
            );

            /* Generamos las URL para las vistas previas */
            const newPreviews = compressedImages.map((file) => URL.createObjectURL(file));
            setImages((prev) => [...prev, ...compressedImages]);
            setImagePreviews((prev) => [...prev, ...newPreviews]);
        }
    };

    /* Funcionalidad para eliminar una fotos que el usuario ha cargado de la galería */
    const removeImage = (index: number) => {
        setImages((prev) => prev.filter((_, i) => i !== index));
        setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    };

    /* Funcionalidad para comprimir la imagen */
    const compressImage = async (file: File) => {
        try {
            const options = {
                maxSizeMB: 0.5,
                maxWidthOrHeight: 800,
                useWebWorker: true,
            };

            const compressedFile = await ImageCompression(file, options);
            return compressedFile;
        } catch (error) {
            console.error('Error al comprimir la imagen:', error);
            return file;
        }
    };

    /* Funcionalidad para convertir una imagen a base64 */
    const handleImageToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = (error) => reject(error);
            reader.readAsDataURL(file);
        });
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
                image: await Promise.all(images.map(file => handleImageToBase64(file))),
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

                    {/* Campo añadir foto de la galería */}
                    <IonRow>
                        <IonCol size="12" size-md="8" offset-md="2">
                            <div className="image-container">
                                {imagePreviews.map((src, index) => (
                                    <div key={index} className="image-preview">
                                        <img src={src} alt={`preview-${index}`} />
                                        <IonIcon icon={closeCircle} className="close-icon" onClick={() => removeImage(index)} />
                                    </div>
                                ))}
                                {images.length < 5 && (
                                    <label htmlFor="upload-photo" className="add-image-button">
                                        <IonIcon icon={addOutline} />
                                        <input id="upload-photo" type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleImageChange} />
                                    </label>
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