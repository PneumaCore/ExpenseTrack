import { IonButton, IonCol, IonContent, IonFooter, IonGrid, IonHeader, IonIcon, IonInput, IonItem, IonLabel, IonModal, IonRow, IonSelect, IonSelectOption, IonTitle, IonToolbar } from "@ionic/react";
import { collection, getDocs } from "firebase/firestore";
import { chevronBack } from "ionicons/icons";
import { useEffect, useState } from "react";
import { database } from "../configurations/firebase";
import "./AddAccount.css";
import { faWallet } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface AddAccountProps {
    isOpen: boolean;
    onClose: () => void;
}

interface Currency {
    code: string;
    name: string;
}

const icons = [
    faWallet
];

const colors = [
    '#ff6347', '#3b82f6', '#34d399', '#f59e0b', '#e11d48', '#6366f1',
    '#9c27b0', '#4caf50', '#ff9800', '#2196f3', '#f44336', '#9e9e9e',
    '#00bcd4', '#8bc34a'
];

const AddAccount: React.FC<AddAccountProps> = ({ isOpen, onClose }) => {
    const [name, setName] = useState('');
    const [currencies, setCurrencies] = useState<Currency[]>([]);
    const [selectedAccount, setSelectedAccount] = useState<string | undefined>();
    const [balance, setBalance] = useState(0);
    const [icon, setIcon] = useState(faWallet);

    useEffect(() => {
        const fetchCurrencies = async () => {
            try {

                /* Obtenemos las divisas */
                const currenciesRef = await getDocs(collection(database, 'currencies'));
                const currencyList: Currency[] = currenciesRef.docs.map((doc) => doc.data() as Currency);

                setCurrencies(currencyList);
            } catch (error) {
                console.error('Error al obtener las divisas:', error);
            }
        };

        fetchCurrencies();
    }, []);

    const handleSaveAccount = async () => {
        null;
    }

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
                                <IonSelect interface="popover" label="Cuenta" labelPlacement="floating" placeholder="Selecciona una cuenta" value={selectedAccount} onIonChange={(e) => setSelectedAccount(e.detail.value)}>
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
                            <IonInput placeholder='0' type="number" value={balance} onIonChange={(e) => setBalance(parseFloat(e.detail.value!) || 0)} required />
                        </IonCol>
                    </IonRow>

                    {/* Campo para la selección de icono de la categoría */}
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