import { IonButton, IonCol, IonContent, IonFooter, IonGrid, IonHeader, IonIcon, IonInput, IonItem, IonLabel, IonModal, IonRow, IonSelect, IonSelectOption, IonTitle, IonToolbar } from "@ionic/react";
import { collection, doc, getDocs, setDoc } from "firebase/firestore";
import { chevronBack } from "ionicons/icons";
import { useEffect, useState } from "react";
import { database } from "../configurations/firebase";
import "./AddAccount.css";
import { faCoins, faCreditCard, faHandHoldingDollar, faLandmark, faMoneyBill, faPiggyBank, faReceipt, faSackDollar, faScaleBalanced, faStamp, faVault, faWallet } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBitcoin, faEthereum } from "@fortawesome/free-brands-svg-icons";
import { getAuth } from "firebase/auth";

interface AddAccountProps {
    isOpen: boolean;
    onClose: () => void;
}

interface Currency {
    code: string;
    name: string;
}

const icons = [
    faWallet, faCoins, faMoneyBill, faLandmark, faVault, faPiggyBank, faHandHoldingDollar, faSackDollar, faCreditCard, faBitcoin, faEthereum, faReceipt, faStamp, faScaleBalanced
];

const colors = [
    '#ff6347', '#3b82f6', '#34d399', '#f59e0b', '#e11d48', '#6366f1',
    '#9c27b0', '#4caf50', '#ff9800', '#2196f3', '#f44336', '#9e9e9e',
    '#00bcd4', '#8bc34a'
];

const AddAccount: React.FC<AddAccountProps> = ({ isOpen, onClose }) => {
    const [name, setName] = useState('');
    const [currencies, setCurrencies] = useState<Currency[]>([]);
    const [selectedCurrency, setSelectedCurrency] = useState<string | undefined>();
    const [balance, setBalance] = useState(0);
    const [icon, setIcon] = useState(faWallet);
    const [color, setColor] = useState('#000000');

    /* Notificación global */
    const [toastConfig, setToastConfig] = useState<{
        isOpen: boolean;
        message: string;
        type: 'success' | 'error';
    }>({ isOpen: false, message: '', type: 'error' });

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
            }
        };

        fetchCurrencies();
    }, []);

    const handleSaveAccount = async () => {
        try {

            /* Obtenemos los datos del usuario autenticado */
            const auth = getAuth();
            const currentUser = auth.currentUser;

            /* Generamos un ID automático con Firestore */
            const accountsRef = doc(collection(database, 'accounts'));
            const accountId = accountsRef.id;

            const newAccount = {
                account_id: accountId,
                user_id: currentUser?.uid,
                name: name,
                currency: selectedCurrency,
                balance: parseFloat(balance.toFixed(2)),
                icon: icon.iconName,
                color: color
            }

            /* Guardamos la cuenta en la base de datos */
            await setDoc(accountsRef, newAccount);

            setToastConfig({ isOpen: true, message: 'Cuenta añadida con éxito', type: 'success' });

            /* Cerramos el modal automáticamente al guardar la cuenta */
            onClose();

        } catch (error) {
            setToastConfig({ isOpen: true, message: 'No se pudo añadir la cuenta', type: 'error' });
        }
    };

    return (
        <IonModal isOpen={isOpen} onDidDismiss={onClose}>
            <IonHeader>
                <IonToolbar>
                    <IonTitle>Añadir cuenta</IonTitle>
                    <IonButton slot="start" onClick={onClose} fill='clear'>
                        <IonIcon icon={chevronBack}></IonIcon>
                    </IonButton>
                </IonToolbar>
            </IonHeader>
            <IonContent>
                <IonGrid>

                    {/* Campo para añadir el nombre de la cuenta */}
                    <IonRow>
                        <IonCol size="12" size-md="8" offset-md="2">
                            <IonItem>
                                <IonInput label='Nombre' labelPlacement='floating' placeholder='Nombre' value={name} onIonChange={(e) => setName(e.detail.value!)} required />
                            </IonItem>
                        </IonCol>
                    </IonRow>

                    {/* Campo para seleccionar la divisa de la cuenta */}
                    <IonRow>
                        <IonCol size="12" size-md="8" offset-md="2">
                            <IonItem>
                                <IonSelect interface="popover" label="Divisa" labelPlacement="floating" placeholder="Selecciona una divisa" value={selectedCurrency} onIonChange={(e) => setSelectedCurrency(e.detail.value)}>
                                    {currencies.map(currency => (
                                        <IonSelectOption key={currency.code} value={currency.code}>
                                            <IonLabel>{currency.name} ({currency.code})</IonLabel>
                                        </IonSelectOption>
                                    ))}
                                </IonSelect>
                            </IonItem>
                        </IonCol>
                    </IonRow>

                    {/* Campo para introducir el balance de la cuenta */}
                    <IonRow>
                        <IonCol size="12" size-md="8" offset-md="2" className='account-setup-currency'>
                            <IonItem style={{ width: '100%' }}>
                                <IonInput placeholder='0' type="number" value={balance} onIonChange={(e) => setBalance(parseFloat(e.detail.value!) || 0)} required />
                            </IonItem>
                        </IonCol>
                    </IonRow>

                    {/* Campo para la selección de icono de la cuenta */}
                    <IonRow>
                        <IonCol size="12" size-md="8" offset-md="2">
                            <IonItem>
                                <div className="account-icon-picker-container">
                                    <IonLabel>Selecciona un icono</IonLabel>
                                    <div>
                                        {icons.map((faIcon, index) => (
                                            <div
                                                key={index}
                                                onClick={() => setIcon(faIcon)}
                                                className={`account-icon-container ${icon === faIcon ? 'selected' : ''}`}
                                            >
                                                <FontAwesomeIcon icon={faIcon} />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                            </IonItem>
                        </IonCol>
                    </IonRow>

                    {/* Campo para la selección de color de la cuenta */}
                    <IonRow>
                        <IonCol size="12" size-md="8" offset-md="2">
                            <IonItem>
                                <div className="account-color-picker-container">
                                    <IonLabel>Selecciona un color</IonLabel>
                                    <div>
                                        {colors.map((colorOption, index) => (
                                            <div
                                                key={index}
                                                onClick={() => setColor(colorOption)}
                                                className={`account-color-container ${color === colorOption ? 'selected' : ''}`}
                                                style={{ backgroundColor: colorOption }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </IonItem>
                        </IonCol>
                    </IonRow>
                </IonGrid>
            </IonContent>
            <IonFooter>
                <IonToolbar>
                    <div className='add-account-footer'>

                        {/* Botón para guardar la cuenta */}
                        <IonButton onClick={handleSaveAccount}>Guardar cuenta</IonButton>
                    </div>
                </IonToolbar>
            </IonFooter>
        </IonModal >
    );
}

export default AddAccount;