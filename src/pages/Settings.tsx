import { IonAlert, IonButtons, IonContent, IonGrid, IonHeader, IonItem, IonLabel, IonList, IonMenuButton, IonPage, IonSelect, IonSelectOption, IonTitle, IonToolbar } from '@ionic/react';
import './Settings.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCommentDollar, faDatabase, faUser } from '@fortawesome/free-solid-svg-icons';
import { useHistory } from 'react-router';
import { useEffect, useState } from 'react';
import { getAuth } from 'firebase/auth';
import { collection, doc, getDocs, onSnapshot, orderBy, query, Timestamp, updateDoc, where } from 'firebase/firestore';
import { database } from '../configurations/firebase';
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';
import * as XLSX from 'xlsx';

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

const Settings: React.FC = () => {
    const history = useHistory();
    const [currencies, setCurrencies] = useState<Currency[]>([]);
    const [preferredCurrency, setPreferredCurrency] = useState<string>("EUR");
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [alert, setAlert] = useState<string>('');
    const [showAlert, setShowAlert] = useState(false);

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

    /* Exportamos los datos de las cuentas, transacciones y transferencias */
    const exportToExcel = async () => {

        if (transactions.length === 0) {
            setAlert("No hay transacciones para exportar");
            setShowAlert(true);
            return;
        }

        /* Pedimos permisos de almacenamiento al usuario */
        await Filesystem.requestPermissions();

        /* Formateamos el nombre de las columnas y los datos de las transferencias */
        const formattedTransactions = transactions.map(transaction => ({
            ID: transaction.transaction_id,
            Tipo: transaction.type,
            Categoría: transaction.category_id,
            Cuenta: transaction.account_id,
            Monto: transaction.amount,
            Divisa: transaction.currency,
            Fecha: new Date(transaction.date.toDate()).toLocaleDateString(),
            Nota: transaction.note
        }));

        const ws = XLSX.utils.json_to_sheet(formattedTransactions);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Transacciones");

        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const uint8Array = new Uint8Array(excelBuffer);

        try {
            let binary = '';
            uint8Array.forEach(byte => binary += String.fromCharCode(byte));
            const base64Data = btoa(binary);

            await Filesystem.writeFile({
                path: 'Documents/ExpenseTrack/transacciones.xlsx',
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
                <IonGrid>
                    <IonList className='settings-list'>
                        <IonItem onClick={() => history.push('/profile', { from: window.location.pathname })}>
                            <div slot="start">
                                <FontAwesomeIcon icon={faUser}></FontAwesomeIcon>
                            </div>
                            <IonLabel>Perfil</IonLabel>
                        </IonItem>
                        <IonItem>
                            <div slot="start">
                                <FontAwesomeIcon icon={faDatabase}></FontAwesomeIcon>
                            </div>
                            <IonLabel onClick={exportToExcel}>Exportar datos</IonLabel>
                        </IonItem>
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
                    </IonList>
                </IonGrid>
            </IonContent>
        </IonPage>
    );
}

export default Settings;