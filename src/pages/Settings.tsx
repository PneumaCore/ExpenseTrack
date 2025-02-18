import { Directory, Filesystem } from '@capacitor/filesystem';
import { faCommentDollar, faDatabase, faFileExcel, faLock, faTrashCan, faUser } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IonAlert, IonButtons, IonCol, IonContent, IonGrid, IonHeader, IonItem, IonLabel, IonList, IonMenuButton, IonPage, IonRow, IonSelect, IonSelectOption, IonTitle, IonToolbar } from '@ionic/react';
import { deleteUser, getAuth, signOut } from 'firebase/auth';
import { collection, deleteDoc, doc, getDocs, onSnapshot, or, orderBy, query, Timestamp, updateDoc, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useHistory } from 'react-router';
import * as XLSX from 'xlsx';
import { database } from '../configurations/firebase';
import './Settings.css';

interface Currency {
    code: string;
    name: string;
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

const Settings: React.FC = () => {
    const history = useHistory();
    const [currencies, setCurrencies] = useState<Currency[]>([]);
    const [preferredCurrency, setPreferredCurrency] = useState<string>("EUR");
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [transfers, setTransfers] = useState<Transfer[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [alert, setAlert] = useState<string>('');
    const [showAlert, setShowAlert] = useState(false);
    const [isExportAlertOpen, setIsExportAlertOpen] = useState(false);
    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);

    /* Leemos las divisa preferida del usuario de la base de datos */
    useEffect(() => {
        const fetchUserCurrency = async () => {
            try {
                const auth = getAuth();
                const currentUser = auth.currentUser;

                const usersRef = collection(database, 'users');
                const q = query(usersRef, where('uid', '==', currentUser?.uid));
                const snapshot = await getDocs(q);

                if (!snapshot.empty) {
                    const userData = snapshot.docs[0].data();
                    setPreferredCurrency(userData.currency || "EUR");
                }
            } catch (error) {
                console.error("Error al obtener la divisa preferida del usuario: ", error);
            }
        };

        fetchUserCurrency();
    }, []);

    /* Buscamos el código y nombre de las divisas en la API de openexchangerates.org */
    useEffect(() => {
        const fetchCurrencies = async () => {
            try {

                /* Obtenemos los nombres y códigos de las divisas desde la API */
                const response = await fetch('https://openexchangerates.org/api/currencies.json');
                const data = await response.json();

                const currencyList: Currency[] = Object.keys(data).map((key) => ({
                    code: key,
                    name: data[key],
                }));

                setCurrencies(currencyList);
            } catch (error) {
                console.error('Error al obtener las divisas:', error);
            } finally {
            }
        };

        fetchCurrencies();
    }, []);

    /* Leemos las transacciones realizadas por el usuario de la base de datos */
    useEffect(() => {
        const fetchTransactions = () => {
            try {

                /* Obtenemos los datos del usuario autenticado */
                const auth = getAuth();
                const currentUser = auth.currentUser;

                /* Obtenemos las categorías asociadas al usuario autenticado */
                const transactionsRef = collection(database, 'transactions');
                const q = query(transactionsRef, where('user_id', '==', currentUser?.uid), orderBy('date', 'desc'));

                const unsubscribe = onSnapshot(q, (querySnapshot) => {
                    const fetchedTransactions = querySnapshot.docs.map((doc) => ({
                        ...doc.data(),
                        transaction_id: doc.id,
                    })) as Transaction[];
                    setTransactions(fetchedTransactions);
                });
                return unsubscribe;

            } catch (error) {
                console.error("Error al obtener las transacciones: ", error);
            }
        };
        const unsubscribe = fetchTransactions();
        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, []);

    /* Leemos las transferencias del usuario de la base de datos */
    useEffect(() => {
        const fetchTransfers = () => {
            try {

                /* Obtenemos los datos del usuario autenticado */
                const auth = getAuth();
                const currentUser = auth.currentUser;

                /* Obtenemos las transferencias asociadas al usuario autenticado */
                const transfersRef = collection(database, 'transfers');
                const q = query(transfersRef, where('user_id', '==', currentUser?.uid), orderBy('date', 'desc'));

                const unsubscribe = onSnapshot(q, (querySnapshot) => {
                    const fetchedTransfers = querySnapshot.docs.map((doc) => ({
                        ...doc.data(),
                        transfer_id: doc.id,
                    })) as Transfer[];
                    setTransfers(fetchedTransfers);
                });
                return unsubscribe;

            } catch (error) {
                console.error("Error al obtener las transferencias: ", error);
            }
        };
        const unsubscribe = fetchTransfers();
        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, []);

    /* Leemos las cuentas del usuario de la base de datos */
    useEffect(() => {
        const fetchAccounts = () => {
            try {

                /* Obtenemos los datos del usuario autenticado */
                const auth = getAuth();
                const currentUser = auth.currentUser;

                /* Obtenemos las cuentas asociadas al usuario autenticado */
                const transactionsRef = collection(database, 'accounts');
                const q = query(transactionsRef, where('user_id', '==', currentUser?.uid));

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

    /* Exportamos los datos de las transacciones */
    const exportTransactionsToExcel = async () => {

        if (transactions.length === 0) {
            setAlert("No hay transacciones para exportar");
            setShowAlert(true);
            return;
        }

        /* Pedimos permisos de almacenamiento al usuario */
        await Filesystem.requestPermissions();

        /* Formateamos el nombre de las columnas y los datos de las transferencias */
        const formattedTransactions = transactions.map(transaction => ({
            "Fecha": new Date(transaction.date.toDate()).toLocaleDateString(),
            "Tipo": transaction.type,
            "Categoría": categories.find(cat => cat.category_id === transaction.category_id)?.name,
            "Cuenta": accounts.find(acc => acc.account_id === transaction.account_id)?.name,
            "Monto": transaction.amount,
            "Divisa": transaction.currency,
            "Nota": transaction.note
        }));

        /* Creamos el archivo excel */
        const ws = XLSX.utils.json_to_sheet(formattedTransactions);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Transacciones");

        /* Convertimos el archivo excel a un array binario para que sea legible */
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const uint8Array = new Uint8Array(excelBuffer);

        try {

            /* Pasamos las cadenas binarias a base64 para que pueda almacenarse en sistemas operativos Android */
            let binary = '';
            uint8Array.forEach(byte => binary += String.fromCharCode(byte));
            const base64Data = btoa(binary);

            /* Generamos la fecha actual y la añadimos al nombre del archivo */
            const date = new Date().toISOString().split('T')[0];
            const fileName = `expensetrack_transactions_${date}.xlsx`;

            /* Almacenamos el archivo excel en la carpeta 'Documentos' que viene por defecto en Android */
            await Filesystem.writeFile({
                path: `Documents/${fileName}`,
                data: base64Data,
                directory: Directory.ExternalStorage
            });

            setAlert("Archivo exportado correctamente en Documentos/ExpenseTrack");
            setShowAlert(true);
        } catch (error) {
            console.error("Error al guardar el archivo:", error);
            setAlert("No se ha podido exportar el archivo correctamente");
            setShowAlert(true);
        }
    };

    /* Exportamos los datos de las transacciones */
    const exportTransfersToExcel = async () => {

        if (transfers.length === 0) {
            setAlert("No hay transferencias para exportar");
            setShowAlert(true);
            return;
        }

        /* Pedimos permisos de almacenamiento al usuario */
        await Filesystem.requestPermissions();

        /* Formateamos el nombre de las columnas y los datos de las transferencias */
        const formattedTransfers = transfers.map(transfer => ({
            "Fecha": new Date(transfer.date.toDate()).toLocaleDateString(),
            "Cuenta origen": accounts.find(acc => acc.account_id === transfer.source_account_id)?.name,
            "Divisa origen": transfer.source_currency,
            "Cuenta destino": accounts.find(acc => acc.account_id === transfer.destination_account_id)?.name,
            "Divisa destino": transfer.destination_currency,
            "Monto": transfer.amount,
            "Monto convertido": transfer.converted_amount,
            "Nota": transfer.note
        }));

        /* Creamos el archivo excel */
        const ws = XLSX.utils.json_to_sheet(formattedTransfers);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Transferencias");

        /* Convertimos el archivo excel a un array binario para que sea legible */
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const uint8Array = new Uint8Array(excelBuffer);

        try {

            /* Pasamos las cadenas binarias a base64 para que pueda almacenarse en sistemas operativos Android */
            let binary = '';
            uint8Array.forEach(byte => binary += String.fromCharCode(byte));
            const base64Data = btoa(binary);

            /* Generamos la fecha actual y la añadimos al nombre del archivo */
            const date = new Date().toISOString().split('T')[0];
            const fileName = `expensetrack_transfers_${date}.xlsx`;

            /* Almacenamos el archivo excel en la carpeta 'Documentos' que viene por defecto en Android */
            await Filesystem.writeFile({
                path: `Documents/${fileName}`,
                data: base64Data,
                directory: Directory.ExternalStorage
            });

            setAlert("Archivo exportado correctamente en Documentos/ExpenseTrack");
            setShowAlert(true);
        } catch (error) {
            console.error("Error al guardar el archivo:", error);
            setAlert("No se ha podido exportar el archivo correctamente");
            setShowAlert(true);
        }
    };

    /* Guardamos la divisa seleccionada en la base de datos */
    const handleSaveProfile = async (currency: string) => {
        try {

            /* Obtenemos los datos del usuario autenticado */
            const auth = getAuth();
            const currentUser = auth.currentUser;

            /* Verificamos si el usuario está autenticado */
            if (!currentUser || !currentUser.uid) {
                throw new Error("El usuario no está autenticado.");
            }

            if (!currency) {
                throw new Error("No se ha seleccionado ninguna divisa.");
            }

            const usersRef = doc(database, "users", currentUser?.uid);

            await updateDoc(usersRef, {
                currency: currency,
            });

            setAlert("Divisa seleccionada correctamente.");
            setShowAlert(true);

        } catch (error) {
            setAlert("Error al seleccionar la divisa.");
            setShowAlert(true);
        }
    }

    /* Borrar los datos del usuario autenticado de todas las colecciones de la base de datos */
    const deleteUserData = async () => {

        /* Obtenemos los datos del usuario autenticado */
        const auth = getAuth();
        const currentUser = auth.currentUser;

        if (!currentUser) return;
        const userId = currentUser.uid;

        const collections = ['transactions', 'transfers', 'accounts', 'categories', 'recurringTransactions'];

        try {
            for (const col of collections) {
                const q = query(collection(database, col), where('user_id', '==', userId));
                const snapshot = await getDocs(q);
                snapshot.forEach(async (doc) => {
                    await deleteDoc(doc.ref);
                });
            }

            setAlert("Todos los datos han sido eliminados correctamente.");
            setShowAlert(true);
        } catch (error) {
            setAlert("No se pudo eliminar los datos han sido eliminados correctamente.");
            setShowAlert(true);
        }
    };

    /* Borrar los datos del usuario autenticado de todas las colecciones de la base de datos y su cuenta */
    const deleteAccount = async () => {

        /* Obtenemos los datos del usuario autenticado */
        const auth = getAuth();
        const currentUser = auth.currentUser;

        /* Borramos los datos del usuario de todas las colecciones de la base de datos */
        if (!currentUser) return;
        await deleteUserData();

        const userRef = doc(database, 'users', currentUser.uid);

        /* Terminamos de borrar el rastro del usuario borrándolo de la colección de usuarios de la base de datos */
        await deleteDoc(userRef);

        try {
            
            /* Cerramos sesión, borramos al usuario de Firebase y lo devolvemos a la pantalla para iniciar sesión */
            await signOut(auth);
            await deleteUser(currentUser);
            history.push('/login');

            setAlert("Tu cuenta ha sido eliminada correctamente.");
            setShowAlert(true);
        } catch (error) {
            setAlert("No se pudo eliminar tu cuenta correctamente.");
            setShowAlert(true);
        }
    };

    return (
        <IonPage id="main-content">
            <IonHeader>
                <IonToolbar>
                    <IonButtons slot="start">
                        <IonMenuButton></IonMenuButton>
                    </IonButtons>
                    <IonTitle>Ajustes</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent fullscreen>
                {showAlert && (<IonAlert isOpen={showAlert} onDidDismiss={() => setShowAlert(false)} message={alert} buttons={['Aceptar']} />)}

                <IonAlert
                    isOpen={isExportAlertOpen}
                    onDidDismiss={() => setIsExportAlertOpen(false)}
                    header="¿Qué datos quieres exportar?"
                    buttons={[
                        { text: "Transacciones", handler: () => exportTransactionsToExcel() },
                        { text: "Transferencias", handler: () => exportTransfersToExcel() },
                        { text: "Cancelar", role: "cancel" }
                    ]}
                />

                <IonAlert
                    isOpen={isDeleteAlertOpen}
                    onDidDismiss={() => setIsDeleteAlertOpen(false)}
                    header="¿Qué datos quieres eliminar?"
                    buttons={[
                        { text: "Eliminar datos", handler: () => deleteUserData() },
                        { text: "Eliminar datos y cuenta", handler: () => deleteAccount() },
                        { text: "Cancelar", role: "cancel" }
                    ]}
                />
                <IonGrid>
                    <IonRow>
                        <IonCol size="12" size-md="8" offset-md="2">
                            <IonList className='settings-list'>

                                {/* Opción para cambiar la foto de perfil o el nombre y apellidos */}
                                <IonItem onClick={() => history.push('/profile', { from: window.location.pathname })}>
                                    <div slot="start">
                                        <FontAwesomeIcon icon={faUser}></FontAwesomeIcon>
                                    </div>
                                    <IonLabel>Perfil</IonLabel>
                                </IonItem>

                                {/* Opción para restablecer la contraseña del usuario */}
                                <IonItem onClick={() => history.push('/reset_password', { from: window.location.pathname })}>
                                    <div slot="start">
                                        <FontAwesomeIcon icon={faLock}></FontAwesomeIcon>
                                    </div>
                                    <IonLabel>Restablecer contraseña</IonLabel>
                                </IonItem>

                                {/* Opción para cambiar la divisa preferida del usuario */}
                                <IonItem>
                                    <div slot="start">
                                        <FontAwesomeIcon icon={faCommentDollar}></FontAwesomeIcon>
                                    </div>
                                    <IonLabel>Divisa</IonLabel>
                                    <IonSelect slot='end' value={preferredCurrency} placeholder="Selecciona una divisa" onIonChange={e => { const currency = e.detail.value; setPreferredCurrency(currency); handleSaveProfile(currency); }}>
                                        {currencies.map(currency => (
                                            <IonSelectOption key={currency.code} value={currency.code}>
                                                {currency.name} ({currency.code})
                                            </IonSelectOption>
                                        ))}
                                    </IonSelect>
                                </IonItem>

                                {/* Opción para eliminar los datos del usuario o su cuenta */}
                                <IonItem>
                                    <div slot="start">
                                        <FontAwesomeIcon icon={faFileExcel}></FontAwesomeIcon>
                                    </div>
                                    <IonLabel onClick={() => setIsExportAlertOpen(true)}>Exportar datos</IonLabel>
                                </IonItem>
                                <IonItem>
                                    <div slot="start">
                                        <FontAwesomeIcon icon={faTrashCan}></FontAwesomeIcon>
                                    </div>
                                    <IonLabel onClick={() => setIsDeleteAlertOpen(true)}>Eliminar datos</IonLabel>
                                </IonItem>
                            </IonList>
                        </IonCol>
                    </IonRow>
                </IonGrid>
            </IonContent>
        </IonPage>
    );
}

export default Settings;