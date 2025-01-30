import { IonAlert, IonButtons, IonContent, IonGrid, IonHeader, IonItem, IonLabel, IonList, IonMenuButton, IonPage, IonSelect, IonSelectOption, IonTitle, IonToolbar } from '@ionic/react';
import './Settings.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCommentDollar, faDatabase, faUser } from '@fortawesome/free-solid-svg-icons';
import { useHistory } from 'react-router';
import { useEffect, useState } from 'react';
import { getAuth } from 'firebase/auth';
import { collection, doc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { database } from '../configurations/firebase';

interface Currency {
    code: string;
    name: string;
}

const Settings: React.FC = () => {
    const history = useHistory();
    const [currencies, setCurrencies] = useState<Currency[]>([]);
    const [preferredCurrency, setPreferredCurrency] = useState<string>("EUR");
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
                            <IonLabel>Datos</IonLabel>
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